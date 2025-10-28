<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OrderRejected extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $restaurantName;
    public $totalAmount;
    public $rejectionReason;
    public $deliveryLocation;

    public function __construct($employeeName, $restaurantName, $totalAmount, $rejectionReason, $deliveryLocation = null)
    {
        $this->employeeName = $employeeName;
        $this->restaurantName = $restaurantName;
        $this->totalAmount = $totalAmount;
        $this->rejectionReason = $rejectionReason;
        $this->deliveryLocation = $deliveryLocation;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Commande rejetée - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.order-rejected',
            with: [
                'employeeName' => $this->employeeName,
                'restaurantName' => $this->restaurantName,
                'totalAmount' => $this->totalAmount,
                'rejectionReason' => $this->rejectionReason,
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
