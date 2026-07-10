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
            $user = Auth::user();
            
            if ($user && $user->employee_id) {
                // Get company_id from employee table directly to avoid relationship recursion
                $companyId = \Illuminate\Support\Facades\DB::table('employees')
                    ->where('id', $user->employee_id)
                    ->value('company_id');

                if ($companyId) {
                    $builder->whereHas('employee', function ($query) use ($companyId) {
                        $query->where('company_id', $companyId);
                    });
                }
            }
        });
    }
}
