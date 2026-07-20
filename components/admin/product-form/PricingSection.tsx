import React from 'react';
import { Coins, TrendingUp, AlertTriangle, Percent } from 'lucide-react';

interface PricingSectionProps {
  prodPrice: string;
  setProdPrice: (s: string) => void;
  prodOriginalPrice: string;
  setProdOriginalPrice: (s: string) => void;
  prodCostPrice: string;
  setProdCostPrice: (s: string) => void;
  prodUnitsPerBox: string;
  setProdUnitsPerBox: (s: string) => void;
  prodBoxPrice: string;
  setProdBoxPrice: (s: string) => void;
  prodPublicBoxPrice: string;
  setProdPublicBoxPrice: (s: string) => void;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  prodPrice,
  setProdPrice,
  prodOriginalPrice,
  setProdOriginalPrice,
  prodCostPrice,
  setProdCostPrice,
  prodUnitsPerBox,
  setProdUnitsPerBox,
  prodBoxPrice,
  setProdBoxPrice,
  prodPublicBoxPrice,
  setProdPublicBoxPrice,
}) => {
  // Parsing inputs
  const uPrice = parseFloat(prodPrice) || 0;
  const oPrice = parseFloat(prodOriginalPrice) || 0;
  const fakeDiscount = oPrice > uPrice ? Math.round(((oPrice - uPrice) / oPrice) * 100) : 0;
  const uCost = parseFloat(prodCostPrice) || 0;
  const bCost = parseFloat(prodBoxPrice) || 0;
  const bPrice = parseFloat(prodPublicBoxPrice) || 0;

  // Real-time calculations
  const unitProfit = uPrice - uCost;
  const unitMargin = uPrice > 0 ? (unitProfit / uPrice) * 100 : 0;
  const unitMarkup = uCost > 0 ? (unitProfit / uCost) * 100 : 0;

  const boxProfit = bPrice - bCost;
  const boxMargin = bPrice > 0 ? (boxProfit / bPrice) * 100 : 0;
  const boxMarkup = bCost > 0 ? (boxProfit / bCost) * 100 : 0;

  // Margin diagnostics
  const getMarginStyle = (margin: number) => {
    if (margin <= 0) {
      return {
        bg: 'bg-rose-50 border-rose-100 text-rose-700',
        barBg: 'bg-rose-500',
        label: 'PÉRDIDA / CRÍTICO',
      };
    } else if (margin < 15) {
      return {
        bg: 'bg-amber-50 border-amber-100 text-amber-700',
        barBg: 'bg-amber-500',
        label: 'ALERTA: MARGEN BAJO',
      };
    } else if (margin < 35) {
      return {
        bg: 'bg-teal-50 border-teal-100 text-teal-700',
        barBg: 'bg-teal-500',
        label: 'SALUDABLE',
      };
    } else {
      return {
        bg: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        barBg: 'bg-emerald-500',
        label: 'ALTA RENTABILIDAD',
      };
    }
  };

  const unitStyle = getMarginStyle(unitMargin);
  const boxStyle = getMarginStyle(boxMargin);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" id="product-form-pricing">
      {/* Informative Header */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
        <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100 text-teal-600">
          <Coins size={18} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Finanzas & Estructura de Precios</h4>
          <p className="text-[11px] text-slate-500 font-semibold">
            Define los costos del proveedor y establece los precios de venta. El simulador calculará la rentabilidad en tiempo real.
          </p>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        
        {/* Cost Section (Left) */}
        <div className="md:col-span-5 bg-slate-50/50 p-5 rounded-3xl border border-slate-100 space-y-4">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block border-b border-slate-100 pb-2">
            1. Costos de Adquisición (Proveedor)
          </span>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
              Precio Costo Caja
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full bg-white border border-slate-200/80 p-3 pl-7 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                value={prodBoxPrice}
                onChange={(e) => setProdBoxPrice(e.target.value)}
                placeholder="0.00"
                id="input-prod-box-price"
              />
            </div>
            <span className="text-[9px] text-slate-400 font-medium block">Cuánto cobra el laboratorio o proveedor por la caja.</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                Unid/Caja
              </label>
              <input
                type="number"
                min="1"
                className="w-full bg-white border border-slate-200/80 p-3 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500"
                value={prodUnitsPerBox}
                onChange={(e) => setProdUnitsPerBox(e.target.value)}
                placeholder="Ej: 100"
                id="input-prod-units-box"
              />
              <span className="text-[9px] text-slate-400 font-medium block">Contenido de la caja.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-teal-600 uppercase tracking-wider block">
                Costo Unit. <span className="bg-teal-100 text-teal-700 px-1 rounded text-[8px] font-black">CALCULADO</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  className="w-full bg-teal-50 border border-teal-200/60 p-3 pl-7 rounded-2xl text-xs font-black text-teal-800 outline-none focus:ring-2 focus:ring-teal-500"
                  value={prodCostPrice}
                  onChange={(e) => setProdCostPrice(e.target.value)}
                  placeholder="0.00"
                  id="input-prod-cost-price"
                />
              </div>
              <span className="text-[9px] text-teal-600 font-medium block">Equivale a: Costo Caja / Unidades.</span>
            </div>
          </div>
        </div>

        {/* Pricing Section (Right) */}
        <div className="md:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 space-y-4">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block border-b border-slate-100 pb-2">
            2. Precios de Venta al Público (P.V.P)
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                P.V.P Unitario <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full bg-slate-50 border border-slate-200/80 p-3 pl-7 rounded-2xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  placeholder="0.00"
                  id="input-prod-price"
                />
              </div>
              <span className="text-[9px] text-slate-400 font-medium block">Precio de venta por pastilla/ampolla/sobre.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">
                P.V.P Caja Entera
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-blue-400 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full bg-blue-50/20 border border-blue-200/60 p-3 pl-7 rounded-2xl text-xs font-black text-blue-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  value={prodPublicBoxPrice}
                  onChange={(e) => setProdPublicBoxPrice(e.target.value)}
                  placeholder="0.00"
                  id="input-prod-public-box-price"
                />
              </div>
              <span className="text-[9px] text-blue-600 font-medium block">Precio con descuento especial por caja cerrada.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-amber-600 uppercase tracking-wider block flex items-center gap-1">
                P.V.P Anterior (Tachado) <span className="bg-amber-100 text-amber-800 px-1 rounded text-[8px] font-black uppercase">Opcional</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-500 text-xs font-bold">$</span>
                <input
                  type="number"
                  step="0.01;any"
                  min="0"
                  className="w-full bg-amber-50/20 border border-amber-200/60 p-3 pl-7 rounded-2xl text-xs font-black text-amber-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                  value={prodOriginalPrice}
                  onChange={(e) => setProdOriginalPrice(e.target.value)}
                  placeholder="Ej: 1.50"
                  id="input-prod-original-price"
                />
              </div>
              <span className="text-[9px] text-slate-400 font-medium block">
                {fakeDiscount > 0 ? (
                  <span className="text-emerald-600 font-bold">🏷️ Muestra {fakeDiscount}% de descuento ficticio</span>
                ) : (
                  "Para simular un descuento en la imagen del producto."
                )}
              </span>
            </div>
          </div>

          {/* Real-time warnings */}
          {uPrice > 0 && uCost > uPrice && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-rose-700 animate-pulse">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold uppercase leading-tight">
                ¡Peligro! El Costo Unitario (${uCost.toFixed(2)}) supera el Precio de Venta Público (${uPrice.toFixed(2)}). Esta venta generará pérdidas.
              </p>
            </div>
          )}

          {bPrice > 0 && bCost > bPrice && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-start gap-2.5 text-rose-700 animate-pulse">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p className="text-[10px] font-bold uppercase leading-tight">
                ¡Peligro! El Costo de Caja (${bCost.toFixed(2)}) supera el Precio Público de Caja (${bPrice.toFixed(2)}). Ajusta los valores.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Simulator Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-50">
        
        {/* Unit Profit Simulator */}
        <div className={`p-4 rounded-3xl border shadow-xs transition-all ${unitStyle.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[9px] font-black uppercase opacity-60 tracking-wider">Simulador de Venta Unitaria</span>
              <p className="text-sm font-black uppercase mt-0.5">{unitStyle.label}</p>
            </div>
            <TrendingUp size={16} className="opacity-40" />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold border-t border-black/5 pt-3">
            <div>
              <p className="text-[8px] font-black uppercase opacity-60">Ganancia neta / Unid</p>
              <p className="text-base font-black">${unitProfit >= 0 ? unitProfit.toFixed(2) : `(${Math.abs(unitProfit).toFixed(2)})`}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase opacity-60">Margen de Ganancia</p>
              <p className="text-base font-black flex items-center gap-0.5">
                {unitMargin.toFixed(1)}<Percent size={12} className="opacity-70" />
              </p>
            </div>
          </div>

          {/* Visual progress bar */}
          <div className="mt-3 bg-slate-200/40 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${unitStyle.barBg}`} 
              style={{ width: `${Math.max(0, Math.min(100, unitMargin))}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-bold opacity-60 mt-1 uppercase">
            <span>Markup: {unitMarkup.toFixed(1)}%</span>
            <span>Ref: Meta farmacéutica: 25% - 35%</span>
          </div>
        </div>

        {/* Box Profit Simulator */}
        <div className={`p-4 rounded-3xl border shadow-xs transition-all ${boxStyle.bg}`}>
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[9px] font-black uppercase opacity-60 tracking-wider">Simulador de Venta por Caja</span>
              <p className="text-sm font-black uppercase mt-0.5">{boxStyle.label}</p>
            </div>
            <TrendingUp size={16} className="opacity-40" />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-bold border-t border-black/5 pt-3">
            <div>
              <p className="text-[8px] font-black uppercase opacity-60">Ganancia neta / Caja</p>
              <p className="text-base font-black">${boxProfit >= 0 ? boxProfit.toFixed(2) : `(${Math.abs(boxProfit).toFixed(2)})`}</p>
            </div>
            <div>
              <p className="text-[8px] font-black uppercase opacity-60">Margen de Ganancia</p>
              <p className="text-base font-black flex items-center gap-0.5">
                {boxMargin.toFixed(1)}<Percent size={12} className="opacity-70" />
              </p>
            </div>
          </div>

          {/* Visual progress bar */}
          <div className="mt-3 bg-slate-200/40 h-2 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${boxStyle.barBg}`} 
              style={{ width: `${Math.max(0, Math.min(100, boxMargin))}%` }}
            />
          </div>
          <div className="flex justify-between text-[8px] font-bold opacity-60 mt-1 uppercase">
            <span>Markup: {boxMarkup.toFixed(1)}%</span>
            <span>Ref: Caja cerrada descuento mayor</span>
          </div>
        </div>

      </div>
    </div>
  );
};
