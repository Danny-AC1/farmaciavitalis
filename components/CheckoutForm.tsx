import React, { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronDown, Navigation, Loader2, CheckCircle2, AlertCircle, Move, Maximize2, Check, X } from 'lucide-react';
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

const MACHALILLA_CENTER: [number, number] = [-1.4836, -80.7733];

const CheckoutForm: React.FC<CheckoutFormProps> = ({
  formData, handleInputChange, setFormData, ciudadelas, selectedCiudadela, setSelectedCiudadela, onCancel, onNextStep
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);
  
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const mapContainerId = "checkout-map-container";

  // Efecto para redimensionar el mapa cuando cambia a pantalla completa
  useEffect(() => {
    if (mapRef.current) {
      // Forzar a Leaflet a reconocer el nuevo tamaño del contenedor (fixed vs relative)
      setTimeout(() => {
        mapRef.current.invalidateSize();
        if (isMapFullscreen && markerRef.current) {
          mapRef.current.setView(markerRef.current.getLatLng(), mapRef.current.getZoom());
        }
      }, 100);
    }
    
    // Bloquear el scroll del body cuando el mapa está en fullscreen
    if (isMapFullscreen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = '';
    }
    
    return () => { document.body.style.overflow = ''; };
  }, [isMapFullscreen]);

  useEffect(() => {
    // @ts-ignore
    const L = window.L;
    if (!L) return;

    if (!mapRef.current) {
      const initialLat = formData.lat || MACHALILLA_CENTER[0];
      const initialLng = formData.lng || MACHALILLA_CENTER[1];

      mapRef.current = L.map(mapContainerId, {
        zoomControl: false,
        tap: false 
      }).setView([initialLat, initialLng], 16);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(mapRef.current);

      L.control.zoom({ position: 'bottomright' }).addTo(mapRef.current);

      const customIcon = L.divIcon({
        className: 'custom-div-icon',
        html: `<div style="background-color: #0d9488; width: 34px; height: 34px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 4px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center;">
                 <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
               </div>`,
        iconSize: [34, 46],
        iconAnchor: [17, 46]
      });

      markerRef.current = L.marker([initialLat, initialLng], {
        draggable: true,
        icon: customIcon
      }).addTo(mapRef.current);

      markerRef.current.on('dragend', (event: any) => {
        const marker = event.target;
        const position = marker.getLatLng();
        setFormData({
          ...formData,
          lat: position.lat,
          lng: position.lng
        });
      });

      if (!formData.lat || !formData.lng) {
        setFormData({ ...formData, lat: initialLat, lng: initialLng });
      }
    }
  }, []);

  const handleGetLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!navigator.geolocation) return alert("Navegador no compatible.");

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo([latitude, longitude], 17);
          markerRef.current.setLatLng([latitude, longitude]);
          setFormData({ ...formData, lat: latitude, lng: longitude });
        }
        setIsLocating(false);
        setLocationSuccess(true);
        setTimeout(() => setLocationSuccess(false), 3000);
      },
      () => { // Se eliminó 'error' para limpiar la advertencia de la línea 115
        setIsLocating(false);
        setLocationError("GPS no disponible. Mueve el pin manualmente.");
      },
      { timeout: 10000 }
    );
  };

  const confirmLocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMapFullscreen(false);
    setLocationSuccess(true);
    setTimeout(() => setLocationSuccess(false), 3000);
  };

  const openFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMapFullscreen(true);
  };

  const closeFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsMapFullscreen(false);
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

      <div className="bg-slate-50 rounded-[1.5rem] p-4 border-2 border-dashed border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div>
                <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight flex items-center gap-2">
                  Punto de Entrega <Move size={14} className="text-teal-500 animate-pulse" />
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Ubica tu casa exactamente en el mapa</p>
            </div>
            <button 
                type="button" 
                onClick={handleGetLocation}
                disabled={isLocating}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-md active:scale-95 ${locationSuccess ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
            >
                {/* Fixed escaped quotes in className and redundant backslashes on line 192 */}
                {isLocating ? <Loader2 size={16} className="animate-spin" /> : locationSuccess ? <CheckCircle2 size={16} /> : <Navigation size={16} />}
                {isLocating ? 'Buscando...' : locationSuccess ? 'Ubicado' : 'Detectar GPS'}
            </button>
        </div>

        {locationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-[10px] font-black text-red-600 uppercase tracking-tighter animate-in fade-in">
            <AlertCircle size={14}/>
            <span>{locationError}</span>
          </div>
        )}

        {/* Contenedor del Mapa */}
        <div 
          className={`relative overflow-hidden ${isMapFullscreen ? 'fixed inset-0 !m-0 !p-0 rounded-none z-[9999] bg-white' : 'w-full h-48 md:h-56 rounded-2xl border-2 border-white shadow-xl'}`}
        >
           <div id={mapContainerId} className="w-full h-full absolute inset-0 z-0"></div>
           
           {isMapFullscreen ? (
             <div className="absolute inset-0 pointer-events-none z-[10000]">
               <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                  <div className="bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-2xl shadow-2xl pointer-events-auto border border-white/20">
                    <p className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                       <Move size={14} className="text-teal-400" /> Mueve el pin a tu casa
                    </p>
                    <p className="text-slate-400 text-[9px] font-bold uppercase mt-1">Acércate lo más posible</p>
                  </div>
                  <button 
                    type="button"
                    onClick={closeFullscreen}
                    className="p-3 bg-white text-slate-900 rounded-2xl shadow-2xl pointer-events-auto hover:bg-slate-50 active:scale-95 transition-all border border-slate-200"
                  >
                    <X size={24} />
                  </button>
               </div>

               <div className="absolute bottom-10 left-6 right-6 flex flex-col gap-4 items-center">
                  <div className="bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white flex items-center gap-2 pointer-events-auto">
                    <MapPin size={14} className="text-teal-600"/>
                    <span className="text-[10px] font-black text-slate-700 uppercase">
                      Coords: {formData.lat?.toFixed(5)}, {formData.lng?.toFixed(5)}
                    </span>
                  </div>
                  <button 
                    type="button"
                    onClick={confirmLocation}
                    className="w-full max-w-sm bg-teal-600 text-white py-5 rounded-[2rem] font-black text-sm uppercase tracking-[0.2em] shadow-[0_20px_50px_rgba(13,148,136,0.6)] pointer-events-auto flex items-center justify-center gap-3 hover:bg-teal-700 active:scale-95 transition-all border-4 border-white"
                  >
                    <CheckCircle2 size={24} /> CONFIRMAR PUNTO
                  </button>
               </div>
             </div>
           ) : (
             <div 
                className="absolute inset-0 bg-teal-900/10 flex flex-col items-center justify-center group hover:bg-teal-900/20 transition-all cursor-pointer z-10"
                onClick={openFullscreen}
             >
                <div className="bg-white/95 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 transform transition-transform group-hover:scale-105">
                  <Maximize2 size={14} className="text-teal-600" />
                  <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest">Toca para ampliar mapa</span>
                </div>
             </div>
           )}
        </div>
      </div>

      <div>
        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">Referencia Exacta / Dirección</label>
        <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full border-2 border-gray-100 rounded-xl p-3 outline-none focus:border-teal-500 transition-all font-bold text-slate-800" placeholder="Ej: Frente a la cancha, casa color crema" />
      </div>
      
      <div className="mt-8 flex gap-3 pt-4 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="w-1/3 bg-white border-2 border-gray-100 text-gray-400 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">Cancelar</button>
        <button type="submit" className="w-2/3 bg-teal-600 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-transform active:scale-95">Elegir Método de Pago &rarr;</button>
      </div>
      
      <style>{`
        .leaflet-container { font-family: inherit; width: 100% !important; height: 100% !important; z-index: 1; }
        .custom-div-icon { background: none; border: none; }
        .leaflet-bar { border: none !important; box-shadow: 0 4px 6px rgba(0,0,0,0.1) !important; }
        .leaflet-bar a { background-color: white !important; color: #0d9488 !important; border: 1px solid #f1f5f9 !important; }
        .leaflet-control-zoom { margin-bottom: 20px !important; margin-right: 20px !important; }
        
        /* Forzar visibilidad absoluta en fullscreen rompiendo el overflow del modal */
        :global(.fixed.inset-0:has(#checkout-map-container)) {
            z-index: 9999 !important;
        }

        /* Si el mapa está en fullscreen, forzamos al modal padre a no tener transform que rompa el 'fixed' */
        ${isMapFullscreen ? `
            :global(.animate-in.zoom-in) {
                transform: none !important;
                max-height: none !important;
                overflow: visible !important;
            }
        ` : ''}
        
        .leaflet-pane { z-index: 2 !important; }
        .leaflet-top, .leaflet-bottom { z-index: 3 !important; }
      `}</style>
    </form>
  );
};

export default CheckoutForm;