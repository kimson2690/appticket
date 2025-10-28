#!/bin/bash

echo "🔍 Vérification de la connexion WhatsApp..."
echo ""

while true; do
    STATUS=$(curl -s http://localhost:3001/health | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
    
    if [ "$STATUS" = "ready" ]; then
        echo "✅ WhatsApp est CONNECTÉ et prêt !"
        echo ""
        echo "🎉 Vous pouvez maintenant activer WhatsApp dans Laravel :"
        echo "   cd /Users/kima/AppTicket"
        echo "   ./ACTIVER-WHATSAPP.sh"
        echo ""
        break
    else
        echo "⏳ En attente de connexion... (scannez le QR code)"
        sleep 3
    fi
done
