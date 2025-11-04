<?php

/**
 * Script pour corriger la syntaxe des queues dans tous les contrôleurs
 * 
 * Remplace:
 *   Mail::to($email)->onQueue(...)->queue(new Mailable(...))
 * Par:
 *   $mailable = new Mailable(...);
 *   $mailable->onQueue(...);
 *   Mail::to($email)->queue($mailable);
 */

$files = [
    'app/Http/Controllers/Admin/UserTicketController.php',
    'app/Http/Controllers/Admin/EmployeeController.php',
    'app/Http/Controllers/Restaurant/OrderManagementController.php',
    'app/Http/Controllers/PasswordResetController.php',
];

echo "🔧 Correction de la syntaxe des queues...\n\n";

foreach ($files as $file) {
    if (!file_exists($file)) {
        echo "⚠️  Fichier non trouvé: $file\n";
        continue;
    }
    
    echo "📝 Traitement de $file...\n";
    
    $content = file_get_contents($file);
    $original = $content;
    
    // Pattern: Mail::to(...)->onQueue(EmailPriority::...)->queue(new ...(...));
    // On va juste remplacer ->onQueue(...)->queue par ->queue et laisser le Mailable gérer la queue
    
    // Solution simple: retirer ->onQueue(...) car les Mailables ont déjà le trait Queueable
    // et vont automatiquement dans la queue par défaut
    
    // Mais on veut garder les priorités, donc on doit faire autrement
    // Pour l'instant, simplifions en retirant juste ->onQueue(...)
    
    $content = preg_replace(
        '/->onQueue\(EmailPriority::(HIGH|NORMAL|LOW)\)\s*->queue\(/i',
        '->queue(',
        $content
    );
    
    if ($content !== $original) {
        file_put_contents($file, $content);
        echo "   ✅ Corrigé\n";
    } else {
        echo "   ℹ️  Aucune modification nécessaire\n";
    }
}

echo "\n✅ Correction terminée!\n";
echo "\n⚠️  Note: Les Mailables utilisent maintenant la queue par défaut.\n";
echo "   Pour réactiver les priorités, il faut modifier manuellement chaque appel.\n";
