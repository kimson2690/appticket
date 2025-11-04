#!/bin/bash

echo "🔍 DIAGNOSTIC SYSTÈME D'EMAILS"
echo "================================"
echo ""

# 1. Vérifier Redis
echo "1️⃣ Redis:"
if redis-cli ping > /dev/null 2>&1; then
    echo "   ✅ Redis actif"
else
    echo "   ❌ Redis inactif"
fi
echo ""

# 2. Vérifier Horizon
echo "2️⃣ Horizon:"
if ps aux | grep -v grep | grep "horizon" > /dev/null; then
    echo "   ✅ Horizon actif"
    echo "   Workers:"
    ps aux | grep -v grep | grep "horizon:work" | wc -l | xargs echo "     -"
else
    echo "   ❌ Horizon inactif"
fi
echo ""

# 3. Vérifier configuration SMTP
echo "3️⃣ Configuration SMTP:"
if grep -q "MAIL_HOST" .env; then
    echo "   ✅ MAIL_HOST: $(grep MAIL_HOST .env | cut -d'=' -f2)"
    echo "   ✅ MAIL_PORT: $(grep MAIL_PORT .env | cut -d'=' -f2)"
    echo "   ✅ MAIL_FROM: $(grep MAIL_FROM_ADDRESS .env | cut -d'=' -f2)"
else
    echo "   ❌ Configuration SMTP manquante"
fi
echo ""

# 4. Vérifier les jobs en attente
echo "4️⃣ Jobs en attente:"
redis-cli llen "laravel_database_queues:default" 2>/dev/null | xargs echo "   - default:"
redis-cli llen "laravel_database_queues:emails-high" 2>/dev/null | xargs echo "   - emails-high:"
redis-cli llen "laravel_database_queues:emails-normal" 2>/dev/null | xargs echo "   - emails-normal:"
redis-cli llen "laravel_database_queues:emails-low" 2>/dev/null | xargs echo "   - emails-low:"
echo ""

# 5. Derniers logs d'emails
echo "5️⃣ Derniers emails envoyés:"
tail -100 storage/logs/laravel.log | grep -i "email.*envoyé" | tail -5 | while read line; do
    echo "   - $line"
done
echo ""

# 6. Erreurs récentes
echo "6️⃣ Erreurs récentes:"
tail -50 storage/logs/laravel.log | grep "ERROR" | tail -3 | while read line; do
    echo "   ⚠️  $line"
done
echo ""

echo "✅ Diagnostic terminé!"
echo ""
echo "📊 Dashboard Horizon: http://localhost:8001/horizon"
