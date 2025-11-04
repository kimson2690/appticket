#!/bin/bash

echo "🚀 Démarrage de Laravel Horizon..."
echo ""

# Vérifier si Redis est actif
if ! redis-cli ping > /dev/null 2>&1; then
    echo "❌ Redis n'est pas actif!"
    echo "   Démarrez Redis avec: brew services start redis"
    echo "   Ou: redis-server"
    exit 1
fi

echo "✅ Redis est actif"
echo ""

# Vérifier la configuration
if grep -q "QUEUE_CONNECTION=redis" .env; then
    echo "✅ Configuration queue: Redis"
else
    echo "⚠️  Configuration queue n'est pas Redis"
    echo "   Mettez à jour .env: QUEUE_CONNECTION=redis"
    exit 1
fi

echo ""
echo "📊 Dashboard Horizon sera disponible sur:"
echo "   http://localhost:8001/horizon"
echo ""
echo "📋 Queues configurées:"
echo "   🔴 emails-high   (5 workers, 3 retries, 30s timeout)"
echo "   🟡 emails-normal (3 workers, 2 retries, 60s timeout)"
echo "   🟢 emails-low    (2 workers, 1 retry, 120s timeout)"
echo ""
echo "⏳ Démarrage de Horizon..."
echo ""

# Démarrer Horizon
php artisan horizon
