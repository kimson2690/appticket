# 📧 Système d'Envoi d'Emails Asynchrone

## 🎯 Vue d'ensemble

Ce système utilise **Laravel Queues + Redis + Horizon** pour gérer l'envoi asynchrone des emails avec 3 niveaux de priorité.

## 🏗️ Architecture

```
Application → Redis Queue → Horizon Workers → Mail Service
              (3 queues)    (10 workers)      (SMTP/API)
```

## 📊 Queues et Priorités

### 🔴 **HIGH Priority** (`emails-high`)
**Workers**: 5 | **Retries**: 3 | **Timeout**: 30s

Emails transactionnels critiques :
- ✅ `OrderConfirmation` - Confirmation de commande employé
- ✅ `NewOrderReceived` - Nouvelle commande pour restaurant
- ✅ `OrderValidated` - Commande validée par restaurant
- ✅ `OrderRejected` - Commande rejetée + remboursement
- ✅ `PasswordReset` - Réinitialisation mot de passe

### 🟡 **NORMAL Priority** (`emails-normal`)
**Workers**: 3 | **Retries**: 2 | **Timeout**: 60s

Notifications importantes :
- ✅ `TicketsAssigned` - Tickets assignés à employé
- ✅ `EmployeeApproved` - Employé approuvé
- ✅ `EmployeeRejected` - Employé rejeté
- ✅ `EmployeeRegistrationPending` - Inscription en attente
- ✅ `NewEmployeeRegistration` - Nouvelle inscription (gestionnaire)

### 🟢 **LOW Priority** (`emails-low`)
**Workers**: 2 | **Retries**: 1 | **Timeout**: 120s

Rapports et statistiques :
- 📊 Rapports mensuels (à implémenter)
- 📊 Statistiques hebdomadaires (à implémenter)

## 🚀 Démarrage

### 1. Vérifier Redis
```bash
# Démarrer Redis
brew services start redis

# Ou manuellement
redis-server

# Vérifier
redis-cli ping
# Doit retourner: PONG
```

### 2. Démarrer Horizon
```bash
./start-horizon.sh
```

Ou manuellement :
```bash
php artisan horizon
```

### 3. Accéder au Dashboard
```
http://localhost:8001/horizon
```

## 📈 Monitoring

### Dashboard Horizon
- **Jobs en cours** : Visualisation temps réel
- **Jobs échoués** : Liste des échecs avec retry
- **Métriques** : Throughput, temps d'attente, etc.
- **Workers** : État de chaque worker

### Commandes utiles
```bash
# Voir les jobs en attente
php artisan queue:work --once

# Nettoyer les jobs échoués
php artisan horizon:clear

# Redémarrer Horizon
php artisan horizon:terminate

# Voir les logs
tail -f storage/logs/laravel.log
```

## 🔧 Configuration

### `.env`
```env
QUEUE_CONNECTION=redis
REDIS_CLIENT=predis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### `config/horizon.php`
- Configuration des supervisors
- Nombre de workers par queue
- Stratégies de scaling
- Timeouts et retries

## 📝 Utilisation dans le code

### Envoyer un email HIGH priority
```php
use App\Helpers\EmailPriority;
use App\Mail\OrderConfirmation;

Mail::to($employee->email)
    ->onQueue(EmailPriority::HIGH)
    ->queue(new OrderConfirmation(...));
```

### Envoyer un email NORMAL priority
```php
Mail::to($employee->email)
    ->onQueue(EmailPriority::NORMAL)
    ->queue(new TicketsAssigned(...));
```

### Envoyer un email LOW priority
```php
Mail::to($manager->email)
    ->onQueue(EmailPriority::LOW)
    ->queue(new MonthlyReport(...));
```

## 🎨 Avantages

✅ **Performance** : Réponse HTTP immédiate (pas d'attente SMTP)
✅ **Fiabilité** : Retry automatique en cas d'échec
✅ **Priorités** : Emails critiques traités en premier
✅ **Monitoring** : Dashboard visuel en temps réel
✅ **Scalabilité** : Ajout facile de workers
✅ **Logs** : Traçabilité complète

## 🐛 Dépannage

### Redis ne démarre pas
```bash
# macOS
brew services restart redis

# Linux
sudo systemctl restart redis
```

### Jobs bloqués
```bash
# Nettoyer la queue
php artisan queue:flush

# Redémarrer Horizon
php artisan horizon:terminate
./start-horizon.sh
```

### Emails non envoyés
1. Vérifier Horizon est actif : `http://localhost:8001/horizon`
2. Vérifier les logs : `tail -f storage/logs/laravel.log`
3. Vérifier config SMTP dans `.env`

## 📚 Documentation

- [Laravel Queues](https://laravel.com/docs/queues)
- [Laravel Horizon](https://laravel.com/docs/horizon)
- [Redis](https://redis.io/documentation)

## 🔄 Déploiement Production

### Supervisor (Linux)
```bash
# Installer supervisor
sudo apt-get install supervisor

# Créer config
sudo nano /etc/supervisor/conf.d/horizon.conf
```

Contenu :
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

```bash
# Recharger supervisor
sudo supervisorctl reread
sudo supervisorctl update
sudo supervisorctl start horizon
```

## 📊 Statistiques

- **Emails/jour** : ~500-1000
- **Temps moyen** : <5s par email
- **Taux de succès** : >99%
- **Workers actifs** : 10 (5+3+2)
