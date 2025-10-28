#!/bin/bash

# Script pour tester tous les templates WhatsApp
PHONE="22671616631"

echo "🧪 Test des templates WhatsApp sur $PHONE"
echo ""

# 1. Commande validée
echo "1️⃣ Test: order_validated"
curl -X POST http://localhost:3001/send-template \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"template\": \"order_validated\",
    \"data\": {
      \"employee_name\": \"Test User\",
      \"restaurant_name\": \"Le Baobab\",
      \"order_id\": \"ORDER_001\",
      \"total_amount\": \"5000\",
      \"delivery_location\": \"Bureau Principal\"
    }
  }"
echo -e "\n"

# 2. Commande rejetée
echo "2️⃣ Test: order_rejected"
curl -X POST http://localhost:3001/send-template \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"template\": \"order_rejected\",
    \"data\": {
      \"employee_name\": \"Test User\",
      \"restaurant_name\": \"Le Baobab\",
      \"order_id\": \"ORDER_002\",
      \"rejection_reason\": \"Restaurant fermé\"
    }
  }"
echo -e "\n"

# 3. Confirmation commande
echo "3️⃣ Test: order_confirmation"
curl -X POST http://localhost:3001/send-template \
  -H "Content-Type: application/json" \
  -d "{
    \"phone\": \"$PHONE\",
    \"template\": \"order_confirmation\",
    \"data\": {
      \"employee_name\": \"Test User\",
      \"restaurant_name\": \"Le Baobab\",
      \"order_id\": \"ORDER_003\",
      \"total_amount\": \"7500\",
      \"delivery_location\": \"Bâtiment A\",
      \"date\": \"$(date '+%d/%m/%Y à %H:%M')\",
      \"items\": [
        {\"name\": \"Poulet Yassa\", \"quantity\": 1, \"total\": \"2500\"},
        {\"name\": \"Riz\", \"quantity\": 2, \"total\": \"5000\"}
      ]
    }
  }"
echo -e "\n"

echo "✅ Tests terminés ! Vérifiez votre WhatsApp."
