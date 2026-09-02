import React, { useState } from 'react';
import { 
  X, 
  CreditCard, 
  Banknote, 
  Landmark, 
  Check, 
  Loader2 
} from 'lucide-react';
import { CreditTicket, Order } from '../../types';
import { updateCreditDB } from '../../services/db.credits';
import { addOrderDB } from '../../services/db.orders';
import { createCreditPaymentOrder } from '../../utils/creditPaymentOrders';

interface POSCreditQuickPaymentModalProps {
  credit: CreditTicket | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (createdOrder?: Order) => void;
}

export const POSCreditQuickPaymentModal: React.FC<POSCreditQuickPaymentModalProps> = ({
  credit,
  isOpen,
  onClose,
  onPaymentSuccess,
}) => {
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialAmount, setPartialAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [cashGiven, setCashGiven] = useState('');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !credit) return null;

  const currentPaid = credit.paidAmount || 0;
  const remaining = Math.max(0, credit.total - currentPaid);
  const amountToPay = paymentType === 'FULL' ? remaining : (parseFloat(partialAmount) || 0);
  const changeDue = paymentMethod === 'CASH' && cashGiven ? (parseFloat(cashGiven) || 0) - amountToPay : 0;

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (amountToPay <= 0) {
      alert('El monto a abonar debe ser mayor a 0');
      return;
    }

    if (amountToPay > remaining) {
      alert(`El monto no puede superar el saldo pendiente ($${remaining.toFixed(2)})`);
      return;
    }

    setIsProcessing(true);

    try {
      const newPaidAmount = currentPaid + amountToPay;
      const isFullyPaid = newPaidAmount >= credit.total - 0.001;

      const newPaymentRecord = {
        id: `PAY-${Date.now()}`,
        date: new Date().toISOString(),
        amount: amountToPay,
        paymentMethod: paymentMethod,
        note: note.trim() || (isFullyPaid ? 'Cancelación total en caja POS' : 'Abono parcial en caja POS')
      };

      const updatedCredit: CreditTicket = {
        ...credit,
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'PAGADO' : 'PENDIENTE',
        payments: [...(credit.payments || []), newPaymentRecord]
      };

      // 1. Crear y registrar la orden de ingreso contable para caja y pedidos
      const orderData = createCreditPaymentOrder(
        credit,
        amountToPay,
        paymentMethod,
        paymentMethod === 'CASH' && cashGiven ? parseFloat(cashGiven) : undefined,
        note.trim()
      );

      await addOrderDB(orderData);

      // 2. Actualizar cuenta del crédito
      await updateCreditDB(updatedCredit);

      alert(`✅ Abono de $${amountToPay.toFixed(2)} registrado exitosamente.\n\n• Sumado a Caja del día (${paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'})\n• Registrado en Pedidos ("Abonos de Fiados")\n${isFullyPaid ? '• ¡Cuenta totalmente saldada!' : `• Saldo restante: $${(credit.total - newPaidAmount).toFixed(2)}`}`);
      
      onPaymentSuccess(orderData);
      onClose();
    } catch (err: any) {
      console.error('Error al registrar abono:', err);
      alert('Error al registrar abono');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <CreditCard size={20} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                Caja POS • Cobro de Deuda
              </span>
              <h4 className="text-base font-black tracking-tight mt-0.5">
                Registrar Abono / Cancelación
              </h4>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmitPayment} className="p-5 space-y-4">
          
          {/* Tarjeta de Resumen de Deuda */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[9px] font-black uppercase text-slate-400 block">Cliente Deudor</span>
                <span className="text-sm font-black text-slate-900">{credit.customerName}</span>
              </div>
              {credit.customerPhone && (
                <span className="text-[11px] font-bold text-slate-500">{credit.customerPhone}</span>
              )}
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-bold text-slate-400 block">Deuda Total</span>
                <span className="font-mono text-xs font-bold text-slate-600">${credit.total.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-[9px] font-bold text-teal-600 block text-center">Abonado Previo</span>
                <span className="font-mono text-xs font-bold text-teal-700 block text-center">${currentPaid.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-[9px] font-black text-rose-600 block">Saldo Pendiente</span>
                <span className="font-mono text-base font-black text-rose-600">${remaining.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Selector Tipo de Pago */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Monto a Cobrar
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentType('FULL')}
                className={`py-2 rounded-xl text-xs font-black transition border ${
                  paymentType === 'FULL'
                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Pagar Todo (${remaining.toFixed(2)})
              </button>

              <button
                type="button"
                onClick={() => setPaymentType('PARTIAL')}
                className={`py-2 rounded-xl text-xs font-black transition border ${
                  paymentType === 'PARTIAL'
                    ? 'bg-teal-600 border-teal-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Abono Parcial ($)
              </button>
            </div>
          </div>

          {paymentType === 'PARTIAL' && (
            <div className="space-y-1 animate-in fade-in">
              <label className="text-[9px] font-black uppercase text-slate-400 block">
                Valor del Abono ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                max={remaining}
                placeholder="0.00"
                value={partialAmount}
                onChange={e => setPartialAmount(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-teal-700 focus:outline-none focus:border-teal-500"
              />
            </div>
          )}

          {/* Método de Pago */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Método de Cobro
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod('CASH')}
                className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition border ${
                  paymentMethod === 'CASH'
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Banknote size={15} /> Efectivo
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('TRANSFER')}
                className={`py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 transition border ${
                  paymentMethod === 'TRANSFER'
                    ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Landmark size={15} /> Transferencia
              </button>
            </div>
          </div>

          {/* Efectivo Recibido y Cambio */}
          {paymentMethod === 'CASH' && (
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 animate-in fade-in">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Recibe ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={cashGiven}
                  onChange={e => setCashGiven(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Cambio / Vuelto</label>
                <div className={`px-2.5 py-1.5 rounded-lg text-xs font-black text-center font-mono ${
                  changeDue >= 0 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-600'
                }`}>
                  ${changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}
                </div>
              </div>
            </div>
          )}

          {/* Nota opcional */}
          <div>
            <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Nota o Comentario (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Pago realizado por familiar..."
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-2.5 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing || amountToPay <= 0}
              className="flex-[2] py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-teal-600/20 transition flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <Check size={15} />
                  <span>Cobrar ${amountToPay.toFixed(2)}</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default POSCreditQuickPaymentModal;
