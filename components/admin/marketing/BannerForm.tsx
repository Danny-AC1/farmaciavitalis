import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Upload, Loader2, Check } from 'lucide-react';
import { uploadImageToStorage } from '../../../services/db.utils';

interface BannerFormProps {
  onSubmit: (banner: { title: string; image: string; active: boolean }) => Promise<void>;
}

export const BannerForm: React.FC<BannerFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadImageToStorage(file, `banners/${Date.now()}`);
      setImageUrl(url);
    } catch (error) {
      console.error("Error al cargar imagen del banner:", error);
      alert("No se pudo cargar el archivo. Intenta con otra imagen.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim() || 'Banner Promocional',
        image: imageUrl.trim(),
        active: true
      });
      setTitle('');
      setImageUrl('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Error al registrar banner:", err);
      alert("No se pudo crear el banner.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col gap-6" id="banner-creation-form">
      <div>
        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
          <ImageIcon size={18} className="text-blue-600" />
          Nuevo Banner Carrusel
        </h4>
        <p className="text-xs text-slate-500">Publica anuncios visuales en la página de inicio para promociones activas.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        
        {/* Title Input */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Título del Banner (Opcional)</label>
          <input
            type="text"
            placeholder="Ej: Descuentos de Verano, Cuidado Dermatológico"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-100 p-3 rounded-2xl text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-semibold transition-all"
          />
        </div>

        {/* Image upload / url */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Imagen del Banner</label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              placeholder="Pegar enlace de imagen o subir archivo..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex-1 border border-slate-100 p-3 rounded-2xl text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-medium transition-all"
            />
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={triggerFileSelect}
              disabled={isUploading}
              className="px-4 bg-slate-50 border border-slate-100 text-slate-600 rounded-2xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs font-bold"
            >
              {isUploading ? (
                <Loader2 size={16} className="animate-spin text-teal-600" />
              ) : (
                <Upload size={16} />
              )}
            </button>
          </div>
        </div>

        {/* Real-time image preview */}
        {imageUrl.trim() && (
          <div className="pt-2 border-t border-slate-50">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Vista Previa de Imagen</label>
            <div className="relative rounded-2xl overflow-hidden border border-slate-100 aspect-video bg-slate-50">
              <img 
                src={imageUrl} 
                alt="Vista previa de banner" 
                className="w-full h-full object-cover"
                onError={() => console.log('Invalid image url')}
              />
            </div>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={!imageUrl.trim() || isSubmitting || isUploading}
          className="w-full bg-teal-600 text-white font-black p-3.5 rounded-2xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Check size={18} />
              Publicar Banner
            </>
          )}
        </button>

      </form>
    </div>
  );
};
