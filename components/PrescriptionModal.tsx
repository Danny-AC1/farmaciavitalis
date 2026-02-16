import React, { useState } from 'react';
import { X, Send, Loader2, UploadCloud, Image as ImageIcon, Info } from 'lucide-react';
import { uploadImageToStorage } from '../services/db';

interface PrescriptionModalProps {
  onClose: () => void;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ onClose }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSend = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
        // En una app real subiríamos a un servidor. 
        // Aquí simulamos que procesamos la imagen para validación local.
        await uploadImageToStorage(file, `prescriptions/${Date.now()}_${file.name}`);
        
        // CONSTRUCCIÓN DEL LINK CORREGIDA: 
        // No enviamos el Base64 por URL porque rompe el límite de caracteres de los navegadores.
        const phoneNumber = "593998506160";
        const message = `Hola Farmacia Vitalis 💊. Tengo mi receta médica lista para cotizar. ¿Podrían ayudarme?`;
        const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // Redirigir a WhatsApp
        window.open(waLink, '_blank');
        onClose();
    } catch (error) {
        alert("Error al procesar la imagen. Intenta de nuevo.");
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-5 bg-teal-600 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                    <ImageIcon className="h-5 w-5" />
                </div>
                <h3 className="font-black text-sm uppercase tracking-widest">Enviar Receta</h3>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="h-6 w-6" /></button>
        </div>
        
        <div className="p-8 flex flex-col items-center">
            {!preview ? (
                <label className="w-full h-72 border-4 border-dashed border-slate-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-all bg-slate-50 group">
                    <div className="bg-white p-6 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <UploadCloud className="h-12 w-12 text-teal-600" />
                    </div>
                    <span className="text-slate-800 font-black uppercase text-xs tracking-widest">Seleccionar Receta</span>
                    <span className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-tighter">Cámara o Galería de Fotos</span>
                    {/* Eliminado capture="environment" para permitir elegir archivos locales */}
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                </label>
            ) : (
                <div className="relative w-full h-72 rounded-[2rem] overflow-hidden border-4 border-slate-100 shadow-inner group">
                    <img src={preview} alt="Receta" className="w-full h-full object-cover" />
                    <button 
                        onClick={() => { setFile(null); setPreview(''); }}
                        className="absolute top-4 right-4 bg-red-500 text-white p-2 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest text-center">Vista previa de tu receta</p>
                    </div>
                </div>
            )}

            <div className="mt-6 bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info className="text-blue-500 shrink-0 mt-0.5" size={16}/>
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase tracking-tight">
                    Por favor, adjunta la imagen manualmente en el chat de WhatsApp que se abrirá a continuación.
                </p>
            </div>

            <button 
                onClick={handleSend}
                disabled={!file || isUploading}
                className="mt-8 w-full bg-slate-900 hover:bg-black text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl active:scale-95"
            >
                {isUploading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5 text-teal-400" />}
                {isUploading ? "Procesando..." : "Abrir WhatsApp"}
            </button>
            
            <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                Vitalis Machalilla • Atención Inmediata
            </p>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;