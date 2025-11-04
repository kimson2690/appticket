# 🚀 Guide de Démarrage - Service d'Emails

## ⚡ Démarrage Rapide

### **Méthode 1 : Script simple**
```bash
./start-horizon.sh
```

### **Méthode 2 : Daemon (arrière-plan)**
```bash
./horizon-daemon.sh start
```

---

## 📋 Commandes Disponibles

### **Avec le daemon (Recommandé)**

```bash
# Démarrer
./horizon-daemon.sh start

# Arrêter
./horizon-daemon.sh stop

# Redémarrer
./horizon-daemon.sh restart

# Vérifier le statut
./horizon-daemon.sh status
```

### **Commandes Laravel directes**

```bash
# Démarrer (bloque le terminal)
php artisan horizon

# Arrêter proprement
php artisan horizon:terminate

# Voir les workers
php artisan horizon:list

# Nettoyer les jobs échoués
php artisan horizon:clear
```

---

## 🔍 Vérifications

### **1. Vérifier si Horizon tourne**
```bash
./horizon-daemon.sh status
```

Ou :
```bash
ps aux | grep horizon | grep -v grep
```

### **2. Vérifier Redis**
```bash
redis-cli ping
# Doit retourner: PONG
```

### **3. Diagnostic complet**
```bash
./diagnostic_emails.sh
```

### **4. Dashboard Web**
```
http://localhost:8001/horizon
```

---

## 📊 Monitoring

### **Logs en temps réel**
```bash
# Logs Laravel
tail -f storage/logs/laravel.log

# Logs Horizon
tail -f storage/logs/horizon.log

# Filtrer les emails
tail -f storage/logs/laravel.log | grep -i email
```

### **Jobs en attente**
```bash
redis-cli llen "laravel_database_queues:emails-high"
redis-cli llen "laravel_database_queues:emails-normal"
redis-cli llen "laravel_database_queues:emails-low"
```

---

## 🐛 Dépannage

### **Horizon ne démarre pas**
```bash
# 1. Vérifier Redis
redis-cli ping

# 2. Vérifier la config
grep QUEUE_CONNECTION .env

# 3. Nettoyer le cache
php artisan config:clear
php artisan cache:clear

# 4. Redémarrer
./horizon-daemon.sh restart
```

### **Emails non envoyés**
```bash
# 1. Vérifier Horizon actif
./horizon-daemon.sh status

# 2. Vérifier les logs
tail -50 storage/logs/laravel.log | grep ERROR

# 3. Tester l'envoi
php test_real_email.php
```

### **Jobs bloqués**
```bash
# Nettoyer les queues
php artisan horizon:clear

# Redémarrer Horizon
./horizon-daemon.sh restart
```

---

## 🔄 Démarrage Automatique (Production)

### **macOS (LaunchAgent)**

Créer le fichier : `~/Library/LaunchAgents/com.appticket.horizon.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.appticket.horizon</string>
    <key>ProgramArguments</key>
    <array>
        <string>/opt/homebrew/bin/php</string>
        <string>/Users/kima/AppTicket/restaurant-backend/artisan</string>
        <string>horizon</string>
    </array>
    <key>WorkingDirectory</key>
    <string>/Users/kima/AppTicket/restaurant-backend</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>/Users/kima/AppTicket/restaurant-backend/storage/logs/horizon.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/kima/AppTicket/restaurant-backend/storage/logs/horizon-error.log</string>
</dict>
</plist>
```

Activer :
```bash
launchctl load ~/Library/LaunchAgents/com.appticket.horizon.plist
launchctl start com.appticket.horizon
```

### **Linux (Supervisor)**

Créer : `/etc/supervisor/conf.d/horizon.conf`

```ini
[program:horizon]
process_name=%(program_name)s
command=php /path/to/artisan horizon
autostart=true
autorestart=true
user=www-data
redirect_stderr=true
stdout_logfile=/path/to/horizon.log
stopwaitsecs=3600
```

Activer :
```bash
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start horizon
```

---

## 📈 Performance

### **Queues et Priorités**

- 🔴 **emails-high** : 2 workers, 3 retries, 30s timeout
  - OrderConfirmation, OrderValidated, OrderRejected, PasswordReset
  
- 🟡 **emails-normal** : 1 worker, 2 retries, 60s timeout
  - TicketsAssigned, EmployeeApproved, EmployeeRejected
  
- 🟢 **emails-low** : 1 worker, 1 retry, 120s timeout
  - Rapports, statistiques

### **Capacité**
- **~300 emails/minute** en pic
- **~10,000 emails/heure** en continu
- **Retry automatique** en cas d'échec

---

## ✅ Checklist Quotidienne

- [ ] Horizon actif : `./horizon-daemon.sh status`
- [ ] Redis actif : `redis-cli ping`
- [ ] Pas d'erreurs : `tail -20 storage/logs/laravel.log | grep ERROR`
- [ ] Dashboard accessible : http://localhost:8001/horizon

---

## 📞 Support

En cas de problème :
1. Vérifier les logs : `tail -f storage/logs/laravel.log`
2. Lancer le diagnostic : `./diagnostic_emails.sh`
3. Consulter le dashboard : http://localhost:8001/horizon
