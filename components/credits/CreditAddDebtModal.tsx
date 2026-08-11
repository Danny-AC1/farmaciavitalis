import React, { useState, useMemo } from 'react';
import { CreditTicket, Product, CartItem, DebtAddition } from '../../types';
import { X, Search, Plus, Trash2, ShoppingBag, PlusCircle, AlertCircle, FileText } from 'lucide-react';

interface CreditAddDebtModalProps {
  credit: CreditTicket;
  products: Product[];
  onClose: () => void;
  onAddDebt: (
    updatedCredit: CreditTicket,
    stockAdjustments: { productId: string; newStock: number }[],
    additionSummary: { amount: number; itemCount: number }
  ) => Promise<void>;
}

export const CreditAddDebtModal: React.FC<CreditAddDebtModalProps> = ({
  credit,
  products,
  onClose,
  onAddDebt,
}) => {
  const [productSearch, setProductSearch] = useState('');
  const [addCart, setAddCart] = useState<CartItem[]>([]);
  const [debtNote, setDebtNote] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const lower = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(lower)) ||
      (p.barcode && p.barcode.includes(lower))
    ).slice(0, 5);
  }, [products, productSearch]);

  const addToAddCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    const unitsNeeded = unitType === 'BOX' ? (product.unitsPerBox || 1) : 1;
    
    const alreadyInAddCart = addCart
      .filter(item => item.id === product.id)
      .reduce((sum, item) => {
        const itemUnits = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
        return sum + (item.quantity * itemUnits);
      }, 0);

    if (alreadyInAddCart + unitsNeeded > product.stock) {
      setErrorMessage(`Stock insuficiente de ${product.name}. Disponible: ${product.stock} uds.`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setAddCart(prev => {
      const exists = prev.find(item => item.id === product.id && item.selectedUnit === unitType);
      if (exists) {
        return prev.map(item => (item.id === product.id && item.selectedUnit === unitType)
          ? { ...item, quantity: item.quantity + 1 }
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
    setProductSearch('');
  };

  const updateCartQty = (productId: string, unitType: 'UNIT' | 'BOX', delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setAddCart(prev => {
      return prev.map(item => {
        if (item.id === productId && item.selectedUnit === unitType) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;

          const unitsNeeded = unitType === 'BOX' ? (product.unitsPerBox || 1) * newQty : newQty;
          if (unitsNeeded > product.stock) {
            setErrorMessage(`Supera el stock disponible (${product.stock} uds.)`);
            setTimeout(() => setErrorMessage(null), 3000);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const removeItem = (productId: string, unitType: 'UNIT' | 'BOX') => {
    setAddCart(prev => prev.filter(i => !(i.id === productId && i.selectedUnit === unitType)));
  };

  const additionTotal = useMemo(() => {
    return addCart.reduce((sum, item) => {
      const isBox = item.selectedUnit === 'BOX';
      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
    }, 0);
  }, [addCart]);

  const currentPaid = credit.paidAmount || 0;
  const previousTotal = credit.total;
  const newTotal = previousTotal + additionTotal;
  const newRemaining = newTotal - currentPaid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (addCart.length === 0) {
      alert("Por favor agregue al menos un medicamento a la nueva deuda.");
      return;
    }

    setIsSubmitting(true);

    try {
      const stockAdjustments: { productId: string; newStock: number }[] = [];
      for (const item of addCart) {
        const orig = products.find(p => p.id === item.id);
        if (orig) {
          const isBox = item.selectedUnit === 'BOX';
          const unitsToSubtract = isBox ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
          stockAdjustments.push({
            productId: item.id,
            newStock: Math.max(0, orig.stock - unitsToSubtract)
          });
        }
      }

      const mergedItems = [...credit.items];
      for (const newItem of addCart) {
        const existingIndex = mergedItems.findIndex(
          i => i.id === newItem.id && i.selectedUnit === newItem.selectedUnit
        );
        if (existingIndex >= 0) {
          mergedItems[existingIndex] = {
            ...mergedItems[existingIndex],
            quantity: mergedItems[existingIndex].quantity + newItem.quantity
          };
        } else {
          mergedItems.push(newItem);
        }
      }

      const newDebtRecord: DebtAddition = {
        id: `ADD-DEBT-${Date.now()}`,
        date: new Date().toISOString(),
        items: addCart,
        subtotal: additionTotal,
        note: debtNote.trim() || undefined
      };

      const updatedCredit: CreditTicket = {
        ...credit,
        items: mergedItems,
        subtotal: credit.subtotal + additionTotal,
        total: newTotal,
        status: 'PENDIENTE',
        additionalDebts: [...(credit.additionalDebts || []), newDebtRecord]
      };

      await onAddDebt(updatedCredit, stockAdjustments, {
        amount: additionTotal,
        itemCount: addCart.length
      });

    } catch (err) {
      console.error(err);
      alert("Ocurrió un error al agregar la nueva deuda.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
              <PlusCircle className="text-indigo-400" size={22} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300">Recargo a Deuda Existente</span>
              <h3 className="text-base font-black tracking-tight">{credit.customerName}</h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={18} />
          </button>
        </div>

        {errorMessage && (
          <div className="bg-rose-50 border-b border-rose-100 text-rose-800 p-3 px-6 flex items-center gap-2 text-xs font-bold">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Deuda Actual</span>
              <span className="font-mono font-black text-slate-800 text-sm">${previousTotal.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Abonado</span>
              <span className="font-mono font-bold text-teal-600 text-sm">${currentPaid.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 font-bold block uppercase">Pendiente Hoy</span>
              <span className="font-mono font-black text-rose-600 text-sm">${(previousTotal - currentPaid).toFixed(2)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <Search size={14} className="text-teal-600" />
              Buscar Medicamentos a Adicionar:
            </label>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Escribe el nombre o principio activo..."
              className="w-full pl-3.5 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />

            {filteredProducts.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden divide-y divide-slate-100 mt-1 max-h-48 overflow-y-auto">
                {filteredProducts.map(p => (
                  <div key={p.id} className="p-3 hover:bg-indigo-50/50 flex items-center justify-between gap-2 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Stock: {p.stock} uds | P.Unit: ${p.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => addToAddCart(p, 'UNIT')}
                        className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                      >
                        <Plus size={10} /> +Unid
                      </button>
                      {p.unitsPerBox && p.unitsPerBox > 1 && (
                        <button
                          type="button"
                          onClick={() => addToAddCart(p, 'BOX')}
                          className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1"
                        >
                          <Plus size={10} /> +Caja (${(p.publicBoxPrice || p.boxPrice || 0).toFixed(2)})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <span className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <ShoppingBag size={14} className="text-indigo-600" />
              Nuevos Medicamentos a Cargar ({addCart.length}):
            </span>

            {addCart.length === 0 ? (
              <div className="bg-slate-50 border border-dashed border-slate-200 p-6 rounded-2xl text-center">
                <p className="text-xs text-slate-400 font-medium">Busca y selecciona los productos que el cliente se está llevando ahora.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {addCart.map((item) => {
                  const isBox = item.selectedUnit === 'BOX';
                  const unitPrice = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                  const lineTotal = unitPrice * item.quantity;

                  return (
                    <div key={`${item.id}-${item.selectedUnit}`} className="bg-white border border-slate-200/80 p-3 rounded-xl flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">
                          {isBox ? `Caja (${item.unitsPerBox} un)` : 'Unidad'} - ${unitPrice.toFixed(2)} c/u
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, item.selectedUnit, -1)}
                            className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-bold text-slate-800">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, item.selectedUnit, 1)}
                            className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                          >
                            +
                          </button>
                        </div>

                        <span className="text-xs font-black font-mono text-indigo-900 w-14 text-right">
                          ${lineTotal.toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => removeItem(item.id, item.selectedUnit)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-xs font-extrabold text-slate-700 flex items-center gap-1.5">
              <FileText size={13} className="text-slate-400" />
              Nota o Detalle Adicional (Opcional):
            </label>
            <input
              type="text"
              value={debtNote}
              onChange={(e) => setDebtNote(e.target.value)}
              placeholder="Ej: Entrega adicional por receta de seguimiento..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="bg-indigo-50/70 border border-indigo-100 p-4 rounded-2xl space-y-2">
            <div className="flex justify-between text-xs text-indigo-950 font-medium">
              <span>Monto Adicional Nuevo:</span>
              <span className="font-mono font-extrabold text-indigo-600">+${additionTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-slate-600 font-medium">
              <span>Deuda Acumulada Previa:</span>
              <span className="font-mono font-bold">${previousTotal.toFixed(2)}</span>
            </div>
            <div className="pt-2 border-t border-indigo-200/80 flex justify-between items-center">
              <span className="text-xs font-black text-indigo-950">NUEVO TOTAL CONSOLIDADO:</span>
              <span className="text-base font-black font-mono text-indigo-900">${newTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-bold text-rose-700 pt-0.5">
              <span>NUEVO SALDO PENDIENTE POR COBRAR:</span>
              <span className="font-mono">${newRemaining.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-extrabold text-xs transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || addCart.length === 0}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:opacity-50 text-white rounded-xl font-extrabold text-xs shadow-md shadow-indigo-600/20 transition flex items-center gap-2"
            >
              <PlusCircle size={16} />
              {isSubmitting ? 'Guardando Recargo...' : 'Sumar a la Deuda'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default CreditAddDebtModal;