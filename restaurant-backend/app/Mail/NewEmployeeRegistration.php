<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewEmployeeRegistration extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $employeeEmail;
    public $companyName;

    public function __construct($employeeName, $employeeEmail, $companyName)
    {
        $this->employeeName = $employeeName;
        $this->employeeEmail = $employeeEmail;
        $this->companyName = $companyName;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nouvelle demande d\'inscription - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "Bonjour,\n\n";
        $message .= "Une nouvelle demande d'inscription a été reçue pour {$this->companyName}.\n\n";
        $message .= "Détails de l'employé :\n";
        $message .= "Nom : {$this->employeeName}\n";
        $message .= "Email : {$this->employeeEmail}\n\n";
        $message .= "Veuillez vous connecter à AppTicket pour approuver ou rejeter cette demande.\n\n";
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
