<?php

namespace App\Notifications;

use App\Models\EmployeeEvaluation;
use App\Services\CurrencyService;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AppraisalApprovedNotification extends Notification
{
    use Queueable;

    public EmployeeEvaluation $evaluation;

    public function __construct(EmployeeEvaluation $evaluation)
    {
        $this->evaluation = $evaluation;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $monthName = date('F', mktime(0, 0, 0, (int)$this->evaluation->month, 10));
        $outcomeDetails = [];

        if ($this->evaluation->increment_percentage > 0) {
            $outcomeDetails[] = "+{$this->evaluation->increment_percentage}% increment";
        } elseif ($this->evaluation->increment_recommended > 0) {
            $currency = CurrencyService::symbol($this->evaluation->company_id);
            $outcomeDetails[] = "+{$currency} {$this->evaluation->increment_recommended} increment";
        }

        if ($this->evaluation->promotion_recommended && $this->evaluation->recommended_designation) {
            $outcomeDetails[] = "Promoted to {$this->evaluation->recommended_designation}";
        }

        $outcomeSummary = !empty($outcomeDetails) ? ' (' . implode(', ', $outcomeDetails) . ')' : '';

        return [
            'evaluation_id'        => $this->evaluation->id,
            'month'                => $this->evaluation->month,
            'year'                 => $this->evaluation->year,
            'overall_score'        => $this->evaluation->overall_score,
            'increment_percentage' => $this->evaluation->increment_percentage,
            'increment_amount'     => $this->evaluation->increment_recommended,
            'promotion'            => $this->evaluation->promotion_recommended,
            'designation'          => $this->evaluation->recommended_designation,
            'message'              => "🎉 Congratulations! Your performance appraisal for {$monthName} {$this->evaluation->year} has been approved{$outcomeSummary}. Your official appraisal letter is now available.",
            'action_url'           => route('evaluations.show', $this->evaluation->id),
            'letter_download_url'  => route('evaluations.downloadLetter', $this->evaluation->id),
            'type'                 => 'appraisal_approved',
        ];
    }
}
