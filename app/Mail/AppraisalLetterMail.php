<?php

namespace App\Mail;

use App\Models\EmployeeEvaluation;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class AppraisalLetterMail extends Mailable
{
    use Queueable, SerializesModels;

    public $evaluation;
    public $employee;
    public $company;
    public $settings;
    public $currencySymbol;

    /**
     * Create a new message instance.
     */
    public function __construct(EmployeeEvaluation $evaluation, array $settings = [], string $currencySymbol = '₹')
    {
        $this->evaluation = $evaluation->loadMissing(['employee.department', 'employee.company', 'evaluator', 'approver']);
        $this->employee = $this->evaluation->employee;
        $this->company = $this->employee->company ?? null;
        $this->settings = $settings;
        $this->currencySymbol = $currencySymbol;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $companyName = $this->company->name ?? config('app.name', 'HRMS');
        $subject = 'Official Performance Appraisal & Compensation Revision - ' . $companyName;

        return $this->subject($subject)
            ->view('emails.appraisal_letter');
    }
}
