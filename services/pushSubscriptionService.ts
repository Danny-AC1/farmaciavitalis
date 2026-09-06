// 100% Free Device & Push Registration Service using Firebase Firestore
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp
} from 'firebase/firestore';
import { firestore as db } from './firebase';
import { 
  initNotificationServiceWorker,
  checkNotificationCapabilities 
} from './nativeNotificationService';

export interface DevicePushInfo {
  deviceId: string;
  userId: string;
  role: 'ADMIN' | 'USER' | 'GUEST';
  platform: 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown';
  browser: string;
  isStandalone: boolean;
  permission: NotificationPermission;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  updatedAt?: any;
}

const DEVICE_ID_KEY = 'vitalis_device_uuid';

export const getOrCreateDeviceId = (): string => {
  if (typeof window === 'undefined') return 'server-env';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
};

export const detectPlatform = (): 'android' | 'ios' | 'windows' | 'mac' | 'linux' | 'unknown' => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'android';
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/windows/.test(ua)) return 'windows';
  if (/macintosh|mac os x/.test(ua)) return 'mac';
  if (/linux/.test(ua)) return 'linux';
  return 'unknown';
};

export const detectBrowser = (): string => {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent;
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('Chrome/') && !ua.includes('Edg/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('Firefox/')) return 'Firefox';
  return 'Navegador Web';
};

/**
 * Register this PC or phone device in Firestore to receive realtime notifications 100% free
 */
export const registerDeviceForPush = async (
  userId: string, 
  role: 'ADMIN' | 'USER' | 'GUEST' = 'USER',
  soundEnabled: boolean = true,
  hapticsEnabled: boolean = true
): Promise<boolean> => {
  try {
    const deviceId = getOrCreateDeviceId();
    const capabilities = checkNotificationCapabilities();
    const platform = detectPlatform();
    const browser = detectBrowser();

    await initNotificationServiceWorker();

    const deviceDoc: DevicePushInfo = {
      deviceId,
      userId: userId || 'anonymous',
      role,
      platform,
      browser,
      isStandalone: capabilities.isStandalone,
      permission: capabilities.permission,
      soundEnabled,
      hapticsEnabled,
      updatedAt: serverTimestamp()
    };

    // Save to Firestore in push_subscriptions collection
    await setDoc(doc(db, 'push_subscriptions', deviceId), deviceDoc, { merge: true });
    return true;
  } catch (err) {
    console.warn('Could not register device push in Firestore (operating in local fallback mode):', err);
    return false;
  }
};

/**
 * Get current registered device status
 */
export const getCurrentDeviceStatus = async (): Promise<DevicePushInfo | null> => {
  try {
    const deviceId = getOrCreateDeviceId();
    const docSnap = await getDoc(doc(db, 'push_subscriptions', deviceId));
    if (docSnap.exists()) {
      return docSnap.data() as DevicePushInfo;
    }
  } catch (e) {
    // Ignore offline errors
  }
  return null;
};
