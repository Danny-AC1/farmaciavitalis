import React from 'react';
import { History } from 'lucide-react';
import { TreasurySession } from '../../../types';

interface TreasuryHistoryTabProps {
  sessions: TreasurySession[];
  historicStats: {
    closedCount: number;
    totalDiscrepancies: number;
    totalInitialFunds: number;
    totalCountedCash: number;
  };
  handleDeleteSession: (id: string) => void;
}

export const TreasuryHistoryTab: React.FC<TreasuryHistoryTabProps> = ({
  sessions,
  historicStats,
  handleDeleteSession,
}) => {
  const closedSessions = sessions.filter(s => s.status === 'CLOSED');

  return (
    <div className="space-y-4 w-full">
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div>
          <h4 className="font-extrabold text-slate-800 text-sm">Resumen de Turnos y Auditoría de Discrepancias</h4>
          <p className="text-xs text-slate-400 mt-0.5">Reportes consolidados de arqueos ciegos anteriores y cuadres de caja.</p>
        </div>

        {/* Estadísticas históricas de cuadre */}
        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-150">
          <div className="text-center shrink-0 pr-4 border-r border-slate-200">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Turnos Cerrados</span>
            <span className="text-sm font-black text-slate-800">{historicStats.closedCount}</span>
          </div>
          <div className="text-center">
            <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Balance de Faltantes/Sobrantes</span>
            <span className={`text-sm font-black font-mono ${
              historicStats.totalDiscrepancies >= 0 ? 'text-emerald-600' : 'text-rose-500'
            }`}>
              {historicStats.totalDiscrepancies >= 0 ? '+' : '-'}${Math.abs(historicStats.totalDiscrepancies).toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Listado de turnos */}
      {closedSessions.length === 0 ? (
        <div className="bg-white py-12 rounded-[2.5rem] border border-slate-100 text-center">
          <History size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-xs text-slate-500 font-bold">No se registran turnos de arqueo cerrados en el historial.</p>
          <p className="text-[10px] text-slate-400 mt-1">Los arqueos aparecerán aquí una vez cierres una sesión activa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {closedSessions.map((sess) => {
            const discVal = sess.discrepancy || 0;
            return (
              <div key={sess.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between hover:border-slate-200 transition-all shadow-sm">
                <div>
                  {/* Cabecera */}
                  <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                    <div className="space-y-0.5">
                      <span className="text-[9px] text-slate-400 font-bold font-mono uppercase block">{sess.id}</span>
                      <span className="text-xs text-slate-800 font-extrabold block">Cajero: {sess.openedBy}</span>
                    </div>
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      discVal === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                      discVal > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-rose-50 text-rose-600 border border-rose-100'
                    }`}>
                      {discVal === 0 ? 'Cuadre Perfecto' : discVal > 0 ? 'Sobrante' : 'Faltante'}
                    </span>
                  </div>

                  {/* Detalles financieros */}
                  <div className="grid grid-cols-2 gap-4 py-4 text-xs font-semibold">
                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Fecha de Turno</span>
                      <span className="text-slate-700 block">
                        {new Date(sess.openedAt).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Cerrado en</span>
                      <span className="text-slate-700 block">
                        {sess.closedAt ? new Date(sess.closedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1.5">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Fondo Inicial</span>
                      <span className="text-slate-800 font-bold block">${sess.initialCash.toFixed(2)}</span>
                    </div>

                    <div className="space-y-1 pt-1.5">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Esperado en Libro</span>
                      <span className="text-slate-800 font-bold block">${(sess.expectedCash || 0).toFixed(2)}</span>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Contado Físico</span>
                      <span className="text-slate-800 font-black font-mono block text-sm">${(sess.actualCash || 0).toFixed(2)}</span>
                    </div>

                    <div className="space-y-1 pt-1.5 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Diferencia / Cuadre</span>
                      <span className={`font-black font-mono block text-sm ${discVal >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {discVal >= 0 ? '+' : '-'}${Math.abs(discVal).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Desglose de denominación o notas */}
                  {sess.blindArqueo && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 mt-2">
                      <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Denominaciones contadas:</span>
                      <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 font-bold font-mono">
                        {sess.blindArqueo.bills100 ? <span>$100({sess.blindArqueo.bills100})</span> : null}
                        {sess.blindArqueo.bills50 ? <span>$50({sess.blindArqueo.bills50})</span> : null}
                        {sess.blindArqueo.bills20 ? <span>$20({sess.blindArqueo.bills20})</span> : null}
                        {sess.blindArqueo.bills10 ? <span>$10({sess.blindArqueo.bills10})</span> : null}
                        {sess.blindArqueo.bills5 ? <span>$5({sess.blindArqueo.bills5})</span> : null}
                        {sess.blindArqueo.bills1 ? <span>$1({sess.blindArqueo.bills1})</span> : null}
                        {sess.blindArqueo.coins050 ? <span>50c({sess.blindArqueo.coins050})</span> : null}
                        {sess.blindArqueo.coins025 ? <span>25c({sess.blindArqueo.coins025})</span> : null}
                        {sess.blindArqueo.coins010 ? <span>10c({sess.blindArqueo.coins010})</span> : null}
                        {sess.blindArqueo.coins005 ? <span>5c({sess.blindArqueo.coins005})</span> : null}
                        {sess.blindArqueo.coins001 ? <span>1c({sess.blindArqueo.coins001})</span> : null}
                      </div>
                    </div>
                  )}

                  {sess.notes && (
                    <div className="mt-3 text-[10.5px] text-slate-500 font-semibold italic border-l-2 border-slate-200 pl-2">
                      Observación: "{sess.notes}"
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auditado</span>
                  <button
                    onClick={() => handleDeleteSession(sess.id)}
                    className="text-[10px] text-slate-400 hover:text-rose-500 font-bold transition-colors"
                  >
                    Eliminar Registro
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default TreasuryHistoryTab;
