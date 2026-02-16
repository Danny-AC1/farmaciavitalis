
import React, { useState } from 'react';
import { MapPin, ChevronDown, CheckCircle2, MousePointer2 } from 'lucide-react';
import { CheckoutFormData, Ciudadela } from '../types';
import LocationPickerModal from './LocationPickerModal';

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
  const [showMapPicker, setShowMapPicker] = useState(false);
  const hasSelectedLocation = formData.lat && formData.lng;

  const handleLocationConfirm = (lat: number, lng: number) => {
    setFormData({ ...formData, lat, lng });
    setShowMapPicker(false);
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

      <div className="bg-slate-50 rounded-[1.5rem] p-5 border-2 border-dashed border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                  Ubicación de Entrega {hasSelectedLocation && <CheckCircle2 size={16} className="text-green-500" />}
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                   {hasSelectedLocation ? 'Punto GPS seleccionado correctamente' : 'Ubica tu casa exactamente en el mapa'}
                </p>
            </div>
            <button 
                type="button" 
                onClick={() => setShowMapPicker(true)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-[0.1em] transition-all shadow-lg active:scale-95 ${hasSelectedLocation ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
                <MousePointer2 size={16}/> {hasSelectedLocation ? 'CAMBIAR UBICACIÓN' : 'ABRIR MAPA'}
            </button>
        </div>

        {hasSelectedLocation && (
            <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-100 flex items-center gap-3 animate-in slide-in-from-top-2">
                <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600"><CheckCircle2 size={16}/></div>
                <div className="flex-grow">
                    <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Coordenadas del destino</p>
                    <p className="text-[10px] font-bold text-slate-700 tabular-nums">LAT: {formData.lat?.toFixed(5)} / LNG: {formData.lng?.toFixed(5)}</p>
                </div>
            </div>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Referencia Exacta / Dirección</label>
        <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 transition-all font-bold text-slate-800" placeholder="Ej: Frente a la cancha, casa color crema" />
      </div>
      
      <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="w-1/3 bg-white border-2 border-gray-100 text-gray-400 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-transform active:scale-95">Elegir Método de Pago &rarr;</button>
      </div>

      {/* El Modal del Mapa ahora vive fuera de los estilos restrictivos del formulario */}
      {showMapPicker && (
          <LocationPickerModal 
            initialLat={formData.lat}
            initialLng={formData.lng}
            onConfirm={handleLocationConfirm}
            onClose={() => setShowMapPicker(false)}
          />
      )}
    </form>
  );
};

export default CheckoutForm;
