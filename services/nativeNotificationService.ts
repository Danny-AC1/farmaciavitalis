// Service for handling Browser Native System/Push Notifications (100% Free Web Push)
import { notificationAudio } from './notificationAudioService';

export interface DeviceNotificationStatus {
  supported: boolean;
  permission: NotificationPermission;
  hasServiceWorker: boolean;
  hasPushManager: boolean;
  hasVibration: boolean;
  isStandalone: boolean;
  isIOS: boolean;
}

export const checkNotificationCapabilities = (): DeviceNotificationStatus => {
  const supported = typeof window !== 'undefined' && 'Notification' in window;
  const hasServiceWorker = typeof window !== 'undefined' && 'serviceWorker' in navigator;
  const hasPushManager = hasServiceWorker && 'PushManager' in window;
  const hasVibration = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  
  const isStandalone = typeof window !== 'undefined' && (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '';
  const isIOS = /iphone|ipad|ipod/.test(ua);

  return {
    supported,
    permission: getNotificationPermission(),
    hasServiceWorker,
    hasPushManager,
    hasVibration,
    isStandalone,
    isIOS
  };
};

export const initNotificationServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if ('serviceWorker' in navigator) {
    try {
      // First check if already registered
      let registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js');
      }
      return registration;
    } catch (error) {
      console.error('ServiceWorker registration for notifications failed:', error);
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
  soundType?: 'order' | 'alert' | 'chat' | 'none';
  requireInteraction?: boolean;
  actions?: Array<{ action: string; title: string; icon?: string }>;
}

export const triggerNativeNotification = async (
  title: string, 
  options: NativeNotificationOptions
) => {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  // 1. Audio chime feedback
  if (options.soundType !== 'none') {
    if (options.soundType === 'alert') {
      notificationAudio.playAlertTone();
    } else if (options.soundType === 'chat') {
      notificationAudio.playChatPing();
    } else {
      notificationAudio.playOrderChime();
    }
  }

  // 2. Haptic motor vibration on mobile devices
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([300, 100, 300, 100, 300]);
    } catch {
      // Ignore vibration policy issues
    }
  }

  const defaultActions = [
    { action: 'open', title: '👁️ Ver Detalle' },
    { action: 'dismiss', title: '✅ Marcar Visto' }
  ];

  const notificationOptions = {
    body: options.body,
    icon: options.icon || '/icon-192.png',
    badge: options.badge || '/favicon-32x32.png',
    tag: options.tag || `vitalis-${Date.now()}`,
    data: {
      url: options.url || window.location.href
    },
    vibrate: [300, 100, 300, 100, 300],
    renotify: true,
    silent: options.silent || false,
    requireInteraction: options.requireInteraction ?? true,
    actions: options.actions || defaultActions
  };

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions as any);
        return;
      }
    }
    // Fallback if SW not active yet
    new Notification(title, notificationOptions);
  } catch (err) {
    console.error('Error showing native notification:', err);
    try {
      new Notification(title, notificationOptions);
    } catch (e) {
      console.error('Fallback notification failed:', e);
    }
  }
};

/**
 * Send an immediate test notification with haptic vibration, audio chime, and OS system card
 */
export const sendTestNotification = async (type: 'order' | 'alert' | 'chat' = 'order'): Promise<boolean> => {
  const perm = getNotificationPermission();
  if (perm !== 'granted') {
    const granted = await requestNotificationPermission();
    if (!granted) return false;
  }

  const payloads = {
    order: {
      title: '🛒 ¡Pedido de Prueba Vitalis!',
      body: 'Tu dispositivo está 100% configurado para recibir alertas instantáneas.',
      soundType: 'order' as const,
      url: '/#orders'
    },
    alert: {
      title: '⚠️ Alerta de Sistema Vitalis',
      body: 'Notificación prioritaria de prueba con sonido y vibración háptica.',
      soundType: 'alert' as const,
      url: '/'
    },
    chat: {
      title: '💬 Nuevo Mensaje de Farmacia Vitalis',
      body: 'El farmacéutico de turno te ha respondido en el chat.',
      soundType: 'chat' as const,
      url: '/assistant'
    }
  };

  const selected = payloads[type];
  await triggerNativeNotification(selected.title, {
    body: selected.body,
    soundType: selected.soundType,
    url: selected.url,
    tag: `vitalis-test-${Date.now()}`,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '🚀 Abrir Farmacia' },
      { action: 'dismiss', title: '✅ Todo Listo' }
    ]
  });

  return true;
};

/**
 * Schedule a background notification via Service Worker (e.g., medicine reminder)
 */
export const scheduleBackgroundNotification = async (params: {
  title: string;
  body: string;
  delayMs: number;
  tag?: string;
  url?: string;
  actions?: Array<{ action: string; title: string }>;
}) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SCHEDULE_MED_NOTIFICATION',
      ...params
    });
    return true;
  }
  return false;
};
