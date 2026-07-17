import React from 'react';
import { 
  Plus, 
  ArrowDownRight, 
  ArrowUpRight, 
  Banknote, 
  FileText 
} from 'lucide-react';
import { TreasuryTransaction } from '../../../types';

interface TreasuryTransactionsTabProps {
  activeSessionCalculations: {
    transactions: TreasuryTransaction[];
    totalEgresos: number;
    totalRetiros: number;
  } | null;
  txType: 'EGRESO' | 'INGRESO_EXTRA' | 'RETIRO_PARCIAL';
  setTxType: (v: 'EGRESO' | 'INGRESO_EXTRA' | 'RETIRO_PARCIAL') => void;
  txCategory: 'SUMINISTROS' | 'SERVICIOS' | 'REPARTO' | 'COMPRAS' | 'OTROS';
  setTxCategory: (v: 'SUMINISTROS' | 'SERVICIOS' | 'REPARTO' | 'COMPRAS' | 'OTROS') => void;
  txAmountStr: string;
  setTxAmountStr: (v: string) => void;
  txConcept: string;
  setTxConcept: (v: string) => void;
  txBeneficiary: string;
  setTxBeneficiary: (v: string) => void;
  handleAddTransaction: (e: React.FormEvent) => void;
  handleDeleteTransaction: (id: string) => void;
}

export const TreasuryTransactionsTab: React.FC<TreasuryTransactionsTabProps> = ({
  activeSessionCalculations,
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
  handleAddTransaction,
  handleDeleteTransaction,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* Formulario de registro */}
      <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
        <div className="border-b border-slate-50 pb-3">
          <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
            <Plus size={16} className="text-teal-600" />
            Registrar Movimiento de Caja
          </h4>
          <span className="text-[10px] text-slate-400 block font-medium">Asigna salidas o entradas manuales de efectivo de la gaveta.</span>
        </div>

        <form onSubmit={handleAddTransaction} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Tipo de Movimiento</label>
            <div className="grid grid-cols-3 gap-2">
              {(['EGRESO', 'INGRESO_EXTRA', 'RETIRO_PARCIAL'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTxType(type)}
                  className={`py-2 px-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center ${
                    txType === type
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {type === 'EGRESO' ? 'Egreso' : type === 'INGRESO_EXTRA' ? 'Ingreso' : 'Retiro Parcial'}
                </button>
              ))}
            </div>
          </div>

          {txType === 'EGRESO' && (
            <div className="space-y-1 animate-in fade-in duration-150">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Categoría de Egreso</label>
              <select
                value={txCategory}
                onChange={(e) => setTxCategory(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="SUMINISTROS">Suministros de Oficina/Limpieza</option>
                <option value="SERVICIOS">Servicios Básicos / Internet</option>
                <option value="REPARTO">Viáticos de Reparto / Combustible</option>
                <option value="COMPRAS">Compras Rápidas</option>
                <option value="OTROS">Otros Gastos</option>
              </select>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Monto en Efectivo ($) *</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
              <input
                type="number"
                step="0.01"
                required
                placeholder="0.00"
                value={txAmountStr}
                onChange={(e) => setTxAmountStr(e.target.value)}
                className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Concepto / Descripción del Gasto *</label>
            <input
              type="text"
              required
              placeholder="Ej: Pago de almuerzo a motorizado de reparto"
              value={txConcept}
              onChange={(e) => setTxConcept(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Beneficiario / Proveedor (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Juan de la Tiendita"
              value={txBeneficiary}
              onChange={(e) => setTxBeneficiary(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={14} />
            Confirmar Transacción
          </button>
        </form>
      </div>

      {/* Listado de movimientos durante este turno */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
            <h4 className="font-extrabold text-slate-800 text-sm">Movimientos del Turno Vigente</h4>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black">
              {activeSessionCalculations?.transactions.length || 0} registros
            </span>
          </div>

          {activeSessionCalculations?.transactions.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FileText size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-bold">No se han registrado egresos o ingresos en este turno.</p>
              <p className="text-[10px] text-slate-300 mt-1">Usa el formulario de la izquierda para ingresar movimientos.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {activeSessionCalculations?.transactions.map((tx) => (
                <div key={tx.id} className="p-3 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                      tx.type === 'EGRESO' ? 'bg-rose-50 text-rose-600' :
                      tx.type === 'RETIRO_PARCIAL' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {tx.type === 'EGRESO' ? <ArrowDownRight size={16} /> :
                       tx.type === 'RETIRO_PARCIAL' ? <Banknote size={16} /> : <ArrowUpRight size={16} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-800">{tx.concept}</span>
                        <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                          tx.type === 'EGRESO' ? 'bg-rose-50 text-rose-600' :
                          tx.type === 'RETIRO_PARCIAL' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {tx.type === 'EGRESO' ? `EGRESO (${tx.category})` :
                           tx.type === 'RETIRO_PARCIAL' ? 'RETIRO DE CAJA' : 'INGRESO EXTRA'}
                        </span>
                      </div>
                      {tx.beneficiary && (
                        <span className="text-[10px] text-slate-400 block font-medium">Beneficiario: {tx.beneficiary}</span>
                      )}
                      <span className="text-[9.5px] text-slate-400 font-semibold block">Hora: {new Date(tx.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>

                  <div className="text-right space-y-1 pl-4 shrink-0">
                    <span className={`font-mono font-black text-xs block ${
                      tx.type === 'EGRESO' || tx.type === 'RETIRO_PARCIAL' ? 'text-rose-500' : 'text-emerald-600'
                    }`}>
                      {tx.type === 'EGRESO' || tx.type === 'RETIRO_PARCIAL' ? '-' : '+'}${tx.amount.toFixed(2)}
                    </span>
                    <button
                      onClick={() => handleDeleteTransaction(tx.id)}
                      className="text-[9.5px] text-slate-400 hover:text-rose-500 font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {activeSessionCalculations && (
          <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-black text-slate-600 bg-slate-50 p-3.5 rounded-xl">
            <span>Egresos Totales del Turno:</span>
            <span className="font-mono text-rose-500 text-sm">-${(activeSessionCalculations.totalEgresos + activeSessionCalculations.totalRetiros).toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
};
