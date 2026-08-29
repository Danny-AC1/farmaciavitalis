import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { updateProductDB } from '../../services/db';
import { 
  X, 
  Building2, 
  Save, 
  Check, 
  Sparkles, 
  AlertCircle, 
  TrendingUp, 
  DollarSign, 
  Boxes
} from 'lucide-react';

interface AdminSupplierPriceModalProps {
  product: Product | null;
  onClose: () => void;
}

export const AdminSupplierPriceModal: React.FC<AdminSupplierPriceModalProps> = ({
  product,
  onClose
}) => {
  if (!product) return null;

  const [costPrice, setCostPrice] = useState<string>('');
  const [supplierBoxPrice, setSupplierBoxPrice] = useState<string>('');
  const [supplierPriceRangeMin, setSupplierPriceRangeMin] = useState<string>('');
  const [supplierPriceRangeMax, setSupplierPriceRangeMax] = useState<string>('');
  const [suggestedRetailPrice, setSuggestedRetailPrice] = useState<string>('');
  const [price, setPrice] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cargar los valores iniciales cuando cambia el producto seleccionado
  useEffect(() => {
    if (product) {
      setCostPrice(product.costPrice !== undefined ? product.costPrice.toString() : '');
      setSupplierBoxPrice(
        product.supplierBoxPrice !== undefined 
          ? product.supplierBoxPrice.toString() 
          : (product.boxPrice !== undefined ? product.boxPrice.toString() : '')
      );
      setSupplierPriceRangeMin(
        product.supplierPriceRangeMin !== undefined ? product.supplierPriceRangeMin.toString() : ''
      );
      setSupplierPriceRangeMax(
        product.supplierPriceRangeMax !== undefined ? product.supplierPriceRangeMax.toString() : ''
      );
      setSuggestedRetailPrice(
        product.suggestedRetailPrice !== undefined ? product.suggestedRetailPrice.toString() : ''
      );
      setPrice(product.price !== undefined ? product.price.toString() : '');
      setSaveSuccess(false);
    }
  }, [product]);

  // Cálculos en tiempo real
  const costVal = parseFloat(costPrice) || 0;
  const minRangeVal = parseFloat(supplierPriceRangeMin) || 0;
  const maxRangeVal = parseFloat(supplierPriceRangeMax) || 0;
  const priceVal = parseFloat(price) || 0;

  // Cálculo de Margen Real (%)
  const marginPct = priceVal > 0 && costVal > 0 
    ? ((priceVal - costVal) / priceVal) * 100 
    : 0;

  // Diagnóstico de Rango Difare
  let rangeStatus: 'within' | 'below' | 'above' | 'unconfigured' = 'unconfigured';
  if (minRangeVal > 0 && maxRangeVal > 0 && priceVal > 0) {
    if (priceVal < minRangeVal) rangeStatus = 'below';
    else if (priceVal > maxRangeVal) rangeStatus = 'above';
    else rangeStatus = 'within';
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const parsedCostPrice = costPrice !== '' ? parseFloat(costPrice) : product.costPrice;
      const parsedSupplierBoxPrice = supplierBoxPrice !== '' ? parseFloat(supplierBoxPrice) : undefined;
      const parsedMinRange = supplierPriceRangeMin !== '' ? parseFloat(supplierPriceRangeMin) : undefined;
      const parsedMaxRange = supplierPriceRangeMax !== '' ? parseFloat(supplierPriceRangeMax) : undefined;
      const parsedSuggestedRetail = suggestedRetailPrice !== '' ? parseFloat(suggestedRetailPrice) : undefined;
      const parsedPrice = price !== '' ? parseFloat(price) : product.price;

      const updatedProduct: Product = {
        ...product,
        costPrice: parsedCostPrice,
        // Mantenemos boxPrice intacto para preservar compatibilidad con la sección general
        boxPrice: product.boxPrice,
        supplierBoxPrice: parsedSupplierBoxPrice,
        supplierPriceRangeMin: parsedMinRange,
        supplierPriceRangeMax: parsedMaxRange,
        suggestedRetailPrice: parsedSuggestedRetail,
        price: parsedPrice,
      };

      await updateProductDB(updatedProduct);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Error al guardar precios de distribuidora:', err);
      alert('Hubo un error al guardar los precios en la base de datos.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/20 border border-teal-400/30 rounded-2xl text-teal-300">
              <Building2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 bg-teal-400/20 text-teal-200 border border-teal-400/30 rounded-full">
                  Difare / Distribuidoras
                </span>
                <span className="text-xs text-teal-300 font-medium">Gestión de Costos</span>
              </div>
              <h3 className="text-lg font-black text-white truncate max-w-md mt-0.5">
                {product.name}
              </h3>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario / Contenido */}
        <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
          
          {/* Banner de Información Rápida */}
          <div className="bg-teal-50/70 border border-teal-100/80 p-3.5 rounded-2xl flex items-start gap-3">
            <Sparkles size={18} className="text-teal-600 shrink-0 mt-0.5" />
            <p className="text-xs text-teal-900 leading-relaxed font-medium">
              Ajusta los precios de compra de la distribuidora para este producto. Estos valores se sincronizan directamente con la <strong>Suite Gerencial</strong> de Difare y con el catálogo principal.
            </p>
          </div>

          {/* Grid de Costos y Rangos de Compra */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* 1. Costo Neto Unitario */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <DollarSign size={14} className="text-slate-500" />
                  Costo Unitario ($)
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">Neto / Pastilla</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input 
                  type="number" 
                  step="0.0001"
                  min="0"
                  placeholder="0.00"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Precio neto al que adquieres la unidad.</p>
            </div>

            {/* 2. Costo Caja Distribuidora */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Boxes size={14} className="text-blue-500" />
                  Costo Caja ($)
                </label>
                <span className="text-[10px] text-blue-600 font-semibold">Difare / Proveedor</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={supplierBoxPrice}
                  onChange={(e) => setSupplierBoxPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-black text-blue-900 focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Precio de compra por caja completa.</p>
            </div>

            {/* 3. Rango Mínimo Sugerido */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Rango Mín. Sugerido ($)
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">PVP Mínimo</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={supplierPriceRangeMin}
                  onChange={(e) => setSupplierPriceRangeMin(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Límite inferior recomendado por distribuidora.</p>
            </div>

            {/* 4. Rango Máximo Sugerido */}
            <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/80">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Rango Máx. Sugerido ($)
                </label>
                <span className="text-[10px] text-slate-400 font-semibold">PVP Máximo</span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={supplierPriceRangeMax}
                  onChange={(e) => setSupplierPriceRangeMax(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Límite superior recomendado por distribuidora.</p>
            </div>

            {/* 5. PVP Recomendado Unitario (Pastilla / Sobre) */}
            <div className="bg-blue-50/60 p-4 rounded-2xl border border-blue-200/80 sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  PVP Recomendado Unitario ($)
                </label>
                <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full">
                  Precio por Pastilla / Sobre (No Caja)
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 font-bold text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={suggestedRetailPrice}
                  onChange={(e) => setSuggestedRetailPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2 bg-white border border-blue-200 rounded-xl text-sm font-black text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none transition"
                />
              </div>
              <p className="text-[11px] text-blue-700 mt-1">
                Precio de venta al público recomendado por unidad individual.
              </p>
            </div>

            {/* 6. PVP Actual de Venta Unitario */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200/80 sm:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-emerald-600" />
                  PVP Actual de Venta Unitario ($)
                </label>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                  Precio Activo en Tienda & POS
                </span>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-sm">$</span>
                <input 
                  type="number" 
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-white border border-emerald-300 rounded-xl text-base font-black text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none transition"
                />
              </div>
            </div>

          </div>

          {/* Tarjeta de Diagnóstico y Margen */}
          <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <TrendingUp size={20} className="text-teal-400" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Margen Bruto de Ganancia
                </span>
                <span className="text-lg font-black text-white">
                  {marginPct > 0 ? `${marginPct.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Estado Rango Difare:</span>
              {rangeStatus === 'within' && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Check size={14} /> En Rango Óptimo
                </span>
              )}
              {rangeStatus === 'below' && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <AlertCircle size={14} /> Bajo Rango Sugerido
                </span>
              )}
              {rangeStatus === 'above' && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                  <TrendingUp size={14} /> Sobre Rango Sugerido
                </span>
              )}
              {rangeStatus === 'unconfigured' && (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-800 text-slate-400 border border-slate-700">
                  Sin Rango Configurado
                </span>
              )}
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button 
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-xl text-sm font-black text-white shadow-lg transition flex items-center gap-2 active:scale-95 ${
                saveSuccess 
                  ? 'bg-emerald-600 shadow-emerald-600/30' 
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
              }`}
            >
              {isSaving ? (
                <span>Guardando...</span>
              ) : saveSuccess ? (
                <>
                  <Check size={18} />
                  <span>¡Guardado con Éxito!</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  <span>Guardar Precios de Distribuidora</span>
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AdminSupplierPriceModal;
