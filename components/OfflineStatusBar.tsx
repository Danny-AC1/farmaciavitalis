import React from 'react';
import { WifiOff, RefreshCw, CloudSync } from 'lucide-react';
import { useOfflineSync } from '../hooks/useOfflineSync';

export const OfflineStatusBar: React.FC = () => {
  const { isOnline, pendingSyncCount, isSyncing, syncNow } = useOfflineSync();

  // If online and nothing to sync, don't show the bar to keep the UI clean
  if (isOnline && pendingSyncCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <aside 
      aria-label="Estado de conectividad y sincronización"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-50 max-w-md animate-fade-in"
    >
      <div 
        className={`px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md transition-all duration-300 flex items-center justify-between gap-3 ${
          !isOnline 
            ? 'bg-amber-900/90 text-white border-amber-500/40 shadow-amber-950/20' 
            : isSyncing 
              ? 'bg-teal-900/90 text-white border-teal-500/40 shadow-teal-950/20'
              : 'bg-indigo-900/90 text-white border-indigo-500/40 shadow-indigo-950/20'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`p-2 rounded-xl shrink-0 ${
            !isOnline 
              ? 'bg-amber-500/20 text-amber-300 animate-pulse' 
              : isSyncing 
                ? 'bg-teal-500/20 text-teal-300'
                : 'bg-indigo-500/20 text-indigo-300'
          }`}>
            {!isOnline ? (
              <WifiOff size={18} />
            ) : isSyncing ? (
              <RefreshCw size={18} className="animate-spin text-teal-300" />
            ) : (
              <CloudSync size={18} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-xs font-bold tracking-wide truncate">
                {!isOnline ? 'Modo 100% Offline Activo' : isSyncing ? 'Sincronizando en la Nube...' : 'Cambios Locales Pendientes'}
              </p>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 font-mono font-medium">
                {pendingSyncCount} pendientes
              </span>
            </div>
            <p className="text-[11px] text-white/80 truncate">
              {!isOnline 
                ? 'Puedes seguir vendiendo y operando con normalidad.' 
                : isSyncing 
                  ? 'Subiendo datos a Firebase...' 
                  : 'Se sincronizarán automáticamente.'}
            </p>
          </div>
        </div>

        {isOnline && !isSyncing && pendingSyncCount > 0 && (
          <button
            onClick={() => syncNow()}
            className="px-3 py-1.5 bg-white text-indigo-950 text-xs font-bold rounded-xl hover:bg-white/90 active:scale-95 transition-all shadow-sm shrink-0 flex items-center gap-1.5"
            title="Sincronizar ahora"
          >
            <RefreshCw size={12} />
            <span>Sincronizar</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default OfflineStatusBar;
