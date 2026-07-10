<?php

namespace App\Mail;

use App\Models\TrainingAssignment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TrainingAssignedMail extends Mailable
{
    use Queueable, SerializesModels;

    public $assignment;

    public function __construct(TrainingAssignment $assignment)
    {
        $this->assignment = $assignment;
    }

    public function build()
    {
        return $this
            ->subject('Training Assignment: ' . $this->assignment->training->title)
            ->view('emails.training_assigned');
    }
}
