
import React, { useState } from 'react';
import { MapPin, ChevronDown, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { CheckoutFormData, Ciudadela } from '../types';

interface CheckoutFormProps {
  formData: CheckoutFormData;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: (f: CheckoutFormData) => void;
  ciudadelas: Ciudadela[];
  selectedCiudadela: Ciudadela | null;
  setSelectedCiudadela: (c: Ciudadela | null) => void;
  onCancel: () => void;
  onNextStep: (e: React.FormEvent) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  formData, handleInputChange, setFormData, ciudadelas, selectedCiudadela, setSelectedCiudadela, onCancel, onNextStep
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      return alert("Tu navegador no soporta geolocalización.");
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData({
          ...formData,
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setIsLocating(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      (error) => {
        setIsLocating(false);
        alert("No se pudo obtener tu ubicación. Por favor, asegúrate de dar permisos de GPS.");
        console.error(error);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <form onSubmit={onNextStep} className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Tu Nombre</label>
          <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 transition-all font-bold text-slate-800" placeholder="Ej: Juan Pérez" />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Teléfono de contacto</label>
          <input required name="phone" type="tel" value={formData.phone} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 transition-all font-bold text-slate-800" placeholder="099..." />
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1 flex items-center gap-2">
          <MapPin size={14} className="text-teal-600"/> Ciudadela / Sector en Machalilla
        </label>
        <div className="relative">
          <select 
            className="w-full border-2 border-teal-50 bg-slate-50 rounded-xl p-4 font-black text-slate-800 outline-none focus:border-teal-500 transition-all appearance-none cursor-pointer"
            value={selectedCiudadela?.id || ''}
            onChange={(e) => setSelectedCiudadela(ciudadelas.find(c => c.id === e.target.value) || null)}
          >
            {ciudadelas.map(c => (
              <option key={c.id} value={c.id}>{c.name.toUpperCase()} (Envío: ${c.price.toFixed(2)})</option>
            ))}
          </select>
          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-teal-600 pointer-events-none" size={20}/>
        </div>
      </div>

      {/* Selector de Ubicación GPS */}
      <div className="bg-slate-50 rounded-[1.5rem] p-4 border-2 border-dashed border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Punto de Entrega Exacto</h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Usa tu GPS para que lleguemos más rápido</p>
            </div>
            <button 
                type="button" 
                onClick={handleGetLocation}
                disabled={isLocating}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${locationSuccess ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
                {isLocating ? <Loader2 size={16} className="animate-spin"/> : locationSuccess ? <CheckCircle2 size={16}/> : <Navigation size={16}/>}
                {isLocating ? 'Obteniendo...' : locationSuccess ? 'Ubicación Fijada' : 'Fijar mi GPS Actual'}
            </button>
        </div>

        {formData.lat && formData.lng ? (
            <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-white shadow-inner animate-in zoom-in-95">
                <iframe 
                    title="Ubicación de entrega"
                    className="w-full h-full border-0 grayscale-[0.3] contrast-[1.1]"
                    src={`https://www.google.com/maps?q=${formData.lat},${formData.lng}&z=17&output=embed`}
                    allowFullScreen
                    loading="lazy"
                ></iframe>
                <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-black/5 rounded-2xl"></div>
                <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm p-2 rounded-lg text-[9px] font-black text-teal-700 uppercase flex items-center gap-1">
                    <MapPin size={10}/> Coordenadas guardadas correctamente
                </div>
            </div>
        ) : (
            <div className="w-full h-24 flex flex-col items-center justify-center text-slate-300">
                <MapPin size={32} className="opacity-20 mb-1"/>
                <p className="text-[9px] font-bold uppercase tracking-widest">Mapa pendiente de anclaje</p>
            </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Referencia Exacta / Dirección</label>
        <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 transition-all font-bold text-slate-800" placeholder="Ej: Frente a la cancha principal, casa color crema" />
      </div>
      
      <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="w-1/3 bg-white border-2 border-gray-100 text-gray-400 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-transform active:scale-95">Elegir Método de Pago &rarr;</button>
      </div>
    </form>
  );
};

export default CheckoutForm;
