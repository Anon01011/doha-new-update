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
                // Prioritize company_id directly on the user model to avoid relationship recursion
                $companyId = $user->company_id;

                if (!$companyId && $user->employee_id) {
                    // If company_id is not on user, get it from employee table directly 
                    // to avoid triggering Eloquent global scopes recursively (cached request-wide)
                    static $employeeCompanyIds = [];
                    if (!isset($employeeCompanyIds[$user->employee_id])) {
                        $employeeCompanyIds[$user->employee_id] = \Illuminate\Support\Facades\DB::table('employees')
                            ->where('id', $user->employee_id)
                            ->value('company_id');
                    }
                    $companyId = $employeeCompanyIds[$user->employee_id];
                }

                if ($companyId) {
                    $builder->where(function ($query) use ($companyId) {
                        $model = new static;
                        $table = $model->getTable();
                        
                        // If the model is Company itself, scope by id
                        if ($model instanceof \App\Models\Company) {
                            $query->where($table . '.id', $companyId);
                        } else {
                            $column = in_array('branch_id', $model->getFillable()) ? 'branch_id' : 'company_id';
                            $query->where($table . '.' . $column, $companyId);
                        }
                    });
                }
            }
        });

        static::creating(function ($model) {
            if (Auth::hasUser()) {
                $user = Auth::user();
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
