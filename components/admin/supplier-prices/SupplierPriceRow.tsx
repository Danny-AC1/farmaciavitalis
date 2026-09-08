import React from 'react';
import { Product } from '../../../types';
import { CheckCircle2, AlertTriangle, Edit2, RefreshCw, Save } from 'lucide-react';

export interface ProductPriceValues {
  costPrice: string;
  supplierBoxPrice: string;
  supplierPriceRangeMin: string;
  supplierPriceRangeMax: string;
  suggestedRetailPrice: string;
  price: string;
}

interface SupplierPriceRowProps {
  product: Product;
  values: ProductPriceValues;
  suppliersMap: Record<string, string>;
  isSaving: boolean;
  isSavedSuccess: boolean;
  onValueChange: (productId: string, field: string, value: string, originalProduct: Product) => void;
  onSave: (p: Product) => void;
  onEditFull: (p: Product) => void;
}

export const SupplierPriceRow: React.FC<SupplierPriceRowProps> = ({
  product: p,
  values,
  suppliersMap,
  isSaving,
  isSavedSuccess,
  onValueChange,
  onSave,
  onEditFull
}) => {
  const costVal = parseFloat(values.costPrice) || 0;
  const minRangeVal = parseFloat(values.supplierPriceRangeMin) || 0;
  const maxRangeVal = parseFloat(values.supplierPriceRangeMax) || 0;
  const pvpVal = parseFloat(values.price) || 0;

  const marginPct = pvpVal > 0 && costVal > 0 
    ? (((pvpVal - costVal) / pvpVal) * 100).toFixed(1) 
    : null;

  let rangeStatus: 'ok' | 'below' | 'above' | 'none' = 'none';
  if (minRangeVal > 0 && maxRangeVal > 0 && pvpVal > 0) {
    if (pvpVal < minRangeVal) rangeStatus = 'below';
    else if (pvpVal > maxRangeVal) rangeStatus = 'above';
    else rangeStatus = 'ok';
  }

  const suggestedDefault = minRangeVal > 0 && maxRangeVal > 0 
    ? ((minRangeVal + maxRangeVal) / 2).toFixed(2)
    : costVal > 0 ? (costVal * 1.3).toFixed(2) : '0.00';

  return (
    <tr className="hover:bg-slate-50/80 transition-colors">
      {/* Producto */}
      <td className="p-4 pl-6">
        <div className="font-extrabold text-slate-800">{p.name}</div>
        {p.activeIngredient && (
          <span className="text-[10px] font-semibold text-teal-600 block">{p.activeIngredient}</span>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
            {p.category}
          </span>
          {p.supplierId && suppliersMap[p.supplierId] && (
            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold border border-blue-100">
              {suppliersMap[p.supplierId]}
            </span>
          )}
        </div>
      </td>

      {/* 1. Precio de Compra Unitario */}
      <td className="p-4">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
          <input
            type="number" step="0.01" min="0" placeholder="0.00" value={values.costPrice}
            onChange={(e) => onValueChange(p.id, 'costPrice', e.target.value, p)}
            className="w-24 pl-6 pr-2 py-1.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
        <span className="text-[9px] text-amber-700 font-medium block mt-0.5">Precio Compra</span>
      </td>

      {/* Costo Caja */}
      <td className="p-4">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
          <input
            type="number" step="0.01" min="0" placeholder="0.00" value={values.supplierBoxPrice}
            onChange={(e) => onValueChange(p.id, 'supplierBoxPrice', e.target.value, p)}
            className="w-24 pl-6 pr-2 py-1.5 bg-indigo-50/60 border border-indigo-200/90 rounded-xl text-xs font-black text-indigo-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>
        <span className="text-[9px] text-indigo-700 font-semibold block mt-0.5">
          {p.unitsPerBox ? `Costo Caja (${p.unitsPerBox} un)` : 'Costo Caja'}
        </span>
      </td>

      {/* 2. Rango Mínimo Sugerido */}
      <td className="p-4">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
          <input
            type="number" step="0.01" min="0" placeholder="Mínimo" value={values.supplierPriceRangeMin}
            onChange={(e) => onValueChange(p.id, 'supplierPriceRangeMin', e.target.value, p)}
            className="w-28 pl-6 pr-2 py-1.5 bg-teal-50/40 border border-teal-200/80 rounded-xl text-xs font-extrabold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
        <span className="text-[9px] text-teal-600 font-medium block mt-0.5">PVP Mínimo Sug.</span>
      </td>

      {/* 3. Rango Máximo Sugerido */}
      <td className="p-4">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
          <input
            type="number" step="0.01" min="0" placeholder="Máximo" value={values.supplierPriceRangeMax}
            onChange={(e) => onValueChange(p.id, 'supplierPriceRangeMax', e.target.value, p)}
            className="w-28 pl-6 pr-2 py-1.5 bg-teal-50/40 border border-teal-200/80 rounded-xl text-xs font-extrabold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
        <span className="text-[9px] text-teal-600 font-medium block mt-0.5">PVP Máximo Sug.</span>
      </td>

      {/* 4. PVP Sugerido */}
      <td className="p-4">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
          <input
            type="number" step="0.01" min="0" placeholder={suggestedDefault} value={values.suggestedRetailPrice}
            onChange={(e) => onValueChange(p.id, 'suggestedRetailPrice', e.target.value, p)}
            className="w-28 pl-6 pr-2 py-1.5 bg-blue-50/60 border border-blue-200/90 rounded-xl text-xs font-black text-blue-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>
        <span className="text-[9px] text-blue-700 font-semibold block mt-0.5">PVP Recom. Unit.</span>
      </td>

      {/* PVP Actual de Venta Unitario */}
      <td className="p-4">
        <div className="relative">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
          <input
            type="number" step="0.01" min="0" placeholder="0.00" value={values.price}
            onChange={(e) => onValueChange(p.id, 'price', e.target.value, p)}
            className="w-24 pl-6 pr-2 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>
        <span className="text-[9px] text-emerald-700 font-medium block mt-0.5">PVP Venta Unit.</span>
      </td>

      {/* Margen y Diagnóstico Rango */}
      <td className="p-4 text-center">
        {marginPct !== null ? (
          <div className="space-y-1">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
              parseFloat(marginPct) <= 0 
                ? 'bg-red-100 text-red-700 border border-red-200' 
                : parseFloat(marginPct) < 20 
                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
            }`}>
              {marginPct}% Margen
            </span>

            {rangeStatus === 'ok' && (
              <span className="text-[9px] font-extrabold text-emerald-600 flex items-center justify-center gap-0.5">
                <CheckCircle2 size={11} /> En rango
              </span>
            )}
            {rangeStatus === 'below' && (
              <span className="text-[9px] font-extrabold text-amber-600 flex items-center justify-center gap-0.5">
                <AlertTriangle size={11} /> Bajo mín.
              </span>
            )}
            {rangeStatus === 'above' && (
              <span className="text-[9px] font-extrabold text-orange-600 flex items-center justify-center gap-0.5">
                <AlertTriangle size={11} /> Sobre máx.
              </span>
            )}
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">Sin costo</span>
        )}
      </td>

      {/* Botones de Acción */}
      <td className="p-4 pr-6 text-right whitespace-nowrap">
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => onEditFull(p)}
            className="p-2 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-xl transition-all shadow-xs inline-flex items-center justify-center cursor-pointer"
            title="Editar Ficha Completa del Producto"
          >
            <Edit2 size={14} />
          </button>

          <button
            onClick={() => onSave(p)}
            disabled={isSaving}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
              isSavedSuccess
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm active:scale-95'
            }`}
            title="Guardar Precios"
          >
            {isSaving ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : isSavedSuccess ? (
              <>
                <CheckCircle2 size={13} /> ¡Guardado!
              </>
            ) : (
              <>
                <Save size={13} /> Guardar
              </>
            )}
          </button>
        </div>
      </td>
    </tr>
  );
};
