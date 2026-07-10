<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WarningLetter extends Model
{
    use HasFactory, \App\Traits\BelongsToCompany;

    protected $fillable = [
        'company_id',
        'employee_id',
        'grievance_id',
        'type',
        'subject',
        'content',
        'sent_by',
        'sent_at',
    ];

    protected $casts = [
        'sent_at' => 'datetime',
    ];

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function grievance()
    {
        return $this->belongsTo(Grievance::class);
    }

    public function sender()
    {
        return $this->belongsTo(User::class, 'sent_by');
    }
}
