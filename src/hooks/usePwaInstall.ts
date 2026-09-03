import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);

  useEffect(() => {
    // Detectar si la app ya está instalada o ejecutándose en modo standalone
    const checkStandalone = () => {
      const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches;
      // Compatibilidad con iOS Safari
      const isIOSStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      const runningStandalone = isStandaloneMedia || isIOSStandalone;
      setIsStandalone(runningStandalone);
    };

    checkStandalone();

    // Detectar dispositivos iOS (Safari no emite beforeinstallprompt)
    if (typeof window !== 'undefined' && window.navigator) {
      const ua = window.navigator.userAgent.toLowerCase();
      const isAppleMobile = /iphone|ipad|ipod/.test(ua);
      setIsIOS(isAppleMobile);
    }

    // Evento disparado cuando el navegador detecta que el sitio cumple los requisitos de PWA
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    // Evento disparado cuando el usuario completa la instalación
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
      console.log('¡Farmacia Vitalis instalada como app nativa!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'manual_guide'> => {
    if (!deferredPrompt) {
      // Si no hay prompt nativo disponible (ej. iOS o ya consumido), señalizar guía manual
      return 'manual_guide';
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstallable(false);
        setDeferredPrompt(null);
        setIsStandalone(true);
        return 'accepted';
      }
      return 'dismissed';
    } catch (err) {
      console.error('Error al solicitar la instalación de la PWA:', err);
      return 'manual_guide';
    }
  };

  const dismissInstall = () => {
    setIsDismissed(true);
  };

  // Mostrar botón si no está ya instalada en modo app y no ha sido descartada
  const canShowInstallButton = !isStandalone && !isDismissed;

  return {
    isInstallable,
    isStandalone,
    isIOS,
    canShowInstallButton,
    triggerInstall,
    dismissInstall
  };
}

export default usePwaInstall;
