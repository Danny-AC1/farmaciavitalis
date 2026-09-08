import React from 'react';
import { Coins, Trash2 } from 'lucide-react';
import { TreasuryTransaction } from '../../../types';

interface TreasuryTransactionsTabProps {
  txType: 'EGRESO' | 'INGRESO_EXTRA' | 'RETIRO_PARCIAL';
  setTxType: (val: 'EGRESO' | 'INGRESO_EXTRA' | 'RETIRO_PARCIAL') => void;
  txCategory: 'SUMINISTROS' | 'SERVICIOS' | 'REPARTO' | 'COMPRAS' | 'OTROS';
  setTxCategory: (val: 'SUMINISTROS' | 'SERVICIOS' | 'REPARTO' | 'COMPRAS' | 'OTROS') => void;
  txAmountStr: string;
  setTxAmountStr: (val: string) => void;
  txConcept: string;
  setTxConcept: (val: string) => void;
  txBeneficiary: string;
  setTxBeneficiary: (val: string) => void;
  transactions: TreasuryTransaction[];
  totalEgresos: number;
  onAddTransaction: (e: React.FormEvent) => void;
  onDeleteTransaction: (id: string) => void;
}

export const TreasuryTransactionsTab: React.FC<TreasuryTransactionsTabProps> = ({
  txType,
  setTxType,
  txCategory,
  setTxCategory,
  txAmountStr,
  setTxAmountStr,
  txConcept,
  setTxConcept,
  txBeneficiary,
  setTxBeneficiary,
  transactions,
  totalEgresos,
  onAddTransaction,
  onDeleteTransaction
}) => {
  return (
    <div className="space-y-4">
      {/* FORMULARIO DE NUEVO EGRESO */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Coins size={16} className="text-rose-600" />
          Registrar Movimiento de Caja Chica
        </h4>

        <form onSubmit={onAddTransaction} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Tipo de Movimiento
              </label>
              <select
                value={txType}
                onChange={(e) => setTxType(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
              >
                <option value="EGRESO">Egreso / Gasto Menor (-)</option>
                <option value="INGRESO_EXTRA">Ingreso Extra (+)</option>
                <option value="RETIRO_PARCIAL">Retiro / Envío a Caja Fuerte (-)</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Categoría
              </label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value as any)}
                disabled={txType !== 'EGRESO'}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-50"
              >
                <option value="SUMINISTROS">Suministros (Fundas, Limpieza, etc.)</option>
                <option value="SERVICIOS">Servicios Básicos / Internet / Agua</option>
                <option value="REPARTO">Flete / Reparto a Domicilio</option>
                <option value="COMPRAS">Compras Urgentes de Medicamentos</option>
                <option value="OTROS">Otros Gastos</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Monto ($) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={txAmountStr}
                  onChange={(e) => setTxAmountStr(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Concepto / Motivo *
              </label>
              <input
                type="text"
                required
                value={txConcept}
                onChange={(e) => setTxConcept(e.target.value)}
                placeholder="Ej: Pago de fundas plásticas para mostrador"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                Beneficiario / Proveedor
              </label>
              <input
                type="text"
                value={txBeneficiary}
                onChange={(e) => setTxBeneficiary(e.target.value)}
                placeholder="Ej: Comercial Don Pepe / Mensajero"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>
          </div>

          {/* Atajos de conceptos comunes */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[9px] font-bold text-slate-400 uppercase">Atajos:</span>
            {['Fundas / Bolsas', 'Agua de botellón', 'Pago Delivery', 'Artículos de limpieza', 'Pago flete medicina'].map(shortcut => (
              <button
                key={shortcut}
                type="button"
                onClick={() => {
                  setTxConcept(shortcut);
                  setTxType('EGRESO');
                }}
                className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-[9px] font-bold text-slate-600 transition cursor-pointer"
              >
                {shortcut}
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm cursor-pointer"
            >
              Registrar Movimiento
            </button>
          </div>
        </form>
      </div>

      {/* LISTADO DE MOVIMIENTOS DEL TURNO */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center">
          <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
            Movimientos de la Sesión Actual ({transactions.length})
          </span>
          <span className="text-xs font-black text-rose-600">
            Total Egresos: -${totalEgresos.toFixed(2)}
          </span>
        </div>

        <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
          {transactions.map(tx => (
            <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                    tx.type === 'EGRESO' ? 'bg-rose-100 text-rose-700' :
                    tx.type === 'INGRESO_EXTRA' ? 'bg-emerald-100 text-emerald-700' :
                    'bg-purple-100 text-purple-700'
                  }`}>
                    {tx.type} {tx.category ? `(${tx.category})` : ''}
                  </span>
                  <span className="font-bold text-slate-900">{tx.concept}</span>
                </div>
                <div className="text-[10px] text-slate-400 flex items-center gap-2">
                  <span>{new Date(tx.date).toLocaleTimeString()}</span>
                  {tx.beneficiary && <span>• Para: {tx.beneficiary}</span>}
                  <span>• Por: {tx.performedBy}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className={`font-black ${
                  tx.type === 'EGRESO' ? 'text-rose-600' :
                  tx.type === 'INGRESO_EXTRA' ? 'text-emerald-600' :
                  'text-purple-600'
                }`}>
                  {tx.type === 'INGRESO_EXTRA' ? '+' : '-'}${tx.amount.toFixed(2)}
                </span>
                
                <button
                  onClick={() => onDeleteTransaction(tx.id)}
                  className="p-1 text-slate-300 hover:text-rose-600 rounded transition cursor-pointer"
                  title="Eliminar movimiento"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}

          {transactions.length === 0 && (
            <div className="p-6 text-center text-xs text-slate-400 italic">
              No se han registrado egresos o movimientos adicionales en este turno.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
