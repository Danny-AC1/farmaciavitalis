import React from 'react';
import { Sparkles } from 'lucide-react';

interface BulkDiscountToolsProps {
  categories: string[];
  onApplyBulkDiscount: (pct: number, category: string) => void;
}

export const BulkDiscountTools: React.FC<BulkDiscountToolsProps> = ({
  categories,
  onApplyBulkDiscount,
}) => {
  return (
    <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
      <div className="space-y-1">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
          <Sparkles size={14} className="text-amber-500" /> Acciones Masivas por Categoría
        </h4>
        <p className="text-[11px] text-slate-500 leading-normal">
          Aplica un porcentaje de descuento unificado de manera inmediata a todos los productos de un grupo elegido.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 justify-start md:justify-end">
        <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
          <select
            id="bulk-category-select"
            defaultValue="all"
            className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="all">Elegir Categoría...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-1.5">
          {[10, 15, 20, 25].map(pct => (
            <button
              key={pct}
              onClick={() => {
                const selectEl = document.getElementById('bulk-category-select') as HTMLSelectElement;
                const catVal = selectEl?.value || 'all';
                onApplyBulkDiscount(pct, catVal);
              }}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black rounded-lg shadow-sm transition-all"
            >
              {pct}%
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
export default BulkDiscountTools;
