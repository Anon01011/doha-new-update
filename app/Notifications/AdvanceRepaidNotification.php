<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class AdvanceRepaidNotification extends Notification implements ShouldQueue
{
    use Queueable;

    protected $advance;
    protected $repaidAmount;
    protected $isFullyRepaid;

    public function __construct($advance, float $repaidAmount, bool $isFullyRepaid = false)
    {
        $this->advance = $advance;
        $this->repaidAmount = $repaidAmount;
        $this->isFullyRepaid = $isFullyRepaid;
    }

    public function via(object $notifiable): array
    {
        return ['database'];
    }

    public function toArray(object $notifiable): array
    {
        $formattedAmount = number_format($this->repaidAmount, 2);
        $message = $this->isFullyRepaid
            ? "Your salary advance has been fully settled ({$formattedAmount} deducted from salary)."
            : "A deduction of {$formattedAmount} towards your salary advance has been processed from payroll.";

        return [
            'advance_id' => $this->advance->id,
            'title'      => $this->isFullyRepaid ? 'Salary Advance Fully Repaid' : 'Advance Repayment Processed',
            'amount'     => $this->repaidAmount,
            'message'    => $message,
            'action_url' => route('advances.show', $this->advance->id),
            'type'       => 'advance_status_updated',
        ];
    }
}
