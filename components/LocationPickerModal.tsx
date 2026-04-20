import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, Navigation, Loader2, Info, Map as MapIcon } from 'lucide-react';

interface LocationPickerModalProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

const MACHALILLA_CENTER: [number, number] = [-1.4836, -80.7733];

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ initialLat, initialLng, onConfirm, onClose }) => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState({ 
    lat: initialLat || MACHALILLA_CENTER[0], 
    lng: initialLng || MACHALILLA_CENTER[1] 
  });
  const [isLocating, setIsLocating] = useState(false);
  const mapContainerId = "fullscreen-picker-map";

  useEffect(() => {
    // Fix: Cast window.L to any to avoid 'unknown' type errors for Leaflet methods like map, tileLayer, divIcon, and marker
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      // ... init map ...
      mapRef.current = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false,
        tap: false,
        maxZoom: 20
      }).setView([currentCoords.lat, currentCoords.lng], 18);

      // Auto-locar si no hay ubicación previa
      if (!initialLat || !initialLng) {
          setTimeout(() => {
              handleGetLocation();
          }, 500);
      }

      // 2. INTEGRACIÓN DIRECTA CON GOOGLE MAPS (Híbrido: Satélite + Etiquetas)
      // Fix: Use cast any to access tileLayer property on global Leaflet object
      L.tileLayer('https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: 'Map data © Google'
      }).addTo(mapRef.current);

      // 3. Crear Icono Personalizado Vitalis
      // Fix: Use cast any to access divIcon property on global Leaflet object
      const customIcon = L.divIcon({
        className: 'custom-leaflet-pin',
        html: `<div class="pin-wrapper">
                 <div class="pin-main"></div>
                 <div class="pin-shadow"></div>
               </div>`,
        iconSize: [40, 40],
        iconAnchor: [20, 40]
      });

      // 4. Crear Marcador Arrastrable sobre Google Maps
      // Fix: Use cast any to access marker property on global Leaflet object
      markerRef.current = L.marker([currentCoords.lat, currentCoords.lng], {
        draggable: true,
        icon: customIcon,
        zIndexOffset: 1000
      }).addTo(mapRef.current);

      // 5. Sincronización de coordenadas al mover
      const updateCoords = (e: any) => {
        const pos = e.target.getLatLng();
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
      };

      markerRef.current.on('drag', updateCoords);
      markerRef.current.on('dragend', updateCoords);
    }

    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        if (mapRef.current && markerRef.current) {
          mapRef.current.flyTo([latitude, longitude], 19);
          markerRef.current.setLatLng([latitude, longitude]);
          setCurrentCoords({ lat: latitude, lng: longitude });
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col animate-in fade-in duration-300">
      {/* Header flotante optimizado para Google Maps */}
      <div className="absolute top-0 left-0 right-0 z-[1001] p-4 pointer-events-none">
        <div className="max-w-md mx-auto flex justify-between items-start">
            <div className="bg-white/95 backdrop-blur-md text-slate-900 px-4 py-3 rounded-[1.2rem] shadow-2xl pointer-events-auto border border-slate-200 flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-xl">
                  <MapIcon size={18} className="text-white" />
                </div>
                <div>
                    <h3 className="font-black text-[10px] uppercase tracking-widest text-blue-700 leading-none">Google Maps Engine</h3>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1 flex items-center gap-1">
                      <Info size={10} className="text-blue-500"/> Busca tu casa con precisión
                    </p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="bg-white text-slate-900 p-3 rounded-xl shadow-2xl pointer-events-auto hover:bg-slate-50 active:scale-90 transition-all border border-slate-100"
            >
                <X size={20} />
            </button>
        </div>
      </div>

      {/* Contenedor del Mapa (Google Maps) */}
      <div id={mapContainerId} className="flex-grow w-full relative z-0"></div>

      {/* Footer de confirmación REDUCIDO */}
      <div className="p-4 bg-white border-t border-slate-100 flex flex-col items-center gap-3 z-[1001] shadow-[0_-10px_30px_rgba(0,0,0,0.1)]">
          <div className="flex items-center gap-3 w-full max-w-md">
             <div className="flex-grow">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5 ml-1">Precisión GPS Vitalis</p>
                <p className="text-[11px] font-bold text-slate-700 tabular-nums bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 shadow-inner">
                  {currentCoords.lat.toFixed(6)}, {currentCoords.lng.toFixed(6)}
                </p>
             </div>
             <button 
                onClick={handleGetLocation}
                disabled={isLocating}
                className="bg-slate-100 text-blue-600 p-3 rounded-xl hover:bg-blue-50 transition-all active:scale-95 shadow-inner border border-slate-200"
                title="Mi ubicación actual"
              >
                {isLocating ? <Loader2 size={20} className="animate-spin" /> : <Navigation size={20} />}
              </button>
          </div>
          
          <button 
            onClick={() => onConfirm(currentCoords.lat, currentCoords.lng)}
            className="w-full max-w-md bg-teal-600 text-white py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.15em] shadow-[0_8px_20px_rgba(13,148,136,0.25)] flex items-center justify-center gap-2 hover:bg-teal-700 active:scale-95 transition-all border-2 border-white"
          >
            <CheckCircle2 size={20} /> CONFIRMAR UBICACIÓN
          </button>
      </div>

      <style>{`
        /* Mejorar visualización de Google Maps */
        .leaflet-tile-container {
            filter: contrast(1.05) brightness(1.02);
        }
        .custom-leaflet-pin {
          background: none !important;
          border: none !important;
        }
        .pin-wrapper {
          position: relative;
          width: 40px;
          height: 40px;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .pin-main {
          width: 36px;
          height: 36px;
          background-color: #0d9488;
          border: 4px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          position: relative;
          z-index: 2;
        }
        .pin-main::after {
          content: '';
          position: absolute;
          width: 10px;
          height: 10px;
          background: white;
          border-radius: 50%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
        .pin-shadow {
          position: absolute;
          width: 12px;
          height: 4px;
          background: rgba(0,0,0,0.4);
          border-radius: 50%;
          bottom: -2px;
          left: 50%;
          transform: translateX(-50%);
          filter: blur(2px);
        }
        .leaflet-marker-draggable.leaflet-marker-dragging .pin-main {
          transform: rotate(-45deg) scale(1.4) translateY(-18px);
          box-shadow: 0 35px 50px rgba(0,0,0,0.6);
          background-color: #14b8a6;
        }
        .leaflet-container { width: 100%; height: 100%; cursor: crosshair !important; background: #000 !important; }
      `}</style>
    </div>
  );
};

export default LocationPickerModal;