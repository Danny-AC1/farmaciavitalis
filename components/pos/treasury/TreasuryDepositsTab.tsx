import React from 'react';
import { Building2, Trash2 } from 'lucide-react';
import { TreasuryDeposit } from '../../../types';

interface TreasuryDepositsTabProps {
  depBankName: string;
  setDepBankName: (val: string) => void;
  depReference: string;
  setDepReference: (val: string) => void;
  depAmountStr: string;
  setDepAmountStr: (val: string) => void;
  depNotes: string;
  setDepNotes: (val: string) => void;
  deposits: TreasuryDeposit[];
  onAddDeposit: (e: React.FormEvent) => void;
  onToggleStatus: (dep: TreasuryDeposit) => void;
  onDeleteDeposit: (id: string) => void;
}

export const TreasuryDepositsTab: React.FC<TreasuryDepositsTabProps> = ({
  depBankName,
  setDepBankName,
  depReference,
  setDepReference,
  depAmountStr,
  setDepAmountStr,
  depNotes,
  setDepNotes,
  deposits,
  onAddDeposit,
  onToggleStatus,
  onDeleteDeposit
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Building2 size={16} className="text-blue-600" />
          Registrar Depósito Bancario / Conciliación
        </h4>

        <form onSubmit={onAddDeposit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Banco Destino *
              </label>
              <select
                value={depBankName}
                onChange={(e) => setDepBankName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="Banco Pichincha">Banco Pichincha</option>
                <option value="Banco Guayaquil">Banco Guayaquil</option>
                <option value="Banco Bolivariano">Banco Bolivariano</option>
                <option value="Banco del Pacífico">Banco del Pacífico</option>
                <option value="Produbanco">Produbanco</option>
                <option value="Cooperativa JEP">Cooperativa JEP</option>
                <option value="Otros">Otros</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Nº Comprobante / Papeleta *
              </label>
              <input
                type="text"
                required
                value={depReference}
                onChange={(e) => setDepReference(e.target.value)}
                placeholder="Ej: DEP-891048"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Monto Depositado ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={depAmountStr}
                  onChange={(e) => setDepAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
              Notas / Detalle
            </label>
            <input
              type="text"
              value={depNotes}
              onChange={(e) => setDepNotes(e.target.value)}
              placeholder="Ej: Depósito de ventas de la mañana en ventanilla"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              Registrar Depósito
            </button>
          </div>
        </form>
      </div>

      {/* LISTADO DE DEPÓSITOS */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider">
          Depósitos Registrados ({deposits.length})
        </div>

        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {deposits.map(dep => (
            <div key={dep.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{dep.bankName}</span>
                  <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">
                    Ref: {dep.referenceNumber}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                    dep.status === 'CONCILIADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {dep.status}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {new Date(dep.date).toLocaleString()} {dep.notes ? `• ${dep.notes}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-black text-blue-600">${dep.amount.toFixed(2)}</span>
                <button
                  onClick={() => onToggleStatus(dep)}
                  className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 transition cursor-pointer"
                >
                  {dep.status === 'CONCILIADO' ? 'Revertir' : 'Conciliar'}
                </button>
                <button
                  onClick={() => onDeleteDeposit(dep.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Eliminar depósito"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {deposits.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 italic">
              No hay depósitos bancarios registrados aún.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
