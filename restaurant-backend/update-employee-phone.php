<?php

// Script pour mettre à jour le numéro de téléphone d'un employé

$email = "kimaarielle03@gmail.com";
$newPhone = readline("Entrez le nouveau numéro WhatsApp (format: +226XXXXXXXX ou 226XXXXXXXX): ");

$employeesFile = __DIR__ . '/storage/app/employees.json';
$employees = json_decode(file_get_contents($employeesFile), true);

$found = false;
foreach ($employees as &$employee) {
    if ($employee['email'] === $email) {
        $oldPhone = $employee['phone'];
        $employee['phone'] = $newPhone;
        $found = true;
        echo "\n✅ Numéro mis à jour pour {$employee['name']}\n";
        echo "   Ancien: {$oldPhone}\n";
        echo "   Nouveau: {$newPhone}\n";
        break;
    }
}

if ($found) {
    file_put_contents($employeesFile, json_encode($employees, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    echo "\n✅ Sauvegardé dans employees.json\n";
} else {
    echo "\n❌ Employé non trouvé: {$email}\n";
}
