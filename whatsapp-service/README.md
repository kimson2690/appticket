# 📱 WhatsApp Service - Notifications GRATUITES

Service Node.js pour envoyer des notifications WhatsApp **100% gratuitement** via WhatsApp Web.

## ✅ Avantages

- **Totalement gratuit** - Messages illimités
- **Taux d'ouverture 98%** - vs 20% pour les emails
- **Pas d'API payante** - Utilise votre propre numéro WhatsApp
- **Facile à installer** - Setup en 5 minutes
- **Templates personnalisés** - Messages formatés automatiquement

---

## 📦 Installation

### **1. Installer les dépendances**

```bash
cd whatsapp-service
npm install
```

### **2. Configuration**

Copier le fichier `.env.example`:

```bash
cp .env.example .env
```

Le fichier `.env` contient:
```env
WHATSAPP_SERVICE_PORT=3001
NODE_ENV=production
```

---

## 🚀 Démarrage

### **Option 1 : Mode Production**

```bash
npm start
```

### **Option 2 : Mode Développement (auto-restart)**

```bash
npm run dev
```

---

## 📱 Première Connexion

### **Étape 1 : Démarrer le service**

```bash
npm start
```

### **Étape 2 : Scanner le QR Code**

Un QR code s'affichera dans le terminal:

```
🔐 SCANNEZ CE QR CODE AVEC WHATSAPP:

█████████████████████████████
█████████████████████████████
████ ▄▄▄▄▄ █▀▄ ▀▄ ▄▄▄▄▄ ████
████ █   █ █ ▄█▀█ █   █ ████
...

📱 Ouvrez WhatsApp > Paramètres > Appareils connectés > Connecter un appareil
```

### **Étape 3 : Connecter WhatsApp**

1. Ouvrez **WhatsApp** sur votre téléphone
2. Allez dans **Paramètres** → **Appareils connectés**
3. Cliquez sur **Connecter un appareil**
4. Scannez le QR code affiché dans le terminal

### **Étape 4 : Confirmation**

Quand vous verrez ce message, c'est prêt:

```
✅ WhatsApp Service démarré et prêt !
📞 Numéro connecté: 221771234567
```

---

## 🔌 API Endpoints

### **1. Health Check**

Vérifier si le service est actif:

**GET** `http://localhost:3001/health`

**Réponse:**
```json
{
  "status": "ready",
  "qr_code_required": false,
  "message": "WhatsApp service opérationnel"
}
```

---

### **2. Envoyer un Message Simple**

**POST** `http://localhost:3001/send`

**Body:**
```json
{
  "phone": "221771234567",
  "message": "Bonjour, ceci est un test !"
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Message WhatsApp envoyé avec succès",
  "to": "221771234567"
}
```

---

### **3. Envoyer un Template**

**POST** `http://localhost:3001/send-template`

**Body:**
```json
{
  "phone": "221771234567",
  "template": "order_confirmation",
  "data": {
    "employee_name": "Jean Dupont",
    "restaurant_name": "Le Baobab",
    "order_id": "order_123",
    "total_amount": "5000",
    "delivery_location": "Bureau Principal",
    "date": "27/10/2025 à 14:30",
    "items": [
      { "name": "Poulet Yassa", "quantity": 1, "total": "2500" },
      { "name": "Spaghetti", "quantity": 1, "total": "2500" }
    ]
  }
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Message template envoyé avec succès",
  "template": "order_confirmation",
  "to": "221771234567"
}
```

---

## 📝 Templates Disponibles

### **1. order_confirmation** - Confirmation de commande

```
🎉 *Commande confirmée !*

Bonjour Jean Dupont,

Votre commande chez *Le Baobab* a bien été enregistrée !

📋 *Détails :*
• Poulet Yassa × 1 = 2500 F CFA
• Spaghetti × 1 = 2500 F CFA

💰 *Total :* 5000 F CFA
📍 *Livraison :* Bureau Principal

⏰ Commande #order_123
📅 27/10/2025 à 14:30

Merci d'utiliser AppTicket ! 🍽️
```

### **2. order_validated** - Commande validée

```
✅ *Commande validée !*

Bonjour Jean Dupont,

Bonne nouvelle ! Votre commande a été *validée* par Le Baobab.

🍽️ Votre repas sera prêt bientôt !

📋 Commande : #order_123
💰 Montant : 5000 F CFA
📍 Livraison : Bureau Principal

Bon appétit ! 😋
```

### **3. order_rejected** - Commande rejetée

```
❌ *Commande rejetée*

Bonjour Jean Dupont,

Nous sommes désolés, votre commande a été *rejetée* par Le Baobab.

📋 Commande : #order_123
⚠️ Raison : Restaurant fermé

💳 Votre solde de tickets a été *re-crédité*.

Vous pouvez passer une nouvelle commande quand vous voulez ! 🍽️
```

### **4. new_order_restaurant** - Nouvelle commande (restaurant)

```
🔔 *Nouvelle commande reçue !*

Restaurant Le Baobab,

👤 Client : Jean Dupont
🏢 Entreprise : TechCorp

📋 *Articles :*
• Poulet Yassa × 1
• Spaghetti × 1

💰 Total : 5000 F CFA
📍 Livraison : Bureau Principal

⏰ Commande #order_123

👉 Connectez-vous pour valider/rejeter la commande.
```

### **5. tickets_assigned** - Tickets affectés

```
🎫 *Nouveaux tickets affectés !*

Bonjour Jean Dupont,

Vous avez reçu *20 ticket(s)* !

💰 Valeur : 500 F CFA par ticket
📦 Souche : SOUCHE-20251027-0001
📅 Validité : 27/10/2025 → 26/11/2025

💳 *Nouveau solde :* 10 000 F CFA

Bon appétit ! 🍽️
```

