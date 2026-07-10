<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    use \App\Traits\BelongsToCompany;

    protected $fillable = [
        'name',
        'company_id',
        'status',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function companies()
    {
        return $this->belongsToMany(Company::class, 'company_department');
    }

    public function employees()
    {
        return $this->hasMany(Employee::class);
    }
}