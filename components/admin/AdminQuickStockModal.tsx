import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import { 
  X, 
  Boxes, 
  Save, 
  Check, 
  Plus, 
  Minus, 
  Package, 
  RefreshCw,
  Layers
} from 'lucide-react';

interface AdminQuickStockModalProps {
  product: Product | null;
  onClose: () => void;
  onUpdateStock: (id: string, newStock: number) => void | Promise<void>;
}

export const AdminQuickStockModal: React.FC<AdminQuickStockModalProps> = ({
  product,
  onClose,
  onUpdateStock
}) => {
  if (!product) return null;

  const [stockValue, setStockValue] = useState<number>(product.stock ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sincronizar cuando cambia el producto
  useEffect(() => {
    if (product) {
      setStockValue(product.stock ?? 0);
      setSaveSuccess(false);
      // Auto-seleccionar el input al abrir
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
    }
  }, [product]);

  const unitsPerBox = product.unitsPerBox && product.unitsPerBox > 1 ? product.unitsPerBox : null;
  const currentStock = product.stock ?? 0;
  const difference = stockValue - currentStock;

  // Manejar suma o resta de unidades
  const handleDelta = (delta: number) => {
    setStockValue(prev => Math.max(0, prev + delta));
  };

  // Manejar guardado
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!product || isSaving) return;

    setIsSaving(true);
    try {
      await onUpdateStock(product.id, stockValue);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error al actualizar el stock rápido:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Manejador de teclado para Enter y Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
    >
      <div 
        className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-600/40 border border-teal-400/30 rounded-2xl">
              <Boxes className="text-teal-200" size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-white tracking-tight">Ajuste Rápido de Stock</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-400/20 text-teal-200 px-2 py-0.5 rounded-md border border-teal-300/20">
                  Inventario
                </span>
              </div>
              <p className="text-xs text-teal-100/80 line-clamp-1 max-w-xs">{product.name}</p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 rounded-xl transition text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Cuerpo */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          
          {/* Ficha Resumen del Producto */}
          <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
            <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
              {product.image ? (
                <img src={product.image} alt={product.name} className="w-full h-full object-contain p-1" />
              ) : (
                <Package className="text-slate-300" size={24} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-800 text-sm truncate">{product.name}</h4>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  {product.category}
                </span>
                {product.barcode && (
                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                    {product.barcode}
                  </span>
                )}
                {unitsPerBox && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 flex items-center gap-1">
                    <Layers size={11} /> {unitsPerBox} un/caja
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Comparativa Visual: Stock Actual vs Nuevo Stock */}
          <div className="grid grid-cols-2 gap-3 bg-slate-50/50 p-4 rounded-2xl border border-slate-200/60">
            <div className="text-center p-3 bg-white rounded-xl border border-slate-100 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Stock Actual
              </span>
              <div className="text-2xl font-black text-slate-700">
                {currentStock}
              </div>
              <span className="text-[10px] font-medium text-slate-400">
                {currentStock === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>

            <div className="text-center p-3 bg-teal-50/70 rounded-xl border border-teal-200/80 shadow-xs relative">
              <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-1">
                Nuevo Stock
              </span>
              <div className="text-2xl font-black text-teal-700">
                {stockValue}
              </div>
              <span className={`text-[10px] font-bold ${
                difference > 0 ? 'text-emerald-600' : difference < 0 ? 'text-red-500' : 'text-slate-400'
              }`}>
                {difference > 0 ? `+${difference} u.` : difference < 0 ? `${difference} u.` : 'Sin cambios'}
              </span>
            </div>
          </div>

          {/* Control Principal de Entrada */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Ingresar o Modificar Cantidad Exacta
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDelta(-1)}
                className="w-12 h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition active:scale-95 border border-slate-200"
                title="Restar 1"
              >
                <Minus size={18} strokeWidth={2.5} />
              </button>
              
              <div className="relative flex-1">
                <input
                  ref={inputRef}
                  type="number"
                  min="0"
                  value={stockValue}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    setStockValue(isNaN(val) ? 0 : Math.max(0, val));
                  }}
                  className="w-full text-center text-2xl font-black text-slate-800 py-2.5 px-3 bg-white border-2 border-teal-500 rounded-2xl focus:outline-hidden focus:ring-4 focus:ring-teal-500/20 tabular-nums shadow-inner"
                />
              </div>

              <button
                type="button"
                onClick={() => handleDelta(1)}
                className="w-12 h-12 rounded-2xl bg-teal-50 hover:bg-teal-100 text-teal-700 flex items-center justify-center transition active:scale-95 border border-teal-200"
                title="Sumar 1"
              >
                <Plus size={18} strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Atajos de Incremento / Decremento Rápido */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Sumar Lotes Rápidos
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 20, 50].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleDelta(num)}
                  className="py-2 px-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-300 border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition active:scale-95"
                >
                  +{num}
                </button>
              ))}
            </div>

            {/* Si el producto tiene unidades por caja, botones de cajas */}
            {unitsPerBox && (
              <div className="pt-1">
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Layers size={12} /> Cajas Completas ({unitsPerBox} u.)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 5].map((boxes) => {
                    const totalToAdd = boxes * unitsPerBox;
                    return (
                      <button
                        key={boxes}
                        type="button"
                        onClick={() => handleDelta(totalToAdd)}
                        className="py-2 px-2 bg-blue-50/80 hover:bg-blue-100 border border-blue-200/80 rounded-xl text-xs font-bold text-blue-800 transition active:scale-95 flex flex-col items-center justify-center"
                      >
                        <span>+{boxes} {boxes === 1 ? 'Caja' : 'Cajas'}</span>
                        <span className="text-[9px] text-blue-600 font-semibold">(+{totalToAdd} u.)</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Botón rápido para marcar agotado si es necesario */}
            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={() => setStockValue(0)}
                className="text-[11px] font-bold text-red-500 hover:text-red-700 hover:underline transition"
              >
                Poner en 0 (Agotado)
              </button>
              <button
                type="button"
                onClick={() => setStockValue(currentStock)}
                className="text-[11px] font-bold text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
              >
                <RefreshCw size={11} /> Revertir cambios
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className={`px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition flex items-center gap-2 active:scale-95 ${
                saveSuccess
                  ? 'bg-emerald-600 shadow-emerald-600/30'
                  : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
              }`}
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check size={16} />
                  <span>¡Stock Actualizado!</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Stock</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminQuickStockModal;
