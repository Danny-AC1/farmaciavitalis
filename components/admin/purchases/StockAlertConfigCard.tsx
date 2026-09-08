import React, { useState } from 'react';
import { 
  Bell, 
  Boxes, 
  Package, 
  Unlink, 
  Minus, 
  Plus, 
  Check, 
  ChevronDown, 
  ChevronUp,
  RotateCcw
} from 'lucide-react';
import { Product } from '../../../types';
import { 
  StockAlertConfig, 
  saveStockAlertConfig, 
  filterProductsInAlert 
} from '../../../services/stockAlertService';

interface StockAlertConfigCardProps {
  products: Product[];
  config: StockAlertConfig;
  onConfigChange: (newConfig: StockAlertConfig) => void;
  onApplyToCart?: () => void;
}

export const StockAlertConfigCard: React.FC<StockAlertConfigCardProps> = ({
  products,
  config,
  onConfigChange,
  onApplyToCart,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  // Calcular en tiempo real cuántos productos están en alerta con la configuración actual
  const alertStats = filterProductsInAlert(products, config);

  const triggerSaveNotification = () => {
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2000);
  };

  const handleUnitThresholdChange = (val: number) => {
    const cleanVal = Math.max(0, val);
    const updated: StockAlertConfig = {
      ...config,
      unitThreshold: cleanVal,
      isLinked: false,
    };
    onConfigChange(updated);
    saveStockAlertConfig(updated);
    triggerSaveNotification();
  };

  const handleBoxThresholdChange = (val: number) => {
    const cleanVal = Math.max(0, val);
    const updated: StockAlertConfig = {
      ...config,
      boxThreshold: cleanVal,
      isLinked: false,
    };
    onConfigChange(updated);
    saveStockAlertConfig(updated);
    triggerSaveNotification();
  };

  const handleResetDefaults = () => {
    const defaults: StockAlertConfig = {
      unitThreshold: 5,
      boxThreshold: 3,
      isLinked: false,
    };
    onConfigChange(defaults);
    saveStockAlertConfig(defaults);
    triggerSaveNotification();
  };

  return (
    <div className="bg-white rounded-3xl md:rounded-[2.5rem] border border-slate-200/90 shadow-sm overflow-hidden transition-all">
      
      {/* Cabecera del Panel */}
      <div className="p-4 md:p-6 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 md:h-11 md:w-11 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20 shrink-0">
            <Bell size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm md:text-base font-black text-slate-800 tracking-tight">
                Alerta de Stock Inteligente
              </h4>
              {savedFeedback && (
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full animate-in fade-in">
                  <Check size={11} /> Guardado
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Ajusta los umbrales cuando desees. El sistema detecta automáticamente si el producto se registra por caja o por unidad.
            </p>
          </div>
        </div>

        {/* Resumen rápido y botón de colapsar */}
        <div className="flex items-center gap-2.5 self-end sm:self-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200/80 rounded-xl text-rose-800 text-xs font-black">
            <span>{alertStats.totalCount} en alerta</span>
            <span className="text-[10px] font-medium text-rose-600">
              ({alertStats.unitProducts.length} uds indiv. / {alertStats.boxProducts.length} en caja)
            </span>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title={isExpanded ? 'Ocultar controles' : 'Mostrar controles'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {/* Controles de Configuración Interactivos */}
      {isExpanded && (
        <div className="p-4 md:p-6 space-y-6">
          
          {/* Indicador de Desvinculación Total */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
                <Unlink size={14} className="text-emerald-600" />
                <span>Umbrales 100% Desvinculados e Independientes</span>
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden lg:inline">
                Editar las unidades de productos en caja nunca modifica las unidades de productos individuales.
              </span>
            </div>

            <button
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 hover:bg-slate-100 px-2.5 py-1 rounded-lg transition-colors"
              title="Restablecer valores por defecto (5 uds individuales / 5 uds en caja)"
            >
              <RotateCcw size={12} />
              <span>Restablecer sugeridos (5 uds / 5 uds)</span>
            </button>
          </div>

          {/* Grid de los 2 Diferenciadores: Por Caja vs Por Unidad */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Control 1: Productos Registrados por CAJA */}
            <div className="border border-teal-200/90 rounded-2xl md:rounded-3xl p-4 md:p-5 bg-teal-50/25 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Boxes size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Productos con Presentación en Caja
                    </h5>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Medicamentos que vienen en caja (ej: Amoxicilina x 50 uds)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-teal-100/80 text-teal-800 border border-teal-200">
                  {alertStats.boxProducts.length} en alerta
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-snug">
                Alertar cuando en inventario queden{' '}
                <strong className="text-teal-900 font-black text-sm">≤ {config.boxThreshold} unidades restantes</strong> de la caja
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-teal-100 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-teal-900 flex items-center gap-1">
                  <span>💡 Ejemplo práctico (Amoxicilina x 50 tabletas):</span>
                </p>
                <p className="leading-relaxed">
                  Si tu caja tiene 50 unidades y configuras aquí <strong>{config.boxThreshold}</strong>, el sistema te alertará en el momento exacto en que queden <strong>≤ {config.boxThreshold} unidades</strong> (tabletas) en stock para solicitar una nueva caja. Si cambias a 3, 4 o 5, solo afectará a los productos en caja.
                </p>
              </div>

              {/* Selector de número */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center bg-white border border-slate-300/80 rounded-xl overflow-hidden shadow-xs">
                  <button
                    onClick={() => handleBoxThresholdChange(config.boxThreshold - 1)}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    title="Reducir unidades límite"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={config.boxThreshold}
                    onChange={(e) => handleBoxThresholdChange(parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-black font-mono text-base text-teal-950 focus:outline-none py-1.5"
                  />
                  <button
                    onClick={() => handleBoxThresholdChange(config.boxThreshold + 1)}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    title="Aumentar unidades límite"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Accesos directos rápidos */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[2, 3, 4, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleBoxThresholdChange(num)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        config.boxThreshold === num
                          ? 'bg-teal-700 text-white shadow-xs scale-105'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {num} uds
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Control 2: Productos Registrados por UNIDAD */}
            <div className="border border-blue-200/90 rounded-2xl md:rounded-3xl p-4 md:p-5 bg-blue-50/25 space-y-3.5 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Package size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-slate-900 uppercase tracking-wide">
                      Productos Registrados por Unidad
                    </h5>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      Medicamentos individuales, jarabes, cremas o insumos sueltos (uds = 1)
                    </p>
                  </div>
                </div>

                <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-blue-100/80 text-blue-800 border border-blue-200">
                  {alertStats.unitProducts.length} en alerta
                </span>
              </div>

              <div className="text-xs text-slate-700 leading-snug">
                Alertar cuando el inventario sea{' '}
                <strong className="text-blue-900 font-black text-sm">≤ {config.unitThreshold} unidades</strong>
              </div>

              <div className="p-3 bg-white/90 rounded-xl border border-blue-100 text-[11px] text-slate-600 space-y-1">
                <p className="font-bold text-blue-900 flex items-center gap-1">
                  <span>💡 Totalmente desvinculado:</span>
                </p>
                <p className="leading-relaxed">
                  Para jarabes, pomadas o insumos individuales, configuras aquí tu límite deseado (ej: <strong>≤ {config.unitThreshold} uds</strong>). Modificar este campo <strong>no altera</strong> el umbral de productos en caja.
                </p>
              </div>

              {/* Selector de número */}
              <div className="flex items-center gap-2 pt-1">
                <div className="flex items-center bg-white border border-slate-300/80 rounded-xl overflow-hidden shadow-xs">
                  <button
                    onClick={() => handleUnitThresholdChange(config.unitThreshold - 1)}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    title="Reducir umbral de unidades"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="0"
                    max="999"
                    value={config.unitThreshold}
                    onChange={(e) => handleUnitThresholdChange(parseInt(e.target.value) || 0)}
                    className="w-14 text-center font-black font-mono text-base text-blue-950 focus:outline-none py-1.5"
                  />
                  <button
                    onClick={() => handleUnitThresholdChange(config.unitThreshold + 1)}
                    className="p-2.5 text-slate-600 hover:bg-slate-100 active:bg-slate-200 transition-colors"
                    title="Aumentar umbral de unidades"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* Accesos directos rápidos */}
                <div className="flex items-center gap-1 flex-wrap">
                  {[2, 3, 5, 8, 10].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleUnitThresholdChange(num)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        config.unitThreshold === num
                          ? 'bg-blue-600 text-white shadow-xs scale-105'
                          : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {num} uds
                    </button>
                  ))}
                </div>
              </div>
            </div>

          </div>

          {/* Barra de Acción: Sugerir y Cargar Automáticamente a la Orden */}
          {onApplyToCart && (
            <div className="p-3.5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
              <div className="text-xs space-y-0.5">
                <div className="font-bold flex items-center gap-1.5">
                  <span>Diagnóstico activo:</span>
                  <span className="text-teal-300 font-black">
                    {alertStats.totalCount} medicamentos requieren reposición
                  </span>
                </div>
                <div className="text-[11px] text-slate-300">
                  {alertStats.unitProducts.length} productos individuales con stock ≤ {config.unitThreshold} uds •{' '}
                  {alertStats.boxProducts.length} productos en caja con stock ≤ {config.boxThreshold} uds restantes.
                </div>
              </div>

              <button
                onClick={onApplyToCart}
                disabled={alertStats.totalCount === 0}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm shrink-0 self-start sm:self-center"
              >
                Cargar {alertStats.totalCount} Medicamentos a la Orden
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
