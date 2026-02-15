
import React from 'react';
import { ShoppingBag, Minus, Plus, Trash2, Package, Inbox, AlertTriangle } from 'lucide-react';
import { CartItem } from '../types';

interface POSCartListProps {
  posCart: CartItem[];
  removeFromPosCart: (id: string) => void;
  addToPosCart: (p: any, unitType?: 'UNIT' | 'BOX') => void;
  setPosCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
}

const POSCartList: React.FC<POSCartListProps> = ({ posCart, removeFromPosCart, addToPosCart, setPosCart }) => {
  
  const toggleUnit = (item: CartItem) => {
      const targetUnit = item.selectedUnit === 'UNIT' ? 'BOX' : 'UNIT';
      
      // Si queremos cambiar a caja, verificar si el stock alcanza para (cantidad actual * unidades por caja)
      if (targetUnit === 'BOX') {
          const neededTotal = item.quantity * (item.unitsPerBox || 1);
          if (neededTotal > item.stock) {
              alert(`No hay suficiente stock para cambiar a cajas. Requieres ${neededTotal} unidades pero solo hay ${item.stock}.`);
              return;
          }
      }

      setPosCart(prev => prev.map(it => {
          if (it.id === item.id && it.selectedUnit === item.selectedUnit) {
              return { ...it, selectedUnit: targetUnit };
          }
          return it;
      }));
  };

  const getStockStatus = (item: CartItem) => {
      const unitsPerPosItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
      const unitsUsedInThisLine = item.quantity * unitsPerPosItem;
      const canAddOneMore = (unitsUsedInThisLine + unitsPerPosItem) <= item.stock;
      return { canAddOneMore, unitsUsedInThisLine };
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {posCart.length === 0 ? (
        <div className="h-full flex flex-col items-center justify-center py-10 md:py-20 opacity-20">
          <ShoppingBag size={80} strokeWidth={1} />
          <p className="text-[10px] md:sm font-black uppercase tracking-[0.2em] mt-4">Esperando productos...</p>
        </div>
      ) : (
        <div className="space-y-0.5 md:space-y-1">
          <div className="hidden md:flex items-center justify-between py-2 border-b border-slate-100 mb-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Producto</span>
            <div className="flex gap-16 px-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">Unidad</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-center">Cantidad</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-right">Subtotal</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-8"></span>
            </div>
          </div>
          {posCart.map((item, idx) => {
            const isBox = item.selectedUnit === 'BOX';
            const unitPrice = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
            const hasBoxOption = (item.unitsPerBox ?? 0) > 1;
            const { canAddOneMore, unitsUsedInThisLine } = getStockStatus(item);

            return (
              <div key={`${item.id}-${item.selectedUnit}-${idx}`} className="flex flex-col md:flex-row items-stretch md:items-center justify-between py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group animate-in slide-in-from-bottom-1">
                <div className="flex-grow min-w-0 flex items-center gap-2 md:gap-3 mb-2 md:mb-0">
                  <span className={`text-[7px] md:text-[8px] font-black px-1 md:px-1.5 py-0.5 rounded uppercase shrink-0 ${isBox ? 'bg-blue-600 text-white' : 'bg-teal-50 text-teal-600'}`}>
                    {isBox ? 'CAJA' : 'UNID'}
                  </span>
                  <div className="min-w-0 flex-grow">
                    <h4 className="text-[11px] md:text-sm font-black text-slate-800 uppercase truncate leading-none">{item.name}</h4>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Stock: {item.stock} / Usado: {unitsUsedInThisLine}</p>
                  </div>
                  <span className="text-[9px] md:text-[10px] font-bold text-slate-400 shrink-0">(${unitPrice.toFixed(2)})</span>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 shrink-0">
                  {/* Selector de Unidad */}
                  <div className="w-24 flex justify-center">
                    {hasBoxOption ? (
                      <button 
                        onClick={() => toggleUnit(item)}
                        className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all border ${isBox ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-teal-200 bg-teal-50 text-teal-700'}`}
                      >
                        {isBox ? <Package size={12}/> : <Inbox size={12}/>}
                        {isBox ? `x${item.unitsPerBox}` : 'Unid'}
                      </button>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase">Fijo</span>
                    )}
                  </div>

                  <div className="flex items-center bg-slate-50 md:bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                    <button onClick={() => {
                      if (item.quantity === 1) {
                        removeFromPosCart(item.id);
                      } else {
                        setPosCart(prev => prev.map((it, i) => i === idx ? {...it, quantity: it.quantity - 1} : it));
                      }
                    }} className="p-1.5 md:p-1 text-slate-400 hover:text-red-500 transition-all"><Minus size={14} strokeWidth={3}/></button>
                    
                    <span className="px-2 md:px-3 text-[12px] md:text-sm font-black text-slate-800 w-8 md:w-10 text-center">{item.quantity}</span>
                    
                    <button 
                        disabled={!canAddOneMore}
                        onClick={() => addToPosCart(item, item.selectedUnit)} 
                        className={`p-1.5 md:p-1 transition-all ${canAddOneMore ? 'text-slate-400 hover:text-teal-600' : 'text-slate-200 cursor-not-allowed'}`}
                    >
                      {canAddOneMore ? <Plus size={14} strokeWidth={3}/> : <AlertTriangle size={14} className="text-orange-300"/>}
                    </button>
                  </div>
                  
                  <div className="w-16 md:w-24 text-right">
                    <p className="text-[13px] md:text-base font-black text-slate-900 tabular-nums">${(unitPrice * item.quantity).toFixed(2)}</p>
                  </div>

                  <button onClick={() => removeFromPosCart(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default POSCartList;
