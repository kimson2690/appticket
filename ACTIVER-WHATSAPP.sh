#!/bin/bash

echo "🔧 Activation de WhatsApp dans Laravel..."

cd /Users/kima/AppTicket/restaurant-backend

# Activer WhatsApp
sed -i '' 's/WHATSAPP_ENABLED=false/WHATSAPP_ENABLED=true/' .env

echo "✅ WhatsApp activé dans .env !"
echo ""
echo "📊 Vérification:"
grep "WHATSAPP_" .env
echo ""
echo "🎉 WhatsApp est maintenant actif !"
echo ""
echo "🧪 Test:"
echo "1. Passez une commande en tant qu'employé"
echo "2. Validez-la en tant que restaurant"
echo "3. Vérifiez WhatsApp de l'employé → Message reçu ! 📱"
