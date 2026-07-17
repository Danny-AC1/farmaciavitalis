import React from 'react';
import { 
  Lock, 
  Unlock, 
  User, 
  Info, 
  ClipboardCheck 
} from 'lucide-react';
import { TreasurySession } from '../../../types';

interface TreasurySessionTabProps {
  activeSession: TreasurySession | null;
  activeSessionCalculations: {
    ordersCount: number;
    cashSales: number;
    transferSales: number;
    totalSales: number;
    extraIngresos: number;
    totalEgresos: number;
    totalRetiros: number;
    expectedCashInDrawer: number;
  } | null;
  arqueo: {
    bills100: number;
    bills50: number;
    bills20: number;
    bills10: number;
    bills5: number;
    bills1: number;
    coins050: number;
    coins025: number;
    coins010: number;
    coins005: number;
    coins001: number;
  };
  auditNotes: string;
  setAuditNotes: (v: string) => void;
  isCierreConfirmed: boolean;
  setIsCierreConfirmed: (v: boolean) => void;
  countedCashSum: number;
  handleOpenSession: (e: React.FormEvent) => void;
  handleCloseSessionSubmit: (e: React.FormEvent) => void;
  initialCashStr: string;
  setInitialCashStr: (v: string) => void;
  cashierName: string;
  setCashierName: (v: string) => void;
  adjustDenom: (field: keyof TreasurySessionTabProps['arqueo'], delta: number) => void;
}

