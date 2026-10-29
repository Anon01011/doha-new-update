<?php

namespace App\Services;

use App\Models\User;
use App\Models\Employee;
use App\Models\ShiftRoster;
use App\Models\LeaveRequest;
use App\Models\ExpenseClaim;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EmployeeAuthorizationService
{
    /**
     * Request-level cache for resolved user employee IDs.
     * @var array<int, int|null>
     */
    protected static array $userEmployeeIdCache = [];

    /**
     * Request-level cache for subordinate employee IDs.
     * @var array<string, array<int>>
     */
    protected static array $subordinatesCache = [];

    /**
     * Resolve the primary Employee ID associated with a User.
     * Uses direct database query to prevent triggering Eloquent global scopes.
     */
    public static function getEmployeeIdForUser(User|int|null $user): ?int
    {
        if (!$user) {
            return null;
        }

        $userId = $user instanceof User ? $user->id : (int) $user;

        if (array_key_exists($userId, self::$userEmployeeIdCache)) {
            return self::$userEmployeeIdCache[$userId];
        }

        if ($user instanceof User && !empty($user->employee_id)) {
            self::$userEmployeeIdCache[$userId] = (int) $user->employee_id;
            return self::$userEmployeeIdCache[$userId];
        }

        // Query database directly
        $userRow = DB::table('users')->where('id', $userId)->first(['employee_id', 'email', 'name']);
        if (!$userRow) {
            self::$userEmployeeIdCache[$userId] = null;
            return null;
        }

        if (!empty($userRow->employee_id)) {
            self::$userEmployeeIdCache[$userId] = (int) $userRow->employee_id;
            return self::$userEmployeeIdCache[$userId];
        }

        if (!empty($userRow->email)) {
            $empId = DB::table('employees')->where('email', $userRow->email)->value('id');
            if ($empId) {
                self::$userEmployeeIdCache[$userId] = (int) $empId;
                return self::$userEmployeeIdCache[$userId];
            }
        }

        if (!empty($userRow->name)) {
            $matchingIds = DB::table('employees')->where('name', $userRow->name)->pluck('id');
            if ($matchingIds->count() === 1) {
                self::$userEmployeeIdCache[$userId] = (int) $matchingIds->first();
                return self::$userEmployeeIdCache[$userId];
            }
        }

        self::$userEmployeeIdCache[$userId] = null;
        return null;
    }

    /**
     * Get all subordinate employee IDs for a given user.
     *
     * @param User|int|null $user
     * @param bool $recursive Whether to include indirect (nested) subordinates
     * @return Collection<int>
     */
    public static function getSubordinateEmployeeIds(User|int|null $user, bool $recursive = true): Collection
    {
        $empId = self::getEmployeeIdForUser($user);
        $userId = $user instanceof User ? $user->id : (is_numeric($user) ? (int) $user : null);
        $userName = $user instanceof User ? $user->name : ($userId ? DB::table('users')->where('id', $userId)->value('name') : null);

        if (!$empId && empty($userName)) {
            return collect();
        }

        $cacheKey = ($empId ?: "u_{$userId}") . '_' . ($recursive ? 'rec' : 'direct');
        if (isset(self::$subordinatesCache[$cacheKey])) {
            return collect(self::$subordinatesCache[$cacheKey]);
        }

        $managerName = $empId ? DB::table('employees')->where('id', $empId)->value('name') : null;
        $matchNames = array_filter(array_unique([$managerName, $userName]));

        // Query direct subordinates without Eloquent scopes
        $directSubIds = DB::table('employees')
            ->where(function ($q) use ($empId, $matchNames) {
                if ($empId) {
                    $q->where('reports_to_id', $empId);
                }
                if (!empty($matchNames)) {
                    if ($empId) {
                        $q->orWhere(function ($sub) use ($matchNames) {
                            $sub->whereNull('reports_to_id')->whereIn('reported_to', $matchNames);
                        });
                    } else {
                        $q->whereIn('reported_to', $matchNames);
                    }
                }
            })
            ->pluck('id')
            ->map(fn($id) => (int) $id)
            ->all();

        if (!$recursive || empty($directSubIds)) {
            self::$subordinatesCache[$cacheKey] = $directSubIds;
            return collect($directSubIds);
        }

        // Breadth-first traversal to discover all indirect subordinates
        $allSubordinates = $directSubIds;
        $currentBatch = $directSubIds;
        $visited = array_flip($directSubIds);
        $maxDepth = 25;
        $depth = 0;

        while (!empty($currentBatch) && $depth < $maxDepth) {
            $depth++;
            $nextBatch = DB::table('employees')
                ->whereIn('reports_to_id', $currentBatch)
                ->pluck('id')
                ->map(fn($id) => (int) $id)
                ->all();

            $newSubs = [];
            foreach ($nextBatch as $nId) {
                if (!isset($visited[$nId])) {
                    $visited[$nId] = true;
                    $newSubs[] = $nId;
                }
            }

            if (empty($newSubs)) {
                break;
            }

            $allSubordinates = array_merge($allSubordinates, $newSubs);
            $currentBatch = $newSubs;
        }

        self::$subordinatesCache[$cacheKey] = $allSubordinates;
        return collect($allSubordinates);
    }

    /**
     * Determine if a user is the assigned reporting person (manager) of an employee.
     * Supports both direct reports and hierarchical indirect reports.
     */
    public static function isReportingPerson(User|int|null $user, Employee|int|null $employee): bool
    {
        if (!$user || !$employee) {
            return false;
        }

        $targetEmpId = $employee instanceof Employee ? $employee->id : (int) $employee;
        $subordinateIds = self::getSubordinateEmployeeIds($user, true);

        return $subordinateIds->contains($targetEmpId);
    }

    /**
     * Check if a proposed manager assignment creates a circular reporting cycle.
     * E.g., Employee A reports to B, and B is changed to report to A.
     */
    public static function detectReportingCycle(int $employeeId, int $proposedManagerId): bool
    {
        if ($employeeId === $proposedManagerId) {
            return true;
        }

        $currentManagerId = $proposedManagerId;
        $visited = [$employeeId => true];
        $depth = 0;
        $maxDepth = 50;

        while ($currentManagerId && $depth < $maxDepth) {
            if ($currentManagerId === $employeeId || isset($visited[$currentManagerId])) {
                return true;
            }

            $visited[$currentManagerId] = true;
            $depth++;

            $currentManagerId = DB::table('employees')
                ->where('id', $currentManagerId)
                ->value('reports_to_id');

            if ($currentManagerId) {
                $currentManagerId = (int) $currentManagerId;
            }
        }

        return false;
    }

    /**
     * Centralized authorization check: Can the user manage a given employee for a specific action?
     *
     * Evaluates:
     * 1. Admin privileges (always allow)
     * 2. Role permissions required for the action
     * 3. Organizational boundary (assigned companies / departments)
     * 4. Reporting relationship override (reporting person takes priority across branch & dept)
     */
    public static function canManageEmployee(User $user, Employee|int $employee, string $action = 'view'): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $targetEmpId = $employee instanceof Employee ? $employee->id : (int) $employee;

        // An employee can always view their own profile/records
        $userEmpId = self::getEmployeeIdForUser($user);
        if ($userEmpId && $userEmpId === $targetEmpId && in_array($action, ['view', 'view-roster', 'view-attendance'])) {
            return true;
        }

        // Map actions to required permissions
        $actionPermissions = [
            'view'              => ['view-employees'],
            'create'            => ['create-employees'],
            'edit'              => ['edit-employees'],
            'delete'            => ['delete-employees'],
            'view-roster'       => ['view-shift-rosters', 'view-rosters'],
            'manage-roster'     => ['create-shift-rosters', 'manage-shift-rosters', 'manage-rosters', 'edit-shift-rosters'],
            'approve-roster'    => ['approve-shift-rosters', 'manage-shift-rosters'],
            'view-attendance'   => ['view-attendance'],
            'manage-attendance' => ['manage-attendance'],
            'view-leave'        => ['view-leave-requests'],
            'approve-leave'     => ['approve-leave-requests'],
            'view-expense'      => ['view-expenses'],
            'approve-expense'   => ['approve-expenses-manager', 'approve-expenses-finance'],
        ];

        // Check if user has at least one required permission for this action (if defined)
        if (isset($actionPermissions[$action])) {
            $hasPerm = false;
            foreach ($actionPermissions[$action] as $perm) {
                if ($user->hasPermission($perm)) {
                    $hasPerm = true;
                    break;
                }
            }
            // For managers/HR, check fallback role capabilities if permission check was negative
            if (!$hasPerm) {
                if ($user->isHR() && in_array($action, ['view', 'edit', 'view-roster', 'manage-roster', 'view-attendance', 'manage-attendance', 'view-leave', 'approve-leave', 'view-expense'])) {
                    $hasPerm = true;
                } elseif ($user->isManager() && in_array($action, ['view', 'view-roster', 'manage-roster', 'view-attendance', 'view-leave', 'approve-leave', 'view-expense', 'approve-expense'])) {
                    $hasPerm = true;
                }
            }

            if (!$hasPerm) {
                return false;
            }
        }

        // RULE 1: Reporting relationship takes priority over branch and department!
        if (self::isReportingPerson($user, $targetEmpId)) {
            return true;
        }

        // RULE 2: If not reporting person, check organizational branch boundaries
        $empRow = $employee instanceof Employee
            ? $employee
            : DB::table('employees')->where('id', $targetEmpId)->first(['company_id', 'department_id']);

        if (!$empRow) {
            return false;
        }

        $assignedCompanyIds = $user->getAssignedCompanyIds();
        if ($assignedCompanyIds->isNotEmpty() && $assignedCompanyIds->contains($empRow->company_id)) {
            // For managers without reporting relationship, verify department if scoped
            if ($user->isManager() && !$user->isHR()) {
                $assignedDeptIds = $user->getAssignedDepartmentIds();
                if ($assignedDeptIds->isNotEmpty() && $empRow->department_id) {
                    return $assignedDeptIds->contains($empRow->department_id);
                }
            }
            return true;
        }

        return false;
    }

    /**
     * Check if a user can create/manage a roster for a specific employee, roster, or company.
     */
    public static function canManageRoster(User $user, ShiftRoster|Employee|int $target): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        $canManagePermission = $user->isAdmin()
            || $user->isHR()
            || $user->isManager()
            || $user->hasRole('shift-manager')
            || $user->hasPermission('create-shift-rosters')
            || $user->hasPermission('manage-shift-rosters')
            || $user->hasPermission('manage-rosters')
            || $user->hasPermission('edit-shift-rosters');

        if (!$canManagePermission) {
            return false;
        }

        if ($target instanceof ShiftRoster) {
            if ($target->employee_id && self::isReportingPerson($user, $target->employee_id)) {
                return true;
            }
            $assignedCompanies = $user->getAssignedCompanyIds();
            return $assignedCompanies->contains($target->company_id);
        }

        if ($target instanceof Employee || (is_int($target) && !Company::where('id', $target)->exists())) {
            $empId = $target instanceof Employee ? $target->id : $target;
            if (self::isReportingPerson($user, $empId)) {
                return true;
            }
            $empCompanyId = $target instanceof Employee ? $target->company_id : DB::table('employees')->where('id', $empId)->value('company_id');
            return $user->getAssignedCompanyIds()->contains($empCompanyId);
        }

        // $target is a company_id
        $companyId = is_int($target) ? $target : (int) $target;
        if ($user->getAssignedCompanyIds()->contains($companyId)) {
            return true;
        }

        // Or user has at least one subordinate in that company
        $subordinateIds = self::getSubordinateEmployeeIds($user, true);
        if ($subordinateIds->isNotEmpty()) {
            $hasSubordinateInCompany = DB::table('employees')
                ->whereIn('id', $subordinateIds)
                ->where('company_id', $companyId)
                ->exists();
            if ($hasSubordinateInCompany) {
                return true;
            }
        }

        return false;
    }

    /**
     * Get all employee IDs accessible by the user for a given action.
     * Merges employees from assigned companies with all reporting subordinates.
     */
    public static function getAccessibleEmployeeIds(User $user, string $action = 'view'): Collection
    {
        if ($user->isAdmin()) {
            return DB::table('employees')->pluck('id');
        }

        $assignedCompanyIds = $user->getAssignedCompanyIds();
        $subordinateIds = self::getSubordinateEmployeeIds($user, true);

        $query = DB::table('employees');

        if ($assignedCompanyIds->isNotEmpty()) {
            $query->where(function ($q) use ($assignedCompanyIds, $subordinateIds) {
                $q->whereIn('company_id', $assignedCompanyIds);
                if ($subordinateIds->isNotEmpty()) {
                    $q->orWhereIn('id', $subordinateIds);
                }
            });
        } elseif ($subordinateIds->isNotEmpty()) {
            $query->whereIn('id', $subordinateIds);
        } else {
            $userEmpId = self::getEmployeeIdForUser($user);
            if ($userEmpId) {
                return collect([$userEmpId]);
            }
            return collect();
        }

        return $query->pluck('id');
    }

    /**
     * Reset in-memory caches (useful in tests).
     */
    public static function clearCache(): void
    {
        self::$userEmployeeIdCache = [];
        self::$subordinatesCache = [];
    }
}

