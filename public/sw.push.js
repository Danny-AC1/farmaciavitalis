// Farmacia Vitalis - Background Web Push & Notification Action Handler
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
      icon: data.icon || '/icon-192.png',
      badge: '/favicon-32x32.png',
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
  
  self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SCHEDULE_MED_NOTIFICATION') {
      const { title, body, delayMs, tag, url } = event.data;
      setTimeout(() => {
        self.registration.showNotification(title || '⏰ Recordatorio de Medicamento', {
          body: body || 'Es momento de tomar tu dosis indicada.',
          icon: '/icon-192.png',
          badge: '/favicon-32x32.png',
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
  