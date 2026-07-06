import React, { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, Navigation, Search, Menu, UtensilsCrossed, Hotel, HeartPulse, Bus, MapPin, Layers, Plus, Minus } from 'lucide-react';

interface LocationPickerModalProps {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onClose: () => void;
}

const MACHALILLA_CENTER: [number, number] = [-1.4836, -80.7733];

const categories = [
    { id: 'restaurants', label: 'Restaurantes', icon: UtensilsCrossed },
    { id: 'hotels', label: 'Hoteles', icon: Hotel },
    { id: 'pharmacy', label: 'Farma', icon: HeartPulse },
    { id: 'transport', label: 'Transporte público', icon: Bus },
];

const LocationPickerModal: React.FC<LocationPickerModalProps> = ({ initialLat, initialLng, onConfirm, onClose }) => {
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState({ 
    lat: initialLat || MACHALILLA_CENTER[0], 
    lng: initialLng || MACHALILLA_CENTER[1] 
  });
  const [isLocating, setIsLocating] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const mapContainerId = "fullscreen-picker-map";

  useEffect(() => {
    const L = (window as any).L;
    if (!L) return;

    if (!mapRef.current) {
      mapRef.current = L.map(mapContainerId, {
        zoomControl: false,
        attributionControl: false,
        tap: false,
        maxZoom: 20
      }).setView([currentCoords.lat, currentCoords.lng], 17);

      // Usar Google Maps Roadmap (Vista de calle estándar)
      L.tileLayer('https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
        maxZoom: 20,
        attribution: 'Map data © Google'
      }).addTo(mapRef.current);

      // Marcador Estilo Google Maps (Círculo azul/verde con halo blanco)
      const customIcon = L.divIcon({
        className: 'google-style-marker',
        html: `<div class="marker-container">
                 <div class="marker-halo"></div>
                 <div class="marker-dot"></div>
               </div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15]
      });

      markerRef.current = L.marker([currentCoords.lat, currentCoords.lng], {
        draggable: true,
        icon: customIcon,
        zIndexOffset: 1000
      }).addTo(mapRef.current);

      const updateCoords = (e: any) => {
        const pos = e.target.getLatLng();
        setCurrentCoords({ lat: pos.lat, lng: pos.lng });
      };

      markerRef.current.on('drag', updateCoords);
      markerRef.current.on('dragend', updateCoords);
      
      // Click en el mapa para mover marcador
      mapRef.current.on('click', (e: any) => {
          markerRef.current.setLatLng(e.latlng);
          setCurrentCoords({ lat: e.latlng.lat, lng: e.latlng.lng });
      });

      if (!initialLat || !initialLng) {
          setTimeout(handleGetLocation, 500);
      }
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
          mapRef.current.flyTo([latitude, longitude], 18);
          markerRef.current.setLatLng([latitude, longitude]);
          setCurrentCoords({ lat: latitude, lng: longitude });
        }
        setIsLocating(false);
      },
      () => setIsLocating(false),
      { enableHighAccuracy: true }
    );
  };

  const zoomIn = () => mapRef.current?.zoomIn();
  const zoomOut = () => mapRef.current?.zoomOut();

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in fade-in duration-300 overflow-hidden">
      {/* Controles Flotantes Superiores (Google Maps Look) */}
      <div className="absolute top-0 left-0 right-0 z-[1001] px-3 pt-4 pointer-events-none space-y-3">
        {/* Barra de Búsqueda */}
        <div className="max-w-xl mx-auto flex items-center gap-2 pointer-events-auto">
            <div className="bg-white flex-grow flex items-center px-4 py-3 rounded-full shadow-lg border border-gray-100 animate-in slide-in-from-top duration-500">
                <Menu size={20} className="text-gray-500 mr-3 shrink-0" />
                <input 
                    type="text" 
                    placeholder="Buscar en Google Maps" 
                    className="w-full bg-transparent outline-none text-sm font-medium text-gray-700" 
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                />
                <div className="flex items-center gap-3 ml-2 shrink-0">
                    <Search size={20} className="text-gray-500 cursor-pointer" />
                    <div className="w-[1px] h-6 bg-gray-200"></div>
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold">D</div>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="bg-white text-gray-600 p-3.5 rounded-full shadow-lg pointer-events-auto active:scale-90 transition-all border border-gray-100 shrink-0"
            >
                <X size={20} />
            </button>
        </div>

        {/* Categorías Rapidas */}
        <div className="max-w-xl mx-auto flex gap-2 overflow-x-auto scrollbar-hide pointer-events-auto pb-4 px-1">
            {categories.map((cat) => (
                <button key={cat.id} className="flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-md border border-gray-50 shrink-0 hover:bg-gray-50 transition-colors">
                    <cat.icon size={14} className="text-blue-500" />
                    <span className="text-[11px] font-bold text-gray-600">{cat.label}</span>
                </button>
            ))}
        </div>
      </div>

      {/* Contenedor del Mapa */}
      <div id={mapContainerId} className="flex-grow w-full relative z-0"></div>

      {/* Controles Flotantes Laterales */}
      <div className="absolute right-4 bottom-52 z-[1001] flex flex-col gap-2 pointer-events-none">
          <div className="flex flex-col bg-white rounded-lg shadow-xl pointer-events-auto overflow-hidden border border-gray-100">
              <button onClick={zoomIn} className="p-2.5 hover:bg-gray-50 border-b border-gray-100"><Plus size={18} className="text-gray-600" /></button>
              <button onClick={zoomOut} className="p-2.5 hover:bg-gray-50"><Minus size={18} className="text-gray-600" /></button>
          </div>
          <button className="bg-white p-2.5 rounded-lg shadow-xl pointer-events-auto border border-gray-100"><Layers size={18} className="text-gray-600" /></button>
          <button 
            onClick={handleGetLocation}
            className={`bg-white p-3 rounded-full shadow-xl pointer-events-auto border border-gray-100 transition-all active:scale-90 ${isLocating ? 'animate-pulse text-blue-600' : 'text-gray-600'}`}
          >
            <Navigation size={22} className={isLocating ? 'fill-blue-600' : ''} />
          </button>
      </div>

      {/* Confirmación - Estilo Card Inferior */}
      <div className="absolute bottom-6 left-4 right-4 z-[1001] pointer-events-none">
          <div className="max-w-md mx-auto bg-white rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.2)] pointer-events-auto border border-gray-100 space-y-4">
              <div className="flex items-start gap-4">
                  <div className="h-10 w-10 bg-teal-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-600/20">
                      <MapPin size={22} />
                  </div>
                  <div className="flex-grow min-w-0">
                      <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">Establecer Ubicación</h4>
                      <p className="text-[11px] text-gray-500 font-bold leading-tight truncate mt-0.5">
                        {currentCoords.lat.toFixed(5)}, {currentCoords.lng.toFixed(5)}
                      </p>
                      <p className="text-[10px] text-teal-600 font-black uppercase mt-1 flex items-center gap-1">
                          <CheckCircle2 size={12}/> Ubicación Seleccionada
                      </p>
                  </div>
              </div>
              
              <button 
                onClick={() => onConfirm(currentCoords.lat, currentCoords.lng)}
                className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl shadow-teal-600/30 hover:bg-teal-700 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                CONFIRMAR ENTREGA AQUÍ
              </button>
          </div>
      </div>

      <style>{`
        .google-style-marker {
            background: none !important;
            border: none !important;
        }
        .marker-container {
            width: 30px;
            height: 30px;
            display: flex;
            justify-content: center;
            align-items: center;
            position: relative;
        }
        .marker-halo {
            position: absolute;
            width: 24px;
            height: 24px;
            background: white;
            border-radius: 50%;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            z-index: 1;
        }
        .marker-dot {
            position: absolute;
            width: 14px;
            height: 14px;
            background: #0d9488;
            border-radius: 50%;
            z-index: 2;
            border: 2px solid white;
        }
        .marker-container:hover .marker-halo {
            transform: scale(1.2);
            background: #ccfbf1;
        }
        .leaflet-container { 
            width: 100%; 
            height: 100%; 
            cursor: crosshair !important; 
            background: #f8fafc !important; 
        }
      `}</style>
    </div>
  );
};

export default LocationPickerModal;