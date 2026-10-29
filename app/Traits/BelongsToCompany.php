<?php
namespace App\Traits;

use App\Models\Company;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToCompany
{
    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function bootBelongsToCompany()
    {
        static::addGlobalScope('company', function (Builder $builder) {
            if (app()->runningInConsole()) {
                return;
            }

            // Use hasUser() to check if the user is already resolved in the guard.
            // Calling Auth::user() when the user is not yet resolved (e.g., during authentication)
            // would trigger a recursive database query on the User model, leading to an infinite loop.
            if (Auth::hasUser()) {
                $user = Auth::user();

                // Admins have unrestricted access to all records across all branches.
                // Applying the company scope to admin users caused 404 errors when:
                // - Admin tries to create a new branch (Company model scoped to only their company)
                // - Admin assigns roles to users in other companies (User model scope hides them)
                if ($user->isAdmin()) {
                    return;
                }

                // Also skip scope for the User model itself to avoid recursive issues
                // and to allow role/permission management across companies.
                if (static::class === \App\Models\User::class) {
                    return;
                }

                // Resolve assigned companies safely without triggering Eloquent recursion
                $assignedCompanyIds = $user->getAssignedCompanyIds();

                // Fallback to user company_id if getAssignedCompanyIds returned empty
                if ($assignedCompanyIds->isEmpty()) {
                    $companyId = $user->company_id;
                    if (!$companyId && $user->employee_id) {
                        static $employeeCompanyIds = [];
                        if (!isset($employeeCompanyIds[$user->employee_id])) {
                            $employeeCompanyIds[$user->employee_id] = \Illuminate\Support\Facades\DB::table('employees')
                                ->where('id', $user->employee_id)
                                ->value('company_id');
                        }
                        $companyId = $employeeCompanyIds[$user->employee_id];
                    }
                    if ($companyId) {
                        $assignedCompanyIds = collect([(int) $companyId]);
                    }
                }

                // Resolve reporting subordinates (subordinates across any branch/department)
                $subordinateIds = \App\Services\EmployeeAuthorizationService::getSubordinateEmployeeIds($user, true);

                $builder->where(function ($query) use ($assignedCompanyIds, $subordinateIds) {
                    $model = new static;
                    $table = $model->getTable();
                    $fillable = $model->getFillable();

                    // If the model is Company itself, scope by id
                    if ($model instanceof \App\Models\Company) {
                        if ($assignedCompanyIds->isNotEmpty()) {
                            $query->whereIn($table . '.id', $assignedCompanyIds);
                        } else {
                            $query->whereRaw('1 = 0');
                        }
                        return;
                    }

                    $column = in_array('branch_id', $fillable) ? 'branch_id' : 'company_id';
                    $hasEmployeeColumn = in_array('employee_id', $fillable) || $table === 'leave_requests' || $table === 'shift_rosters' || $table === 'employee_attendances';

                    // For Employee model itself: match assigned companies OR reporting subordinates
                    if ($model instanceof \App\Models\Employee) {
                        $query->where(function ($sub) use ($table, $column, $assignedCompanyIds, $subordinateIds) {
                            if ($assignedCompanyIds->isNotEmpty()) {
                                $sub->whereIn($table . '.' . $column, $assignedCompanyIds);
                            }
                            if ($subordinateIds->isNotEmpty()) {
                                if ($assignedCompanyIds->isNotEmpty()) {
                                    $sub->orWhereIn($table . '.id', $subordinateIds);
                                } else {
                                    $sub->whereIn($table . '.id', $subordinateIds);
                                }
                            }
                            if ($assignedCompanyIds->isEmpty() && $subordinateIds->isEmpty()) {
                                $sub->whereRaw('1 = 0');
                            }
                        });
                        return;
                    }

                    // For records with employee_id: match assigned companies OR records of subordinates
                    if ($hasEmployeeColumn) {
                        $query->where(function ($sub) use ($table, $column, $assignedCompanyIds, $subordinateIds) {
                            if ($assignedCompanyIds->isNotEmpty()) {
                                $sub->whereIn($table . '.' . $column, $assignedCompanyIds);
                            }
                            if ($subordinateIds->isNotEmpty()) {
                                if ($assignedCompanyIds->isNotEmpty()) {
                                    $sub->orWhereIn($table . '.employee_id', $subordinateIds);
                                } else {
                                    $sub->whereIn($table . '.employee_id', $subordinateIds);
                                }
                            }
                            if ($assignedCompanyIds->isEmpty() && $subordinateIds->isEmpty()) {
                                $sub->whereRaw('1 = 0');
                            }
                        });
                        return;
                    }

                    // Default organizational models (departments, holidays, components, etc.)
                    if ($assignedCompanyIds->isNotEmpty()) {
                        $query->whereIn($table . '.' . $column, $assignedCompanyIds);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                });
            }
        });

        static::creating(function ($model) {
            // Skip auto-setting company_id for admin users and for User model itself
            if (Auth::hasUser()) {
                $user = Auth::user();

                // Admins can create records without auto-assigning their company_id
                if ($user->isAdmin()) {
                    return;
                }

                // Don't auto-assign company_id on the User model itself
                if ($model instanceof \App\Models\User) {
                    return;
                }

                $companyId = $user->company_id;

                if (!$companyId && $user->employee_id) {
                    static $creatingCompanyIds = [];
                    if (!isset($creatingCompanyIds[$user->employee_id])) {
                        $creatingCompanyIds[$user->employee_id] = \Illuminate\Support\Facades\DB::table('employees')
                            ->where('id', $user->employee_id)
                            ->value('company_id');
                    }
                    $companyId = $creatingCompanyIds[$user->employee_id];
                }

                if ($companyId) {
                    $column = in_array('branch_id', $model->getFillable()) ? 'branch_id' : 'company_id';
                    if ($column && in_array($column, $model->getFillable()) && !$model->{$column}) {
                        $model->{$column} = $companyId;
                    }
                }
            }
        });
    }

    /**
     * Define the company relationship.
     */
    public function company()
    {
        return $this->belongsTo(Company::class, 'company_id');
    }
}
