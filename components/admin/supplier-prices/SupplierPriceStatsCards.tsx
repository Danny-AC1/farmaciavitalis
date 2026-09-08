import React from 'react';
import { DollarSign, Printer, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';

interface StatsProps {
  totalProducts: number;
  totalWithCost: number;
  avgMargin: string;
  outOfRangeCount: number;
}

interface SupplierPriceStatsCardsProps {
  stats: StatsProps;
  onPrint: () => void;
}

export const SupplierPriceStatsCards: React.FC<SupplierPriceStatsCardsProps> = ({ stats, onPrint }) => {
  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <DollarSign size={20} />
            </span>
            <h2 className="text-xl font-black text-slate-800">
              Precios y Costos de Proveedor
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Gestión de costos, márgenes netos y rangos sugeridos por distribuidoras.
          </p>
        </div>

        <button
          onClick={onPrint}
          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm active:scale-95 cursor-pointer"
        >
          <Printer size={15} />
          <span>Imprimir Reporte de Costos</span>
        </button>
      </div>

      {/* Tarjetas Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Total Medicamentos</span>
          <div className="text-2xl font-black text-slate-800">{stats.totalProducts}</div>
          <span className="text-[10px] text-slate-400 font-medium mt-1 block">Catálogo activo</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-teal-600 tracking-wider block mb-1">Con Costo Registrado</span>
          <div className="text-2xl font-black text-teal-700 flex items-center gap-1.5">
            {stats.totalWithCost}
            <CheckCircle2 size={18} className="text-teal-500" />
          </div>
          <span className="text-[10px] text-teal-600/80 font-medium mt-1 block">
            {stats.totalProducts > 0 ? ((stats.totalWithCost / stats.totalProducts) * 100).toFixed(0) : 0}% del catálogo
          </span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider block mb-1">Margen Promedio</span>
          <div className="text-2xl font-black text-emerald-600 flex items-center gap-1.5">
            {stats.avgMargin}%
            <TrendingUp size={18} className="text-emerald-500" />
          </div>
          <span className="text-[10px] text-emerald-600/80 font-medium mt-1 block">Sobre productos con costo</span>
        </div>

        <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block mb-1">Fuera de Rango</span>
          <div className="text-2xl font-black text-amber-600 flex items-center gap-1.5">
            {stats.outOfRangeCount}
            <AlertTriangle size={18} className="text-amber-500" />
          </div>
          <span className="text-[10px] text-amber-600/80 font-medium mt-1 block">PVP fuera de sugerido</span>
        </div>
      </div>
    </>
  );
};
