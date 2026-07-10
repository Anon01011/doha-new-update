<?php

namespace App\Mail;

use App\Models\WarningLetter;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class WarningLetterMail extends Mailable
{
    use Queueable, SerializesModels;

    public $warningLetter;

    /**
     * Create a new message instance.
     */
    public function __construct(WarningLetter $warningLetter)
    {
        $this->warningLetter = $warningLetter;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Important: ' . $this->warningLetter->subject)
            ->view('emails.warning_letter');
    }
}
