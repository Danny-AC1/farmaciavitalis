import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Laptop, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Vibrate, 
  Sparkles, 
  X, 
  Play, 
  ShieldCheck,
  Apple
} from 'lucide-react';
import { 
  checkNotificationCapabilities, 
  requestNotificationPermission, 
  sendTestNotification, 
  DeviceNotificationStatus
} from '../../services/nativeNotificationService';
import { notificationAudio } from '../../services/notificationAudioService';
import { registerDeviceForPush, detectPlatform, detectBrowser } from '../../services/pushSubscriptionService';

interface DeviceNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userRole?: 'ADMIN' | 'USER' | 'GUEST';
}

export const DeviceNotificationSettingsModal: React.FC<DeviceNotificationSettingsModalProps> = ({
  isOpen,
  onClose,
  userId = 'guest',
  userRole = 'USER'
}) => {
  const [capabilities, setCapabilities] = useState<DeviceNotificationStatus | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      const caps = checkNotificationCapabilities();
      setCapabilities(caps);
      setSoundEnabled(notificationAudio.isSoundEnabled());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    const updated = checkNotificationCapabilities();
    setCapabilities(updated);

    if (granted) {
      await registerDeviceForPush(userId, userRole, soundEnabled, hapticsEnabled);
      handleRunTest('order');
    }
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    notificationAudio.setSoundEnabled(next);
    if (next) notificationAudio.playOrderChime();
    registerDeviceForPush(userId, userRole, next, hapticsEnabled);
  };

  const handleToggleHaptics = () => {
    const next = !hapticsEnabled;
    setHapticsEnabled(next);
    if (next && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200]);
    }
    registerDeviceForPush(userId, userRole, soundEnabled, next);
  };

  const handleRunTest = async (type: 'order' | 'alert' | 'chat') => {
    setIsTesting(true);
    setTestSuccess(null);

    const success = await sendTestNotification(type);
    setIsTesting(false);

    if (success) {
      setTestSuccess(`¡Notificación ${type === 'order' ? 'de Pedido' : type === 'chat' ? 'de Chat' : 'de Alerta'} enviada con éxito a tu dispositivo!`);
      setTimeout(() => setTestSuccess(null), 4000);
    }
  };

  const platform = detectPlatform();
  const browser = detectBrowser();
  const isPermissionGranted = capabilities?.permission === 'granted';
  const isPermissionDenied = capabilities?.permission === 'denied';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header con gradiente Vitalis */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white p-6 relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/15 backdrop-blur-md rounded-2xl border border-white/20">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>Notificaciones de Primer Nivel</span>
                  <Sparkles size={16} className="text-amber-300" />
                </h3>
                <p className="text-xs text-teal-100 font-medium">
                  Alertas en PC y Celular • 100% Gratis y en Tiempo Real
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-teal-100 hover:text-white hover:bg-white/15 rounded-xl transition"
              aria-label="Cerrar modal"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[75vh]">
          
          {/* Tarjeta de Estado del Dispositivo */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">
                Dispositivo Actual
              </span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${
                isPermissionGranted 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : isPermissionDenied
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {isPermissionGranted && <CheckCircle2 size={13} />}
                {isPermissionDenied && <AlertCircle size={13} />}
                {!isPermissionGranted && !isPermissionDenied && <Bell size={13} />}
                {isPermissionGranted ? 'Activas y Conectadas' : isPermissionDenied ? 'Bloqueadas en Navegador' : 'Pendiente de Activar'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                {platform === 'android' || platform === 'ios' ? (
                  <Smartphone className="h-4 w-4 text-teal-600 shrink-0" />
                ) : (
                  <Laptop className="h-4 w-4 text-teal-600 shrink-0" />
                )}
                <div>
                  <div className="font-bold text-slate-700 capitalize">{platform} ({browser})</div>
                  <div className="text-[10px] text-slate-400">
                    {capabilities?.isStandalone ? 'App PWA Instalada' : 'Navegador Web'}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 bg-white rounded-xl border border-slate-200">
                <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-slate-700">Canal W3C Directo</div>
                  <div className="text-[10px] text-slate-400">Cero intermediarios pagos</div>
                </div>
              </div>
            </div>

            {/* Aviso de permiso bloqueado */}
            {isPermissionDenied && (
              <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <strong className="font-bold block mb-0.5">Las notificaciones están bloqueadas en tu navegador</strong>
                  Para reactivarlas: toca el ícono de candado 🔒 o ajustes al lado del enlace en tu navegador y cambia el permiso de Notificaciones a <strong>Permitir</strong>.
                </div>
              </div>
            )}

            {/* Botón para solicitar permiso si está en 'default' */}
            {!isPermissionGranted && !isPermissionDenied && (
              <button
                onClick={handleRequestPermission}
                className="mt-3 w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                <Bell size={16} />
                <span>Habilitar Notificaciones en este Equipo</span>
              </button>
            )}
          </div>

          {/* Preferencias de Sonido y Vibración Háptica */}
          <div className="space-y-3">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Preferencias Sensoriales
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Sonido */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-xl text-teal-600 border border-slate-200">
                    {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Sonido Acústico</div>
                    <div className="text-[10px] text-slate-400">Campana cristalina</div>
                  </div>
                </div>
                <button
                  onClick={handleToggleSound}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soundEnabled ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      soundEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Vibración Háptica */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-white rounded-xl text-teal-600 border border-slate-200">
                    <Vibrate size={18} />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Vibración Móvil</div>
                    <div className="text-[10px] text-slate-400">Patrón háptico 3-pulsos</div>
                  </div>
                </div>
                <button
                  onClick={handleToggleHaptics}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    hapticsEnabled ? 'bg-teal-600' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Escuchar muestras de sonido */}
            {soundEnabled && (
              <div className="p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between text-xs">
                <span className="font-bold text-teal-900 text-[11px]">Probar tonos:</span>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => notificationAudio.playOrderChime()}
                    className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 font-bold text-[10px] flex items-center gap-1 transition"
                  >
                    <Play size={10} /> Pedido
                  </button>
                  <button 
                    onClick={() => notificationAudio.playChatPing()}
                    className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 font-bold text-[10px] flex items-center gap-1 transition"
                  >
                    <Play size={10} /> Chat
                  </button>
                  <button 
                    onClick={() => notificationAudio.playAlertTone()}
                    className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 rounded-lg border border-teal-200 font-bold text-[10px] flex items-center gap-1 transition"
                  >
                    <Play size={10} /> Alerta
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Banco de Pruebas en Vivo */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Probar en este Dispositivo
              </h4>
              <span className="text-[11px] text-teal-600 font-bold">
                Verifica sonido, vibración y tarjeta nativa
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                onClick={() => handleRunTest('order')}
                disabled={isTesting}
                className="p-3 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-2xl text-center transition group flex flex-col items-center gap-1.5 shadow-xs"
              >
                <div className="p-2 bg-teal-100 text-teal-800 rounded-xl group-hover:scale-110 transition">
                  <Bell size={16} />
                </div>
                <div className="text-[11px] font-black text-slate-800">Nuevo Pedido</div>
                <div className="text-[9px] text-slate-400">Sonido + Vibrar</div>
              </button>

              <button
                onClick={() => handleRunTest('chat')}
                disabled={isTesting}
                className="p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-2xl text-center transition group flex flex-col items-center gap-1.5 shadow-xs"
              >
                <div className="p-2 bg-emerald-100 text-emerald-800 rounded-xl group-hover:scale-110 transition">
                  <Send size={16} />
                </div>
                <div className="text-[11px] font-black text-slate-800">Mensaje Chat</div>
                <div className="text-[9px] text-slate-400">Ping suave</div>
              </button>

              <button
                onClick={() => handleRunTest('alert')}
                disabled={isTesting}
                className="p-3 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-2xl text-center transition group flex flex-col items-center gap-1.5 shadow-xs"
              >
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl group-hover:scale-110 transition">
                  <AlertCircle size={16} />
                </div>
                <div className="text-[11px] font-black text-slate-800">Alerta Prioritaria</div>
                <div className="text-[9px] text-slate-400">Tono urgente</div>
              </button>
            </div>

            {testSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>{testSuccess}</span>
              </div>
            )}
          </div>

          {/* Sección para usuarios de iPhone (iOS 16.4+) */}
          {platform === 'ios' && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-xs text-sky-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-sky-950">
                <Apple size={15} />
                <span>Requisito en iPhone (iOS 16.4+)</span>
              </div>
              <p className="text-[11px] text-sky-800 leading-relaxed">
                Apple requiere que la página esté agregada a la pantalla de inicio para recibir alertas cuando el celular esté bloqueado:
                Toca el botón <strong>Compartir</strong> en Safari y selecciona <strong>"Agregar al Inicio"</strong>.
              </p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black uppercase tracking-wider rounded-xl transition shadow-sm"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
