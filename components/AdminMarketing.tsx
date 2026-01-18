
import React from 'react';
import { Megaphone, Sparkles, Loader2, BookOpen, Instagram, MessageCircle, Image as ImageIcon, Trash2, Ticket, Plus } from 'lucide-react';
import { Product, Banner, Coupon } from '../types';

interface AdminMarketingProps {
  products: Product[];
  banners: Banner[];
  coupons: Coupon[];
  blogTopic: string;
  setBlogTopic: (s: string) => void;
  handleGenerateBlog: () => void;
  isGenerating: boolean;
  marketingProduct: string;
  setMarketingProduct: (s: string) => void;
  postPlatform: 'INSTAGRAM' | 'WHATSAPP';
  setPostPlatform: (p: 'INSTAGRAM' | 'WHATSAPP') => void;
  generatedPost: string;
  handleGeneratePost: () => void;
  bannerTitle: string;
  setBannerTitle: (s: string) => void;
  bannerInputRef: React.RefObject<HTMLInputElement>;
  handleAddBanner: (e: React.FormEvent) => void;
  onDeleteBanner: (id: string) => void;
  isUploadingBanner: boolean;
  onAddCoupon?: () => void;
  onDeleteCoupon?: (id: string) => void;
}

const AdminMarketing: React.FC<AdminMarketingProps> = ({
  products, banners, coupons, blogTopic, setBlogTopic, handleGenerateBlog, isGenerating,
  marketingProduct, setMarketingProduct, postPlatform, setPostPlatform, generatedPost,
  handleGeneratePost, bannerTitle, setBannerTitle, bannerInputRef, handleAddBanner,
  onDeleteBanner, isUploadingBanner, onAddCoupon, onDeleteCoupon
}) => {
  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex items-center gap-3 mb-2">
          <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
              <Megaphone size={24} />
          </div>
          <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Marketing & Contenido IA</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Generación de demanda inteligente</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generador de Blog */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <BookOpen className="text-teal-600" size={20}/> Consejos de Salud
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase mb-4 tracking-tight">Escribe artículos automáticos con IA</p>
          <div className="space-y-4">
            <input 
              className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" 
              placeholder="Tema (Ej: Beneficios de la Vitamina C)" 
              value={blogTopic} 
              onChange={e => setBlogTopic(e.target.value)} 
            />
            <button 
              onClick={handleGenerateBlog} 
              disabled={isGenerating || !blogTopic}
              className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 disabled:opacity-50"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18}/>} GENERAR Y PUBLICAR
            </button>
          </div>
        </div>

        {/* Generador de Redes Sociales */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2 text-lg">
            <Instagram className="text-pink-600" size={20}/> Copy para Redes
          </h3>
          <p className="text-xs text-slate-400 font-bold uppercase mb-4 tracking-tight">Publicidad persuasiva para productos</p>
          <div className="space-y-4">
            <select 
              className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500" 
              value={marketingProduct} 
              onChange={e => setMarketingProduct(e.target.value)}
            >
              <option value="">-- Selecciona un Producto --</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex gap-2">
              <button onClick={() => setPostPlatform('INSTAGRAM')} className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-black uppercase transition ${postPlatform === 'INSTAGRAM' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}><Instagram size={14}/> Instagram</button>
              <button onClick={() => setPostPlatform('WHATSAPP')} className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 text-xs font-black uppercase transition ${postPlatform === 'WHATSAPP' ? 'border-green-500 bg-green-50 text-green-600' : 'border-slate-50 bg-slate-50 text-slate-400'}`}><MessageCircle size={14}/> WhatsApp</button>
            </div>
            <button onClick={handleGeneratePost} disabled={isGenerating || !marketingProduct} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition shadow-lg disabled:opacity-50">
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18}/>} CREAR PUBLICIDAD
            </button>
            {generatedPost && (
              <div className="mt-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 text-sm font-medium text-slate-600 whitespace-pre-wrap leading-relaxed">
                {generatedPost}
              </div>
            )}
          </div>
        </div>

        {/* Gestión de Cupones */}
        <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-black text-slate-800 flex items-center gap-2 text-lg">
                    <Ticket className="text-amber-500" size={20}/> Cupones de Descuento
                </h3>
                <button 
                  onClick={onAddCoupon}
                  className="text-[10px] font-black text-teal-600 bg-teal-50 px-3 py-1.5 rounded-xl flex items-center gap-1 hover:bg-teal-100 uppercase tracking-widest"
                >
                    <Plus size={12}/> Crear Cupón
                </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {coupons.length === 0 ? (
                    <div className="col-span-full py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <Ticket size={32} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs font-bold text-slate-400 uppercase">No hay cupones activos</p>
                    </div>
                ) : (
                    coupons.map(coupon => (
                        <div key={coupon.id} className="bg-slate-900 p-4 rounded-2xl relative overflow-hidden group border border-slate-800">
                             <div className="relative z-10">
                                 <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest block mb-1">CÓDIGO</span>
                                 <p className="text-xl font-black text-white tracking-tighter">{coupon.code}</p>
                                 <div className="mt-3 flex justify-between items-end">
                                     <span className="text-xs font-bold text-slate-400">{coupon.type === 'PERCENTAGE' ? `${coupon.value}% OFF` : `$${coupon.value} OFF`}</span>
                                     <button 
                                      onClick={() => onDeleteCoupon?.(coupon.id)}
                                      className="text-red-400 p-1 hover:text-red-300 transition-colors"
                                     >
                                        <Trash2 size={14}/>
                                     </button>
                                 </div>
                             </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        {/* Gestión de Banners */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 lg:col-span-2">
          <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2 text-lg">
            <ImageIcon className="text-blue-600" size={20}/> Banners Promocionales
          </h3>
          <form onSubmit={handleAddBanner} className="flex flex-col md:flex-row gap-4 mb-10 bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100">
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Título del Banner</label>
              <input 
                className="w-full bg-white border-2 border-transparent p-4 rounded-2xl outline-none focus:border-teal-500 transition-all font-bold text-sm" 
                placeholder="Ej: Oferta de Verano" 
                value={bannerTitle} 
                onChange={e => setBannerTitle(e.target.value)} 
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Imagen de Alta Resolución</label>
              <div className="relative">
                <input 
                    type="file" 
                    ref={bannerInputRef} 
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-xl file:border-0 file:text-[10px] file:font-black file:bg-slate-900 file:text-white hover:file:bg-black cursor-pointer bg-white p-1 rounded-2xl" 
                />
              </div>
            </div>
            <button 
                type="submit" 
                disabled={isUploadingBanner} 
                className="bg-teal-600 text-white px-10 py-4 rounded-2xl font-black text-xs hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 self-end disabled:opacity-50 uppercase tracking-widest"
            >
              {isUploadingBanner ? <Loader2 className="animate-spin" /> : 'Subir Banner'}
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {banners.length > 0 && banners.map(banner => (
                <div key={banner.id} className="relative group rounded-[2rem] overflow-hidden shadow-sm border border-slate-100 aspect-video bg-slate-100">
                  <img src={banner.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={banner.title} />
                  <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-6 backdrop-blur-[2px]">
                    <p className="text-white font-black text-center mb-5 text-sm uppercase tracking-tight leading-tight">{banner.title || 'Sin Título'}</p>
                    <button 
                        onClick={() => onDeleteBanner(banner.id)} 
                        className="bg-red-500 text-white p-3 rounded-2xl hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                        title="Eliminar Banner"
                    >
                        <Trash2 size={20}/>
                    </button>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMarketing;
