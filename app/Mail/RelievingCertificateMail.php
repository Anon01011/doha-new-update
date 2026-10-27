<?php

namespace App\Mail;

use App\Models\OffboardingRequest;
use App\Models\Employee;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RelievingCertificateMail extends Mailable
{
    use Queueable, SerializesModels;

    public $offboarding;
    public $employee;
    public $company;
    public $pdfContent;
    public $fileName;

    /**
     * Create a new message instance.
     */
    public function __construct(OffboardingRequest $offboarding, string $pdfContent, string $fileName)
    {
        $this->offboarding = $offboarding->loadMissing(['employee.company', 'employee.department']);
        $this->employee    = $this->offboarding->employee;
        $this->company     = $this->employee->company ?? null;
        $this->pdfContent  = $pdfContent;
        $this->fileName    = $fileName;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $companyName = $this->company->name ?? config('app.name', 'HRMS');
        $subject     = 'Official Experience & Relieving Certificate - ' . ($this->employee->name ?? 'Employee') . ' - ' . $companyName;

        return $this->subject($subject)
            ->view('emails.relieving_letter')
            ->attachData($this->pdfContent, $this->fileName, [
                'mime' => 'application/pdf',
            ]);
    }
}
