#!/bin/bash

# Script pour remplacer tous les send() par queue() avec priorités

echo "🚀 Mise à jour des emails vers système asynchrone..."

# Fonction pour ajouter l'import EmailPriority
add_email_priority_import() {
    local file=$1
    if ! grep -q "use App\\\\Helpers\\\\EmailPriority;" "$file"; then
        # Trouver la dernière ligne use et ajouter après
        sed -i '' '/^use App\\Mail\\/a\
use App\\Helpers\\EmailPriority;
' "$file"
    fi
}

# Liste des fichiers à modifier
files=(
    "app/Http/Controllers/Admin/UserTicketController.php"
    "app/Http/Controllers/Admin/EmployeeController.php"
    "app/Http/Controllers/Restaurant/OrderManagementController.php"
    "app/Http/Controllers/PasswordResetController.php"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "📝 Traitement de $file..."
        
        # Ajouter l'import
        add_email_priority_import "$file"
        
        # Remplacer les patterns courants
        # Pattern 1: Mail::to(...)->send(new ...)
        sed -i '' 's/Mail::to(\([^)]*\))->send(new \(TicketsAssigned\|EmployeeApproved\|EmployeeRejected\|EmployeeRegistrationPending\|NewEmployeeRegistration\)/Mail::to(\1)->onQueue(EmailPriority::NORMAL)->queue(new \2/g' "$file"
        
        # Pattern 2: OrderValidated et OrderRejected (HIGH priority)
        sed -i '' 's/Mail::to(\([^)]*\))->send(new \(OrderValidated\|OrderRejected\)/Mail::to(\1)->onQueue(EmailPriority::HIGH)->queue(new \2/g' "$file"
        
        # Pattern 3: PasswordReset (HIGH priority)
        sed -i '' 's/Mail::to(\([^)]*\))->send(new PasswordReset/Mail::to(\1)->onQueue(EmailPriority::HIGH)->queue(new PasswordReset/g' "$file"
        
        echo "✅ $file mis à jour"
    else
        echo "⚠️  $file non trouvé"
    fi
done

echo ""
echo "✅ Mise à jour terminée!"
echo ""
echo "📋 Résumé des priorités:"
echo "  🔴 HIGH (emails-high): OrderConfirmation, OrderValidated, OrderRejected, PasswordReset, NewOrderReceived"
echo "  🟡 NORMAL (emails-normal): TicketsAssigned, EmployeeApproved, EmployeeRejected, NewEmployeeRegistration"
echo "  🟢 LOW (emails-low): Rapports (à implémenter)"
