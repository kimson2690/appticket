<?php

namespace App\Helpers;

class EmailPriority
{
    /**
     * Emails transactionnels - Priorité maximale
     * Confirmation commande, validation, rejet, remboursement, reset password
     */
    const HIGH = 'emails-high';
    
    /**
     * Emails de notification - Priorité normale
     * Tickets assignés, approbation employé, rejet employé, nouvelle inscription
     */
    const NORMAL = 'emails-normal';
    
    /**
     * Emails de rapport - Priorité basse
     * Rapports mensuels, statistiques
     */
    const LOW = 'emails-low';
}
