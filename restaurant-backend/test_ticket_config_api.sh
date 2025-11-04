#!/bin/bash

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  🧪 TEST API - CONFIGURATIONS DE TICKETS                    ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo ""

API_URL="http://localhost:8001/api/admin"

echo "📋 Test 1: Liste de toutes les configurations"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/ticket-configurations" \
  -H "Content-Type: application/json" \
  -H "X-User-Company-Id: 1" \
  -H "X-User-Role: Gestionnaire Entreprise" \
  | python3 -m json.tool
echo ""
echo ""

echo "📋 Test 2: Configurations actives uniquement (?active=true)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/ticket-configurations?active=true" \
  -H "Content-Type: application/json" \
  -H "X-User-Company-Id: 1" \
  -H "X-User-Role: Gestionnaire Entreprise" \
  | python3 -m json.tool
echo ""
echo ""

echo "📋 Test 3: Configuration active (endpoint spécifique)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/ticket-configurations/active/config" \
  -H "Content-Type: application/json" \
  -H "X-User-Company-Id: 1" \
  | python3 -m json.tool
echo ""
echo ""

echo "📋 Test 4: Sans headers (vérifier erreurs)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
curl -s -X GET "$API_URL/ticket-configurations" \
  -H "Content-Type: application/json" \
  | python3 -m json.tool
echo ""
echo ""

echo "╔══════════════════════════════════════════════════════════════╗"
echo "║  Test terminé - Vérifiez les résultats ci-dessus            ║"
echo "╚══════════════════════════════════════════════════════════════╝"
