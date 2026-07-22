import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, AlertTriangle, Calendar, MessageSquare, 
  X, Volume2, VolumeX, Sparkles, ShieldAlert, ArrowRight, Trash2 
} from 'lucide-react';

export interface VitalisToast {
  id: string;
  type: 'ORDER' | 'STOCK' | 'BOOKING' | 'CHAT';
  title: string;
  desc: string;
  actionLabel: string;
  tab: string;
  chatId?: string;
  timestamp?: number;
}

interface VitalisToastEngineProps {
  toasts: VitalisToast[];
  onDismiss: (id: string) => void;
  onDismissAll?: () => void;
  onAction: (toast: VitalisToast) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const VitalisToastEngine: React.FC<VitalisToastEngineProps> = ({
  toasts,
  onDismiss,
  onDismissAll,
  onAction,
  soundEnabled,
  onToggleSound
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[110] flex flex-col gap-3 pointer-events-none w-full max-w-sm px-3 sm:px-0">
      
      {/* Mini Controls Bar when toasts are present */}
      {toasts.length > 1 && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="pointer-events-auto bg-slate-950/90 backdrop-blur-md text-slate-300 text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-full border border-slate-800 shadow-xl flex items-center justify-between gap-2 self-end border-teal-500/30"
        >
          <div className="flex items-center gap-1.5 text-teal-400">
            <Sparkles size={12} className="animate-pulse" />
            <span>{toasts.length} Alertas Activas</span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onToggleSound}
              className="p-1 hover:text-white transition-colors"
              title={soundEnabled ? "Silenciar audio de notificaciones" : "Activar sonido"}
            >
              {soundEnabled ? <Volume2 size={13} className="text-teal-400" /> : <VolumeX size={13} className="text-slate-500" />}
            </button>
            {onDismissAll && (
              <button 
                onClick={onDismissAll}
                className="hover:text-red-400 transition-colors flex items-center gap-1 text-[9px] border-l border-slate-800 pl-2"
              >
                <Trash2 size={11} />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Animated Toast Items */}
      <AnimatePresence>
        {toasts.map((toast) => {
          const isPersistent = toast.type === 'ORDER' || toast.type === 'CHAT';

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -25, scale: 0.92, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.85, x: 50, transition: { duration: 0.2 } }}
              className={`pointer-events-auto w-full bg-slate-900/95 backdrop-blur-xl text-white rounded-2xl shadow-2xl p-4 border flex flex-col gap-3 relative overflow-hidden transition-all ${
                isPersistent 
                  ? 'border-teal-500/40 shadow-teal-950/40' 
                  : 'border-slate-800 shadow-black/50'
              }`}
            >
              {/* Progress/Accent Bar */}
              {isPersistent ? (
                /* Persistent glowing line */
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-600" />
              ) : (
                /* 7 Seconds Auto-dismiss timer line */
                <motion.div 
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 7, ease: 'linear' }}
                  onAnimationComplete={() => onDismiss(toast.id)}
                  className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-orange-500"
                />
              )}

              {/* Header Info Line */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isPersistent ? 'bg-teal-400 animate-ping' : 'bg-amber-400'}`} />
                  <span className="text-[9.5px] font-black tracking-widest uppercase text-slate-400 flex items-center gap-1">
                    {isPersistent ? (
                      <span className="text-teal-400 font-extrabold flex items-center gap-1">
                        <ShieldAlert size={11} /> PRIORITARIA (Requiere Acción)
                      </span>
                    ) : (
                      'ALERTA VITALIS (7S)'
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => onDismiss(toast.id)}
                    className="p-1 text-slate-500 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                    title="Descartar"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Main Toast Content */}
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 shadow-inner ${
                  toast.type === 'ORDER' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' :
                  toast.type === 'STOCK' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 
                  toast.type === 'CHAT' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 
                  'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                }`}>
                  {toast.type === 'ORDER' ? <Package size={20} className="animate-bounce" /> :
                   toast.type === 'STOCK' ? <AlertTriangle size={20} /> : 
                   toast.type === 'CHAT' ? <MessageSquare size={20} className="animate-pulse" /> : 
                   <Calendar size={20} />}
                </div>

                <div className="flex-1 min-w-0 pr-1">
                  <h4 className="text-xs font-black text-white leading-snug tracking-tight">
                    {toast.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-0.5 line-clamp-2">
                    {toast.desc}
                  </p>
                </div>
              </div>

              {/* Footer Action Button */}
              <div className="flex justify-end pt-1">
                <button 
                  onClick={() => onAction(toast)}
                  className={`font-black text-[10px] px-4 py-1.5 rounded-xl uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-md active:scale-95 ${
                    isPersistent 
                      ? 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20 hover:shadow-teal-400/30' 
                      : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                  }`}
                >
                  <span>{toast.actionLabel}</span>
                  <ArrowRight size={12} />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};

export default VitalisToastEngine;
