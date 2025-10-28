<?php

/**
 * Script pour ajouter le champ 'phone' aux employés existants
 * 
 * Usage: php add-phone-to-employees.php
 */

$employeesFile = __DIR__ . '/storage/app/employees.json';

if (!file_exists($employeesFile)) {
    die("❌ Fichier employees.json non trouvé\n");
}

// Charger les employés
$employees = json_decode(file_get_contents($employeesFile), true);

if (!is_array($employees)) {
    die("❌ Format JSON invalide\n");
}

$modified = 0;

// Ajouter le champ phone si absent
foreach ($employees as &$employee) {
    if (!isset($employee['phone'])) {
        $employee['phone'] = '';  // Vide par défaut
        $modified++;
        echo "✅ Phone ajouté pour: {$employee['name']}\n";
    } else {
        echo "⏭️  {$employee['name']} a déjà un phone: {$employee['phone']}\n";
    }
}

if ($modified > 0) {
    // Sauvegarder
    $json = json_encode($employees, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    file_put_contents($employeesFile, $json);
    echo "\n✅ {$modified} employé(s) mis à jour !\n";
} else {
    echo "\n✅ Tous les employés ont déjà un champ phone.\n";
}

echo "\n📝 Prochaines étapes:\n";
echo "1. Modifiez storage/app/employees.json pour ajouter les numéros\n";
echo "2. Format: \"phone\": \"221771234567\" (code pays + numéro)\n";
echo "3. Exemple: \"221771234567\" pour le Sénégal\n";
echo "\n";
