import React from 'react';
import { ScanBarcode, Package, Wifi, WifiOff, RefreshCw, Coins, Landmark } from 'lucide-react';

interface POSToolbarProps {
  pendingCreditsCount: number;
  onOpenCreditDrawer: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  isSyncing: boolean;
  onManualSync: () => void;
  onOpenScanner: () => void;
  onOpenTreasury?: () => void;
  onOpenCashClosure?: () => void;
  isSessionOpen?: boolean;
  activeCashier?: string;
  showBundles: boolean;
  setShowBundles: (b: boolean | ((prev: boolean) => boolean)) => void;
}

export const POSToolbar: React.FC<POSToolbarProps> = ({
  pendingCreditsCount,
  onOpenCreditDrawer,
  isOnline,
  pendingSyncCount,
  isSyncing,
  onManualSync,
  onOpenScanner,
  onOpenTreasury,
  onOpenCashClosure,
  isSessionOpen = false,
  activeCashier,
  showBundles,
  setShowBundles
}) => {
  const handleTreasuryClick = onOpenTreasury || onOpenCashClosure || (() => {});

  return (
    <div className="flex gap-1 md:gap-2 shrink-0">
      {/* Botón Inteligente de Medicamentos Fiados con badge en tiempo real */}
      <button
        onClick={onOpenCreditDrawer}
        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-[11px] border transition shadow-xs ${
          pendingCreditsCount > 0 
            ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 animate-in zoom-in-95' 
            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
        }`}
        title="Libreta Rápida de Medicamentos Fiados"
      >
        <Coins size={14} className={pendingCreditsCount > 0 ? 'text-amber-100' : 'text-amber-500'} />
        <span>FIADOS ({pendingCreditsCount})</span>
      </button>

      {/* Botón de Sincronización y Estado Offline */}
      <button
        onClick={onManualSync}
        disabled={isSyncing}
        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] border transition ${
          !isOnline 
            ? 'bg-amber-500 text-white border-amber-600 animate-pulse' 
            : pendingSyncCount > 0 
            ? 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
        }`}
        title={!isOnline ? 'Modo Offline Activo' : 'Sincronizar ventas con la nube'}
      >
        {!isOnline ? <WifiOff size={14}/> : <Wifi size={14}/>}
        <span className="hidden sm:inline">
          {!isOnline 
            ? `OFFLINE (${pendingSyncCount})` 
            : pendingSyncCount > 0 
            ? `SINCRONIZAR (${pendingSyncCount})` 
            : 'ONLINE'}
        </span>
        <span className="sm:hidden">
          {!isOnline ? `OFF (${pendingSyncCount})` : pendingSyncCount > 0 ? `SYNC (${pendingSyncCount})` : 'ON'}
        </span>
        {pendingSyncCount > 0 && <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />}
      </button>

      {/* Botón Scanner de Código de Barras */}
      <button 
        onClick={onOpenScanner} 
        className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] text-slate-600 hover:bg-slate-50 transition"
      >
        <ScanBarcode size={14}/> <span className="hidden sm:inline">SCANNER</span>
      </button>

      {/* Botón Tesorería Avanzada & Caja POS */}
      <button 
        onClick={handleTreasuryClick} 
        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-[11px] border transition shadow-xs ${
          isSessionOpen 
            ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800' 
            : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
        }`}
        title={isSessionOpen ? `Turno activo con ${activeCashier || 'cajero'}` : 'Abrir turno de tesorería y caja'}
      >
        <Landmark size={14} className={isSessionOpen ? 'text-emerald-400' : 'text-amber-600'} />
        <span>TESORERÍA</span>
        {isSessionOpen ? (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse hidden sm:inline-block"></span>
        ) : (
          <span className="text-[9px] bg-amber-200/80 text-amber-900 px-1 rounded font-bold hidden sm:inline">CERRADA</span>
        )}
      </button>

      {/* Botón Desplegar Combos / Promociones */}
      <button 
        onClick={() => setShowBundles(prev => !prev)} 
        className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 border px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] transition ${
          showBundles ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'
        }`}
      >
        <Package size={14}/> <span className="hidden sm:inline">COMBOS</span>
      </button>
    </div>
  );
};

export default POSToolbar;
