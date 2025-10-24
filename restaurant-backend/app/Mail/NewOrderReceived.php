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
        return new Content(
            html: 'emails.new-order-received',
            with: [
                'restaurantName' => $this->restaurantName,
                'employeeName' => $this->employeeName,
                'orderItems' => $this->orderItems,
                'totalAmount' => $this->totalAmount
            ]
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
