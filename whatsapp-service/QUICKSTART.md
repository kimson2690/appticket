# 🚀 QUICKSTART - Service WhatsApp

## ⚡ Démarrage rapide

### 1. Installation (première fois)

```bash
cd /Users/kima/AppTicket/whatsapp-service
npm install
```

### 2. Démarrer le service

```bash
npm start
```

Le service démarre sur **http://localhost:3001**

### 3. Scanner le QR Code (première fois)

- Le QR code s'affiche dans le terminal
- Ouvrir WhatsApp sur votre téléphone
- Scanner le code : **Paramètres → WhatsApp Web → Scanner le code QR**
- Attendre "✅ WhatsApp client is ready!"

---

## 📱 Test rapide

### Message simple

```bash
curl -X POST http://localhost:3001/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "22671616631",
    "message": "Test message!"
  }'
```

### Template avec plats

```bash
curl -X POST http://localhost:3001/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "22671616631",
    "template": "order_validated",
    "data": {
      "employee_name": "Jean",
      "restaurant_name": "Le Baobab",
      "order_id": "123",
      "total_amount": "5 000",
      "delivery_location": "ZAD",
      "items": [
        {"name": "Poulet Yassa", "quantity": 1, "price": 2500}
      ]
    }
  }'
```

---

## 🔧 Commandes utiles

### Vérifier le service

```bash
curl http://localhost:3001/health
```

### Arrêter le service

```bash
# Trouver le PID
lsof -ti:3001

# Tuer le processus
kill -9 <PID>
```

### Redémarrer proprement

```bash
# Arrêter
lsof -ti:3001 | xargs kill -9

# Nettoyer
rm -f whatsapp-session/session/SingletonLock

# Démarrer
npm start
```

---

## 📂 Structure du projet

```
whatsapp-service/
├── server.js              # Serveur principal
├── package.json           # Dépendances
├── .env.example          # Configuration template
├── whatsapp-session/     # Session WhatsApp (généré)
│   └── session/          # Données de connexion
├── QUICKSTART.md         # Ce fichier
├── README.md             # Documentation complète
└── MESSAGES-AVEC-PLATS.md # Guide templates
```

---

## 🎯 Templates disponibles

1. **order_confirmation** - Confirmation commande
2. **order_validated** - Commande validée (avec plats)
3. **order_rejected** - Commande rejetée (avec plats)
4. **ticket_assigned** - Tickets affectés
5. **ticket_low_balance** - Solde faible

---

## 🔍 Debugging

### Voir les logs en temps réel

```bash
tail -f /tmp/whatsapp-startup.log
```

### Vérifier la connexion

```bash
./verifier-connexion.sh
```

### Tester tous les templates

```bash
./TESTER-TEMPLATES.sh
```

---

## ⚠️ Problèmes courants

### "Port already in use"

```bash
lsof -ti:3001 | xargs kill -9
```

### "SingletonLock file exists"

```bash
rm -f whatsapp-session/session/SingletonLock
npm start
```

### "WhatsApp not connected"

1. Arrêter le service
2. Supprimer le dossier `whatsapp-session/`
3. Redémarrer et scanner à nouveau le QR code

---

## 🔗 Endpoints API

### POST /send-message

Envoie un message simple

**Body :**
```json
{
  "phone": "22671616631",
  "message": "Votre message"
}
```

### POST /send-template

Envoie un message template

**Body :**
```json
{
  "phone": "22671616631",
  "template": "order_validated",
  "data": { ... }
}
```

### GET /health

Vérifie le statut du service

**Réponse :**
```json
{
  "status": "ready",
  "qr_code_required": false
}
```

---

## 📝 Configuration Laravel

Dans `.env` du backend :

```env
WHATSAPP_ENABLED=true
WHATSAPP_SERVICE_URL=http://localhost:3001
```

---

## 🎊 C'est tout !

Le service est maintenant opérationnel et prêt à envoyer des messages WhatsApp avec la liste des plats !

**Documentation complète :** `README.md`
**Guide templates :** `MESSAGES-AVEC-PLATS.md`
**Installation :** `INSTALLATION-RAPIDE.md`
