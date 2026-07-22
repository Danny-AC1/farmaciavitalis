// Service for handling Browser Native System/Push Notifications (Free Web Push)

export const initNotificationServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Notification ServiceWorker registered with scope:', registration.scope);
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration failed:', error);
    }
  }
  return null;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (typeof window !== 'undefined' && 'Notification' in window) {
    return Notification.permission;
  }
  return 'denied';
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      await initNotificationServiceWorker();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

export interface NativeNotificationOptions {
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  url?: string;
  silent?: boolean;
  requireInteraction?: boolean;
}

export const triggerNativeNotification = async (
  title: string, 
  options: NativeNotificationOptions
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const notificationOptions = {
    body: options.body,
    icon: options.icon || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=128&auto=format&fit=crop&q=80',
    badge: options.badge || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=72&auto=format&fit=crop&q=80',
    tag: options.tag || 'vitalis-notification',
    data: {
      url: options.url || window.location.href
    },
    vibrate: [300, 100, 300, 100, 300],
    silent: options.silent || false,
    requireInteraction: options.requireInteraction ?? true
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as any);
        return;
      }
    }
    // Fallback if SW not active
    new Notification(title, notificationOptions);
  } catch (err) {
    console.error('Error showing native notification:', err);
    try {
      new Notification(title, notificationOptions);
    } catch (e) {
      console.error('Fallback notification also failed:', e);
    }
  }
};
