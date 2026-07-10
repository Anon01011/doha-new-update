<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

use App\Traits\BelongsToCompany;

class EmployeeEvaluation extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'employee_id',
        'evaluator_id',
        'month',
        'year',
        'overall_score',
        'criteria_scores',
        'comments',
        'company_id',
    ];

    protected $casts = [
        'criteria_scores' => 'array',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }
}
