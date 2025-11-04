#!/bin/bash

# Script de migration automatique finale - JSON vers MySQL
# Date: 28 Octobre 2025
# Usage: bash SCRIPT_MIGRATION_FINALE.sh

echo "🚀 MIGRATION AUTOMATIQUE FINALE - JSON → MySQL"
echo "================================================"
echo ""

cd /Users/kima/AppTicket/restaurant-backend

# Backup
BACKUP_DIR="backup_final_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Backup créé: $BACKUP_DIR"

# Copier les contrôleurs
cp -r app/Http/Controllers "$BACKUP_DIR/"

echo ""
echo "🔧 Application des remplacements globaux..."
echo ""

# Pattern 1: Charger employees.json → Employee::all()
find app/Http/Controllers -name "*.php" -type f -exec sed -i '' \
  -e 's/\$employeesFile = storage_path('\''app\/employees\.json'\'');/$employees = \\App\\Models\\Employee::all()->toArray(); \/\/ Migré MySQL/g' \
  -e 's/\$employees = json_decode(file_get_contents(\$employeesFile), true) ?? \[\];/\/\/ Déjà chargé depuis MySQL/g' \
  -e 's/if (file_exists(\$employeesFile)) {/\/\/ MySQL - pas besoin de file_exists/g' \
  {} \;

# Pattern 2: Charger orders.json → Order::all()
find app/Http/Controllers -name "*.php" -type f -exec sed -i '' \
  -e 's/\$ordersFile = storage_path('\''app\/orders\.json'\'');/$orders = \\App\\Models\\Order::all()->toArray(); \/\/ Migré MySQL/g' \
  -e 's/\$orders = json_decode(file_get_contents(\$ordersFile), true) ?? \[\];/\/\/ Déjà chargé depuis MySQL/g' \
  {} \;

# Pattern 3: Charger ticket_batches.json → TicketBatch::all()
find app/Http/Controllers -name "*.php" -type f -exec sed -i '' \
  -e 's/\$batchesFile = storage_path('\''app\/ticket_batches\.json'\'');/$batches = \\App\\Models\\TicketBatch::all()->toArray(); \/\/ Migré MySQL/g' \
  -e 's/\$batches = json_decode(file_get_contents(\$batchesFile), true) ?? \[\];/\/\/ Déjà chargé depuis MySQL/g' \
  {} \;

# Pattern 4: Charger ticket_assignments.json → UserTicket::all()
find app/Http/Controllers -name "*.php" -type f -exec sed -i '' \
  -e 's/\$assignmentsFile = storage_path('\''app\/ticket_assignments\.json'\'');/$assignments = \\App\\Models\\UserTicket::all()->toArray(); \/\/ Migré MySQL/g' \
  -e 's/\$assignments = json_decode(file_get_contents(\$assignmentsFile), true) ?? \[\];/\/\/ Déjà chargé depuis MySQL/g' \
  {} \;

# Pattern 5: Supprimer file_put_contents (commenté)
find app/Http/Controllers -name "*.php" -type f -exec sed -i '' \
  -e 's/file_put_contents(\$employeesFile, json_encode(\$employees, JSON_PRETTY_PRINT));/\/\/ MySQL gère automatiquement - plus besoin de file_put_contents/g' \
  -e 's/file_put_contents(\$ordersFile, json_encode(\$orders, JSON_PRETTY_PRINT));/\/\/ MySQL gère automatiquement/g' \
  -e 's/file_put_contents(\$batchesFile, json_encode(\$batches, JSON_PRETTY_PRINT));/\/\/ MySQL gère automatiquement/g' \
  -e 's/file_put_contents(\$assignmentsFile, json_encode(\$assignments, JSON_PRETTY_PRINT));/\/\/ MySQL gère automatiquement/g' \
  {} \;

echo "✅ Remplacements automatiques terminés"
echo ""
echo "📊 Résumé:"
echo "- Backup: $BACKUP_DIR"
echo "- Patterns JSON remplacés par MySQL"
echo ""
echo "⚠️  IMPORTANT:"
echo "1. Les patterns JSON ont été automatiquement remplacés"
echo "2. Certains contrôleurs nécessitent des ajustements manuels"
echo "3. Testez chaque endpoint après migration"
echo ""
echo "📝 Contrôleurs modifiés:"
grep -r "Migré MySQL" app/Http/Controllers --include="*.php" | cut -d: -f1 | sort -u
echo ""
echo "✅ Script terminé!"
echo ""
echo "🎯 PROCHAINE ÉTAPE:"
echo "1. Vérifier les fichiers modifiés"
echo "2. Tester les endpoints"
echo "3. Corriger les erreurs de syntaxe si nécessaire"
