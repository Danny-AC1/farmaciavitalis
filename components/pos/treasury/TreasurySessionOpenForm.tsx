import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import { User } from '../../../types';

interface TreasurySessionOpenFormProps {
  cashierName: string;
  setCashierName: (val: string) => void;
  initialCashStr: string;
  setInitialCashStr: (val: string) => void;
  users?: User[];
  onSubmit: (e: React.FormEvent) => void;
}

export const TreasurySessionOpenForm: React.FC<TreasurySessionOpenFormProps> = ({
  cashierName,
  setCashierName,
  initialCashStr,
  setInitialCashStr,
  users = [],
  onSubmit
}) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-5 text-center">
      <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
        <Lock size={28} />
      </div>
      <div>
        <h4 className="text-base font-black text-slate-800">Apertura de Turno en POS</h4>
        <p className="text-xs text-slate-500 mt-1">
          Inicia el turno de caja indicando el fondo inicial para cambio. Todas las ventas en efectivo se acumularán automáticamente.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 text-left">
        <div>
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
            Cajero(a) Responsable *
          </label>
          <input
            type="text"
            required
            value={cashierName}
            onChange={(e) => setCashierName(e.target.value)}
            placeholder="Nombre del responsable"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition"
          />
          {users.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <span className="text-[9px] text-slate-400 font-bold self-center">Personal:</span>
              {users.filter(u => u.displayName).slice(0, 4).map(u => (
                <button
                  key={u.uid}
                  type="button"
                  onClick={() => setCashierName(u.displayName || '')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-bold text-slate-700 transition"
                >
                  {u.displayName}
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
            Fondo de Apertura (Efectivo en Caja) *
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
            <input
              type="number"
              step="0.01"
              required
              value={initialCashStr}
              onChange={(e) => setInitialCashStr(e.target.value)}
              placeholder="50.00"
              className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition"
            />
          </div>

          <div className="flex gap-2 mt-2">
            {['20.00', '30.00', '50.00', '100.00'].map(val => (
              <button
                key={val}
                type="button"
                onClick={() => setInitialCashStr(val)}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
              >
                ${val}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
        >
          <Unlock size={14} className="text-emerald-400" />
          <span>Abrir Turno de Caja</span>
        </button>
      </form>
    </div>
  );
};
