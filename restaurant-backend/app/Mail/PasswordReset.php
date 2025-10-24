<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PasswordReset extends Mailable
{
    use Queueable, SerializesModels;

    public $userName;
    public $resetToken;
    public $resetUrl;

    public function __construct($userName, $resetToken, $resetUrl)
    {
        $this->userName = $userName;
        $this->resetToken = $resetToken;
        $this->resetUrl = $resetUrl;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Réinitialisation de mot de passe - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "Bonjour {$this->userName},\n\n";
        $message .= "Vous avez demandé la réinitialisation de votre mot de passe.\n\n";
        $message .= "Cliquez sur le lien ci-dessous pour créer un nouveau mot de passe :\n";
        $message .= "{$this->resetUrl}\n\n";
        $message .= "Ce lien est valide pendant 60 minutes.\n\n";
        $message .= "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.\n\n";
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
