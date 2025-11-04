#!/bin/bash

# Script de migration automatique des contrôleurs JSON → MySQL
# Date: 28 Octobre 2025

echo "🚀 Migration automatique des contrôleurs restants"
echo "=================================================="

# Backup des fichiers avant modification
BACKUP_DIR="backup_controllers_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Création backup dans: $BACKUP_DIR"

# Liste des contrôleurs à migrer
CONTROLLERS=(
    "app/Http/Controllers/Admin/TicketBatchController.php"
    "app/Http/Controllers/Admin/UserTicketController.php"
    "app/Http/Controllers/Admin/CompanyController.php"
    "app/Http/Controllers/Restaurant/OrderManagementController.php"
    "app/Http/Controllers/Company/ReportingController.php"
    "app/Http/Controllers/PasswordResetController.php"
    "app/Http/Controllers/Admin/StatisticsController.php"
    "app/Http/Controllers/Restaurant/RestaurantReportingController.php"
)

# Backup
for controller in "${CONTROLLERS[@]}"; do
    if [ -f "$controller" ]; then
        cp "$controller" "$BACKUP_DIR/"
        echo "✅ Backup: $(basename $controller)"
    fi
done

echo ""
echo "🔧 Application des remplacements..."
echo ""

# Pattern 1: storage_path('app/employees.json') load
find app/Http/Controllers -type f -name "*.php" -exec sed -i '' \
    's/\$filePath = storage_path('\''app\/employees\.json'\'');/\/\/ Migré vers MySQL - Employee model/g' {} \;

find app/Http/Controllers -type f -name "*.php" -exec sed -i '' \
    's/\$employeesFile = storage_path('\''app\/employees\.json'\'');/\/\/ Migré vers MySQL - Employee model/g' {} \;

# Pattern 2: storage_path('app/orders.json')
find app/Http/Controllers -type f -name "*.php" -exec sed -i '' \
    's/\$ordersFile = storage_path('\''app\/orders\.json'\'');/\/\/ Migré vers MySQL - Order model/g' {} \;

# Pattern 3: storage_path('app/ticket_batches.json')  
find app/Http/Controllers -type f -name "*.php" -exec sed -i '' \
    's/\$filePath = storage_path('\''app\/ticket_batches\.json'\'');/\/\/ Migré vers MySQL - TicketBatch model/g' {} \;

# Pattern 4: storage_path('app/ticket_assignments.json')
find app/Http/Controllers -type f -name "*.php" -exec sed -i '' \
    's/\$assignmentsFile = storage_path('\''app\/ticket_assignments\.json'\'');/\/\/ Migré vers MySQL - UserTicket model/g' {} \;

echo "✅ Remplacements terminés"
echo ""
echo "📝 Résumé:"
echo "- Backup créé dans: $BACKUP_DIR"
echo "- Contrôleurs modifiés: ${#CONTROLLERS[@]}"
echo ""
echo "⚠️  IMPORTANT:"
echo "1. Les patterns JSON ont été commentés"
echo "2. Vous devez maintenant remplacer manuellement par:"
echo "   - \App\Models\Employee::all()->toArray()"
echo "   - \App\Models\Order::all()->toArray()"
echo "   - \App\Models\TicketBatch::all()->toArray()"
echo "   - \App\Models\UserTicket::all()->toArray()"
echo ""
echo "3. Testez chaque contrôleur après modification"
echo ""
echo "✅ Script terminé!"
