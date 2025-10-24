<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderConfirmation extends Mailable
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
            subject: 'Confirmation de commande - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $message = "Bonjour {$this->employeeName},\n\n";
        $message .= "Votre commande chez {$this->restaurantName} a bien été enregistrée !\n\n";
        $message .= "Détail de votre commande :\n";
        foreach ($this->orderItems as $item) {
            $message .= "- {$item['name']} x{$item['quantity']} = {$item['price']}F\n";
        }
        $message .= "\nMontant total : {$this->totalAmount}F\n\n";
        $message .= "Votre commande est en attente de validation par le restaurant.\n\n";
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
