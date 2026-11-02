<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class EmployeeRosterMail extends Mailable
{
    use Queueable, SerializesModels;

    public $employee;
    public $company;
    public $roster;
    public $dateRange;

    /**
     * Create a new message instance.
     */
    public function __construct($employee, $company, $roster, $dateRange)
    {
        $this->employee = $employee;
        $this->company = $company;
        $this->roster = $roster;
        $this->dateRange = $dateRange;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        $companyName = $this->company->name ?? config('app.name');
        return $this->subject("Shift Roster: {$this->dateRange} | {$companyName}")
            ->view('emails.employee_roster');
    }
}
