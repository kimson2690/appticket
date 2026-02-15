const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const webpush = require('web-push');
require('dotenv').config();

// ============================================
// CONFIGURATION WEB PUSH (VAPID)
// ============================================
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:appticket@kura-immo.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
    console.log('🔔 Web Push configuré avec VAPID');
} else {
    console.warn('⚠️  Clés VAPID manquantes - Push notifications désactivées');
}

const app = express();
const PORT = process.env.WHATSAPP_SERVICE_PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// État du client WhatsApp
let clientReady = false;
let qrCodeGenerated = false;

// Initialisation du client WhatsApp avec authentification locale
const client = new Client({
    authStrategy: new LocalAuth({
        dataPath: './whatsapp-session'
    }),
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/nicholascelesworthy/whatsapp-web-version/main/versions.json',
    },
    restartOnAuthFail: true,
    puppeteer: {
        headless: true,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-software-rasterizer'
        ]
    }
});

// Event: QR Code généré (à scanner avec WhatsApp)
client.on('qr', (qr) => {
    console.log('\n🔐 SCANNEZ CE QR CODE AVEC WHATSAPP:\n');
    qrcode.generate(qr, { small: true });
    console.log('\n📱 Ouvrez WhatsApp > Paramètres > Appareils connectés > Connecter un appareil\n');
    qrCodeGenerated = true;
});

// Event: Client prêt
client.on('ready', () => {
    console.log('✅ WhatsApp Service démarré et prêt !');
    console.log('📞 Numéro connecté:', client.info.wid.user);
    clientReady = true;
});

// Event: Authentification réussie
client.on('authenticated', () => {
    console.log('✅ Authentification WhatsApp réussie');
});

// Event: Déconnexion
client.on('disconnected', (reason) => {
    console.log('⚠️  WhatsApp déconnecté:', reason);
    clientReady = false;
});

// Event: Erreur d'authentification
client.on('auth_failure', (msg) => {
    console.error('❌ Échec authentification WhatsApp:', msg);
    clientReady = false;
});

// Initialiser le client
client.initialize();

// ============================================
// ROUTES API
// ============================================

/**
 * GET /health - Vérifier si le service est actif
 */
app.get('/health', (req, res) => {
    res.json({
        status: clientReady ? 'ready' : 'not_ready',
        qr_code_required: qrCodeGenerated && !clientReady,
        message: clientReady 
            ? 'WhatsApp service opérationnel' 
            : 'En attente de connexion WhatsApp (scannez le QR code dans les logs)'
    });
});

/**
 * POST /send - Envoyer un message WhatsApp
 * Body: { phone: "221771234567", message: "Votre message" }
 */