export const TreasurySessionTab: React.FC<TreasurySessionTabProps> = ({
  activeSession,
  activeSessionCalculations,
  arqueo,
  auditNotes,
  setAuditNotes,
  isCierreConfirmed,
  setIsCierreConfirmed,
  countedCashSum,
  handleOpenSession,
  handleCloseSessionSubmit,
  initialCashStr,
  setInitialCashStr,
  cashierName,
  setCashierName,
  adjustDenom,
}) => {
  if (!activeSession) {
    return (
      <div className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl mx-auto w-full text-center space-y-6">
        <div className="mx-auto h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
          <Lock size={32} />
        </div>

        <div className="space-y-2">
          <h4 className="text-lg font-black text-slate-800 tracking-tight">Turno Cerrado / Caja Fuera de Línea</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Para registrar transacciones de caja chica, conciliar depósitos y llevar el control diario de arqueos, debes realizar la apertura del cajón de efectivo con un fondo inicial para cambio.
          </p>
        </div>

        <form onSubmit={handleOpenSession} className="max-w-md mx-auto bg-slate-50/50 p-6 rounded-[2rem] border border-slate-150 space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Fondo de Apertura (Efectivo en Caja) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                step="0.01"
                required
                value={initialCashStr}
                onChange={(e) => setInitialCashStr(e.target.value)}
                placeholder="50.00"
                className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
            <span className="text-[9.5px] text-slate-400 block font-medium">Sencillo o cambio destinado a iniciar el día en la farmacia.</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Cajero(a) Responsable *</label>
            <div className="relative">
              <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Ej: Daniel Ascencio"
                value={cashierName}
                onChange={(e) => setCashierName(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Unlock size={14} />
            Abrir Turno de Caja Chica
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Resumen del Balance de Efectivo */}
      <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Turno Activo
            </span>
            <span className="text-[11px] text-slate-400 font-bold font-mono">
              {activeSession.id}
            </span>
          </div>

          <div className="mt-4 space-y-1">
            <h4 className="text-base font-extrabold text-slate-800">Responsable: {activeSession.openedBy}</h4>
            <span className="text-[10.5px] text-slate-400 font-semibold block">
              Apertura: {new Date(activeSession.openedAt).toLocaleDateString('es-ES')} {new Date(activeSession.openedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Cuentas en tiempo real */}
          {activeSessionCalculations && (
            <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                <span>Fondo Inicial de Caja:</span>
                <span className="font-mono text-slate-800 font-bold">${activeSession.initialCash.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                <span>Ingresos Ventas Efectivo (+):</span>
                <span className="font-mono text-emerald-600 font-bold">${activeSessionCalculations.cashSales.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                <span>Ingresos Extra (+):</span>
                <span className="font-mono text-emerald-600 font-bold">${activeSessionCalculations.extraIngresos.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                <span>Egresos Detallados (-):</span>
                <span className="font-mono text-rose-500 font-bold">-${activeSessionCalculations.totalEgresos.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                <span>Retiros Parciales / Caja Fuerte (-):</span>
                <span className="font-mono text-rose-500 font-bold">-${activeSessionCalculations.totalRetiros.toFixed(2)}</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex justify-between items-center mt-4">
                <div>
                  <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Saldo Teórico en Caja</span>
                  <span className="text-[10.5px] text-slate-500 font-bold">(Sistema debiese tener en Efectivo)</span>
                </div>
                <span className="text-xl font-black text-slate-800 font-mono">
                  ${activeSessionCalculations.expectedCashInDrawer.toFixed(2)}
                </span>
              </div>

              <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-sky-500" />
                  Ventas por Transferencia (Banco):
                </span>
                <span className="font-mono text-slate-700 font-bold">${activeSessionCalculations.transferSales.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60 text-amber-800 text-[11px] leading-relaxed font-semibold flex items-start gap-2">
          <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <span>
            El Arqueo Ciego requiere que cuentes el efectivo billete por billete y moneda por moneda a la derecha. El sistema mantendrá oculto el "Saldo Teórico" del cajero hasta que confirme el cierre para prevenir ajustes artificiales.
          </span>
        </div>
      </div>

      {/* ARQUEO DE CAJA INTERACTIVO (Arqueo Ciego) */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <div>
          <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
            <ClipboardCheck size={16} className="text-rose-500" />
            Arqueo de Efectivo Físico (Billetes & Monedas)
          </h4>
          <p className="text-[11px] text-slate-400 mt-0.5">Suma el inventario de monedas y billetes existentes en gaveta para la conciliación de fin de turno.</p>
        </div>

        <form onSubmit={handleCloseSessionSubmit} className="space-y-6">
          {/* Billetes */}
          <div className="space-y-3">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Billetes</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {([
                { label: '$100.00', key: 'bills100' },
                { label: '$50.00', key: 'bills50' },
                { label: '$20.00', key: 'bills20' },
                { label: '$10.00', key: 'bills10' },
                { label: '$5.00', key: 'bills5' },
                { label: '$1.00', key: 'bills1' }
              ] as const).map((denom) => (
                <div key={denom.key} className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">{denom.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustDenom(denom.key, -1)}
                      className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-black text-slate-800 font-mono">
                      {arqueo[denom.key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustDenom(denom.key, 1)}
                      className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monedas */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monedas (Fraccionarias)</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {([
                { label: '$0.50 ctv', key: 'coins050' },
                { label: '$0.25 ctv', key: 'coins025' },
                { label: '$0.10 ctv', key: 'coins010' },
                { label: '$0.05 ctv', key: 'coins005' },
                { label: '$0.01 ctv', key: 'coins001' }
              ] as const).map((denom) => (
                <div key={denom.key} className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">{denom.label}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => adjustDenom(denom.key, -1)}
                      className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                    >
                      -
                    </button>
                    <span className="w-5 text-center text-xs font-black text-slate-800 font-mono">
                      {arqueo[denom.key]}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustDenom(denom.key, 1)}
                      className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resultados acumulativos y envío de cierre */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl">
              <div>
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">TOTAL EFECTIVO CONTADO</span>
                <span className="text-xs text-slate-300 font-semibold">(Suma de billetes y monedas contadas)</span>
              </div>
              <span className="text-xl font-mono font-black text-teal-400">
                ${countedCashSum.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Observaciones del Turno / Arqueo</label>
              <textarea
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Ej: Entrega conforme, se deposita $150 al banco principal..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors h-16 resize-none"
              />
            </div>

            <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100/60 flex items-center gap-3">
              <input
                type="checkbox"
                id="confirm_cierre"
                checked={isCierreConfirmed}
                onChange={(e) => setIsCierreConfirmed(e.target.checked)}
                className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <label htmlFor="confirm_cierre" className="text-xs text-rose-900 font-bold select-none cursor-pointer">
                Confirmo que el conteo físico de gaveta está correcto y deseo proceder con el cierre definitivo del turno.
              </label>
            </div>

            <button
              type="submit"
              disabled={!isCierreConfirmed || countedCashSum <= 0}
              className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Lock size={14} />
              Realizar Cierre de Caja y Calcular Discrepancia
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
