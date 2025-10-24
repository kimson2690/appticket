<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderValidated extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $restaurantName;
    public $totalAmount;

    public function __construct($employeeName, $restaurantName, $totalAmount)
    {
        $this->employeeName = $employeeName;
        $this->restaurantName = $restaurantName;
        $this->totalAmount = $totalAmount;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Commande validée - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "Bonjour {$this->employeeName},\n\n";
        $message .= "Bonne nouvelle ! Votre commande chez {$this->restaurantName} a été validée.\n\n";
        $message .= "Montant : {$this->totalAmount}F\n\n";
        $message .= "Votre repas est en préparation !\n\n";
        $message .= "Bon appétit !\n\n";
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
