<?php

/**
 * Script de test du système de queue d'emails
 * 
 * Ce script teste l'envoi d'emails via les différentes queues
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Mail;
use App\Mail\OrderConfirmation;
use App\Helpers\EmailPriority;

echo "🧪 Test du système de queue d'emails\n";
echo "=====================================\n\n";

// Test 1: Email HIGH priority
echo "📧 Test 1: Email HIGH priority (OrderConfirmation)\n";
try {
    $mailable = new OrderConfirmation(
        'Test User',
        'Test Restaurant',
        5000,
        [
            ['name' => 'Foutou', 'quantity' => 2, 'price' => 2500]
        ],
        null
    );
    $mailable->onQueue(EmailPriority::HIGH);
    Mail::to('test@example.com')->queue($mailable);
    echo "   ✅ Email ajouté à la queue 'emails-high'\n";
} catch (\Exception $e) {
    echo "   ❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n";

// Test 2: Email NORMAL priority
echo "📧 Test 2: Email NORMAL priority (TicketsAssigned)\n";
try {
    $mailable = new \App\Mail\TicketsAssigned(
        'Test User',
        10,
        500,
        5000
    );
    $mailable->onQueue(EmailPriority::NORMAL);
    Mail::to('test@example.com')->queue($mailable);
    echo "   ✅ Email ajouté à la queue 'emails-normal'\n";
} catch (\Exception $e) {
    echo "   ❌ Erreur: " . $e->getMessage() . "\n";
}

echo "\n";

// Vérifier les jobs dans Redis
echo "📊 Statistiques des queues:\n";
echo "----------------------------\n";

$redis = app('redis')->connection();

$queues = ['emails-high', 'emails-normal', 'emails-low'];
foreach ($queues as $queue) {
    $queueKey = config('database.redis.options.prefix') . 'queues:' . $queue;
    $count = $redis->llen($queueKey);
    
    $icon = $queue === 'emails-high' ? '🔴' : ($queue === 'emails-normal' ? '🟡' : '🟢');
    echo "$icon $queue: $count job(s) en attente\n";
}

echo "\n";
echo "✅ Tests terminés!\n";
echo "\n";
echo "📊 Consultez le dashboard Horizon:\n";
echo "   http://localhost:8001/horizon\n";
echo "\n";
echo "💡 Les emails ne seront PAS réellement envoyés car:\n";
echo "   - Adresse test@example.com\n";
echo "   - Configuration SMTP peut ne pas être configurée\n";
echo "   - C'est juste pour tester le système de queue\n";
