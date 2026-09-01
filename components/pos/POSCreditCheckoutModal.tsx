import React, { useState } from 'react';
import { 
  X, 
  Coins, 
  User as UserIcon, 
  Phone, 
  MapPin, 
  Printer, 
  Check, 
  Banknote, 
  Landmark, 
  Loader2 
} from 'lucide-react';
import { CartItem, User, Product, CreditTicket } from '../../types';
import { printCreditVoucher } from '../../utils/posCreditHelpers';
import { addCreditDB } from '../../services/db.credits';
import { updateStockDB } from '../../services/db.products';

interface POSCreditCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  posCart: CartItem[];
  products: Product[];
  selectedCustomer: User | null;
  onSuccess: () => void;
}

export const POSCreditCheckoutModal: React.FC<POSCreditCheckoutModalProps> = ({
  isOpen,
  onClose,
  posCart,
  products,
  selectedCustomer,
  onSuccess,
}) => {
  const [customerName, setCustomerName] = useState(selectedCustomer?.displayName || '');
  const [customerPhone, setCustomerPhone] = useState(selectedCustomer?.phone || '');
  const [customerAddress, setCustomerAddress] = useState(selectedCustomer?.cedula || '');
  const [hasInitialPayment, setHasInitialPayment] = useState(false);
  const [initialPaymentAmount, setInitialPaymentAmount] = useState('');
  const [initialPaymentMethod, setInitialPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [creditNote, setCreditNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [autoPrint, setAutoPrint] = useState(true);

  // Sincronizar si cambia el cliente seleccionado
  React.useEffect(() => {
    if (selectedCustomer) {
      setCustomerName(selectedCustomer.displayName || '');
      setCustomerPhone(selectedCustomer.phone || '');
      setCustomerAddress(selectedCustomer.cedula || '');
    }
  }, [selectedCustomer]);

  if (!isOpen) return null;

  const totalValue = posCart.reduce((sum, item) => {
    const isBox = item.selectedUnit === 'BOX';
    const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    return sum + (price * item.quantity);
  }, 0);

  const initialAbono = hasInitialPayment ? (parseFloat(initialPaymentAmount) || 0) : 0;
  const remainingDebt = Math.max(0, totalValue - initialAbono);

  const handleConfirmCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('Por favor ingresa el nombre del cliente o deudor.');
      return;
    }

    if (posCart.length === 0) {
      alert('No hay productos en el carrito para fiar.');
      return;
    }

    if (hasInitialPayment && initialAbono >= totalValue) {
      alert('El abono inicial no puede ser mayor o igual al total. Para venta pagada completa, usa el cobro normal del POS.');
      return;
    }

    setIsProcessing(true);

    try {
      const creditId = `CR-${Date.now()}`;
      
      const newCredit: CreditTicket = {
        id: creditId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        customerAddress: customerAddress.trim() || undefined,
        items: [...posCart],
        subtotal: totalValue,
        total: totalValue,
        date: new Date().toISOString(),
        status: remainingDebt === 0 ? 'PAGADO' : 'PENDIENTE',
        paidAmount: initialAbono,
        payments: initialAbono > 0 ? [
          {
            id: `PAY-${Date.now()}`,
            date: new Date().toISOString(),
            amount: initialAbono,
            paymentMethod: initialPaymentMethod,
            note: creditNote.trim() ? `Abono inicial: ${creditNote}` : 'Abono inicial en despacho'
          }
        ] : []
      };

      // 1. Guardar en Base de Datos de Créditos
      await addCreditDB(newCredit);

      // 2. Descontar Stock de Productos de la Farmacia
      for (const item of posCart) {
        const orig = products.find(p => p.id === item.id);
        if (orig) {
          const isBox = item.selectedUnit === 'BOX';
          const unitsToSubtract = isBox ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
          await updateStockDB(item.id, Math.max(0, orig.stock - unitsToSubtract));
        }
      }

      // 3. Imprimir Vale / Pagaré de Fiado si está activado
      if (autoPrint) {
        try {
          printCreditVoucher(newCredit, initialAbono);
        } catch (printErr) {
          console.warn("Error printing credit voucher:", printErr);
        }
      }

      alert(`✅ Medicamentos despachados a crédito exitosamente.\nTicket #${creditId}\nSaldo pendiente: $${remainingDebt.toFixed(2)}`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error al registrar crédito desde el POS:", err);
      alert(`Error al registrar crédito: ${err.message || 'Error desconocido'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white">
              <Coins size={22} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                Venta a Crédito / Fiado
              </span>
              <h3 className="text-base font-black tracking-tight mt-1">
                Despachar Carrito a Crédito
              </h3>
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

        {/* Contenido Scrolleable */}
        <form onSubmit={handleConfirmCredit} className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* Resumen del Carrito */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Total de Medicamentos ({posCart.length} items):</span>
              <span className="font-mono text-base font-black text-slate-900">${totalValue.toFixed(2)}</span>
            </div>

            <div className="max-h-24 overflow-y-auto space-y-1 text-[11px] text-slate-600">
              {posCart.map((item, idx) => (
                <div key={idx} className="flex justify-between">
                  <span className="truncate pr-2">{item.quantity}x {item.name} ({item.selectedUnit === 'BOX' ? 'Caja' : 'Unid'})</span>
                  <span className="font-mono">${((item.selectedUnit === 'BOX' ? (item.publicBoxPrice || item.boxPrice || 0) : item.price) * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Datos del Cliente Deudor */}
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block">
              Datos del Cliente / Deudor
            </label>

            <div>
              <div className="relative">
                <UserIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  required
                  placeholder="Nombre y Apellido del Cliente *"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="tel"
                  placeholder="Teléfono / WhatsApp"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Cédula / Dirección"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Abono Inicial Opcional */}
          <div className="border border-slate-200 rounded-2xl p-3.5 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">¿Deja algún abono inicial ahora?</span>
                <span className="text-[10px] text-slate-400">Si el cliente paga una parte en efectivo o transferencia</span>
              </div>
              <input 
                type="checkbox"
                checked={hasInitialPayment}
                onChange={e => setHasInitialPayment(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
              />
            </div>

            {hasInitialPayment && (
              <div className="pt-2 border-t border-slate-100 space-y-3 animate-in fade-in duration-200">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Monto del Abono ($)</label>
                    <input 
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={initialPaymentAmount}
                      onChange={e => setInitialPaymentAmount(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-emerald-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 block mb-1">Método de Abono</label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setInitialPaymentMethod('CASH')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition ${
                          initialPaymentMethod === 'CASH' 
                            ? 'bg-emerald-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Banknote size={12} /> Efectivo
                      </button>
                      <button
                        type="button"
                        onClick={() => setInitialPaymentMethod('TRANSFER')}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black flex items-center justify-center gap-1 transition ${
                          initialPaymentMethod === 'TRANSFER' 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <Landmark size={12} /> Transf.
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-200 flex justify-between items-center text-xs">
                  <span className="font-bold text-amber-900">Saldo que queda pendiente:</span>
                  <span className="font-mono font-black text-rose-600 text-sm">${remainingDebt.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Notas */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-1">
              Observaciones / Fecha de compromiso de pago
            </label>
            <input 
              type="text"
              placeholder="Ej: Paga el día viernes 15 / Compromiso de quincena..."
              value={creditNote}
              onChange={e => setCreditNote(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Opción Imprimir Pagaré / Comprobante de Fiado */}
          <div className="flex items-center gap-2 pt-1">
            <input 
              type="checkbox"
              id="autoPrintVoucher"
              checked={autoPrint}
              onChange={e => setAutoPrint(e.target.checked)}
              className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
            />
            <label htmlFor="autoPrintVoucher" className="text-xs font-bold text-slate-700 cursor-pointer flex items-center gap-1">
              <Printer size={13} className="text-slate-400" />
              Imprimir Vale de Entrega / Pagaré para firma del cliente
            </label>
          </div>

          {/* Botones de Envío */}
          <div className="pt-3 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 py-3 text-xs font-black uppercase tracking-wider text-slate-500 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="flex-[2] py-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Procesando...</span>
                </>
              ) : (
                <>
                  <Check size={16} />
                  <span>Confirmar y Despachar Fiado</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
};

export default POSCreditCheckoutModal;
