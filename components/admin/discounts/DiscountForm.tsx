import React from 'react';
import { Tag, Percent, DollarSign, Calendar, AlertTriangle } from 'lucide-react';
import { Product } from '../../../types';

interface DiscountFormProps {
  selectedProduct: Product | null;
  discountType: 'PERCENTAGE' | 'FIXED';
  setDiscountType: (type: 'PERCENTAGE' | 'FIXED') => void;
  discountValue: number;
  setDiscountValue: (val: number) => void;
  promoTag: string;
  setPromoTag: (tag: string) => void;
  expiryDate: string;
  setExpiryDate: (date: string) => void;
  onSaveDiscount: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export const DiscountForm: React.FC<DiscountFormProps> = ({
  selectedProduct,
  discountType,
  setDiscountType,
  discountValue,
  setDiscountValue,
  promoTag,
  setPromoTag,
  expiryDate,
  setExpiryDate,
  onSaveDiscount,
  onCancel,
}) => {
  return (
    <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
        <Tag size={18} className="text-amber-500" />
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Configuración de Oferta</h4>
      </div>

      {!selectedProduct ? (
        <div className="py-12 text-center text-slate-400 space-y-2">
          <div className="h-10 w-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
            <Tag size={18} />
          </div>
          <p className="text-xs font-bold leading-normal">
            Selecciona un producto del listado para asignar o editar un descuento.
          </p>
        </div>
      ) : (
        <form onSubmit={onSaveDiscount} className="space-y-5 animate-in fade-in duration-200">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
            <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase block">Producto Seleccionado</span>
            <span className="text-xs font-bold text-slate-800 block leading-tight">{selectedProduct.name}</span>
            <span className="text-[10px] text-slate-400 block">Precio Original: ${selectedProduct.price.toFixed(2)}</span>
          </div>

          {/* Tipo de Descuento */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Método de Descuento</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setDiscountType('PERCENTAGE')}
                className={`py-2 text-xs font-extrabold rounded-xl border transition-all text-center ${
                  discountType === 'PERCENTAGE'
                    ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Porcentaje (%)
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('FIXED')}
                className={`py-2 text-xs font-extrabold rounded-xl border transition-all text-center ${
                  discountType === 'FIXED'
                    ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                Valor Fijo ($)
              </button>
            </div>
          </div>

          {/* Valor numérico del Descuento */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              {discountType === 'PERCENTAGE' ? 'Porcentaje de Descuento (%)' : 'Monto de Descuento Fijo ($)'}
            </label>
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {discountType === 'PERCENTAGE' ? <Percent size={14} /> : <DollarSign size={14} />}
              </div>
              <input
                type="number"
                min="0.01"
                step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                max={discountType === 'PERCENTAGE' ? '100' : selectedProduct.price}
                value={discountValue}
                onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                required
              />
            </div>
          </div>

          {/* Etiqueta Promocional */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Etiqueta Promocional</label>
            <input
              type="text"
              placeholder="Ej: Oferta, 2x1, Flash, Liquidación"
              value={promoTag}
              onChange={(e) => setPromoTag(e.target.value)}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
            />
          </div>

          {/* Fecha de Expiración */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Fin de Promoción (Opcional)</label>
            <div className="relative">
              <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Visualizador de Viabilidad Financiera y Nuevo Margen */}
          {(() => {
            const calculatedFinalPrice = discountType === 'PERCENTAGE' 
              ? selectedProduct.price * (1 - discountValue / 100) 
              : selectedProduct.price - discountValue;
            const finalPriceToDisplay = Math.max(0, calculatedFinalPrice);
            
            const costPrice = selectedProduct.costPrice || 0;
            const profitDiff = finalPriceToDisplay - costPrice;
            const marginPercent = finalPriceToDisplay > 0 ? (profitDiff / finalPriceToDisplay) * 100 : 0;
            const hasNegativeMargin = costPrice > 0 && profitDiff < 0;

            return (
              <div className={`p-4 rounded-2xl border ${hasNegativeMargin ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-slate-50 border-slate-100 text-slate-800'} space-y-2.5`}>
                <span className="text-[9px] font-black tracking-widest uppercase block text-slate-500">Estimación de Rentabilidad</span>
                
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Precio Oferta</span>
                    <span className="font-extrabold text-slate-800 block">${finalPriceToDisplay.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Margen Estimado</span>
                    <span className={`font-extrabold block ${hasNegativeMargin ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                      {costPrice > 0 ? `${marginPercent.toFixed(1)}%` : 'Sin Costo'}
                    </span>
                  </div>
                </div>

                {hasNegativeMargin && (
                  <div className="flex items-start gap-2 text-[10.5px] font-bold text-rose-600 leading-normal">
                    <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                    <span>¡Alerta! El precio promocional cae por debajo del costo de compra (${costPrice.toFixed(2)}). Generarás pérdidas en esta venta.</span>
                  </div>
                )}
              </div>
            );
          })()}

          <div className="flex gap-2.5">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shadow-md"
            >
              Confirmar Descuento
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-black rounded-xl transition-colors"
            >
              Descartar
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
export default DiscountForm;
