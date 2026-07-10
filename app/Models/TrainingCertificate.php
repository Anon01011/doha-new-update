<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class TrainingCertificate extends Model
{
    protected $fillable = [
        'training_assignment_id',
        'employee_id',
        'training_id',
        'company_id',
        'certificate_number',
        'issue_date',
        'expiry_date',
        'issued_by',
        'certificate_file_path',
        'verification_code',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'expiry_date' => 'date',
    ];

    protected static function booted()
    {
        static::creating(function ($certificate) {
            if (!$certificate->certificate_number) {
                $certificate->certificate_number = 'CERT-' . strtoupper(Str::random(10));
            }
            if (!$certificate->verification_code) {
                $certificate->verification_code = strtoupper(Str::random(16));
            }
        });
    }

    public function trainingAssignment()
    {
        return $this->belongsTo(TrainingAssignment::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function issuer()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }
}
