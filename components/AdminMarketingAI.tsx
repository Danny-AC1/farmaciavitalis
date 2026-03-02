
import React from 'react';
import { Sparkles, Loader2, BookOpen, Instagram, MessageCircle, BrainCircuit } from 'lucide-react';
import { Product } from '../types';
import AdminPrintableAd from './AdminPrintableAd';
import AdminMarketingImageGen from './AdminMarketingImageGen';

interface AdminMarketingAIProps {
  products: Product[];
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
}

const AdminMarketingAI: React.FC<AdminMarketingAIProps> = ({
  products, blogTopic, setBlogTopic, handleGenerateBlog, isGenerating,
  marketingProduct, setMarketingProduct, postPlatform, setPostPlatform, generatedPost,
  handleGeneratePost
}) => {
  return (
    <div className="space-y-8 animate-in fade-in pb-20">
      <div className="flex items-center gap-3 mb-2">
          <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
              <BrainCircuit size={24} />
          </div>
          <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Marketing con IA</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inteligencia Artificial para tu Farmacia</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Generador de Blog */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
                <BookOpen size={24}/>
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Blog Automático</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Artículos de salud con IA</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tema del Artículo</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-transparent p-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" 
                  placeholder="Ej: Beneficios de la Vitamina C" 
                  value={blogTopic} 
                  onChange={e => setBlogTopic(e.target.value)} 
                />
            </div>
            <button 
              onClick={handleGenerateBlog} 
              disabled={isGenerating || !blogTopic}
              className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 disabled:opacity-50 active:scale-95"
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18}/>} GENERAR Y PUBLICAR EN BLOG
            </button>
          </div>
        </div>

        {/* Generador de Redes Sociales */}
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-pink-50 p-3 rounded-2xl text-pink-600">
                <Instagram size={24}/>
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Copy Creativo</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Publicidad persuasiva</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Producto a Promocionar</label>
                <select 
                  className="w-full bg-slate-50 border-none p-4 rounded-2xl font-bold text-sm text-slate-700 outline-none focus:ring-2 focus:ring-pink-500" 
                  value={marketingProduct} 
                  onChange={e => setMarketingProduct(e.target.value)}
                >
                  <option value="">-- Selecciona un Producto --</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                </select>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPostPlatform('INSTAGRAM')} className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${postPlatform === 'INSTAGRAM' ? 'border-pink-500 bg-pink-50 text-pink-600 shadow-sm' : 'border-slate-50 bg-slate-50 text-slate-400'}`}><Instagram size={14}/> Instagram</button>
              <button onClick={() => setPostPlatform('WHATSAPP')} className={`flex-1 py-3 rounded-xl border-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all ${postPlatform === 'WHATSAPP' ? 'border-green-500 bg-green-50 text-green-600 shadow-sm' : 'border-slate-50 bg-slate-50 text-slate-400'}`}><MessageCircle size={14}/> WhatsApp</button>
            </div>

            <button onClick={handleGeneratePost} disabled={isGenerating || !marketingProduct} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition shadow-lg disabled:opacity-50 active:scale-95">
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={18}/>} CREAR PUBLICIDAD CON IA
            </button>

            {generatedPost && (
              <div className="mt-4 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 text-sm font-medium text-slate-600 whitespace-pre-wrap leading-relaxed animate-in zoom-in duration-300">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Resultado Generado</span>
                    <Sparkles size={12} className="text-indigo-500"/>
                </div>
                {generatedPost}
              </div>
            )}

            <AdminMarketingImageGen 
              product={products.find(p => p.id === marketingProduct)} 
              isGeneratingPost={isGenerating}
            />
          </div>
        </div>

        {/* Publicidad Imprimible QR */}
        <AdminPrintableAd />
      </div>

      {/* Info Card */}
      <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex items-start gap-4">
          <div className="bg-white p-2 rounded-xl text-indigo-600 shadow-sm">
              <BrainCircuit size={20}/>
          </div>
          <div>
              <p className="text-xs font-black text-indigo-900 uppercase tracking-tight mb-1">¿Cómo funciona?</p>
              <p className="text-[10px] text-indigo-700 font-bold leading-relaxed uppercase">
                  Nuestra IA analiza tu catálogo y las tendencias de salud actuales para crear contenido que conecte con tus clientes. 
                  Los artículos de blog se publican automáticamente en la sección de consejos de la app.
              </p>
          </div>
      </div>
    </div>
  );
};

export default AdminMarketingAI;
