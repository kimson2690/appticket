// ============================================
// AppTicket - Service Worker (Push Notifications)
// ============================================

// Event: Push notification reçue
self.addEventListener('push', (event) => {
    if (!event.data) return;

    let data;
    try {
        data = event.data.json();
    } catch (e) {
        data = {
            title: 'AppTicket',
            body: event.data.text(),
            icon: '/AppTicket.png',
            badge: '/AppTicket.png',
            data: {}
        };
    }

    const options = {
        body: data.body || '',
        icon: data.icon || '/AppTicket.png',
        badge: data.badge || '/AppTicket.png',
        vibrate: [100, 50, 100],
        data: data.data || {},
        actions: [],
        tag: data.data?.notification_id || 'appticket-' + Date.now(),
        renotify: true,
        requireInteraction: false,
        silent: false,
    };

    // Actions contextuelles selon le type de notification
    const type = data.data?.type;
    if (type === 'success') {
        options.actions = [{ action: 'open', title: 'Voir' }];
    } else if (type === 'alert' || type === 'warning') {
        options.actions = [
            { action: 'open', title: 'Voir détails' },
            { action: 'dismiss', title: 'Ignorer' }
        ];
    }

    event.waitUntil(
        self.registration.showNotification(data.title || 'AppTicket', options)
    );
});

// Event: Clic sur la notification
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    if (event.action === 'dismiss') return;

    // Déterminer l'URL à ouvrir
    const actionUrl = event.notification.data?.action_url;
    const urlToOpen = actionUrl
        ? new URL(actionUrl, self.location.origin).href
        : self.location.origin;

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
            // Si une fenêtre AppTicket est déjà ouverte, la focus
            for (const client of windowClients) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    if (actionUrl) {
                        client.navigate(urlToOpen);
                    }
                    return client.focus();
                }
            }
            // Sinon, ouvrir une nouvelle fenêtre
            return clients.openWindow(urlToOpen);
        })
    );
});

// Event: Fermeture de la notification (statistiques optionnelles)
self.addEventListener('notificationclose', (event) => {
    // Peut être utilisé pour tracker les notifications ignorées
});

// Event: Installation du Service Worker
self.addEventListener('install', (event) => {
    self.skipWaiting();
});

// Event: Activation du Service Worker
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
