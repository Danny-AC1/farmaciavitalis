import React from 'react';

interface DiscountStatsProps {
  stats: {
    totalPromos: number;
    categoriesCount: number;
    averageDiscount: number;
  };
}

export const DiscountStats: React.FC<DiscountStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
          {stats.totalPromos}
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Promociones Activas</span>
          <span className="text-lg font-black text-slate-800 block">Productos en Oferta</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
          {stats.categoriesCount}
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Categorías Afectadas</span>
          <span className="text-lg font-black text-slate-800 block">Diferentes Líneas</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold font-mono">
          {stats.averageDiscount}%
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Promedio de Ahorro</span>
          <span className="text-lg font-black text-slate-800 block">Ahorro Promedio</span>
        </div>
      </div>
    </div>
  );
};
export default DiscountStats;
