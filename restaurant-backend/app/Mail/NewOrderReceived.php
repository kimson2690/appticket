<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewOrderReceived extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $restaurantName;
    public $totalAmount;
    public $orderItems;

    public function __construct($employeeName, $restaurantName, $totalAmount, $orderItems)
    {
        $this->employeeName = $employeeName;
        $this->restaurantName = $restaurantName;
        $this->totalAmount = $totalAmount;
        $this->orderItems = $orderItems;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nouvelle commande reçue - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "Bonjour,\n\n";
        $message .= "Vous avez reçu une nouvelle commande chez {$this->restaurantName} !\n\n";
        $message .= "Client : {$this->employeeName}\n\n";
        $message .= "Détail de la commande :\n";
        foreach ($this->orderItems as $item) {
            $message .= "- {$item['name']} x{$item['quantity']}\n";
        }
        $message .= "\nMontant total : {$this->totalAmount}F\n\n";
        $message .= "Veuillez vous connecter à AppTicket pour valider ou rejeter cette commande.\n\n";
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
