import React from 'react';
import { Trash2 } from 'lucide-react';
import { Banner } from '../../../types';

interface BannerCardProps {
  banner: Banner;
  onDelete: (id: string) => void;
}

export const BannerCard: React.FC<BannerCardProps> = ({ banner, onDelete }) => {
  const handleDeleteClick = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar este banner? Se quitará de la pantalla de inicio del cliente inmediatamente.`)) {
      onDelete(banner.id);
    }
  };

  return (
    <div className="relative group rounded-[2rem] overflow-hidden shadow-xs border border-slate-150 aspect-video bg-slate-50 hover:shadow-md transition-all duration-300" id={`banner-card-${banner.id}`}>
      
      {/* Banner image with hover scaling */}
      <img 
        src={banner.image} 
        alt={banner.title || 'Anuncio'} 
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
        referrerPolicy="no-referrer"
      />

      {/* Glossy Backdrop with Action Layer */}
      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4 backdrop-blur-[2px]">
        
        {/* Banner Title */}
        <p className="text-white font-black text-center mb-4 text-xs uppercase tracking-tight leading-tight max-w-[200px]">
          {banner.title || 'Anuncio Promocional'}
        </p>

        {/* Delete Trigger */}
        <button 
          onClick={handleDeleteClick} 
          className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl transition-all shadow-lg shadow-red-500/20 active:scale-90"
          title="Eliminar Banner"
        >
          <Trash2 size={18} />
        </button>

      </div>

      {/* Subtle Active Badge in Corner */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-full border border-slate-100 flex items-center gap-1 shadow-xs pointer-events-none">
        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
        <span className="text-[9px] font-black uppercase text-slate-700 tracking-wider">Activo</span>
      </div>

    </div>
  );
};