### **6. budget_alert** - Alerte budget

```
⚠️ *Alerte budget*

Bonjour Jean Dupont,

Attention, vous avez utilisé *85%* de votre budget mensuel !

📊 Budget : 50 000 F CFA
💸 Dépensé : 42 500 F CFA
💰 Restant : 7 500 F CFA

⚠️ Surveillez vos dépenses.
```

### **7. tickets_expiring** - Tickets expirent bientôt

```
⏰ *Tickets bientôt expirés !*

Bonjour Jean Dupont,

Vous avez *5 ticket(s)* qui expire(nt) dans 3 jour(s) !

💰 Valeur : 2 500 F CFA
📅 Expiration : 30/10/2025

👉 Utilisez-les rapidement ! 🍽️
```

---

## 🔧 Intégration Laravel

### **1. Ajouter les variables d'environnement**

Dans `restaurant-backend/.env`:

```env
# WhatsApp Notifications (GRATUIT)
WHATSAPP_ENABLED=true
WHATSAPP_SERVICE_URL=http://localhost:3001
```

### **2. Le service Laravel existe déjà**

Le fichier `app/Services/WhatsAppService.php` est déjà créé et prêt.

### **3. Utilisation dans le code**

```php
use App\Services\WhatsAppService;

// Dans un contrôleur
$whatsapp = new WhatsAppService();

// Envoyer un message simple
$whatsapp->sendMessage('221771234567', 'Bonjour !');

// Envoyer un template
$whatsapp->notifyOrderValidated($order, $employee);
```

---

## 📞 Format des Numéros de Téléphone

Le service accepte plusieurs formats:

```
771234567       → 221771234567  ✅
+221771234567   → 221771234567  ✅
00221771234567  → 221771234567  ✅
221771234567    → 221771234567  ✅
```

**Note:** Le code pays `221` (Sénégal) est ajouté automatiquement.

---

## 🔒 Sécurité

### **Session WhatsApp**

La session est sauvegardée dans le dossier `whatsapp-session/`:

```
whatsapp-service/
├── whatsapp-session/    ← Session WhatsApp (Ne pas supprimer !)
│   ├── Default/
│   └── session.json
```

**⚠️ Important:** Ne supprimez **jamais** ce dossier, sinon vous devrez re-scanner le QR code.

### **Gitignore**

Ajoutez à `.gitignore`:

```
whatsapp-session/
.wwebjs_auth/
.wwebjs_cache/
```

---

## ⚡ Auto-Démarrage (Production)

### **Avec PM2 (Recommandé)**

```bash
# Installer PM2
npm install -g pm2

# Démarrer le service
pm2 start server.js --name whatsapp-service

# Voir les logs
pm2 logs whatsapp-service

# Redémarrer
pm2 restart whatsapp-service

# Arrêter
pm2 stop whatsapp-service

# Auto-démarrage au boot
pm2 startup
pm2 save
```

---

## 🐛 Dépannage

### **Problème 1 : QR Code ne s'affiche pas**

**Solution:** Redémarrez le service:
```bash
pm2 restart whatsapp-service
# ou
npm start
```

### **Problème 2 : "WhatsApp service non prêt"**

**Solution:** Vérifiez que le service Node.js est démarré:
```bash
curl http://localhost:3001/health
```

### **Problème 3 : Session expirée**

**Solution:** Supprimez le dossier `whatsapp-session/` et re-scannez:
```bash
rm -rf whatsapp-session/
npm start
# Scannez le nouveau QR code
```

### **Problème 4 : "Numéro non enregistré sur WhatsApp"**

**Solution:** Vérifiez que le numéro a bien un compte WhatsApp actif.

---

## 📊 Monitoring

### **Health Check Automatique**

Créez un cron job pour vérifier le service:

```bash
# Ajouter au crontab
crontab -e

# Vérifier toutes les 5 minutes
*/5 * * * * curl -f http://localhost:3001/health || pm2 restart whatsapp-service
```

---

## 💡 Conseils d'Utilisation

### **1. Limites WhatsApp**

- **Maximum:** ~1000 messages/jour recommandé
- **Délai:** Attendez 1-2 secondes entre chaque message
- **Pas de spam:** Évitez d'envoyer trop de messages identiques

### **2. Bonnes Pratiques**

- ✅ Utilisez votre numéro WhatsApp Business de préférence
- ✅ Gardez le service actif 24/7 avec PM2
- ✅ Testez avec votre propre numéro d'abord
- ✅ Activez seulement pour les notifications importantes

### **3. Serveur de Production**

Pour la production, hébergez sur:
- **VPS** (OVH, DigitalOcean, AWS EC2)
- Installez Node.js + PM2
- Configurez firewall (port 3001)
- Setup monitoring (Uptime Robot, etc.)

---

## 🎯 Résultat Final

Une fois configuré, vos employés recevront:

📱 **WhatsApp** (Taux ouverture: 98%)
```
✅ Commande validée !
Bonjour Jean,
Votre commande chez Le Baobab...
```

📧 **Email** (Taux ouverture: 20%)
```
Subject: Commande validée
Votre commande...
```

🔔 **Notification App** (Si connecté)
```
Commande validée ✅
Le Baobab a accepté votre commande
```

---

## 📞 Support

Pour toute question:
- Consultez les logs: `pm2 logs whatsapp-service`
- Testez l'API: `curl http://localhost:3001/health`
- Vérifiez la session: `ls whatsapp-session/`

---

**🎉 C'est tout ! Votre service WhatsApp GRATUIT est prêt !**
