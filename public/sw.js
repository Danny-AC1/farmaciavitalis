// Service Worker for Farmacia Vitalis Web Push Notifications & Offline Support
const CACHE_NAME = 'vitalis-pwa-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) => {
        return Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        );
      }),
      self.clients.claim()
    ])
  );
});

// Cache with network fallback strategy for static assets
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and skip API or cross-origin requests
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Web Push Notification listener (Background Notifications)
self.addEventListener('push', (event) => {
  let data = {
    title: '⏰ Recordatorio Vitalis',
    body: 'Es hora de tu medicamento o revisión de dosis.',
    url: '/#treatment'
  };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch (e) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=192&auto=format&fit=crop&q=80',
    badge: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=72&auto=format&fit=crop&q=80',
    tag: data.tag || 'vitalis-med-alarm',
    data: { url: data.url || '/#treatment' },
    vibrate: [400, 100, 400, 100, 400],
    requireInteraction: true,
    actions: [
      { action: 'open', title: '💊 Tomar Medicina' },
      { action: 'dismiss', title: '✅ Entendido' }
    ]
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Client PostMessage listener for foreground/background communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_MED_NOTIFICATION') {
    const { title, body, delayMs, tag, url } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title || '⏰ Recordatorio de Medicamento', {
        body: body || 'Es momento de tomar tu dosis indicada.',
        icon: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=192&auto=format&fit=crop&q=80',
        badge: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=72&auto=format&fit=crop&q=80',
        tag: tag || `med-alarm-${Date.now()}`,
        data: { url: url || '/#treatment' },
        vibrate: [400, 100, 400, 100, 400],
        requireInteraction: true,
        actions: [
          { action: 'open', title: '💊 Ver Pastillero' },
          { action: 'dismiss', title: '✅ Posponer' }
        ]
      });
    }, delayMs || 0);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const urlToOpen = event.notification.data?.url || '/';

  if (action === 'dismiss') {
    return;
  }

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
