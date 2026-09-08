import React from 'react';
import { RefreshCw, Check } from 'lucide-react';
import { Product } from '../../../types';
import { StockAlertConfig, filterProductsInAlert, evaluateProductStockAlert } from '../../../services/stockAlertService';

interface StockQuickSummaryCardsProps {
  products: Product[];
  alertConfig: StockAlertConfig;
  updates: Record<string, number>;
  isSaving: boolean;
  onSaveAll: () => void;
}

export const StockQuickSummaryCards: React.FC<StockQuickSummaryCardsProps> = ({
  products,
  alertConfig,
  updates,
  isSaving,
  onSaveAll
}) => {
  const hasUpdates = Object.keys(updates).some(k => updates[k] !== 0);
  const totalEditedCount = Object.values(updates).filter(v => v !== 0).length;

  return (
    <>
      {/* Botón flotante sólido de confirmación y guardado de borrador */}
      {hasUpdates && (
        <div className="fixed bottom-24 right-6 md:right-12 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <button 
            onClick={onSaveAll}
            disabled={isSaving}
            className="bg-teal-700 text-white px-8 py-5 rounded-full font-bold text-sm shadow-xl flex items-center gap-3 hover:bg-teal-800 hover:scale-105 active:scale-95 transition-all border-4 border-white cursor-pointer"
          >
            {isSaving ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Check size={18} strokeWidth={3} />
            )}
            <span>
              {isSaving ? 'Guardando Inventario...' : `Guardar Cambios (${totalEditedCount} editados)`}
            </span>
          </button>
        </div>
      )}

      {/* Indicadores y resumen general */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex items-center gap-4">
          <div className="h-10 w-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            {filterProductsInAlert(products, alertConfig).totalCount}
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">
              Stock en Alerta (≤ {alertConfig.boxThreshold} uds caja / ≤ {alertConfig.unitThreshold} uds indiv.)
            </p>
            <p className="text-xs text-rose-900 font-semibold">Requieren reposición según umbral configurado</p>
          </div>
        </div>
        
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            {products.filter(p => !evaluateProductStockAlert(p, alertConfig).isAlert && p.stock > 0).length}
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Nivel Óptimo</p>
            <p className="text-xs text-emerald-900 font-semibold">Productos por encima de alerta</p>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-700 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            {products.length}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Catálogo Total</p>
            <p className="text-xs text-slate-900 font-semibold">Medicinas registradas en sistema</p>
          </div>
        </div>
      </div>
    </>
  );
};