app.post('/send', async (req, res) => {
    try {
        if (!clientReady) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp service non prêt. Scannez le QR code.'
            });
        }

        const { phone, message } = req.body;

        if (!phone || !message) {
            return res.status(400).json({
                success: false,
                error: 'Paramètres manquants: phone et message requis'
            });
        }

        // Formater le numéro de téléphone (format international)
        // Exemple: 771234567 → 221771234567@c.us
        const formattedPhone = phone.replace(/\D/g, ''); // Enlever non-chiffres
        const chatId = formattedPhone.includes('@') 
            ? formattedPhone 
            : `${formattedPhone}@c.us`;

        // Envoyer le message directement (isRegisteredUser est cassé avec les versions récentes de WhatsApp Web)
        await client.sendMessage(chatId, message);

        console.log(`✅ Message envoyé à ${phone}`);

        res.json({
            success: true,
            message: 'Message WhatsApp envoyé avec succès',
            to: phone
        });

    } catch (error) {
        console.error('❌ Erreur envoi WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

/**
 * POST /send-template - Envoyer un message formaté (commande)
 * Body: { phone, template: "order_confirmation", data: {...} }
 */
app.post('/send-template', async (req, res) => {
    try {
        if (!clientReady) {
            return res.status(503).json({
                success: false,
                error: 'WhatsApp service non prêt'
            });
        }

        const { phone, template, data } = req.body;

        if (!phone || !template || !data) {
            return res.status(400).json({
                success: false,
                error: 'Paramètres manquants: phone, template, data requis'
            });
        }

        // Log pour debugging
        console.log('📋 Template:', template);
        console.log('📊 Data reçue:', JSON.stringify(data, null, 2));
        
        // Générer le message à partir du template
        const message = generateMessage(template, data);

        if (!message) {
            return res.status(400).json({
                success: false,
                error: 'Template inconnu: ' + template
            });
        }

        // Formater et envoyer directement (isRegisteredUser est cassé avec les versions récentes de WhatsApp Web)
        const formattedPhone = phone.replace(/\D/g, '');
        const chatId = `${formattedPhone}@c.us`;

        await client.sendMessage(chatId, message);

        console.log(`✅ Template "${template}" envoyé à ${phone}`);

        res.json({
            success: true,
            message: 'Message template envoyé avec succès',
            template,
            to: phone
        });

    } catch (error) {
        console.error('❌ Erreur template WhatsApp:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// ============================================
// TEMPLATES DE MESSAGES
// ============================================

function generateMessage(template, data) {
    switch (template) {
        case 'order_confirmation':
            return `🎉 *Commande confirmée !*

Bonjour ${data.employee_name},

Votre commande chez *${data.restaurant_name}* a bien été enregistrée !

📋 *Détails :*
${data.items.map(item => `• ${item.name} × ${item.quantity} = ${item.total} F CFA`).join('\n')}

💰 *Total :* ${data.total_amount} F CFA

📍 *Livraison :* ${data.delivery_location || 'À récupérer'}

⏰ Commande #${data.order_id}
📅 ${data.date}

Merci d'utiliser AppTicket ! 🍽️`;

        case 'order_validated':
            return `✅ *Commande validée !*

Bonjour ${data.employee_name},

Bonne nouvelle ! Votre commande a été *validée* par ${data.restaurant_name}.

🍽️ Votre repas sera prêt bientôt !

📋 *Détails :*
${data.items ? data.items.map(item => `• ${item.name} × ${item.quantity} = ${(item.price * item.quantity).toLocaleString()} F CFA`).join('\n') : ''}

💰 *Total :* ${data.total_amount} F CFA
📍 *Livraison :* ${data.delivery_location || 'À récupérer'}
⏰ Commande #${data.order_id}

Bon appétit ! 😋`;

        case 'order_rejected':
            return `❌ *Commande rejetée*

Bonjour ${data.employee_name},

Nous sommes désolés, votre commande a été *rejetée* par ${data.restaurant_name}.

📋 *Votre commande :*
${data.items ? data.items.map(item => `• ${item.name} × ${item.quantity}`).join('\n') : ''}

⚠️ *Raison :* ${data.rejection_reason || 'Non spécifiée'}
⏰ Commande #${data.order_id}

💳 Votre solde de tickets a été *re-crédité*.

Vous pouvez passer une nouvelle commande quand vous voulez ! 🍽️`;

        case 'new_order_restaurant':
            return `🔔 *Nouvelle commande reçue !*

Restaurant ${data.restaurant_name},

👤 Client : ${data.employee_name}
🏢 Entreprise : ${data.company_name}

📋 *Articles :*
${data.items.map(item => `• ${item.name} × ${item.quantity}`).join('\n')}

💰 Total : ${data.total_amount} F CFA
📍 Livraison : ${data.delivery_location || 'Sur place'}
${data.notes ? `📝 Note : ${data.notes}` : ''}

⏰ Commande #${data.order_id}

👉 Connectez-vous pour valider/rejeter la commande.`;

        case 'tickets_assigned':
            return `🎫 *Nouveaux tickets affectés !*

Bonjour ${data.employee_name},

Vous avez reçu *${data.tickets_count} ticket(s)* !

💰 Valeur : ${data.ticket_value} F CFA par ticket
📦 Souche : ${data.batch_number || 'N/A'}
📅 Validité : ${data.validity_start} → ${data.validity_end}

💳 *Nouveau solde :* ${data.new_balance} F CFA

Bon appétit ! 🍽️`;

        case 'budget_alert':
            return `⚠️ *Alerte budget*

Bonjour ${data.employee_name},

Attention, vous avez utilisé *${data.percentage}%* de votre budget mensuel !

📊 Budget : ${data.budget_limit} F CFA
💸 Dépensé : ${data.spent} F CFA
💰 Restant : ${data.remaining} F CFA

${data.percentage >= 90 ? '🚨 Budget bientôt épuisé !' : '⚠️ Surveillez vos dépenses.'}`;

        case 'tickets_expiring':
            return `⏰ *Tickets bientôt expirés !*

Bonjour ${data.employee_name},

Vous avez *${data.tickets_count} ticket(s)* qui expire(nt) dans ${data.days_left} jour(s) !

💰 Valeur : ${data.total_value} F CFA
📅 Expiration : ${data.expiry_date}

👉 Utilisez-les rapidement ! 🍽️`;

        default:
            return null;
    }
}

// ============================================
// ROUTES WEB PUSH NOTIFICATIONS
// ============================================

/**
 * POST /push/send - Envoyer une notification push
 * Body: { subscription: { endpoint, keys: { p256dh, auth } }, title, body, icon, badge, data }
 */
app.post('/push/send', async (req, res) => {
    try {
        if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
            return res.status(503).json({
                success: false,
                error: 'Web Push non configuré (clés VAPID manquantes)'
            });
        }

        const { subscription, title, body, icon, badge, data } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                success: false,
                error: 'Subscription invalide: endpoint et keys requis'
            });
        }

        const payload = JSON.stringify({
            title: title || 'AppTicket',
            body: body || '',
            icon: icon || '/AppTicket.png',
            badge: badge || '/AppTicket.png',
            data: data || {},
            timestamp: Date.now()
        });

        const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth
            }
        };

        await webpush.sendNotification(pushSubscription, payload, {
            TTL: 86400, // 24h
            urgency: 'high'
        });

        console.log(`🔔 Push envoyé: "${title}"`);

        res.json({
            success: true,
            message: 'Notification push envoyée'
        });

    } catch (error) {
        console.error('❌ Erreur push:', error.statusCode || error.message);

        // 410 Gone ou 404 = subscription expirée
        if (error.statusCode === 410 || error.statusCode === 404) {
            return res.status(410).json({
                success: false,
                expired: true,
                error: 'Subscription expirée ou invalide'
            });
        }

        res.status(500).json({
            success: false,
            expired: false,
            error: error.message
        });
    }
});

/**
 * GET /push/vapid-key - Récupérer la clé publique VAPID
 */
app.get('/push/vapid-key', (req, res) => {
    if (!VAPID_PUBLIC_KEY) {
        return res.status(503).json({
            success: false,
            error: 'Clé VAPID non configurée'
        });
    }

    res.json({
        success: true,
        public_key: VAPID_PUBLIC_KEY
    });
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================

app.listen(PORT, () => {
    console.log('\n🚀 Service Notifications démarré');
    console.log(`📡 API disponible sur: http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔔 Web Push: ${VAPID_PUBLIC_KEY ? 'Activé' : 'Désactivé'}`);
    console.log('\n⏳ En attente de connexion WhatsApp...\n');
});

// Gestion propre de l'arrêt
process.on('SIGINT', async () => {
    console.log('\n⏹️  Arrêt du service WhatsApp...');
    await client.destroy();
    process.exit(0);
});
