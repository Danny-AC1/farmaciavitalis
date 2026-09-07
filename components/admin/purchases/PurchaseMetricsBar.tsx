import React from 'react';
import { DollarSign, TrendingUp, Boxes, Layers, Percent } from 'lucide-react';
import { PurchaseOrderItem } from '../../../types/purchases';

interface PurchaseMetricsBarProps {
  items: PurchaseOrderItem[];
  budgetLimit?: number;
}

export const PurchaseMetricsBar: React.FC<PurchaseMetricsBarProps> = ({ items, budgetLimit }) => {
  let totalCost = 0;
  let totalProjectedRevenue = 0;
  let totalPhysicalUnits = 0;
  let totalBoxes = 0;

  items.forEach((it) => {
    totalCost += it.subtotal;
    totalProjectedRevenue += it.projectedRevenue;
    if (it.unitType === 'BOX') {
      totalBoxes += it.quantity;
      totalPhysicalUnits += it.quantity * (it.unitsPerBox || 1);
    } else {
      totalPhysicalUnits += it.quantity;
    }
  });

  const projectedProfit = Math.max(0, totalProjectedRevenue - totalCost);
  const projectedMargin = totalProjectedRevenue > 0 ? (projectedProfit / totalProjectedRevenue) * 100 : 0;
  const isOverBudget = budgetLimit && budgetLimit > 0 && totalCost > budgetLimit;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
      {/* Inversión Total */}
      <div className={`p-4 rounded-3xl border transition-all ${
        isOverBudget 
          ? 'bg-rose-50 border-rose-200 text-rose-900' 
          : 'bg-white border-slate-200/80 shadow-sm'
      }`}>
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Inversión Estimada</span>
          <DollarSign size={16} className={isOverBudget ? 'text-rose-500' : 'text-teal-600'} />
        </div>
        <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-slate-900">
          ${totalCost.toFixed(2)}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {items.length} {items.length === 1 ? 'producto en orden' : 'productos en orden'}
        </p>
      </div>

      {/* Venta Estimada al Público */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Venta Proyectada (PVP)</span>
          <Layers size={16} className="text-blue-600" />
        </div>
        <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-blue-700">
          ${totalProjectedRevenue.toFixed(2)}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Ingreso bruto estimado</p>
      </div>

      {/* Ganancia Proyectada */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ganancia Neta Est.</span>
          <TrendingUp size={16} className="text-emerald-600" />
        </div>
        <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-emerald-700">
          ${projectedProfit.toFixed(2)}
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Diferencia neta estimada</p>
      </div>

      {/* Margen Porcentual */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Margen Comercial</span>
          <Percent size={16} className="text-amber-600" />
        </div>
        <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-amber-700">
          {projectedMargin.toFixed(1)}%
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">Rentabilidad sobre venta</p>
      </div>

      {/* Volumen Físico de Mercadería */}
      <div className="col-span-2 md:col-span-1 p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between text-slate-400 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Ingreso a Bodega</span>
          <Boxes size={16} className="text-indigo-600" />
        </div>
        <div className="text-xl md:text-2xl font-black font-mono tracking-tight text-slate-800">
          {totalPhysicalUnits} <span className="text-xs font-bold text-slate-400 uppercase">uds</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5">
          {totalBoxes > 0 ? `${totalBoxes} cajas incluidas` : 'Solo unidades sueltas'}
        </p>
      </div>
    </div>
  );
};
