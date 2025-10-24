# 📧 Configuration du Serveur de Messagerie

## Informations du Serveur Mail Kura-Immo

### Serveur Entrant (IMAP/POP3)
- **Serveur :** mail.kura-immo.com
- **IMAP Port :** 993 (avec SSL)
- **POP3 Port :** 995 (avec SSL)

### Serveur Sortant (SMTP)
- **Serveur :** mail.kura-immo.com
- **SMTP Port :** 465 (avec SSL/TLS)

### Compte Email
- **Email :** appticket@kura-immo.com
- **Mot de passe :** [Utiliser le mot de passe du compte de messagerie]

---

## 🔧 Configuration Laravel (.env)

Le fichier `.env.example` a été mis à jour avec la configuration. Pour activer l'envoi d'emails :

### 1. Copier la configuration dans votre fichier .env

Si vous n'avez pas encore de fichier `.env`, copiez `.env.example` :

```bash
cd restaurant-backend
cp .env.example .env
```

### 2. Ajouter le mot de passe

Ouvrez le fichier `.env` et ajoutez le mot de passe du compte email :

```env
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
MAIL_PORT=465
MAIL_USERNAME=appticket@kura-immo.com
MAIL_PASSWORD=VOTRE_MOT_DE_PASSE_ICI
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=appticket@kura-immo.com
MAIL_FROM_NAME="AppTicket"
```

### 3. Configuration complète disponible dans .env

```env
# Configuration du serveur de messagerie Kura-Immo
# Serveur: mail.kura-immo.com
# Ports disponibles: SMTP 465 (SSL), IMAP 993, POP3 995
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
MAIL_PORT=465
MAIL_USERNAME=appticket@kura-immo.com
MAIL_PASSWORD=
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=appticket@kura-immo.com
MAIL_FROM_NAME="AppTicket"
```

---

## 🧪 Tester la Configuration

### Méthode 1 : Artisan Tinker

```bash
cd restaurant-backend
php artisan tinker
```

Puis dans Tinker :

```php
Mail::raw('Test email depuis AppTicket', function ($message) {
    $message->to('votre-email@test.com')
            ->subject('Test de configuration mail');
});
```

### Méthode 2 : Créer une route de test

Dans `routes/api.php` :

```php
Route::get('/test-email', function () {
    try {
        Mail::raw('Ceci est un email de test depuis AppTicket', function ($message) {
            $message->to('votre-email@test.com')
                    ->subject('Test AppTicket Mail');
        });
        return response()->json(['success' => true, 'message' => 'Email envoyé !']);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});
```

Testez avec :
```bash
curl http://localhost:8000/api/test-email
```

---

## 📝 Cas d'Usage

### Notifications par Email

L'application peut maintenant envoyer des emails pour :

1. **Notifications employés :**
   - Approbation de compte
   - Rejet de demande d'inscription
   - Confirmation de commande
   - Validation/Rejet de commande par le restaurant
   - Affectation de tickets

2. **Notifications gestionnaires :**
   - Nouvelle demande d'inscription
   - Nouvelle commande reçue
   - Rappel de souches expirées

3. **Notifications système :**
   - Réinitialisation de mot de passe
   - Alertes de sécurité
   - Rapports automatiques

---

## 🔐 Sécurité

### ⚠️ Important

- ✅ Le fichier `.env` est dans `.gitignore` (ne sera jamais commité)
- ✅ Le mot de passe doit être ajouté manuellement
- ✅ Utiliser SSL/TLS pour la sécurité (port 465)
- ❌ Ne JAMAIS partager le mot de passe dans le code
- ❌ Ne JAMAIS commiter le fichier `.env`

### Variables d'environnement par serveur

Pour différents environnements :

**Développement (local) :**
```env
MAIL_MAILER=log  # Emails dans les logs uniquement
```

**Staging/Test :**
```env
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
# ... configuration complète
```

**Production :**
```env
MAIL_MAILER=smtp
MAIL_HOST=mail.kura-immo.com
# ... configuration complète avec mot de passe sécurisé
```

---

## 🛠️ Dépannage

### Erreur "Connection refused"
- Vérifier que le serveur mail est accessible
- Vérifier le port (465 pour SSL)
- Vérifier le pare-feu

### Erreur "Authentication failed"
- Vérifier le nom d'utilisateur (email complet)
- Vérifier le mot de passe
- Vérifier que le compte est actif

### Erreur "SSL certificate problem"
- Vérifier que `MAIL_ENCRYPTION=ssl`
- Le port 465 nécessite SSL

### Les emails ne sont pas envoyés
1. Vérifier la configuration dans `.env`
2. Vérifier les logs Laravel : `storage/logs/laravel.log`
3. Tester avec la commande artisan tinker
4. Vérifier la queue si utilisée : `php artisan queue:work`

---

## 📚 Documentation Laravel Mail

Pour plus d'informations sur l'envoi d'emails avec Laravel :
- [Documentation officielle Laravel Mail](https://laravel.com/docs/10.x/mail)
- [Configuration SMTP](https://laravel.com/docs/10.x/mail#smtp-driver)

---

## ✅ Checklist de Configuration

- [ ] Copier `.env.example` vers `.env`
- [ ] Ajouter le mot de passe dans `MAIL_PASSWORD`
- [ ] Vérifier que toutes les variables mail sont correctes
- [ ] Tester l'envoi d'email avec tinker ou route de test
- [ ] Vérifier les logs en cas d'erreur
- [ ] Configurer les notifications dans l'application

---

**Date de configuration :** 24 octobre 2025  
**Serveur mail :** mail.kura-immo.com  
**Contact :** appticket@kura-immo.com
