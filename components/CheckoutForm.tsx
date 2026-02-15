
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Navigation, Loader2, CheckCircle2, AlertCircle, Move } from 'lucide-react';
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

// Coordenadas por defecto (Machalilla Centro)
const MACHALILLA_CENTER: [number, number] = [-1.4836, -80.7733];

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  formData, handleInputChange, setFormData, ciudadelas, selectedCiudadela, setSelectedCiudadela, onCancel, onNextStep
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerId = "checkout-map-container";

  // Inicializar el mapa
  useEffect(() => {
    // @ts-ignore - Leaflet viene de window por el CDN
    const L = window.L;
    if (!L) return;

    if (!mapRef.current) {
      const initialLat = formData.lat || MACHALILLA_CENTER[0];
      const initialLng = formData.lng || MACHALILLA_CENTER[1];

      mapRef.current = L.map(mapContainerId, {
        zoomControl: false
      }).setView([initialLat, initialLng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      // Crear el marcador arrastrable
      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #0d9488; width: 30px; height: 30px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                 <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
               </div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42]
      });

      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(mapRef.current);

      // Evento al terminar de arrastrar
      markerRef.current.on('dragend', (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        setFormData({
          ...formData,
          lat: position.lat,
          lng: position.lng
        });
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 2000);
      });

      // Si el usuario ya tiene coordenadas, guardarlas al iniciar si no existen
      if (!formData.lat || !formData.lng) {
        setFormData({ ...formData, lat: initialLat, lng: initialLng });
      }
    }

    return () => {
      // No destruimos el mapa aquí para evitar parpadeos si hay re-renders de React
    };
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return alert("Navegador no compatible.");

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
          
          setFormData({
            ...formData,
            lat: latitude,
            lng: longitude
          });
        }
        setIsLocating(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      (error) => {
        setIsLocating(false);
        setLocationError("Ubicación por GPS no disponible. Mueve el pin manualmente.");
        console.error(error);
      },
      { timeout: 10000 }
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

      {/* Selector de Ubicación Interactiva */}
      <div className="bg-slate-50 rounded-[1.5rem] p-4 border-2 border-dashed border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                  Selecciona tu Ubicación <Move size={14} className="text-teal-500 animate-pulse" />
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Arrastra el marcador hacia tu puerta</p>
            </div>
            <button 
                type="button" 
                onClick={handleGetLocation}
                disabled={isLocating}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${locationSuccess ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
                {isLocating ? <Loader2 size={16} className="animate-spin"/> : locationSuccess ? <CheckCircle2 size={16}/> : <Navigation size={16}/>}
                {isLocating ? 'Capturando...' : locationSuccess ? '¡Confirmado!' : 'Detectar mi GPS'}
            </button>
        </div>

        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-[10px] font-black text-red-600 uppercase tracking-tighter animate-in fade-in">
            <AlertCircle size={14}/>
            <span>{locationError}</span>
          </div>
        )}

        <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden border-2 border-white shadow-xl">
           <div id={mapContainerId} className="w-full h-full z-0"></div>
           
           <div className="absolute top-2 left-2 right-2 z-[10] pointer-events-none">
              <div className="bg-teal-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg inline-flex items-center gap-2 text-[8px] font-black text-white uppercase tracking-widest shadow-lg">
                <div className="w-2 h-2 bg-teal-400 rounded-full animate-ping"></div>
                Arrastra el pin al punto exacto
              </div>
           </div>

           <div className="absolute bottom-2 left-2 z-[10] bg-white/90 backdrop-blur-sm p-2 rounded-lg text-[8px] font-black text-slate-500 uppercase flex items-center gap-1 shadow-md">
                <MapPin size={10} className="text-teal-600"/> 
                LAT: {formData.lat?.toFixed(5)} | LNG: {formData.lng?.toFixed(5)}
           </div>
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Referencia Exacta / Dirección</label>
        <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 transition-all font-bold text-slate-800" placeholder="Ej: Frente a la cancha, casa color crema" />
      </div>
      
      <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="w-1/3 bg-white border-2 border-gray-100 text-gray-400 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-500/20 transition-transform active:scale-95">Elegir Método de Pago &rarr;</button>
      </div>
      
      <style>{`
        .leaflet-container { font-family: inherit; }
        .custom-div-icon { background: none; border: none; }
        .leaflet-bar { border: none !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important; }
        .leaflet-bar a { background-color: white !important; color: #0d9488 !important; border: 1px solid #f1f5f9 !important; }
        .leaflet-bar a:first-child { border-top-left-radius: 12px !important; border-top-right-radius: 12px !important; }
        .leaflet-bar a:last-child { border-bottom-left-radius: 12px !important; border-bottom-right-radius: 12px !important; }
      `}</style>
    </form>
  );
};

export default CheckoutForm;
