<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class NotificationService
{
    /**
     * Resolve the User record linked to an Employee.
     * Checks employee_id on User, then relation, then email.
     */
    public static function getUserForEmployee($employeeOrId): ?User
    {
        if (!$employeeOrId) {
            return null;
        }

        if ($employeeOrId instanceof User) {
            return $employeeOrId;
        }

        $employeeId = $employeeOrId instanceof Employee ? $employeeOrId->id : $employeeOrId;
        $employee = $employeeOrId instanceof Employee ? $employeeOrId : Employee::find($employeeId);

        if (!$employee) {
            return null;
        }

        // 1. Direct match on users.employee_id
        $user = User::where('employee_id', $employee->id)->first();
        if ($user) {
            return $user;
        }

        // 2. Relation fallback
        if ($employee->relationLoaded('user') && $employee->user) {
            return $employee->user;
        }

        // 3. Fallback match by employee email
        if (!empty($employee->email)) {
            $user = User::where('email', $employee->email)->first();
            if ($user) {
                return $user;
            }
        }

        return null;
    }

    /**
     * Resolve the User record for an employee's direct reporting manager.
     */
    public static function getReportingManagerUser($employeeOrId): ?User
    {
        $employee = $employeeOrId instanceof Employee ? $employeeOrId : Employee::find($employeeOrId);
        if (!$employee) {
            return null;
        }

        // 1. Try resolving via direct foreign key
        if (!empty($employee->reports_to_id)) {
            $user = self::getUserForEmployee($employee->reports_to_id);
            if ($user) {
                return $user;
            }
        }

        // 2. Fallback: Resolve via manager name
        if (!empty($employee->reported_to)) {
            $managerEmp = Employee::withoutGlobalScopes()->where('name', $employee->reported_to)->first();
            if ($managerEmp) {
                $user = self::getUserForEmployee($managerEmp);
                if ($user) {
                    return $user;
                }
            }

            // 3. Fallback: Check if manager is a direct User record
            $directUser = User::where('name', $employee->reported_to)->first();
            if ($directUser) {
                return $directUser;
            }
        }

        return null;
    }

    /**
     * Resolve all HR and Admin users scoped to a specific company/branch.
     * Prevents cross-company data leakage while ensuring global admins are included.
     */
    public static function getHrAndAdminUsers(?int $companyId = null, ?string $requiredPermission = null): Collection
    {
        // 1. ALL Admins — Admins can see all branches and departments across the system
        $adminUsers = User::where(function ($q) {
            $q->where('role', 'admin')
              ->orWhereHas('roles', fn($rq) => $rq->whereIn('slug', ['admin', 'super-admin']));
        })->get();

        // 2. HR users — strictly from the same branch / company
        $hrUsers = collect();
        if ($companyId) {
            $hrUsers = User::where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                  ->orWhereHas('employee', fn($eq) => $eq->where('company_id', $companyId));
            })->where(function ($q) {
                $q->where('role', 'hr')
                  ->orWhereHas('roles', fn($rq) => $rq->where('slug', 'hr'));
            })->get();
        } else {
            $hrUsers = User::where(function ($q) {
                $q->where('role', 'hr')
                  ->orWhereHas('roles', fn($rq) => $rq->where('slug', 'hr'));
            })->get();
        }

        $allUsers = $adminUsers->merge($hrUsers)->unique('id')->values();

        // If a required permission is specified, filter users who actually possess it
        if ($requiredPermission) {
            $allUsers = $allUsers->filter(function ($user) use ($requiredPermission) {
                return $user->isAdmin() || $user->hasPermission($requiredPermission);
            });
        }

        return $allUsers;
    }

    /**
     * Send a notification safely to an employee.
     */
    public static function notifyEmployee($employeeOrId, Notification $notification): bool
    {
        $user = self::getUserForEmployee($employeeOrId);
        if (!$user) {
            Log::info("Notification skipped: No user account found for employee", ['employee' => $employeeOrId]);
            return false;
        }

        try {
            $user->notify($notification);
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to notify employee user {$user->id}: " . $e->getMessage(), [
                'exception' => $e,
                'notification' => get_class($notification),
            ]);
            return false;
        }
    }

    /**
     * Send a notification safely to an employee's reporting manager.
     */
    public static function notifyManager($employeeOrId, Notification $notification): bool
    {
        $managerUser = self::getReportingManagerUser($employeeOrId);
        if (!$managerUser) {
            return false;
        }

        try {
            $managerUser->notify($notification);
            return true;
        } catch (\Throwable $e) {
            Log::error("Failed to notify manager user {$managerUser->id}: " . $e->getMessage(), [
                'exception' => $e,
                'notification' => get_class($notification),
            ]);
            return false;
        }
    }

    /**
     * Send a notification to HR and Admins within the tenant boundary.
     */
    public static function notifyHrAndAdmins(
        Notification $notification,
        ?int $companyId = null,
        ?int $excludeUserId = null,
        ?string $requiredPermission = null
    ): int {
        $recipients = self::getHrAndAdminUsers($companyId, $requiredPermission);
        $count = 0;

        foreach ($recipients as $recipient) {
            if ($excludeUserId && $recipient->id === $excludeUserId) {
                continue;
            }

            try {
                $recipient->notify($notification);
                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed to notify HR/Admin user {$recipient->id}: " . $e->getMessage(), [
                    'exception' => $e,
                    'notification' => get_class($notification),
                ]);
            }
        }

        return $count;
    }

    /**
     * Send a notification to approvers: Direct Reporting Manager + Company HR/Admins.
     * Automatically deduplicates recipients and excludes the initiating user.
     */
    public static function notifyApprovers(
        $employeeOrId,
        Notification $notification,
        ?int $excludeUserId = null,
        ?string $requiredPermission = null
    ): int {
        $employee = $employeeOrId instanceof Employee ? $employeeOrId : Employee::find($employeeOrId);
        $companyId = $employee?->company_id;
        $sentUserIds = [];
        $count = 0;

        // 1. Direct Reporting Manager (takes priority across all branches and departments)
        $manager = self::getReportingManagerUser($employee);
        if ($manager && (!$excludeUserId || $manager->id !== $excludeUserId)) {
            try {
                $manager->notify($notification);
                $sentUserIds[] = $manager->id;
                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed to notify manager {$manager->id}: " . $e->getMessage());
            }
        }

        // 2. Department Managers in the same branch
        if ($employee && $employee->department_id) {
            $deptManagers = User::where(function ($q) {
                $q->where('role', 'manager')
                  ->orWhereHas('roles', fn($rq) => $rq->where('slug', 'manager'));
            })->where(function ($q) use ($companyId) {
                if ($companyId) {
                    $q->where('company_id', $companyId)
                      ->orWhereHas('employee', fn($eq) => $eq->where('company_id', $companyId));
                }
            })->get();

            foreach ($deptManagers as $dManager) {
                if (!in_array($dManager->id, $sentUserIds) && (!$excludeUserId || $dManager->id !== $excludeUserId)) {
                    try {
                        $dManager->notify($notification);
                        $sentUserIds[] = $dManager->id;
                        $count++;
                    } catch (\Throwable $e) {
                        Log::error("Failed to notify dept manager {$dManager->id}: " . $e->getMessage());
                    }
                }
            }
        }

        // 3. Company HR (same branch) & Admins (all branches)
        $admins = self::getHrAndAdminUsers($companyId, $requiredPermission);
        foreach ($admins as $admin) {
            if (in_array($admin->id, $sentUserIds) || ($excludeUserId && $admin->id === $excludeUserId)) {
                continue;
            }

            try {
                $admin->notify($notification);
                $sentUserIds[] = $admin->id;
                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed to notify HR/Admin {$admin->id}: " . $e->getMessage());
            }
        }

        return $count;
    }

    /**
     * Dispatch notification to a list of users or employees safely.
     */
    public static function notifyMany($recipients, Notification $notification, ?int $excludeUserId = null): int
    {
        $count = 0;
        $sentUserIds = [];

        foreach ($recipients as $item) {
            $user = $item instanceof User ? $item : self::getUserForEmployee($item);
            if (!$user || in_array($user->id, $sentUserIds) || ($excludeUserId && $user->id === $excludeUserId)) {
                continue;
            }

            try {
                $user->notify($notification);
                $sentUserIds[] = $user->id;
                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed to notify user {$user->id}: " . $e->getMessage());
            }
        }

        return $count;
    }

    /**
     * Notify all relevant management stakeholders across the role matrix:
     * - If an HR user acts -> Branch Managers and Global Admins receive notifications.
     * - If a Manager acts -> Branch HR and Global Admins receive notifications.
     * - If an Admin acts -> Branch HR and Branch/Department Managers receive notifications.
     * - If a Shift Manager acts -> Branch HR, Branch Managers, and Global Admins receive notifications.
     */
    public static function notifyManagementStakeholders(
        Notification $notification,
        ?int $companyId = null,
        ?int $departmentId = null,
        ?int $excludeUserId = null,
        $employeeOrId = null
    ): int {
        $sentUserIds = [];
        $count = 0;

        // 1. Global Admins (Admins receive notifications across all branches/departments)
        $admins = User::where(function ($q) {
            $q->where('role', 'admin')
              ->orWhereHas('roles', fn($rq) => $rq->whereIn('slug', ['admin', 'super-admin']));
        })->get();

        foreach ($admins as $admin) {
            if ($excludeUserId && $admin->id === $excludeUserId) continue;
            if (in_array($admin->id, $sentUserIds)) continue;

            try {
                $admin->notify($notification);
                $sentUserIds[] = $admin->id;
                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed to notify admin {$admin->id}: " . $e->getMessage());
            }
        }

        // 2. Branch HR (Strictly scoped to the same branch / company)
        $hrQuery = User::where(function ($q) {
            $q->where('role', 'hr')
              ->orWhereHas('roles', fn($rq) => $rq->where('slug', 'hr'));
        });

        if ($companyId) {
            $hrQuery->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                  ->orWhereHas('employee', fn($eq) => $eq->where('company_id', $companyId));
            });
        }

        $hrs = $hrQuery->get();
        foreach ($hrs as $hr) {
            if ($excludeUserId && $hr->id === $excludeUserId) continue;
            if (in_array($hr->id, $sentUserIds)) continue;

            try {
                $hr->notify($notification);
                $sentUserIds[] = $hr->id;
                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed to notify HR {$hr->id}: " . $e->getMessage());
            }
        }

        // 3. Branch / Department Managers
        $managerQuery = User::where(function ($q) {
            $q->where('role', 'manager')
              ->orWhereHas('roles', fn($rq) => $rq->where('slug', 'manager'));
        });

        if ($companyId) {
            $managerQuery->where(function ($q) use ($companyId) {
                $q->where('company_id', $companyId)
                  ->orWhereHas('employee', fn($eq) => $eq->where('company_id', $companyId));
            });
        }

        if ($departmentId) {
            $managerQuery->where(function ($q) use ($departmentId) {
                $q->whereHas('employee', fn($eq) => $eq->where('department_id', $departmentId))
                  ->orWhereDoesntHave('employee');
            });
        }

        $managers = $managerQuery->get();
        foreach ($managers as $manager) {
            if ($excludeUserId && $manager->id === $excludeUserId) continue;
            if (in_array($manager->id, $sentUserIds)) continue;

            try {
                $manager->notify($notification);
                $sentUserIds[] = $manager->id;
                $count++;
            } catch (\Throwable $e) {
                Log::error("Failed to notify manager {$manager->id}: " . $e->getMessage());
            }
        }

        // 4. Direct Reporting Manager (if employee provided)
        if ($employeeOrId) {
            $repManager = self::getReportingManagerUser($employeeOrId);
            if ($repManager && (!$excludeUserId || $repManager->id !== $excludeUserId) && !in_array($repManager->id, $sentUserIds)) {
                try {
                    $repManager->notify($notification);
                    $sentUserIds[] = $repManager->id;
                    $count++;
                } catch (\Throwable $e) {
                    Log::error("Failed to notify direct reporting manager {$repManager->id}: " . $e->getMessage());
                }
            }
        }

        return $count;
    }
}
