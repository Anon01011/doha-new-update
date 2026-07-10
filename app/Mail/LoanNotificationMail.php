<?php

namespace App\Mail;

use App\Models\Employee;
use App\Models\Loan;
use App\Models\Company;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class LoanNotificationMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public Employee $employee;
    public Loan $loan;
    public Company $company;
    public string $type;
    public float $installmentAmount;

    /**
     * Create a new message instance.
     *
     * @param string $type 'disbursed' | 'installment_paid' | 'completed'
     */
    public function __construct(Employee $employee, Loan $loan, Company $company, string $type, float $installmentAmount = 0)
    {
        $this->employee          = $employee;
        $this->loan              = $loan;
        $this->company           = $company;
        $this->type              = $type;
        $this->installmentAmount = $installmentAmount;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $subjects = [
            'disbursed'        => "Loan Disbursed – {$this->company->name}",
            'installment_paid' => "Installment Paid – Loan #{$this->loan->id}",
            'completed'        => "Loan Fully Repaid – Congratulations!",
        ];

        return new Envelope(
            subject: $subjects[$this->type] ?? 'Loan Notification',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.loan_notification',
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }
}
