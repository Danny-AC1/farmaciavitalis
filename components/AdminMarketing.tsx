
import React from 'react';
import { Megaphone, ImageIcon, Trash2, Ticket, Plus, Loader2 } from 'lucide-react';
import { Banner, Coupon } from '../types';

interface AdminMarketingProps {
  banners: Banner[];
  coupons: Coupon[];
  bannerTitle: string;
  setBannerTitle: (s: string) => void;
  bannerInputRef: React.Ref<HTMLInputElement>;
  handleAddBanner: (e: React.FormEvent) => void;
  onDeleteBanner: (id: string) => void;
  isUploadingBanner: boolean;
  onAddCoupon?: () => void;
  onDeleteCoupon?: (id: string) => void;
}

const AdminMarketing: React.FC<AdminMarketingProps> = ({
  banners, coupons, bannerTitle, setBannerTitle, bannerInputRef, handleAddBanner,
  onDeleteBanner, isUploadingBanner, onAddCoupon, onDeleteCoupon
}) => {
  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex items-center gap-3 mb-2">
          <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
              <Megaphone size={24} />
          </div>
          <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Marketing & Promociones</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de banners y cupones</p>
          </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Gestión de Cupones */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <div className="bg-amber-50 p-3 rounded-2xl text-amber-500">
                        <Ticket size={24}/>
                    </div>
                    <div>
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Cupones de Descuento</h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Incentivos para tus clientes</p>
                    </div>
                </div>
                <button 
                  onClick={onAddCoupon}
                  className="bg-teal-600 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 active:scale-95"
                >
                    <Plus size={14}/> Crear Cupón
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {coupons.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                        <Ticket size={48} className="mx-auto text-slate-200 mb-3" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay cupones activos</p>
                    </div>
                ) : (
                    coupons.map(coupon => (
                        <div key={coupon.id} className="bg-slate-900 p-6 rounded-[2rem] relative overflow-hidden group border border-slate-800 shadow-xl">
                             <div className="relative z-10">
                                 <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block mb-1">CÓDIGO</span>
                                 <p className="text-2xl font-black text-white tracking-tighter uppercase">{coupon.code}</p>
                                 <div className="mt-4 flex justify-between items-end">
                                     <span className="text-xs font-black text-slate-400 uppercase">{coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}</span>
                                     <button 
                                      onClick={() => onDeleteCoupon?.(coupon.id)}
                                      className="bg-red-500/10 text-red-400 p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                     >
                                        <Trash2 size={16}/>
                                     </button>
                                 </div>
                             </div>
                             <div className="absolute -right-4 -bottom-4 bg-teal-600/10 w-20 h-20 rounded-full blur-2xl"></div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Gestión de Banners */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-50 p-3 rounded-2xl text-blue-600">
                <ImageIcon size={24}/>
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Banners Promocionales</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Publicidad visual en el inicio</p>
            </div>
          </div>

          <form onSubmit={handleAddBanner} className="flex flex-col md:flex-row gap-6 mb-12 bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100">
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título del Banner</label>
              <input 
                className="w-full bg-white border-2 border-transparent p-4 rounded-2xl outline-none focus:border-teal-500 transition-all font-bold text-sm" 
                placeholder="Ej: Oferta de Verano" 
                value={bannerTitle} 
                onChange={e => setBannerTitle(e.target.value)} 
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Imagen del Banner</label>
              <div className="relative">
                <input 
                    type="file" 
                    ref={bannerInputRef} 
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-slate-900 file:text-white hover:file:bg-black cursor-pointer bg-white p-1.5 rounded-2xl border-2 border-transparent focus:border-teal-500" 
                />
              </div>
            </div>
            <button 
                type="submit" 
                disabled={isUploadingBanner} 
                className="bg-teal-600 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 self-end disabled:opacity-50 uppercase tracking-widest active:scale-95"
            >
              {isUploadingBanner ? <Loader2 className="animate-spin" /> : 'Subir Banner'}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {banners.length > 0 ? banners.map(banner => (
                <div key={banner.id} className="relative group rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 aspect-video bg-slate-100">
                  <img src={banner.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={banner.title} />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 backdrop-blur-[2px]">
                    <p className="text-white font-black text-center mb-5 text-sm uppercase tracking-tight leading-tight">{banner.title || 'Sin Título'}</p>
                    <button 
                        onClick={() => onDeleteBanner(banner.id)} 
                        className="bg-red-500 text-white p-4 rounded-2xl hover:bg-red-600 transition-all shadow-lg shadow-red-500/30 active:scale-90"
                        title="Eliminar Banner"
                    >
                        <Trash2 size={24}/>
                    </button>
                  </div>
                </div>
            )) : (
                <div className="col-span-full py-20 text-center bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
                    <ImageIcon size={48} className="mx-auto text-slate-200 mb-3" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay banners publicados</p>
                </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMarketing;
