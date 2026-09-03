import React, { useState } from 'react';
import { Download, Smartphone, X, Sparkles, Share, PlusSquare, MoreVertical, CheckCircle2 } from 'lucide-react';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface PwaInstallButtonProps {
  variant?: 'banner' | 'floating' | 'inline' | 'navbar';
  className?: string;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({ 
  variant = 'banner',
  className = ''
}) => {
  const { canShowInstallButton, isIOS, triggerInstall, dismissInstall } = usePwaInstall();
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false);

  // Si ya está instalada o el usuario no tiene habilitado el botón, no mostrar nada
  if (!canShowInstallButton) {
    return null;
  }

  const handleInstallClick = async () => {
    const result = await triggerInstall();
    if (result === 'manual_guide' || isIOS) {
      setShowGuideModal(true);
    }
  };

  const renderGuideModal = () => {
    if (!showGuideModal) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-slate-800 relative animate-in zoom-in-95 duration-200">
          <button
            onClick={() => setShowGuideModal(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <img src="/icon-192.png" alt="Farmacia Vitalis" className="w-12 h-12 rounded-2xl shadow-md object-cover" />
            <div>
              <h3 className="font-extrabold text-base text-slate-900 leading-tight">Instalar Farmacia Vitalis</h3>
              <p className="text-xs text-teal-600 font-semibold">Experiencia como aplicación nativa</p>
            </div>
          </div>

          <div className="bg-teal-50/70 border border-teal-100 rounded-2xl p-4 text-xs text-teal-900 space-y-3 mb-5">
            {isIOS ? (
              <>
                <p className="font-bold text-slate-800">Para instalar en tu iPhone o iPad (Safari):</p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p>Toca el botón <span className="font-bold inline-flex items-center gap-1 text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200"><Share size={12} /> Compartir</span> en la barra inferior de Safari.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p>Desplaza hacia abajo y selecciona <span className="font-bold inline-flex items-center gap-1 text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200"><PlusSquare size={12} /> Agregar al inicio</span>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p>Presiona <span className="font-bold text-teal-700">"Agregar"</span> en la esquina superior derecha.</p>
                </div>
              </>
            ) : (
              <>
                <p className="font-bold text-slate-800">Para instalar en tu celular o tablet:</p>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">1</div>
                  <p>Toca el menú de opciones <span className="font-bold inline-flex items-center gap-1 text-teal-700 bg-white px-1.5 py-0.5 rounded border border-teal-200"><MoreVertical size={12} /> (tres puntos)</span> en tu navegador.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">2</div>
                  <p>Selecciona <span className="font-bold text-teal-700">"Instalar aplicación"</span> o <span className="font-bold text-teal-700">"Agregar a la pantalla principal"</span>.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold text-xs shrink-0">3</div>
                  <p>Confirma tocando <span className="font-bold text-teal-700">"Instalar"</span> para tener el ícono oficial en tu pantalla.</p>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 mb-5">
            <CheckCircle2 size={15} className="text-emerald-500 shrink-0" />
            <span>Sin ocupar espacio extra y con carga ultrarrápida.</span>
          </div>

          <button
            onClick={() => setShowGuideModal(false)}
            className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-2xl font-bold text-sm shadow-md transition"
          >
            Entendido
          </button>
        </div>
      </div>
    );
  };

  if (variant === 'navbar') {
    return (
      <>
        <button
          onClick={handleInstallClick}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-full text-xs font-bold shadow-sm transition-all animate-bounce ${className}`}
          title="Instalar Farmacia Vitalis en tu dispositivo"
        >
          <Download size={14} className="animate-pulse" />
          <span>Instalar App</span>
        </button>
        {renderGuideModal()}
      </>
    );
  }

  if (variant === 'inline') {
    return (
      <>
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
            onClick={handleInstallClick}
            className="px-4 py-2 bg-white text-teal-800 rounded-xl font-extrabold text-xs shadow-sm hover:bg-teal-50 active:scale-95 transition-all shrink-0 flex items-center gap-1.5"
          >
            <Download size={14} />
            Instalar
          </button>
        </div>
        {renderGuideModal()}
      </>
    );
  }

  if (variant === 'floating') {
    return (
      <>
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
                onClick={handleInstallClick}
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
        {renderGuideModal()}
      </>
    );
  }

  // Variant 'banner' por defecto (banner fijo en la parte superior para móviles y escritorio)
  return (
    <>
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
              onClick={handleInstallClick}
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
      {renderGuideModal()}
    </>
  );
};

export default PwaInstallButton;
