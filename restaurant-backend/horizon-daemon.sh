#!/bin/bash

# Script pour démarrer Horizon en arrière-plan (daemon)
# Usage: ./horizon-daemon.sh [start|stop|restart|status]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PID_FILE="$SCRIPT_DIR/horizon.pid"
LOG_FILE="$SCRIPT_DIR/storage/logs/horizon.log"

start() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "⚠️  Horizon est déjà actif (PID: $PID)"
            return 1
        fi
    fi
    
    echo "🚀 Démarrage de Horizon..."
    cd "$SCRIPT_DIR"
    nohup php artisan horizon >> "$LOG_FILE" 2>&1 &
    echo $! > "$PID_FILE"
    echo "✅ Horizon démarré (PID: $(cat $PID_FILE))"
    echo "📊 Dashboard: http://localhost:8001/horizon"
}

stop() {
    if [ ! -f "$PID_FILE" ]; then
        echo "⚠️  Horizon n'est pas actif"
        return 1
    fi
    
    PID=$(cat "$PID_FILE")
    echo "🛑 Arrêt de Horizon (PID: $PID)..."
    
    # Graceful shutdown
    php artisan horizon:terminate
    
    # Attendre un peu
    sleep 2
    
    # Forcer si nécessaire
    if ps -p "$PID" > /dev/null 2>&1; then
        kill "$PID" 2>/dev/null
        sleep 1
    fi
    
    rm -f "$PID_FILE"
    echo "✅ Horizon arrêté"
}

status() {
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "✅ Horizon est actif (PID: $PID)"
            echo ""
            echo "Workers actifs:"
            ps aux | grep "horizon:work" | grep -v grep | wc -l | xargs echo "  -"
            echo ""
            echo "📊 Dashboard: http://localhost:8001/horizon"
            return 0
        else
            echo "❌ Horizon n'est pas actif (PID file existe mais processus mort)"
            rm -f "$PID_FILE"
            return 1
        fi
    else
        echo "❌ Horizon n'est pas actif"
        return 1
    fi
}

case "$1" in
    start)
        start
        ;;
    stop)
        stop
        ;;
    restart)
        stop
        sleep 2
        start
        ;;
    status)
        status
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status}"
        exit 1
        ;;
esac
