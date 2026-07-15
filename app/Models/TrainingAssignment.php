<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;
use App\Models\TrainingSession;
use App\Models\TrainingSessionAttendance;
use App\Models\TrainingMaterial;
use App\Models\TrainingQuiz;
use App\Models\TrainingQuizAttempt;

class TrainingAssignment extends Model
{
    use \App\Traits\BelongsToCompany;

    protected $fillable = [
        'training_id',
        'employee_id',
        'assigned_by',
        'assigned_date',
        'status',
        'completion_date',
        'score',
        'certificate_issued',
        'feedback',
        'remarks',
        'company_id',
        'progress_percentage',
        'started_at',
        'last_activity_at',
        'sessions_attended',
        'sessions_total',
        'quiz_scores',
        'materials_viewed',
    ];

    protected $casts = [
        'assigned_date' => 'date',
        'completion_date' => 'date',
        'score' => 'decimal:2',
        'certificate_issued' => 'boolean',
        'started_at' => 'datetime',
        'last_activity_at' => 'datetime',
        'quiz_scores' => 'array',
        'materials_viewed' => 'array',
    ];

    public function training()
    {
        return $this->belongsTo(Training::class);
    }

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function assigner()
    {
        return $this->belongsTo(User::class, 'assigned_by');
    }

    public function company()
    {
        return $this->belongsTo(Company::class);
    }

    public function certificate()
    {
        return $this->hasOne(TrainingCertificate::class);
    }

    public function evaluation()
    {
        return $this->hasOne(TrainingEvaluation::class);
    }



    /**
     * Recalculate and update the progress percentage.
     * Logic: 50% Sessions + 50% Materials
     */
    public function recalculateProgress()
    {
        $trainingId = $this->training_id;
        $employeeId = $this->employee_id;

        // 1. Sessions Progress
        $totalSessions = TrainingSession::where('training_id', $trainingId)->count();
        $sessionProgress = 0;
        $hasSessions = $totalSessions > 0;

        if ($hasSessions) {
            $attendedSessions = TrainingSessionAttendance::whereHas('trainingSession', function ($q) use ($trainingId) {
                $q->where('training_id', $trainingId);
            })
                ->where('employee_id', $employeeId)
                ->whereIn('attendance_status', ['present', 'late'])
                ->count();

            $sessionProgress = ($attendedSessions / $totalSessions); // 0.0 to 1.0

            $this->sessions_total = $totalSessions;
            $this->sessions_attended = $attendedSessions;
        }

        // 2. Materials Progress
        $totalMaterials = TrainingMaterial::where('training_id', $trainingId)->count();
        $materialProgress = 0;
        $hasMaterials = $totalMaterials > 0;

        if ($hasMaterials) {
            $viewedCount = count($this->materials_viewed ?? []);
            $materialProgress = min(1.0, ($viewedCount / $totalMaterials)); // 0.0 to 1.0
        }

        // 3. Quiz Progress
        $quiz = TrainingQuiz::where('training_id', $trainingId)->where('is_active', true)->first();
        $quizProgress = 0;
        $hasQuiz = $quiz !== null;

        if ($hasQuiz) {
            // Check if passed
            $passedAttempt = TrainingQuizAttempt::where('training_quiz_id', $quiz->id)
                ->where('employee_id', $employeeId)
                ->where('is_passed', true)
                ->exists();

            $quizProgress = $passedAttempt ? 1.0 : 0.0;
        }

        // Weighted Average
        // Weights: All equal. You can adjust weights here if needed (e.g., Quiz = 2x).
        $activeComponents = 0;
        $totalScore = 0;

        if ($hasSessions) {
            $activeComponents++;
            $totalScore += $sessionProgress;
        }
        if ($hasMaterials) {
            $activeComponents++;
            $totalScore += $materialProgress;
        }
        if ($hasQuiz) {
            $activeComponents++;
            $totalScore += $quizProgress;
        }

        $finalProgress = ($activeComponents > 0) ? ($totalScore / $activeComponents) * 100 : 0;
        $finalProgress = round($finalProgress);

        // Update Status
        $status = $this->status;

        // Completion Check
        // Explicitly require Quiz Pass if quiz exists, even if rounding pushes it to 100?
        // The formula naturally handles it: if Quiz=0 and there are 3 components, max score is 66%. 
        // If 2 components (Quiz + Mat), max is 50%.
        // Only edge case: if NO sessions, NO materials, NO quiz -> 0%.

        if ($finalProgress == 100 && $status !== 'completed') {
            $status = 'completed';
            $this->completion_date = today();
            // TODO: Auto-generate certificate here?
        } elseif ($finalProgress > 0 && $status === 'assigned') {
            $status = 'in_progress';
            if (!$this->started_at) {
                $this->started_at = now();
            }
        }

        $this->progress_percentage = $finalProgress;
        $this->status = $status;
        $this->last_activity_at = now();
        $this->save();
    }
}


