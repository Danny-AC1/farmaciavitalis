import React from 'react';
import { Printer, Trash2 } from 'lucide-react';
import { TreasurySession } from '../../../types';
import { printTreasuryShiftTicket } from '../../../utils/posTicketPrinter';

interface TreasuryHistoryTabProps {
  sessions: TreasurySession[];
  onDeleteSession: (id: string) => void;
}

export const TreasuryHistoryTab: React.FC<TreasuryHistoryTabProps> = ({
  sessions,
  onDeleteSession
}) => {
  const closedSessions = sessions.filter(s => s.status === 'CLOSED');

  return (
    <div className="space-y-3">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider">
          Historial de Turnos y Arqueos Pasados ({closedSessions.length})
        </div>

        <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
          {closedSessions.map(s => {
            const discrepancy = s.discrepancy || 0;
            return (
              <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-slate-900 text-xs">{s.id}</span>
                    <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                      Responsable: {s.openedBy}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                      Math.abs(discrepancy) < 0.01 
                        ? 'bg-emerald-100 text-emerald-800' 
                        : discrepancy > 0 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {Math.abs(discrepancy) < 0.01 
                        ? 'Cuadre Exacto' 
                        : discrepancy > 0 
                        ? `Sobrante +$${discrepancy.toFixed(2)}` 
                        : `Faltante -$${Math.abs(discrepancy).toFixed(2)}`}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                    <span>Apertura: {new Date(s.openedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    {s.closedAt && <span>Cierre: {new Date(s.closedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>}
                    <span>Fondo: ${s.initialCash.toFixed(2)}</span>
                    {s.notes && <span className="italic text-slate-400">"{s.notes}"</span>}
                  </div>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <div className="text-right">
                    <span className="text-[9px] font-bold text-slate-400 uppercase block">Efectivo Contado</span>
                    <span className="text-xs font-black text-slate-800">${(s.actualCash || 0).toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => printTreasuryShiftTicket(s)}
                    className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
                    title="Reimprimir Comprobante Térmico de Arqueo"
                  >
                    <Printer size={15} />
                  </button>

                  <button
                    onClick={() => onDeleteSession(s.id)}
                    className="p-2 text-slate-300 hover:text-rose-600 rounded-xl transition cursor-pointer"
                    title="Eliminar registro"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}

          {closedSessions.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400 italic">
              No hay historial de turnos cerrados todavía.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
