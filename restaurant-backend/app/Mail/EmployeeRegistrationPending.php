<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class EmployeeRegistrationPending extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $companyName;

    /**
     * Create a new message instance.
     */
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
            subject: 'Inscription en attente de validation - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "Bonjour {$this->employeeName},\n\n";
        $message .= "Votre demande d'inscription sur AppTicket a bien été reçue !\n\n";
        $message .= "Votre compte est actuellement en attente de validation par le gestionnaire de {$this->companyName}.\n\n";
        $message .= "Vous recevrez un email de confirmation dès que votre compte sera approuvé.\n\n";
        $message .= "Merci de votre patience.\n\n";
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
