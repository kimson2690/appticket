#!/bin/bash

# Script de test pour l'inscription d'employé
# Utilisation: ./test_employee_registration.sh

echo "╔════════════════════════════════════════════════════════════╗"
echo "║  🧪 TEST D'INSCRIPTION EMPLOYÉ                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
API_URL="http://localhost:8001/api/admin/employees"
TIMESTAMP=$(date +%s)
TEST_EMAIL="test_${TIMESTAMP}@example.com"

echo "📊 Configuration:"
echo "  • API URL: $API_URL"
echo "  • Email test: $TEST_EMAIL"
echo ""

# Données de test
TEST_DATA=$(cat <<EOF
{
  "name": "Test Employé",
  "email": "$TEST_EMAIL",
  "password": "Test@123",
  "phone": "+22670000000",
  "company_id": "1",
  "department": "IT",
  "position": "Développeur",
  "employee_number": "EMP$TIMESTAMP",
  "ticket_balance": 0,
  "status": "pending",
  "hire_date": "2025-11-01"
}
EOF
)

echo "🚀 Envoi de la requête..."
echo ""

# Envoi de la requête
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

# Extraire le code HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "📥 Réponse reçue:"
echo "  • Code HTTP: $HTTP_CODE"
echo ""

# Analyser la réponse
if [ "$HTTP_CODE" == "201" ]; then
  echo "✅ SUCCÈS! Employé créé avec succès!"
  echo ""
  echo "Détails:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  
  # Extraire l'ID de l'employé
  EMPLOYEE_ID=$(echo "$BODY" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
  if [ -n "$EMPLOYEE_ID" ]; then
    echo "🆔 ID de l'employé créé: $EMPLOYEE_ID"
    echo ""
    echo "Pour supprimer cet employé test:"
    echo "  curl -X DELETE $API_URL/$EMPLOYEE_ID"
  fi
  
elif [ "$HTTP_CODE" == "500" ]; then
  echo "❌ ERREUR 500! Problème serveur."
  echo ""
  echo "Détails de l'erreur:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  echo ""
  echo "🔍 Vérifications recommandées:"
  echo "  1. Vérifier les logs: tail -f storage/logs/laravel.log"
  echo "  2. Vérifier la base de données"
  echo "  3. Vérifier la migration: php artisan migrate:status"
  
elif [ "$HTTP_CODE" == "422" ]; then
  echo "⚠️  ERREUR DE VALIDATION (422)"
  echo ""
  echo "Détails:"
  echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
  
else
  echo "⚠️  Code HTTP inattendu: $HTTP_CODE"
  echo ""
  echo "Réponse:"
  echo "$BODY"
fi

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║  Test terminé                                              ║"
echo "╚════════════════════════════════════════════════════════════╝"
