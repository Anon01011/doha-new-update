<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TrainingSessionAttendance extends Model
{
    protected $table = 'training_session_attendance';

    protected $fillable = [
        'training_session_id',
        'employee_id',
        'company_id',
        'attendance_status',
        'check_in_time',
        'check_out_time',
        'notes',
        'marked_by',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
    ];

    public function trainingSession()
    {
        return $this->belongsTo(TrainingSession::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function markedBy()
    {
        return $this->belongsTo(User::class, 'marked_by');
    }
}
