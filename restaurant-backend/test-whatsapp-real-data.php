<?php

// Test WhatsApp avec vraies données

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// 1. Charger l'employé
$employeesFile = storage_path('app/employees.json');
$employees = json_decode(file_get_contents($employeesFile), true);
$employee = collect($employees)->firstWhere('email', 'kimaarielle03@gmail.com');

// 2. Charger un restaurant
$restaurantsFile = storage_path('app/restaurants.json');
$restaurants = json_decode(file_get_contents($restaurantsFile), true);
$restaurant = collect($restaurants)->firstWhere('id', '5');

// 3. Charger un lieu de livraison
$location = App\Models\DeliveryLocation::first();

echo "✅ Données chargées:\n";
echo "👤 Employé: {$employee['name']}\n";
echo "📱 Téléphone: {$employee['phone']}\n";
echo "🍽️ Restaurant: {$restaurant['name']}\n";
echo "📍 Lieu: {$location->name}\n\n";

// 4. Simuler une commande avec VRAIES données
$order = [
    'id' => 'order_test_' . time(),
    'restaurant_name' => $restaurant['name'],
    'total_amount' => 2500,
    'delivery_location' => [
        'name' => $location->name,
        'address' => $location->address,
        'building' => $location->building
    ]
];

echo "📤 Test envoi WhatsApp...\n";

$whatsapp = new App\Services\WhatsAppService();
$result = $whatsapp->notifyOrderValidated($order, $employee);

if ($result) {
    echo "✅ WhatsApp envoyé!\n";
    echo "📱 Vérifiez sur {$employee['phone']}\n";
    echo "   Restaurant: {$order['restaurant_name']}\n";
    echo "   Livraison: {$order['delivery_location']['name']}\n";
} else {
    echo "❌ Échec\n";
}
