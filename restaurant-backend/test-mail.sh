#!/bin/bash

# Script de test du serveur mail AppTicket
# Usage: ./test-mail.sh [email]

# Couleurs pour l'affichage
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Email par défaut
DEFAULT_EMAIL="test@example.com"
TEST_EMAIL="${1:-$DEFAULT_EMAIL}"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   📧 Test du Serveur Mail AppTicket${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Vérifier que le fichier .env existe
if [ ! -f ".env" ]; then
    echo -e "${RED}❌ Erreur: Le fichier .env n'existe pas${NC}"
    echo -e "${YELLOW}💡 Créez-le avec: cp .env.example .env${NC}"
    exit 1
fi

# Vérifier la configuration mail dans .env
if ! grep -q "MAIL_HOST=mail.kura-immo.com" .env; then
    echo -e "${YELLOW}⚠️  La configuration mail n'est pas détectée dans .env${NC}"
    echo -e "${YELLOW}💡 Ajoutez la configuration du serveur mail.kura-immo.com${NC}"
    echo ""
fi

# Test de l'envoi d'email
echo -e "${BLUE}📤 Envoi de l'email de test à: ${TEST_EMAIL}${NC}"
echo ""

RESPONSE=$(curl -s -X GET "http://localhost:8000/api/test-email?email=${TEST_EMAIL}")

# Vérifier si la requête a réussi
if [ $? -eq 0 ]; then
    # Parser la réponse JSON pour vérifier le succès
    if echo "$RESPONSE" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Email envoyé avec succès !${NC}"
        echo ""
        echo -e "${BLUE}📋 Détails:${NC}"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
        echo ""
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
        echo -e "${GREEN}✨ Configuration mail fonctionnelle !${NC}"
        echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    else
        echo -e "${RED}❌ Erreur lors de l'envoi de l'email${NC}"
        echo ""
        echo -e "${YELLOW}📋 Réponse du serveur:${NC}"
        echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
        echo ""
        echo -e "${YELLOW}💡 Vérifications à faire:${NC}"
        echo "   1. Le fichier .env contient la configuration mail"
        echo "   2. MAIL_PASSWORD est rempli avec le bon mot de passe"
        echo "   3. Le serveur Laravel a été redémarré après modification du .env"
        echo "   4. Le serveur mail.kura-immo.com est accessible"
        exit 1
    fi
else
    echo -e "${RED}❌ Impossible de contacter le serveur Laravel${NC}"
    echo -e "${YELLOW}💡 Vérifiez que le serveur tourne sur http://localhost:8000${NC}"
    echo -e "${YELLOW}   Démarrez-le avec: php artisan serve${NC}"
    exit 1
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Pour tester avec un autre email:${NC}"
echo -e "${BLUE}   ./test-mail.sh votre-email@example.com${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
