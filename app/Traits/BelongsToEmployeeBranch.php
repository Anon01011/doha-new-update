<?php
namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToEmployeeBranch
{
    /**
     * The "booted" method of the model.
     *
     * @return void
     */
    protected static function bootBelongsToEmployeeBranch()
    {
        static::addGlobalScope('employee_branch', function (Builder $builder) {
            // Guard against recursive resolution while the guard is still
            // authenticating the user.
            if (!Auth::hasUser()) {
                return;
            }

            $user = Auth::user();

            if (!$user) {
                return;
            }

            // Admins have unrestricted access to all branches, matching the
            // behaviour of the BelongsToCompany scope.
            if ($user->isAdmin()) {
                return;
            }

            if ($user->employee_id) {
                // Get company_id from employee table directly to avoid relationship recursion
                $companyId = \Illuminate\Support\Facades\DB::table('employees')
                    ->where('id', $user->employee_id)
                    ->value('company_id');

                if ($companyId) {
                    $builder->whereHas('employee', function ($query) use ($companyId) {
                        $query->where('company_id', $companyId);
                    });
                }
            } else {
                // A non-admin user with no linked employee profile has no
                // business context. Returning no rows is safer than returning
                // every row in the system.
                $builder->whereRaw('1 = 0');
            }
        });
    }
}