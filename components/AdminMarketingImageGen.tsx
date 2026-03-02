
import React, { useState, useEffect } from 'react';
import { Loader2, Image as ImageIcon, Download, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

interface AdminMarketingImageGenProps {
  product: Product | undefined;
  isGeneratingPost: boolean;
}

const AdminMarketingImageGen: React.FC<AdminMarketingImageGenProps> = ({ product, isGeneratingPost }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!product) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const prompt = `Crea una imagen publicitaria de alto impacto para una farmacia. 
      Producto: ${product.name}. 
      Categoría: ${product.category}.
      Estilo: Profesional, limpio, moderno, colores vibrantes pero médicos. 
      La imagen debe ser atractiva para redes sociales y mostrar el concepto de salud y bienestar relacionado con el producto. 
      Sin texto excesivo, enfocado en la calidad visual.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
          }
        }
      });

      let imageUrl = null;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          imageUrl = `data:image/png;base64,${part.inlineData.data}`;
          break;
        }
      }

      if (imageUrl) {
        setGeneratedImageUrl(imageUrl);
      } else {
        throw new Error("No se pudo generar la imagen");
      }
    } catch (err) {
      console.error("Error generating image:", err);
      setError("Error al generar la imagen. Inténtalo de nuevo.");
    } finally {
      setIsGenerating(false);
    }
  };

  // Trigger generation when a post is being generated
  useEffect(() => {
    if (isGeneratingPost && product) {
      setGeneratedImageUrl(null); // Clear previous image to show loading state
      generateImage();
    }
  }, [isGeneratingPost]);

  // Reset image when product changes
  useEffect(() => {
    setGeneratedImageUrl(null);
  }, [product?.id]);

  if (!product) return null;

  return (
    <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
            <ImageIcon size={18} />
          </div>
          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Imagen Publicitaria IA</h4>
        </div>
        {generatedImageUrl && (
          <button 
            onClick={generateImage}
            disabled={isGenerating}
            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-800 transition disabled:opacity-50"
          >
            <RefreshCw size={12} className={isGenerating ? "animate-spin" : ""} /> Regenerar
          </button>
        )}
      </div>

      <div className="relative aspect-square w-full bg-slate-100 rounded-[2rem] overflow-hidden border-2 border-dashed border-slate-200 flex flex-col items-center justify-center group">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-indigo-600" size={40} />
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Diseñando imagen de impacto...</p>
          </div>
        ) : generatedImageUrl ? (
          <>
            <img 
              src={generatedImageUrl} 
              alt={`Publicidad de ${product.name}`} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
              <a 
                href={generatedImageUrl} 
                download={`publicidad-${product.name.toLowerCase().replace(/\s+/g, '-')}.png`}
                className="bg-white text-slate-900 p-3 rounded-2xl font-black flex items-center gap-2 hover:scale-110 transition shadow-xl"
              >
                <Download size={20} />
              </a>
            </div>
          </>
        ) : (
          <div className="text-center p-8">
            <div className="bg-slate-200 p-4 rounded-full inline-block mb-3 text-slate-400">
              <ImageIcon size={32} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">La imagen se generará automáticamente con el copy</p>
            <button 
              onClick={generateImage}
              className="mt-4 text-[10px] font-black text-indigo-600 border-2 border-indigo-600 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition"
            >
              Generar ahora
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-[10px] font-bold text-red-500 uppercase tracking-tight text-center">{error}</p>
      )}
    </div>
  );
};

export default AdminMarketingImageGen;
