<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketsAssigned extends Mailable
{
    use Queueable, SerializesModels;

    public $employeeName;
    public $ticketsCount;
    public $ticketValue;
    public $totalAmount;

    public function __construct($employeeName, $ticketsCount, $ticketValue, $totalAmount)
    {
        $this->employeeName = $employeeName;
        $this->ticketsCount = $ticketsCount;
        $this->ticketValue = $ticketValue;
        $this->totalAmount = $totalAmount;
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Nouveaux tickets affectés - AppTicket',
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        return new Content(
            html: 'emails.tickets-assigned',
            with: [
                'employeeName' => $this->employeeName,
                'ticketsCount' => $this->ticketsCount,
                'ticketValue' => $this->ticketValue,
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
