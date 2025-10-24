<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeeRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $companyName;

    public function __construct($employeeName, $companyName)
    {
        $this->employeeName = $employeeName;
        $this->companyName = $companyName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Demande d\'inscription non approuvée - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "Bonjour {$this->employeeName},\n\n";
        $message .= "Nous vous informons que votre demande d'inscription sur AppTicket pour {$this->companyName} n'a pas été approuvée.\n\n";
        $message .= "Pour plus d'informations, veuillez contacter le gestionnaire de votre entreprise.\n\n";
        $message .= "Cordialement,\n";
        $message .= "L'équipe AppTicket";

        return new Content(
            text: 'emails.plain',
            with: ['content' => $message]
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
