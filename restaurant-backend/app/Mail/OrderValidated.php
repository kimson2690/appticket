<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderValidated extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public $tries = 3;
    public $timeout = 30;
    public $backoff = [10, 30, 60];

    public $employeeName;
    public $restaurantName;
    public $totalAmount;
    public $deliveryLocation;

    public function __construct($employeeName, $restaurantName, $totalAmount, $deliveryLocation = null)
    {
        $this->employeeName = $employeeName;
        $this->restaurantName = $restaurantName;
        $this->totalAmount = $totalAmount;
        $this->deliveryLocation = $deliveryLocation;
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
        return new Content(
            html: 'emails.order-validated',
            with: [
                'employeeName' => $this->employeeName,
                'restaurantName' => $this->restaurantName,
                'totalAmount' => $this->totalAmount,
                'deliveryLocation' => $this->deliveryLocation
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
