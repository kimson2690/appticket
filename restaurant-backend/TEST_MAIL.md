# 🧪 Test du Serveur Mail

## ⚠️ Configuration Détectée

Le test montre que la configuration mail n'est pas encore active :
- Server: `null`
- Port: `null`
- Encryption: `null`

Cela signifie que le fichier `.env` n'a pas encore les valeurs du serveur mail.

---

## ✅ Étapes pour activer la configuration

### 1. Ouvrir le fichier .env

Le fichier `.env` est actuellement ouvert dans votre IDE. Ajoutez ces lignes :

```env
# Configuration du serveur de messagerie Kura-Immo
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
MAIL_PORT=465
MAIL_USERNAME=appticket@kura-immo.com
MAIL_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=appticket@kura-immo.com
MAIL_FROM_NAME="AppTicket"
```

**⚠️ IMPORTANT :** Remplacez `VOTRE_MOT_DE_PASSE_ICI` par le vrai mot de passe du compte appticket@kura-immo.com

### 2. Redémarrer le serveur Laravel

Après avoir modifié le `.env`, vous devez redémarrer le serveur :

```bash
# Si le serveur tourne dans un terminal, appuyez sur Ctrl+C puis :
cd /Users/kima/AppTicket/restaurant-backend
php artisan serve
```

### 3. Tester à nouveau

Une fois le serveur redémarré avec la nouvelle configuration :

```bash
curl -X GET "http://localhost:8000/api/test-email?email=VOTRE_EMAIL@example.com"
```

---

## 🎯 Réponse Attendue (Succès)

```json
{
  "success": true,
  "message": "Email de test envoyé avec succès !",
  "details": {
    "to": "votre-email@example.com",
    "from": "appticket@kura-immo.com",
    "server": "mail.kura-immo.com",
    "port": "465",
    "encryption": "ssl",
    "sent_at": "24/10/2025 14:45:30"
  }
}
```

Notez que `server`, `port` et `encryption` ont maintenant des valeurs ! ✅

---

## 🚨 Erreurs Possibles

### Erreur "Connection refused"

```json
{
  "success": false,
  "error": "Erreur lors de l'envoi de l'email",
  "message": "Connection refused"
}
```

**Solution :**
- Vérifier que le serveur mail.kura-immo.com est accessible
- Vérifier le port 465
- Vérifier le pare-feu

### Erreur "Authentication failed"

```json
{
  "success": false,
  "error": "Erreur lors de l'envoi de l'email",
  "message": "Authentication failed"
}
```

**Solution :**
- Vérifier le mot de passe dans `MAIL_PASSWORD`
- Vérifier l'email dans `MAIL_USERNAME`

### Erreur "SSL certificate problem"

```json
{
  "success": false,
  "error": "Erreur lors de l'envoi de l'email",
  "message": "SSL certificate problem"
}
```

**Solution :**
- Vérifier que `MAIL_ENCRYPTION=ssl`
- Le port 465 nécessite SSL

---

## 📱 Test avec votre propre email

Pour tester avec votre email personnel :

```bash
# Remplacez par votre vrai email
curl -X GET "http://localhost:8000/api/test-email?email=kima@gmail.com"
```

Vous devriez recevoir un email avec :
```
Sujet: Test de configuration mail - AppTicket

Ceci est un email de test depuis AppTicket.
Si vous recevez cet email, votre configuration mail fonctionne correctement ! ✅

Serveur: mail.kura-immo.com
Date: 24/10/2025 14:45:30
```

---

## 🔍 Vérifier les logs Laravel

En cas d'erreur, consultez les logs :

```bash
tail -f storage/logs/laravel.log
```

---

## ✅ Checklist de vérification

- [ ] Fichier `.env` existe
- [ ] Configuration mail ajoutée dans `.env`
- [ ] Mot de passe `MAIL_PASSWORD` rempli
- [ ] Serveur Laravel redémarré
- [ ] Test avec curl réussi
- [ ] Email reçu dans la boîte mail

---

**Une fois le test réussi, vous pourrez utiliser l'envoi d'emails dans toute l'application ! 📧**
