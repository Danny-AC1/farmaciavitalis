import React, { useState } from 'react';
import { 
  X, 
  PlusCircle, 
  Coins, 
  Printer, 
  Phone, 
  Banknote, 
  Landmark, 
  Loader2,
  ShoppingBag
} from 'lucide-react';
import { CreditTicket, CartItem, Product } from '../../types';
import { 
  calculateCartAdditionTotal, 
  executeAddDebtToCredit, 
  printCreditAdditionVoucher 
} from '../../utils/posAddDebtHelper';

interface POSAddDebtModalProps {
  isOpen: boolean;
  credit: CreditTicket | null;
  posCart: CartItem[];
  products: Product[];
  onClose: () => void;
  onSuccess: () => void;
}

export const POSAddDebtModal: React.FC<POSAddDebtModalProps> = ({
  isOpen,
  credit,
  posCart,
  products,
  onClose,
  onSuccess
}) => {
  const [hasImmediateAbono, setHasImmediateAbono] = useState(false);
  const [abonoAmount, setAbonoAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [cashGiven, setCashGiven] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [autoPrint, setAutoPrint] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !credit) return null;

  const additionTotal = calculateCartAdditionTotal(posCart);
  const currentPaid = credit.paidAmount || 0;
  const currentPending = Math.max(0, credit.total - currentPaid);
  
  const parsedAbono = hasImmediateAbono ? (parseFloat(abonoAmount) || 0) : 0;
  const newPending = Math.max(0, currentPending + additionTotal - parsedAbono);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (posCart.length === 0) {
      alert('El carrito del POS está vacío. Agrega medicamentos primero para sumarlos a la deuda.');
      return;
    }

    if (hasImmediateAbono && parsedAbono > (currentPending + additionTotal)) {
      alert('El abono no puede superar la deuda total acumulada.');
      return;
    }

    setIsProcessing(true);

    try {
      const result = await executeAddDebtToCredit({
        credit,
        cartItems: posCart,
        products,
        customNote: customNote.trim() || undefined,
        initialAbono: parsedAbono,
        initialPaymentMethod: paymentMethod,
        cashGiven: paymentMethod === 'CASH' && cashGiven ? parseFloat(cashGiven) : undefined
      });

      if (autoPrint) {
        try {
          printCreditAdditionVoucher(
            credit,
            posCart,
            additionTotal,
            currentPending,
            result.newPending,
            parsedAbono
          );
        } catch (printErr) {
          console.warn('Error al imprimir comprobante de suma a deuda:', printErr);
        }
      }

      alert(
        `✅ ¡Productos sumados exitosamente a la cuenta de ${credit.customerName}!\n\n` +
        `• Saldo anterior: $${currentPending.toFixed(2)}\n` +
        `• Valor sumado (+): $${additionTotal.toFixed(2)}\n` +
        (parsedAbono > 0 ? `• Abono recibido (-): $${parsedAbono.toFixed(2)}\n` : '') +
        `• NUEVO SALDO PENDIENTE: $${result.newPending.toFixed(2)}\n\n` +
        `El inventario de la farmacia ha sido descontado correctamente.`
      );

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al sumar productos a la deuda:', err);
      alert(`Error al procesar la suma a la deuda: ${err.message || 'Error inesperado'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[160] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      <div 
        className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh]"
        id="pos-add-debt-modal"
      >
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/25 border border-indigo-400/30 flex items-center justify-center text-indigo-400">
              <PlusCircle size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  Punto de Venta POS
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] px-2 py-0.2 rounded-full font-black">
                  Cuenta #{credit.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight text-white">
                Sumar Productos a Deuda Existente
              </h3>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition disabled:opacity-50 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario con Scroll */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-y-auto">
          
          <div className="p-5 space-y-4">
            
            {/* Ficha del Cliente y Deuda Actual */}
            <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3.5 flex items-start justify-between gap-3">
              <div>
                <span className="text-[9px] font-black text-indigo-800 uppercase tracking-wider block">
                  Cliente Deudor
                </span>
                <h4 className="text-base font-black text-slate-900 uppercase">
                  {credit.customerName}
                </h4>
                {credit.customerPhone && (
                  <p className="text-xs text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
                    <Phone size={11} /> {credit.customerPhone}
                  </p>
                )}
              </div>

              <div className="text-right">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                  Saldo Actual
                </span>
                <p className="text-lg font-black text-rose-600 font-mono leading-none">
                  ${currentPending.toFixed(2)}
                </p>
                <span className="text-[9px] text-slate-400 font-medium mt-0.5 block">
                  Ticket #{credit.id.slice(-6).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Medicamentos del Carrito que se van a Sumar */}
            <div className="border border-slate-200 rounded-2xl p-3.5 bg-slate-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <ShoppingBag size={12} className="text-indigo-600" />
                  Medicamentos del Carrito a Cargar ({posCart.length})
                </span>
                <span className="text-xs font-black text-indigo-700 font-mono">
                  +${additionTotal.toFixed(2)}
                </span>
              </div>

              <div className="max-h-32 overflow-y-auto space-y-1.5 divide-y divide-slate-150 pr-1">
                {posCart.map((item, idx) => {
                  const isBox = item.selectedUnit === 'BOX';
                  const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                  const itemSubtotal = price * item.quantity;
                  return (
                    <div key={idx} className="flex justify-between items-center pt-1.5 text-xs">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-800 truncate uppercase text-[11px]">
                          {item.name}
                        </p>
                        <p className="text-[9px] text-slate-400">
                          {item.quantity} {isBox ? `Caja(s) x${item.unitsPerBox || 1}` : 'Unidad(es)'} • ${price.toFixed(2)} c/u
                        </p>
                      </div>
                      <span className="font-mono font-bold text-slate-700 shrink-0">
                        ${itemSubtotal.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cálculo Matemático Transparente: Saldo Anterior + Adición = Nuevo Saldo */}
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 shadow-sm">
              <span className="text-[9px] font-black uppercase text-indigo-300 tracking-wider block mb-2">
                Resumen de Actualización de Deuda
              </span>

              <div className="grid grid-cols-3 gap-2 text-center items-center">
                <div className="bg-white/5 border border-white/10 rounded-xl p-2">
                  <span className="text-[8px] font-bold text-slate-400 uppercase block">Saldo Previo</span>
                  <span className="text-sm font-black font-mono text-slate-200">
                    ${currentPending.toFixed(2)}
                  </span>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-2 text-indigo-300">
                  <span className="text-[8px] font-bold uppercase block">+ Adición Carrito</span>
                  <span className="text-sm font-black font-mono">
                    +${additionTotal.toFixed(2)}
                  </span>
                </div>

                <div className="bg-rose-500/20 border border-rose-500/30 rounded-xl p-2 text-rose-300">
                  <span className="text-[8px] font-black uppercase block">Nuevo Saldo</span>
                  <span className="text-base font-black font-mono">
                    ${newPending.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Opción de Abono Inmediato Parcial */}
            <div className="border border-slate-200 rounded-2xl p-3.5 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-2">
                  <Coins size={16} className="text-teal-600" />
                  <span className="text-xs font-bold text-slate-800">
                    ¿El cliente entrega algún abono en efectivo o transferencia ahora?
                  </span>
                </div>
                <input 
                  type="checkbox"
                  checked={hasImmediateAbono}
                  onChange={(e) => {
                    setHasImmediateAbono(e.target.checked);
                    if (!e.target.checked) {
                      setAbonoAmount('');
                      setCashGiven('');
                    }
                  }}
                  className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                />
              </label>

              {hasImmediateAbono && (
                <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                        Monto del Abono ($)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={currentPending + additionTotal}
                        value={abonoAmount}
                        onChange={(e) => setAbonoAmount(e.target.value)}
                        placeholder="Ej: 5.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
                        required={hasImmediateAbono}
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                        Método
                      </label>
                      <div className="grid grid-cols-2 gap-1 bg-slate-100 p-0.5 rounded-xl">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('CASH')}
                          className={`py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                            paymentMethod === 'CASH' 
                              ? 'bg-white text-slate-900 shadow-xs' 
                              : 'text-slate-500'
                          }`}
                        >
                          <Banknote size={11} /> Efectivo
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('TRANSFER')}
                          className={`py-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1 transition ${
                            paymentMethod === 'TRANSFER' 
                              ? 'bg-white text-slate-900 shadow-xs' 
                              : 'text-slate-500'
                          }`}
                        >
                          <Landmark size={11} /> Transf.
                        </button>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === 'CASH' && parsedAbono > 0 && (
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                        Efectivo Recibido (para calcular cambio)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={cashGiven}
                        onChange={(e) => setCashGiven(e.target.value)}
                        placeholder="Ej: 10.00"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none focus:border-teal-500 font-mono"
                      />
                      {parseFloat(cashGiven) > parsedAbono && (
                        <p className="text-[10px] font-bold text-teal-600 mt-1">
                          Cambio a devolver: ${(parseFloat(cashGiven) - parsedAbono).toFixed(2)}
                        </p>
                      )}
                    </div>
                  )}

                  <p className="text-[9px] text-teal-700 bg-teal-50 p-2 rounded-xl border border-teal-100 font-medium">
                    ✓ Este abono se sumará automáticamente al Corte de Caja del día y aparecerá en el historial de Pedidos.
                  </p>
                </div>
              )}
            </div>

            {/* Nota o Motivo Opcional */}
            <div>
              <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">
                Nota o Detalle Opcional de la Entrega
              </label>
              <input 
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Ej: Autorizado por Dr. / Receta de control..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Checkbox Imprimir Vale */}
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input 
                type="checkbox"
                checked={autoPrint}
                onChange={(e) => setAutoPrint(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
              />
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Printer size={13} className="text-indigo-600" />
                Imprimir anexo / vale térmico de entrega adicional
              </span>
            </label>

          </div>

          {/* Botones de Acción */}
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition cursor-pointer"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isProcessing || posCart.length === 0}
              className="flex-2 py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <PlusCircle size={16} />
                  <span>Confirmar y Sumar a Deuda</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default POSAddDebtModal;
