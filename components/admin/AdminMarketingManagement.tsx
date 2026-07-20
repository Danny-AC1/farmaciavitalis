import React, { useState, useMemo } from 'react';
import { Search, Ticket, Image as ImageIcon, Sparkles, AlertCircle, RefreshCw, ArrowUpDown } from 'lucide-react';
import { Coupon, Banner } from '../../types';
import { MarketingStats } from './marketing/MarketingStats';
import { CouponForm } from './marketing/CouponForm';
import { CouponCard } from './marketing/CouponCard';
import { BannerForm } from './marketing/BannerForm';
import { BannerCard } from './marketing/BannerCard';

interface AdminMarketingManagementProps {
  banners: Banner[];
  coupons: Coupon[];
  onAddCoupon: (coupon: { code: string; value: number; type: 'PERCENTAGE' | 'FIXED'; active: boolean }) => Promise<void>;
  onDeleteCoupon: (id: string) => Promise<void>;
  onAddBanner: (banner: { title: string; image: string; active: boolean }) => Promise<void>;
  onDeleteBanner: (id: string) => Promise<void>;
}

export const AdminMarketingManagement: React.FC<AdminMarketingManagementProps> = ({
  banners,
  coupons,
  onAddCoupon,
  onDeleteCoupon,
  onAddBanner,
  onDeleteBanner
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'banners'>('coupons');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'code' | 'value' | 'type'>('code');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter and Sort Coupons
  const filteredCoupons = useMemo(() => {
    let result = [...coupons];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(c => c.code.toLowerCase().includes(query));
    }

    result.sort((a, b) => {
      let valA: any = a.code;
      let valB: any = b.code;

      if (sortBy === 'value') {
        valA = a.value;
        valB = b.value;
      } else if (sortBy === 'type') {
        valA = a.type;
        valB = b.type;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });

    return result;
  }, [coupons, searchTerm, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300 pb-20" id="admin-marketing-management-root">
      
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-amber-50 border border-amber-100 text-amber-600 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest inline-block mb-1.5 shadow-2xs">
            Módulo de Campañas & Fidelidad
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Marketing y Promociones
          </h2>
          <p className="text-xs text-slate-500">
            Administra cupones de descuento activos y banners publicitarios de Vitalis.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => { setActiveSubTab('coupons'); setSearchTerm(''); }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'coupons'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Ticket size={14} className={activeSubTab === 'coupons' ? 'text-amber-500' : ''} />
            Cupones Descuento
          </button>
          <button
            onClick={() => { setActiveSubTab('banners'); setSearchTerm(''); }}
            className={`px-4 py-2 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 ${
              activeSubTab === 'banners'
                ? 'bg-white text-slate-800 shadow-xs border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <ImageIcon size={14} className={activeSubTab === 'banners' ? 'text-blue-500' : ''} />
            Banners Carrusel
          </button>
        </div>
      </div>

      {/* 1. Statistics Summary */}
      <MarketingStats banners={banners} coupons={coupons} />

      {/* 2. Unified Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Context-dependent Form */}
        <div className="lg:col-span-4">
          {activeSubTab === 'coupons' ? (
            <CouponForm coupons={coupons} onSubmit={onAddCoupon} />
          ) : (
            <BannerForm onSubmit={onAddBanner} />
          )}
        </div>

        {/* Right Column: Listing and Filters */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Filters Bar (Only shown for coupons, banners are direct) */}
          {activeSubTab === 'coupons' ? (
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
              
              {/* Search Code */}
              <div className="relative w-full sm:max-w-xs">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar cupón por código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-100 pl-10 pr-4 py-2.5 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold transition-all"
                />
              </div>

              {/* Sorting */}
              <div className="flex gap-2 w-full sm:w-auto items-center justify-end">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none cursor-pointer"
                >
                  <option value="code">Código</option>
                  <option value="value">Valor</option>
                  <option value="type">Tipo</option>
                </select>

                <button
                  onClick={toggleSortOrder}
                  className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                  title={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
                >
                  <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
                </button>
              </div>

            </div>
          ) : (
            <div className="bg-blue-50/50 border border-blue-100/50 p-4 rounded-2xl flex items-center gap-3">
              <Sparkles size={16} className="text-blue-500 shrink-0" />
              <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                Los banners del carrusel se muestran directamente en la pantalla de inicio del cliente en un slider dinámico para potenciar las ventas de productos en temporada.
              </p>
            </div>
          )}

          {/* Cards Grid */}
          {activeSubTab === 'coupons' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredCoupons.map(coupon => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  onDelete={onDeleteCoupon}
                />
              ))}

              {filteredCoupons.length === 0 && (
                <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="bg-slate-50 p-4 rounded-full text-slate-400">
                    <AlertCircle size={32} />
                  </div>
                  <h4 className="font-black text-slate-700 text-sm">No se encontraron cupones</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    {searchTerm 
                      ? `Ningún cupón coincide con "${searchTerm}". Intenta con otra palabra clave.`
                      : 'Crea tu primer cupón de descuento en el formulario izquierdo para incentivar compras.'
                    }
                  </p>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="text-xs font-black text-teal-600 hover:text-teal-700 flex items-center gap-1.5"
                    >
                      <RefreshCw size={12} />
                      Restaurar búsqueda
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {banners.map(banner => (
                <BannerCard
                  key={banner.id}
                  banner={banner}
                  onDelete={onDeleteBanner}
                />
              ))}

              {banners.length === 0 && (
                <div className="col-span-full bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
                  <div className="bg-slate-50 p-4 rounded-full text-slate-400">
                    <AlertCircle size={32} />
                  </div>
                  <h4 className="font-black text-slate-700 text-sm">No hay banners publicados</h4>
                  <p className="text-xs text-slate-500 max-w-xs">
                    Publica imágenes en el carrusel de inicio para destacar promociones especiales o comunicados clínicos importantes.
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
export default AdminMarketingManagement;
