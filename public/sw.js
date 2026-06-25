'use strict';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));

self.addEventListener('push', event => {
    if (!event.data) return;

    let data = {};
    try {
        data = event.data.json();
    } catch {
        data = { title: event.data.text() };
    }

    event.waitUntil(
        self.registration.showNotification(data.title ?? 'ELTS Notification', {
            body:               data.body  ?? '',
            icon:               '/favicon.ico',
            badge:              '/favicon.ico',
            data:               { url: data.url ?? '/' },
            requireInteraction: false,
        })
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    const url = event.notification.data?.url ?? '/';

    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
            for (const client of clientList) {
                try {
                    if (new URL(client.url).pathname === new URL(url, self.location.origin).pathname) {
                        return client.focus();
                    }
                } catch {}
            }
            return self.clients.openWindow(url);
        })
    );
});