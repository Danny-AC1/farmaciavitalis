import React from 'react';
import { DollarSign, Printer } from 'lucide-react';
import { TreasurySession } from '../../../types';
import { TreasuryDenominationCounter, ArqueoDenominations } from './TreasuryDenominationCounter';

interface SessionCalculations {
  ordersCount: number;
  cashSales: number;
  transferSales: number;
  totalSales: number;
  extraIngresos: number;
  totalEgresos: number;
  totalRetiros: number;
  expectedCashInDrawer: number;
}

interface TreasuryActiveSessionViewProps {
  activeSession: TreasurySession;
  calcs: SessionCalculations | null;
  arqueo: ArqueoDenominations;
  setArqueo: React.Dispatch<React.SetStateAction<ArqueoDenominations>>;
  adjustDenom: (field: keyof ArqueoDenominations, delta: number) => void;
  countedCashSum: number;
  auditNotes: string;
  setAuditNotes: (val: string) => void;
  isCierreConfirmed: boolean;
  setIsCierreConfirmed: (val: boolean) => void;
  onCloseSession: (printTicket: boolean) => void;
}

export const TreasuryActiveSessionView: React.FC<TreasuryActiveSessionViewProps> = ({
  activeSession,
  calcs,
  arqueo,
  setArqueo,
  adjustDenom,
  countedCashSum,
  auditNotes,
  setAuditNotes,
  isCierreConfirmed,
  setIsCierreConfirmed,
  onCloseSession
}) => {
  const expectedCash = calcs?.expectedCashInDrawer || 0;
  const discrepancy = countedCashSum - expectedCash;
  const isExactMatch = Math.abs(discrepancy) < 0.01;

  return (
    <div className="space-y-4">
      {/* RESUMEN DE CIFRAS DEL TURNO */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-200">
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fondo Inicial</span>
          <span className="text-sm font-black text-slate-800 mt-1 block">
            ${activeSession.initialCash.toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-400 truncate block">
            Desde {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200">
          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Ventas Efectivo</span>
          <span className="text-sm font-black text-emerald-700 mt-1 block">
            +${(calcs?.cashSales || 0).toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-400 block">{calcs?.ordersCount || 0} pedidos</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200">
          <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">Transferencias</span>
          <span className="text-sm font-black text-blue-700 mt-1 block">
            ${(calcs?.transferSales || 0).toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-400 block">Bancos/Tarjetas</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200">
          <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">Egresos Caja</span>
          <span className="text-sm font-black text-rose-700 mt-1 block">
            -${(calcs?.totalEgresos || 0).toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-400 block">Gastos menores</span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200">
          <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest block">Retiros Caja</span>
          <span className="text-sm font-black text-purple-700 mt-1 block">
            -${(calcs?.totalRetiros || 0).toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-400 block">Caja fuerte</span>
        </div>

        <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-sm">
          <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Efectivo Esperado</span>
          <span className="text-base font-black text-white mt-1 block">
            ${expectedCash.toFixed(2)}
          </span>
          <span className="text-[9px] text-slate-400 block">En Gaveta</span>
        </div>
      </div>

      {/* ARQUEO CIEGO: CONTEO DE BILLETES Y MONEDAS */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-150 pb-3">
          <div>
            <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
              <DollarSign size={16} className="text-rose-600" />
              Arqueo de Efectivo (Billetes y Monedas)
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Cuenta las cantidades físicas en la gaveta para calcular el cuadre de caja.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Contado</span>
              <span className="text-base font-black text-slate-900">${countedCashSum.toFixed(2)}</span>
            </div>

            {calcs && (
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-black ${
                isExactMatch
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : discrepancy > 0
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}>
                {isExactMatch ? (
                  '✓ CUADRE EXACTO'
                ) : discrepancy > 0 ? (
                  `SOBRANTE: +$${discrepancy.toFixed(2)}`
                ) : (
                  `FALTANTE: -$${Math.abs(discrepancy).toFixed(2)}`
                )}
              </div>
            )}
          </div>
        </div>

        {/* GRID DE DENOMINACIONES */}
        <TreasuryDenominationCounter
          arqueo={arqueo}
          setArqueo={setArqueo}
          adjustDenom={adjustDenom}
        />

        {/* NOTAS Y CIERRE DEFINITIVO */}
        <div className="pt-3 border-t border-slate-150 space-y-3">
          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
              Observaciones / Justificativo de Arqueo (Opcional)
            </label>
            <input
              type="text"
              value={auditNotes}
              onChange={(e) => setAuditNotes(e.target.value)}
              placeholder="Ej: Se entregó $50 de fondo al siguiente turno, cuadre exacto sin novedades."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCierreConfirmed}
                onChange={(e) => setIsCierreConfirmed(e.target.checked)}
                className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
              />
              <span className="text-xs font-bold text-slate-700">
                He verificado el conteo de efectivo y confirmo el cierre de turno.
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={!isCierreConfirmed}
                onClick={() => onCloseSession(false)}
                className="px-4 py-2.5 rounded-xl font-black text-xs bg-slate-800 hover:bg-slate-900 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer"
              >
                Cerrar Turno
              </button>

              <button
                type="button"
                disabled={!isCierreConfirmed}
                onClick={() => onCloseSession(true)}
                className="px-4 py-2.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Cerrar e Imprimir Ticket</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
