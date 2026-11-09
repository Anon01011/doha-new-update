<?php

namespace App\Notifications;

use App\Models\EmployeeEvaluation;
use App\Models\Setting;
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
        $channels = ['database'];
        if (Setting::get('email_notifications_enabled', '1') === '1' && !empty($notifiable->email)) {
            $channels[] = 'mail';
        }
        return $channels;
    }

    public function toMail(object $notifiable): MailMessage
    {
        $monthName = date('F', mktime(0, 0, 0, (int)$this->evaluation->month, 10));
        $year = $this->evaluation->year;
        $score = $this->evaluation->overall_score;

        $mail = (new MailMessage)
            ->subject("Performance Appraisal Approved — {$monthName} {$year}")
            ->line("Congratulations! Your performance appraisal for {$monthName} {$year} has been approved.")
            ->line("Overall Score: {$score}");

        if ($this->evaluation->increment_percentage > 0) {
            $mail->line("Increment: +{$this->evaluation->increment_percentage}%");
        } elseif ($this->evaluation->increment_recommended > 0) {
            $currency = CurrencyService::symbol($this->evaluation->company_id);
            $mail->line("Increment: +{$currency} {$this->evaluation->increment_recommended}");
        }
        if ($this->evaluation->promotion_recommended && $this->evaluation->recommended_designation) {
            $mail->line("Promotion: Promoted to {$this->evaluation->recommended_designation}");
        }

        return $mail
            ->action('View Appraisal', route('evaluations.show', $this->evaluation))
            ->line('Your official appraisal letter is now available for download.');
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
            'action_url'           => route('evaluations.show', $this->evaluation),
            'letter_download_url'  => route('evaluations.appraisal-letter', $this->evaluation),
            'type'                 => 'appraisal_approved',
        ];
    }
}
