# 🚀 Configuration Rapide du Serveur Mail

## Étapes pour activer l'envoi d'emails

### 1️⃣ Copier le fichier de configuration

```bash
# Depuis le dossier restaurant-backend
cp .env.example .env
```

### 2️⃣ Ajouter le mot de passe

Ouvrez le fichier `.env` et ajoutez le mot de passe du compte email à la ligne :

```env
MAIL_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
```

La configuration mail est déjà pré-remplie dans `.env.example` avec :

```env
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
MAIL_PORT=465
MAIL_USERNAME=appticket@kura-immo.com
MAIL_PASSWORD=                          # ← À REMPLIR ICI
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=appticket@kura-immo.com
MAIL_FROM_NAME="AppTicket"
```

### 3️⃣ Tester l'envoi d'email

```bash
php artisan tinker
```

Dans Tinker :

```php
Mail::raw('Test email', function ($m) {
    $m->to('votre-email@test.com')->subject('Test AppTicket');
});
```

Si vous voyez "=> null" sans erreur, l'email est envoyé ! ✅

---

## 📧 Informations du serveur mail

- **Serveur :** mail.kura-immo.com
- **Email :** appticket@kura-immo.com
- **SMTP Port :** 465 (SSL)
- **IMAP Port :** 993
- **POP3 Port :** 995

---

## ⚠️ Sécurité

- ✅ Le fichier `.env` est ignoré par Git (ne sera jamais commité)
- ✅ Gardez le mot de passe secret
- ❌ Ne partagez JAMAIS le fichier `.env`

---

## 🆘 Besoin d'aide ?

Consultez la documentation complète : `/MAIL_CONFIGURATION.md`
