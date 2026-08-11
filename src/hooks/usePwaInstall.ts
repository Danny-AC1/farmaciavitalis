import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
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
      console.log('¡Aplicación instalada exitosamente!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('El usuario aceptó instalar la app');
        setIsInstallable(false);
        setDeferredPrompt(null);
      } else {
        console.log('El usuario rechazó la instalación');
      }
    } catch (err) {
      console.error('Error al solicitar la instalación de la PWA:', err);
    }
  };

  const dismissInstall = () => {
    setIsDismissed(true);
  };

  const canShowInstallButton = isInstallable && !isStandalone && !isDismissed;

  return {
    isInstallable,
    isStandalone,
    canShowInstallButton,
    triggerInstall,
    dismissInstall
  };
}

export default usePwaInstall;
