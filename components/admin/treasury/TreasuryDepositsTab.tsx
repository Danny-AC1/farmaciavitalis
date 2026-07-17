import React from 'react';
import { 
  Building2, 
  Plus 
} from 'lucide-react';
import { TreasurySession, TreasuryDeposit } from '../../../types';

interface TreasuryDepositsTabProps {
  activeSession: TreasurySession | null;
  deposits: TreasuryDeposit[];
  depBankName: string;
  setDepBankName: (v: string) => void;
  depReference: string;
  setDepReference: (v: string) => void;
  depAmountStr: string;
  setDepAmountStr: (v: string) => void;
  depNotes: string;
  setDepNotes: (v: string) => void;
  handleAddDeposit: (e: React.FormEvent) => void;
  handleToggleDepositReconcile: (dep: TreasuryDeposit) => void;
  handleDeleteDeposit: (id: string) => void;
}

export const TreasuryDepositsTab: React.FC<TreasuryDepositsTabProps> = ({
  activeSession,
  deposits,
  depBankName,
  setDepBankName,
  depReference,
  setDepReference,
  depAmountStr,
  setDepAmountStr,
  depNotes,
  setDepNotes,
  handleAddDeposit,
  handleToggleDepositReconcile,
  handleDeleteDeposit,
}) => {
  if (!activeSession) return null;

  const sessionDeposits = deposits.filter(d => d.sessionId === activeSession.id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Registrar Depósito */}
      <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="border-b border-slate-50 pb-3">
          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Building2 size={16} className="text-sky-600" />
            Declarar Depósito de Turno
          </h4>
          <span className="text-[10px] text-slate-400 block font-medium">Registra depósitos de efectivo a la cuenta bancaria de la farmacia.</span>
        </div>

        <form onSubmit={handleAddDeposit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Entidad Bancaria</label>
            <select
              value={depBankName}
              onChange={(e) => setDepBankName(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="Banco Pichincha">Banco Pichincha</option>
              <option value="Banco Guayaquil">Banco Guayaquil</option>
              <option value="Produbanco">Produbanco</option>
              <option value="Cooperativa JEP">Cooperativa JEP</option>
              <option value="Otros Bancos">Otros Bancos / Cooperativa</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Monto Depositado ($) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={depAmountStr}
                onChange={(e) => setDepAmountStr(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Número de Comprobante / Referencia Bancaria *</label>
            <input
              type="text"
              required
              placeholder="Ej: DEP-1029384"
              value={depReference}
              onChange={(e) => setDepReference(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Notas Adicionales</label>
            <input
              type="text"
              placeholder="Ej: Depósito de efectivo del fondo del lunes..."
              value={depNotes}
              onChange={(e) => setDepNotes(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-sky-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            Declarar Depósito
          </button>
        </form>
      </div>

      {/* Listado de depósitos */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
            <h4 className="font-extrabold text-slate-800 text-sm">Depósitos a Conciliar en Turno</h4>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black">
              {sessionDeposits.length} declaraciones
            </span>
          </div>

          {sessionDeposits.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Building2 size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-bold">No se han declarado depósitos bancarios hoy.</p>
              <p className="text-[10px] text-slate-300 mt-1">Declara transacciones para mantener el control de arqueos de banco.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {sessionDeposits.map((dep) => (
                <div key={dep.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-800">{dep.bankName}</span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                        dep.status === 'CONCILIADO' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {dep.status === 'CONCILIADO' ? 'Conciliado' : 'Pendiente Verificación'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-bold">Ref: {dep.referenceNumber}</span>
                    {dep.notes && (
                      <span className="text-[9.5px] text-slate-400 block italic">Nota: {dep.notes}</span>
                    )}
                    <span className="text-[9.5px] text-slate-400 font-semibold block">Declarado: {new Date(dep.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div className="text-right pl-4 shrink-0 space-y-1.5">
                    <span className="font-mono font-black text-xs text-slate-700 block">${dep.amount.toFixed(2)}</span>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleDepositReconcile(dep)}
                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition-colors ${
                          dep.status === 'CONCILIADO'
                            ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                            : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                        }`}
                      >
                        {dep.status === 'CONCILIADO' ? 'Pendiente' : 'Conciliar'}
                      </button>
                      <button
                        onClick={() => handleDeleteDeposit(dep.id)}
                        className="text-[10px] text-rose-500 hover:underline font-bold"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default TreasuryDepositsTab;
