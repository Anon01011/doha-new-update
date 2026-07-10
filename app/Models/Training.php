<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\TrainingQuiz;
use App\Traits\BelongsToCompany;

class Training extends Model
{
    use BelongsToCompany;

    protected $fillable = [
        'title',
        'description',
        'category',
        'duration_hours',
        'trainer_name',
        'location',
        'start_date',
        'end_date',
        'max_participants',
        'status',
        'created_by',
        'company_id',
    ];

    protected $casts = [
        'duration_hours' => 'decimal:2',
        'start_date' => 'date',
        'end_date' => 'date',
        'max_participants' => 'integer',
    ];

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function assignments()
    {
        return $this->hasMany(TrainingAssignment::class);
    }

    public function quiz()
    {
        return $this->hasOne(TrainingQuiz::class);
    }

    public function sessions()
    {
        return $this->hasMany(TrainingSession::class);
    }

    public function materials()
    {
        return $this->hasMany(TrainingMaterial::class);
    }

    public function certificates()
    {
        return $this->hasMany(TrainingCertificate::class);
    }

    public function evaluations()
    {
        return $this->hasMany(TrainingEvaluation::class);
    }
}
