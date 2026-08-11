import React from 'react';
import { Download, Smartphone, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface PwaInstallButtonProps {
  variant?: 'banner' | 'floating' | 'inline' | 'navbar';
  className?: string;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({ 
  variant = 'banner',
  className = ''
}) => {
  const { canShowInstallButton, triggerInstall, dismissInstall } = usePwaInstall();

  // Si ya está instalada o el usuario no tiene habilitado el prompt, no mostrar nada
  if (!canShowInstallButton) {
    return null;
  }

  if (variant === 'navbar') {
    return (
      <button
        onClick={triggerInstall}
        className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full text-xs font-bold shadow-sm transition-all animate-bounce ${className}`}
        title="Instalar Farmacia Vitalis en tu dispositivo"
      >
        <Download size={14} className="animate-pulse" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (variant === 'inline') {
    return (
      <div className={`p-4 bg-gradient-to-r from-teal-500 to-emerald-600 text-white rounded-2xl shadow-md flex items-center justify-between gap-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Smartphone size={22} className="text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm leading-tight">Instalar Aplicación Vitalis</h4>
            <p className="text-xs text-teal-100 mt-0.5">Acceso directo rápido y modo sin conexión</p>
          </div>
        </div>
        <button
          onClick={triggerInstall}
          className="px-4 py-2 bg-white text-teal-800 rounded-xl font-extrabold text-xs shadow-sm hover:bg-teal-50 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
        >
          <Download size={14} />
          Instalar
        </button>
      </div>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={`fixed bottom-20 right-4 z-40 max-w-xs animate-in slide-in-from-bottom-5 duration-300 ${className}`}>
        <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/icon-192.png" alt="Vitalis Icon" className="w-9 h-9 rounded-xl shadow-inner object-cover" />
            <div>
              <p className="text-xs font-black text-white leading-tight">Instalar App Vitalis</p>
              <p className="text-[10px] text-slate-300">Abre como aplicación nativa</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={triggerInstall}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-xl shadow-sm active:scale-95 transition"
            >
              Instalar
            </button>
            <button
              onClick={dismissInstall}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Variant 'banner' por defecto (banner fijo en la parte superior/inferior superior para móviles)
  return (
    <div className={`w-full bg-slate-900 border-b border-teal-500/30 text-white py-2.5 px-4 z-50 animate-in fade-in slide-in-from-top duration-300 ${className}`}>
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-500/20 border border-teal-400/40 flex items-center justify-center shrink-0">
            <img src="/icon-192.png" alt="Vitalis App" className="w-6 h-6 rounded-md object-cover" />
          </div>
          <div className="text-left">
            <span className="flex items-center gap-1.5 text-xs font-black text-white">
              <span>Instalar la App de Farmacia Vitalis</span>
              <Sparkles size={12} className="text-amber-400" />
            </span>
            <p className="text-[11px] text-slate-300 hidden sm:block">
              Instálala en tu pantalla de inicio para pedidos más rápidos y acceso inmediato.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={triggerInstall}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-95 text-white font-extrabold text-xs rounded-xl shadow-md transition-all"
          >
            <Download size={14} />
            <span className="hidden xs:inline">Instalar App</span>
            <span className="xs:hidden">Instalar</span>
          </button>
          <button
            onClick={dismissInstall}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            title="Cerrar aviso"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PwaInstallButton;
