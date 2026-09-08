import React from 'react';
import { Minus, Plus, Trash2, Barcode } from 'lucide-react';
import { Product } from '../../../types';

interface StockQuickProductRowProps {
  product: Product;
  diff: number;
  onUpdate: (id: string, delta: number) => void;
  onSetDirectUpdate: (id: string, val: number) => void;
  onClearDraft: (id: string) => void;
  onPrintBarcode: (product: Product) => void;
}

export const StockQuickProductRow: React.FC<StockQuickProductRowProps> = ({
  product: p,
  diff,
  onUpdate,
  onSetDirectUpdate,
  onClearDraft,
  onPrintBarcode
}) => {
  const finalStock = Math.max(0, p.stock + diff);

  return (
    <tr 
      id={`product-row-${p.id}`}
      className={`hover:bg-slate-50/40 transition-colors ${diff !== 0 ? 'bg-teal-50/10' : ''}`}
    >
      {/* Producto */}
      <td className="px-6 py-4">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white rounded-xl border border-slate-100 p-1.5 shrink-0 flex items-center justify-center">
            <img src={p.image} className="max-h-full max-w-full object-contain" alt="" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight">{p.name}</span>
              {p.stock === 0 && (
                <span className="text-[8px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Agotado</span>
              )}
            </div>
            <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Cód: {p.barcode || 'V' + p.id.substring(0,8).toUpperCase()}</p>
          </div>
        </div>
      </td>

      {/* Categoría */}
      <td className="px-6 py-4 text-center">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
          {p.category}
        </span>
      </td>

      {/* Stock Físico */}
      <td className="px-6 py-4 text-center">
        <div className="relative inline-block">
          <span className={`px-4 py-1.5 rounded-full font-bold text-xs min-w-[70px] inline-block text-center ${
            finalStock === 0 
              ? 'bg-red-50 text-red-600 border border-red-100' 
              : finalStock <= 5 
              ? 'bg-amber-50 text-amber-600 border border-amber-100' 
              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
          }`}>
            {p.stock} u.
          </span>
          {diff !== 0 && (
            <div className="absolute -top-3.5 -right-8 animate-in zoom-in duration-200">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border-2 border-white shadow-sm ${diff > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {diff > 0 ? `+${diff}` : diff}
              </span>
            </div>
          )}
        </div>
      </td>

      {/* Ajuste Rápido */}
      <td className="px-6 py-4 text-right">
        <div className="flex items-center justify-end gap-1.5">
          <button 
            onClick={() => onUpdate(p.id, -5)}
            className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
            title="Restar 5 unidades"
          >
            -5
          </button>
          
          <button 
            onClick={() => onUpdate(p.id, -1)}
            className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all cursor-pointer"
            title="Restar 1 unidad"
          >
            <Minus size={14} />
          </button>
          
          <input 
            id={`input-stock-${p.id}`}
            type="number"
            className="w-14 h-8 border border-slate-200 rounded-lg text-center font-bold text-xs text-slate-700 focus:border-teal-500 focus:bg-white outline-none transition-all bg-slate-50/50"
            value={diff || ''}
            onChange={(e) => {
              const v = parseInt(e.target.value);
              onSetDirectUpdate(p.id, isNaN(v) ? 0 : v);
            }}
            onFocus={(e) => e.target.select()}
            placeholder="0"
          />
          
          <button 
            onClick={() => onUpdate(p.id, 1)}
            className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 transition-all cursor-pointer"
            title="Sumar 1 unidad"
          >
            <Plus size={14} />
          </button>

          <button 
            onClick={() => onUpdate(p.id, 5)}
            className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 transition-all cursor-pointer"
            title="Sumar 5 unidades"
          >
            +5
          </button>

          {diff !== 0 && (
            <button
              onClick={() => onClearDraft(p.id)}
              className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              title="Limpiar borrador"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </td>

      {/* Impresora de Código de Barras */}
      <td className="px-6 py-4 text-center">
        <button
          onClick={() => onPrintBarcode(p)}
          className="p-2 rounded-lg bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-500 transition-all active:scale-95 inline-flex items-center justify-center cursor-pointer"
          title="Imprimir código de barra médico"
        >
          <Barcode size={14} />
        </button>
      </td>
    </tr>
  );
};
