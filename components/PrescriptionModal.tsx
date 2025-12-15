import React, { useState } from 'react';
import { X, Camera, Send, Loader2, UploadCloud } from 'lucide-react';
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
        // 1. Subir a Firebase
        const path = `prescriptions/${Date.now()}_${file.name}`;
        const url = await uploadImageToStorage(file, path);
        
        // 2. Construir link de WhatsApp
        const phoneNumber = "593998506160";
        const message = `Hola Farmacia Vitalis 💊. Adjunto mi receta médica para cotizar: ${url}`;
        const waLink = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        
        // 3. Redirigir
        window.open(waLink, '_blank');
        onClose();
    } catch (error) {
        alert("Error al subir la imagen. Intenta de nuevo.");
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in duration-200">
        <div className="p-4 bg-teal-600 text-white flex justify-between items-center">
            <h3 className="font-bold text-lg flex items-center gap-2">
                <Camera className="h-5 w-5" /> Subir Receta Médica
            </h3>
            <button onClick={onClose}><X className="h-6 w-6" /></button>
        </div>
        
        <div className="p-6 flex flex-col items-center">
            {!preview ? (
                <label className="w-full h-64 border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50 transition-colors bg-gray-50">
                    <UploadCloud className="h-16 w-16 text-gray-400 mb-2" />
                    <span className="text-gray-600 font-bold">Toca para tomar foto</span>
                    <span className="text-xs text-gray-400 mt-1">o seleccionar de galería</span>
                    <input 
                        type="file" 
                        accept="image/*" 
                        capture="environment" 
                        className="hidden" 
                        onChange={handleFileChange} 
                    />
                </label>
            ) : (
                <div className="relative w-full h-64 rounded-xl overflow-hidden border border-gray-200">
                    <img src={preview} alt="Receta" className="w-full h-full object-contain bg-black" />
                    <button 
                        onClick={() => { setFile(null); setPreview(''); }}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full shadow"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <p className="text-sm text-center text-gray-500 mt-4 px-4">
                Subiremos tu foto y te redirigiremos a WhatsApp para que nuestro farmacéutico la revise.
            </p>

            <button 
                onClick={handleSend}
                disabled={!file || isUploading}
                className="mt-6 w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-teal-600/20"
            >
                {isUploading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-5 w-5" />}
                {isUploading ? "Procesando..." : "Enviar a WhatsApp"}
            </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;