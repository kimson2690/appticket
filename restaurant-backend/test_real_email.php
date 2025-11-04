<?php

/**
 * Test d'envoi d'email réel
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmation;

echo "📧 Test d'envoi d'email réel\n";
echo "==============================\n\n";

// Email de test
$testEmail = 'kimaarmel@gmail.com'; // Remplacez par votre email

echo "📬 Destinataire: $testEmail\n";
echo "⏳ Envoi en cours...\n\n";

try {
    // Test 1: Envoi synchrone (immédiat)
    echo "1️⃣ Test envoi SYNCHRONE (send):\n";
    Mail::to($testEmail)->send(new OrderConfirmation(
        'Test User',
        'Test Restaurant',
        5000,
        [
            ['name' => 'Foutou', 'quantity' => 2, 'price' => 2500]
        ],
        null
    ));
    echo "   ✅ Email envoyé avec succès (synchrone)\n\n";
    
} catch (\Exception $e) {
    echo "   ❌ Erreur: " . $e->getMessage() . "\n\n";
}

try {
    // Test 2: Envoi asynchrone (queue)
    echo "2️⃣ Test envoi ASYNCHRONE (queue):\n";
    $mailable = new OrderConfirmation(
        'Test User Queue',
        'Test Restaurant Queue',
        3000,
        [
            ['name' => 'Attiéké', 'quantity' => 1, 'price' => 3000]
        ],
        null
    );
    Mail::to($testEmail)->queue($mailable);
    echo "   ✅ Email ajouté à la queue\n";
    echo "   ⏳ Sera envoyé par Horizon dans quelques secondes...\n\n";
    
} catch (\Exception $e) {
    echo "   ❌ Erreur: " . $e->getMessage() . "\n\n";
}

echo "✅ Tests terminés!\n\n";
echo "📊 Vérifications:\n";
echo "   1. Vérifiez votre boîte email: $testEmail\n";
echo "   2. Vérifiez les logs: tail -f storage/logs/laravel.log\n";
echo "   3. Vérifiez Horizon: http://localhost:8001/horizon\n";
