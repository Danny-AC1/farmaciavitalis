import React, { useState, useMemo, useRef } from 'react';
import { Plus, Upload, Loader2, Sparkles, Check } from 'lucide-react';
import { Category } from '../../../types';
import { getCategoryStyle } from '../../../utils/CategoryStyles';
import { uploadImageToStorage } from '../../../services/db.utils';

interface CategoryFormProps {
  categories: Category[];
  onSubmit: (cat: { name: string; image: string }) => Promise<void>;
}

export const CategoryForm: React.FC<CategoryFormProps> = ({ categories, onSubmit }) => {
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic Style Preview based on user typing
  const resolvedStyle = useMemo(() => {
    return getCategoryStyle(name || 'ejemplo');
  }, [name]);

  // Check if name already exists
  const isDuplicate = useMemo(() => {
    if (!name.trim()) return false;
    const cleanInput = name.trim().toLowerCase();
    return categories.some(c => c.name.toLowerCase() === cleanInput);
  }, [name, categories]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Compresses and uploads
      const url = await uploadImageToStorage(file, `categories/${Date.now()}`);
      setImage(url);
    } catch (error) {
      console.error("Error al cargar imagen de categoría:", error);
      alert("Hubo un problema al procesar la imagen. Intenta con otra.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || isDuplicate) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        image: image || ''
      });
      // Reset form
      setName('');
      setImage('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Error al guardar categoría:", err);
      alert("No se pudo agregar la categoría.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const IconComponent = resolvedStyle.icon;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col gap-6" id="category-creation-form">
      <div>
        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
          <Plus size={18} className="text-teal-600" />
          Nueva Categoría
        </h4>
        <p className="text-xs text-slate-500">Crea categorías de producto con asignación inteligente de estilo.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        
        {/* Name input */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Nombre Comercial / Clínico</label>
          <input
            type="text"
            required
            placeholder="Ej: Multivitamínicos, Cuidado de la Piel..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full border p-3 rounded-2xl text-sm bg-slate-50 focus:ring-2 outline-none transition-all ${
              isDuplicate 
                ? 'border-red-200 focus:ring-red-400 focus:border-red-400' 
                : 'border-slate-100 focus:ring-teal-500 focus:border-teal-500'
            }`}
          />
          {isDuplicate && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              ⚠️ Esta categoría ya existe.
            </span>
          )}
        </div>

        {/* Dynamic Image / Banner Link or File Uploader */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">Banner Ilustrativo (Opcional)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Pegar URL de imagen o subir archivo..."
              value={image}
              onChange={(e) => setImage(e.target.value)}
              className="flex-1 border border-slate-100 p-3 rounded-2xl text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition-all"
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

        {/* Real-time Style preview */}
        <div className="pt-2 border-t border-slate-50">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Vista Previa Interactiva (Para Clientes)</label>
          
          <div className="flex flex-col gap-3">
            {/* The reactive client-card preview */}
            <div className={`relative ${resolvedStyle.bg} border ${resolvedStyle.border} rounded-2xl p-4 transition-all duration-300 h-28 relative overflow-hidden flex flex-col justify-between`}>
              <div className="relative z-10">
                <div className={`p-2 rounded-xl w-fit mb-2 ${resolvedStyle.accent} bg-opacity-50`}>
                  <IconComponent className={`h-5 w-5 ${resolvedStyle.text}`} />
                </div>
                <h4 className={`font-black text-sm uppercase tracking-wide ${resolvedStyle.text}`}>{name || 'Categoría Vacía'}</h4>
              </div>
              <IconComponent className={`absolute -right-2 -bottom-2 h-16 w-16 ${resolvedStyle.text} opacity-10 transform rotate-12`} />
            </div>

            {/* Micro style feedback */}
            <p className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
              <Sparkles size={12} className="text-amber-500" />
              {name.trim() 
                ? `Estilo detectado: Tema de color ${resolvedStyle.text.split('-')[1]} con icono de ${IconComponent.name || 'sistema'}.`
                : 'Escribe un nombre para detectar automáticamente el estilo clínico ideal.'
              }
            </p>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={!name.trim() || isDuplicate || isSubmitting || isUploading}
          className="w-full bg-teal-600 text-white font-black p-3.5 rounded-2xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Check size={18} />
              Registrar Categoría
            </>
          )}
        </button>

      </form>
    </div>
  );
};
