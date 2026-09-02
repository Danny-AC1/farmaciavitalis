import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShoppingBag, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Plus, 
  Minus, 
  Trash2, 
  DollarSign
} from 'lucide-react';
import { Product, Order } from '../../../types';

interface ReplenishmentOptimizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  orders: Order[];
  targetBudget?: number;
}

interface SuggestedItem {
  product: Product;
  quantityBoxes: number;
  unitCost: number;
  totalCost: number;
  recentSalesQty: number;
  currentStock: number;
  projectedProfit: number;
}

export const ReplenishmentOptimizerModal: React.FC<ReplenishmentOptimizerModalProps> = ({
  isOpen,
  onClose,
  products,
  orders,
  targetBudget = 120
}) => {
  const [budget, setBudget] = useState<number>(targetBudget);
  const [copied, setCopied] = useState<boolean>(false);
  const [distributor, setDistributor] = useState<'Difare' | 'Farmaenlace' | 'Leterago' | 'General'>('Difare');

  // Calcular productos con mayor rotación en los últimos 14 días
  const rotationMap = useMemo(() => {
    const map = new Map<string, number>();
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    orders.forEach(order => {
      const orderDate = new Date(order.date);
      if (orderDate >= fourteenDaysAgo) {
        order.items.forEach(item => {
          const prev = map.get(item.id) || 0;
          map.set(item.id, prev + item.quantity);
        });
      }
    });
    return map;
  }, [orders]);

  // Generar lista sugerida optimizada para el presupuesto exacto ($120)
  const initialSuggestions = useMemo<SuggestedItem[]>(() => {
    // Ordenar productos: mayor rotación primero, luego bajo stock
    const sorted = [...products].sort((a, b) => {
      const rotA = rotationMap.get(a.id) || 0;
      const rotB = rotationMap.get(b.id) || 0;
      if (rotB !== rotA) return rotB - rotA;
      return a.stock - b.stock; // Menor stock primero
    });

    const items: SuggestedItem[] = [];
    let currentTotal = 0;

    for (const prod of sorted) {
      const rot = rotationMap.get(prod.id) || 0;
      // Considerar costo de caja o costo unitario
      const cost = prod.supplierBoxPrice || prod.boxPrice || (prod.costPrice ? prod.costPrice * (prod.unitsPerBox || 1) : prod.price * 0.7);
      
      if (cost <= 0) continue;
      
      // Si el producto rota o tiene bajo stock, sugerir 1 a 3 cajas
      const boxesToSuggest = rot > 5 ? 2 : 1;
      const itemCost = cost * boxesToSuggest;

      if (currentTotal + itemCost <= budget + 15) {
        const salePricePerBox = prod.publicBoxPrice || (prod.price * (prod.unitsPerBox || 1));
        const profitPerBox = Math.max(0, salePricePerBox - cost);

        items.push({
          product: prod,
          quantityBoxes: boxesToSuggest,
          unitCost: cost,
          totalCost: itemCost,
          recentSalesQty: rot,
          currentStock: prod.stock,
          projectedProfit: profitPerBox * boxesToSuggest
        });
        currentTotal += itemCost;
      }

      if (currentTotal >= budget - 5) break;
    }

    return items;
  }, [products, rotationMap, budget]);

  const [suggestedList, setSuggestedList] = useState<SuggestedItem[]>([]);

  // Inicializar al abrir
  React.useEffect(() => {
    if (isOpen) {
      setSuggestedList(initialSuggestions);
      setBudget(targetBudget);
    }
  }, [isOpen, initialSuggestions, targetBudget]);

  const totalCost = useMemo(() => {
    return suggestedList.reduce((acc, item) => acc + item.totalCost, 0);
  }, [suggestedList]);

  const totalProjectedProfit = useMemo(() => {
    return suggestedList.reduce((acc, item) => acc + item.projectedProfit, 0);
  }, [suggestedList]);

  const handleUpdateQty = (productId: string, delta: number) => {
    setSuggestedList(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = Math.max(1, item.quantityBoxes + delta);
          const newTotalCost = item.unitCost * newQty;
          const salePricePerBox = item.product.publicBoxPrice || (item.product.price * (item.product.unitsPerBox || 1));
          const profitPerBox = Math.max(0, salePricePerBox - item.unitCost);
          return {
            ...item,
            quantityBoxes: newQty,
            totalCost: newTotalCost,
            projectedProfit: profitPerBox * newQty
          };
        }
        return item;
      });
    });
  };

  const handleRemove = (productId: string) => {
    setSuggestedList(prev => prev.filter(i => i.product.id !== productId));
  };

  const generatePlainText = () => {
    const dateStr = new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' });
    let text = `📦 PEDIDO DE REPOSICIÓN - FARMACIA VITALIS\n`;
    text += `🏢 Distribuidora: ${distributor}\n`;
    text += `📅 Fecha: ${dateStr}\n`;
    text += `💰 Presupuesto Asignado: $${budget.toFixed(2)} (Total Estimado: $${totalCost.toFixed(2)})\n`;
    text += `------------------------------------\n`;
    suggestedList.forEach((item, index) => {
      text += `${index + 1}. [${item.quantityBoxes} CAJA(S)] ${item.product.name} (Ref. Costo: $${item.unitCost.toFixed(2)} c/u)\n`;
    });
    text += `------------------------------------\n`;
    text += `Total estimado a pagar: $${totalCost.toFixed(2)}\n`;
    text += `Ganancia Proyectada al vender: $${totalProjectedProfit.toFixed(2)}`;
    return text;
  };

  const handleCopy = () => {
    const text = generatePlainText();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 h-9 w-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-slate-300 hover:text-white transition"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-2xl flex items-center justify-center">
              <ShoppingBag size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-teal-400 uppercase">ESTRATEGIA $120</span>
                <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>
                <span className="text-[9px] font-black tracking-widest text-slate-300 uppercase">ALTA ROTACIÓN</span>
              </div>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5">
                Optimizador de Pedido a Distribuidora
              </h2>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Presupuesto Meta</label>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <DollarSign size={14} className="text-teal-600" />
                <input
                  type="number"
                  value={budget}
                  onChange={(e) => setBudget(Math.max(20, parseFloat(e.target.value) || 0))}
                  className="w-16 text-xs font-black text-slate-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase block mb-1">Distribuidora</label>
              <select
                value={distributor}
                onChange={(e) => setDistributor(e.target.value as any)}
                className="bg-white text-xs font-bold text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm outline-none cursor-pointer"
              >
                <option value="Difare">Difare S.A.</option>
                <option value="Farmaenlace">Farmaenlace</option>
                <option value="Leterago">Leterago</option>
                <option value="General">Distribuidor General</option>
              </select>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase block">Total a Pagar</span>
              <span className={`text-base font-black ${totalCost > budget ? 'text-amber-600' : 'text-teal-700'}`}>
                ${totalCost.toFixed(2)}
              </span>
            </div>
            <div className="text-right border-l border-slate-200 pl-4">
              <span className="text-[10px] font-black text-slate-400 uppercase block">Ganancia Proyectada</span>
              <span className="text-base font-black text-emerald-600">
                +${totalProjectedProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Content / Product List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
            <span>Medicamentos sugeridos por rotación ({suggestedList.length} ítems):</span>
            <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
              <Sparkles size={13} />
              Recompra solo lo vendido
            </span>
          </div>

          {suggestedList.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <AlertCircle size={32} className="text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-600">No hay productos sugeridos para este presupuesto.</p>
              <p className="text-xs text-slate-400 mt-1">Aumenta el presupuesto o revisa el catálogo.</p>
            </div>
          ) : (
            suggestedList.map((item) => (
              <div 
                key={item.product.id}
                className="bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm hover:border-teal-300 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-black text-slate-800 truncate">{item.product.name}</h4>
                    {item.recentSalesQty > 0 && (
                      <span className="bg-teal-50 text-teal-700 text-[9px] font-black px-2 py-0.5 rounded-md shrink-0">
                        {item.recentSalesQty} vendidos rec.
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] text-slate-400 font-medium mt-1">
                    <span>Stock actual: <strong className="text-slate-600">{item.currentStock}</strong></span>
                    <span>Costo caja: <strong className="text-slate-600">${item.unitCost.toFixed(2)}</strong></span>
                    <span className="text-emerald-600 font-bold">Gana: +${item.projectedProfit.toFixed(2)}</span>
                  </div>
                </div>

                {/* Counter & Subtotal */}
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center bg-slate-100 rounded-xl p-1">
                    <button 
                      onClick={() => handleUpdateQty(item.product.id, -1)}
                      className="h-6 w-6 bg-white hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold text-xs shadow-sm transition"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="w-8 text-center text-xs font-black text-slate-800">
                      {item.quantityBoxes}
                    </span>
                    <button 
                      onClick={() => handleUpdateQty(item.product.id, 1)}
                      className="h-6 w-6 bg-white hover:bg-slate-200 rounded-lg flex items-center justify-center text-slate-700 font-bold text-xs shadow-sm transition"
                    >
                      <Plus size={12} />
                    </button>
                  </div>

                  <div className="text-right w-16">
                    <span className="text-xs font-black text-slate-800 block">${item.totalCost.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={() => handleRemove(item.product.id)}
                    className="text-slate-300 hover:text-red-500 p-1 transition"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            <span className="font-bold text-slate-700">Regla clave:</span> No infles el pedido por encima de los ${budget}.
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-sm active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={14} className="text-emerald-400" />
                  <span>¡Lista Copiada!</span>
                </>
              ) : (
                <>
                  <Copy size={14} />
                  <span>Copiar para WhatsApp</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold px-4 py-2.5 rounded-xl transition"
            >
              Cerrar
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReplenishmentOptimizerModal;
