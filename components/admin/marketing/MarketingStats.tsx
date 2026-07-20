import React, { useMemo } from 'react';
import { Megaphone, Ticket, Percent, Image } from 'lucide-react';
import { Coupon, Banner } from '../../../types';

interface MarketingStatsProps {
  banners: Banner[];
  coupons: Coupon[];
}

export const MarketingStats: React.FC<MarketingStatsProps> = ({ banners, coupons }) => {
  const stats = useMemo(() => {
    const totalBanners = banners.length;
    const activeBanners = banners.filter(b => b.active).length;
    const totalCoupons = coupons.length;
    const activeCoupons = coupons.filter(c => c.active).length;

    // Calculate coupon averages
    const percentageCoupons = coupons.filter(c => c.type === 'PERCENTAGE');
    const fixedCoupons = coupons.filter(c => c.type === 'FIXED');

    const avgPercentage = percentageCoupons.length > 0
      ? Math.round(percentageCoupons.reduce((acc, c) => acc + c.value, 0) / percentageCoupons.length)
      : 0;

    const avgFixed = fixedCoupons.length > 0
      ? Math.round(fixedCoupons.reduce((acc, c) => acc + c.value, 0) / fixedCoupons.length)
      : 0;

    return {
      totalBanners,
      activeBanners,
      totalCoupons,
      activeCoupons,
      avgPercentage,
      avgFixed
    };
  }, [banners, coupons]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="marketing-stats-panel">
      
      {/* Active Coupons KPI */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-100 text-amber-600">
          <Ticket size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Cupones Activos</span>
          <p className="text-xl font-black text-slate-800">{stats.activeCoupons} / {stats.totalCoupons}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Incentivos de compra</span>
        </div>
      </div>

      {/* Active Banners KPI */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-blue-600">
          <Image size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Banners de Carrusel</span>
          <p className="text-xl font-black text-slate-800">{stats.activeBanners} / {stats.totalBanners}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Anuncios en inicio</span>
        </div>
      </div>

      {/* Avg Percentage Discount KPI */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className="bg-teal-50 p-3.5 rounded-2xl border border-teal-100 text-teal-600">
          <Percent size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Promedio % OFF</span>
          <p className="text-xl font-black text-slate-800">{stats.avgPercentage}%</p>
          <span className="text-[10px] text-slate-500 font-semibold">Ahorro porcentual</span>
        </div>
      </div>

      {/* Avg Fixed Discount KPI */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100 text-emerald-600">
          <Megaphone size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Ahorro Fijo Promedio</span>
          <p className="text-xl font-black text-slate-800">${stats.avgFixed}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Descuento en USD</span>
        </div>
      </div>

    </div>
  );
};
