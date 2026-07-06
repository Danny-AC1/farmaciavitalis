import React from 'react';
import { CreditTicket } from '../../types';

interface CreditPaymentModalProps {
  selectedPaymentCredit: CreditTicket;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  paymentMethod: 'CASH' | 'TRANSFER';
  setPaymentMethod: (method: 'CASH' | 'TRANSFER') => void;
  cashGiven: string;
  setCashGiven: (cash: string) => void;
  paymentType: 'FULL' | 'PARTIAL';
  setPaymentType: (type: 'FULL' | 'PARTIAL') => void;
  partialPaymentAmount: string;
  setPartialPaymentAmount: (amount: string) => void;
  paymentNote: string;
  setPaymentNote: (note: string) => void;
}

export const CreditPaymentModal: React.FC<CreditPaymentModalProps> = ({
  selectedPaymentCredit,
  onClose,
  onSubmit,
  paymentMethod,
  setPaymentMethod,
  cashGiven,
  setCashGiven,
  paymentType,
  setPaymentType,
  partialPaymentAmount,
  setPartialPaymentAmount,
  paymentNote,
  setPaymentNote,
}) => {
  const currentPaid = selectedPaymentCredit.paidAmount || 0;
  const remaining = selectedPaymentCredit.total - currentPaid;
  const amountToPay = paymentType === 'FULL' ? remaining : (parseFloat(partialPaymentAmount) || 0);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 relative">
          <button 
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 text-white/80 hover:text-white font-extrabold text-sm"
          >
            ✕
          </button>
          <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
            Control de Crédito
          </span>
          <h4 className="text-lg font-black tracking-tight mt-2">Registrar Pago / Abono</h4>
          <p className="text-[11px] text-teal-100 font-medium">Registra un pago parcial (abono) o cancela el saldo total de la cuenta del deudor.</p>
        </div>

        {/* Formulario */}
        <form onSubmit={onSubmit} className="p-6 space-y-4">
          
          {/* Información del Cliente */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Cliente Deudor</span>
            <span className="text-sm font-black text-slate-800 block">{selectedPaymentCredit.customerName}</span>
            {selectedPaymentCredit.customerPhone && (
              <span className="text-[11px] text-slate-500 font-semibold block">Tlf: {selectedPaymentCredit.customerPhone}</span>
            )}
            
            <div className="pt-2 border-t border-slate-200/50 mt-2 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-slate-600">
                <span>Total de la Deuda:</span>
                <span className="font-mono">${selectedPaymentCredit.total.toFixed(2)}</span>
              </div>
              {currentPaid > 0 && (
                <div className="flex justify-between font-bold text-teal-600">
                  <span>Total Abonado previo:</span>
                  <span className="font-mono">${currentPaid.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-rose-600 pt-1 border-t border-dashed border-slate-200">
                <span>Saldo Pendiente actual:</span>
                <span className="font-mono text-sm">${remaining.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Tipo de Registro (Total vs Parcial) */}
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Tipo de Pago</label>
            <div className="flex bg-slate-100 p-1 rounded-xl h-[40px] items-center">
              <button
                type="button"
                onClick={() => setPaymentType('FULL')}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all h-full ${
                  paymentType === 'FULL'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Liquidación Total
              </button>
              <button
                type="button"
                onClick={() => setPaymentType('PARTIAL')}
                className={`flex-1 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all h-full ${
                  paymentType === 'PARTIAL'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Abono Parcial
              </button>
            </div>
          </div>

          {/* Monto de Pago Custom si es abono parcial */}
          {paymentType === 'PARTIAL' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Monto a Abonar *</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={partialPaymentAmount}
                  onChange={(e) => setPartialPaymentAmount(e.target.value)}
                  placeholder="Ingresar monto del abono"
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition-colors"
                />
              </div>
            </div>
          )}

          {/* Nota / Concepto */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nota / Concepto (Opcional)</label>
            <input
              type="text"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              placeholder={paymentType === 'FULL' ? 'Ej: Cancela saldo pendiente' : 'Ej: Pago quincenal, abona la mitad...'}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:bg-white transition-colors"
            />
          </div>

          {/* Selección de Método de Pago */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Método de Pago</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'CASH'
                    ? 'border-teal-500 bg-teal-50/50 text-teal-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-base">💵</span>
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1 transition-all ${
                  paymentMethod === 'TRANSFER'
                    ? 'border-teal-500 bg-teal-50/50 text-teal-700'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <span className="text-base">🏦</span>
                Transferencia
              </button>
            </div>
          </div>

          {/* Detalle si es efectivo */}
          {paymentMethod === 'CASH' && (
            <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Monto Recibido</label>
                <span className="text-[9px] font-bold text-slate-400">Total a Cobrar: ${amountToPay.toFixed(2)}</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:bg-white transition-colors"
                />
              </div>

              {cashGiven && !isNaN(parseFloat(cashGiven)) && (
                <div className="flex justify-between items-center text-xs font-bold pt-1">
                  <span className="text-slate-500">Cambio a entregar:</span>
                  <span className={`font-mono ${parseFloat(cashGiven) - amountToPay >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>
                    ${(parseFloat(cashGiven) - amountToPay).toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Botón de Enviar Pago */}
          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-extrabold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-teal-600/10 transition-colors"
            >
              {paymentType === 'FULL' ? 'Confirmar Liquidación' : 'Confirmar Abono'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
