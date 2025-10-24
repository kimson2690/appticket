# 🔧 Correction de la Configuration Mail

## ⚠️ PROBLÈME DÉTECTÉ

Votre fichier `.env` contient **DEUX configurations mail** :

```env
# ❌ ANCIENNE CONFIGURATION (À SUPPRIMER)
MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"

# ✅ NOUVELLE CONFIGURATION (À GARDER)
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
MAIL_PORT=465
MAIL_USERNAME=appticket@kura-immo.com
MAIL_PASSWORD=Goldenboy@2690
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=appticket@kura-immo.com
MAIL_FROM_NAME="AppTicket"
```

Laravel charge la **première occurrence** des variables, donc il utilise l'ancienne configuration !

---

## ✅ SOLUTION

### Étape 1 : Ouvrir le fichier .env

Le fichier est déjà ouvert dans votre IDE.

### Étape 2 : Supprimer l'ancienne configuration

Cherchez et **SUPPRIMEZ** ces lignes (environ lignes 50-57) :

```env
MAIL_MAILER=log
MAIL_SCHEME=null
MAIL_HOST=127.0.0.1
MAIL_PORT=2525
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_FROM_ADDRESS="hello@example.com"
MAIL_FROM_NAME="${APP_NAME}"
```

### Étape 3 : Garder UNIQUEMENT la nouvelle configuration

Le fichier `.env` doit contenir **UNIQUEMENT** :

```env
# Configuration du serveur de messagerie Kura-Immo
# Serveur: mail.kura-immo.com
# Ports disponibles: SMTP 465 (SSL), IMAP 993, POP3 995
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
MAIL_PORT=465
MAIL_USERNAME=appticket@kura-immo.com
MAIL_PASSWORD=Goldenboy@2690
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=appticket@kura-immo.com
MAIL_FROM_NAME="AppTicket"
```

### Étape 4 : Sauvegarder le fichier

Appuyez sur `Cmd+S` (Mac) ou `Ctrl+S` (Windows/Linux)

### Étape 5 : Nettoyer le cache Laravel

```bash
cd /Users/kima/AppTicket/restaurant-backend
php artisan config:clear
```

### Étape 6 : Tester à nouveau

```bash
./test-mail.sh
```

---

## ✅ RÉSULTAT ATTENDU

Après correction, vous devriez voir :

```json
{
    "success": true,
    "message": "Email de test envoyé avec succès !",
    "details": {
        "to": "test@example.com",
        "from": "appticket@kura-immo.com",
        "server": "mail.kura-immo.com",     ← ✅ CONFIGURÉ
        "port": "465",                       ← ✅ CONFIGURÉ
        "encryption": "ssl",                 ← ✅ CONFIGURÉ
        "sent_at": "24/10/2025 14:50:00"
    }
}
```

---

## 🔍 VÉRIFICATION

Pour vérifier qu'il n'y a plus de duplication :

```bash
# Compter le nombre de fois où MAIL_MAILER apparaît
grep -c "MAIL_MAILER" .env
```

**Résultat attendu :** `1` (une seule occurrence)

---

## 📝 STRUCTURE FINALE DU .env

Votre section mail doit ressembler à ceci :

```env
# ... autres configurations ...

# Configuration du serveur de messagerie Kura-Immo
# Serveur: mail.kura-immo.com
# Ports disponibles: SMTP 465 (SSL), IMAP 993, POP3 995
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
MAIL_PORT=465
MAIL_USERNAME=appticket@kura-immo.com
MAIL_PASSWORD=Goldenboy@2690
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=appticket@kura-immo.com
MAIL_FROM_NAME="AppTicket"

# ... autres configurations ...
```

---

## 🚀 COMMANDES RAPIDES

```bash
# 1. Nettoyer le cache
php artisan config:clear

# 2. Vérifier la configuration
grep "MAIL_" .env

# 3. Tester
./test-mail.sh votre-email@example.com
```

---

**Une fois corrigé, le serveur mail fonctionnera parfaitement ! 📧**
