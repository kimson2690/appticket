# ⚡ Installation Rapide - WhatsApp Notifications GRATUITES

## 🎯 En 5 minutes

### **1. Installer les dépendances**

```bash
cd whatsapp-service
npm install
```

### **2. Configurer l'environnement**

```bash
cp .env.example .env
```

### **3. Démarrer le service**

```bash
npm start
```

### **4. Scanner le QR Code**

Un QR code s'affichera dans le terminal. Scannez-le avec votre WhatsApp :

```
📱 WhatsApp → Paramètres → Appareils connectés → Connecter un appareil
```

### **5. Activer dans Laravel**

Dans `restaurant-backend/.env`:

```env
WHATSAPP_ENABLED=true
WHATSAPP_SERVICE_URL=http://localhost:3001
```

---

## ✅ Vérification

### **Test 1 : Service actif**

```bash
curl http://localhost:3001/health
```

**Résultat attendu:**
```json
{
  "status": "ready",
  "message": "WhatsApp service opérationnel"
}
```

### **Test 2 : Envoyer un message test**

```bash
curl -X POST http://localhost:3001/send \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "221771234567",
    "message": "Test WhatsApp - AppTicket fonctionne !"
  }'
```

**Résultat:** Vous devriez recevoir le message sur WhatsApp ! 🎉

---

## 📱 Test depuis l'application

### **Scénario : Commande validée**

1. Un employé passe une commande
2. Le restaurant valide la commande
3. **L'employé reçoit automatiquement:**
   - ✅ Un email
   - ✅ Une notification dans l'app
   - ✅ **Un message WhatsApp** 📱

### **Message WhatsApp reçu:**

```
✅ *Commande validée !*

Bonjour Jean Dupont,

Bonne nouvelle ! Votre commande a été validée par Le Baobab.

🍽️ Votre repas sera prêt bientôt !

📋 Commande : #order_123
💰 Montant : 5000 F CFA
📍 Livraison : Bureau Principal

Bon appétit ! 😋
```

---

## 🚀 Production (Optionnel)

Pour un service 24/7, installez PM2:

```bash
npm install -g pm2
pm2 start server.js --name whatsapp-service
pm2 startup
pm2 save
```

---

## 📊 Numéros de Téléphone

Le service accepte tous les formats :

```
771234567       ✅
+221771234567   ✅
00221771234567  ✅
221771234567    ✅
```

---

## ⚠️ Important

- **Ne supprimez jamais** le dossier `whatsapp-session/`
- Le service doit rester **actif en permanence**
- Si déconnecté, re-scannez le QR code

---

## 🎉 C'est tout !

Vos notifications WhatsApp GRATUITES sont maintenant actives !

**Taux d'ouverture:**
- 📧 Email: ~20%
- 📱 **WhatsApp: ~98%** ✅

---

## 📞 Aide

Problème ? Consultez `README.md` pour le guide complet.
