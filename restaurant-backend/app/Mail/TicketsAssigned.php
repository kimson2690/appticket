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
        $message = "Bonjour {$this->employeeName},\n\n";
        $message .= "Vous venez de recevoir {$this->ticketsCount} ticket(s) restaurant !\n\n";
        $message .= "Valeur unitaire : {$this->ticketValue}F\n";
        $message .= "Valeur totale : {$this->totalAmount}F\n\n";
        $message .= "Vous pouvez maintenant les utiliser pour commander vos repas.\n\n";
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
