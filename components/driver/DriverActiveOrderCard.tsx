import React, { useState } from 'react';
import { Order } from '../../types';
import { 
  Phone, Clock, MapPin, Loader2, CheckCircle, Navigation, 
  MessageSquare, Volume2, VolumeX, Compass, ChevronDown
} from 'lucide-react';
import { 
  launchNavigationApp, 
  openWhatsAppMessage, 
  speakOrderInstructions, 
  stopSpeaking,
  calculateDistanceKm,
  formatDistance
} from '../../services/driverService';

interface DriverActiveOrderCardProps {
  order: Order;
  driverGps?: { lat: number; lng: number } | null;
  sequenceIndex?: number;
  onCallCustomer: (phone: string) => void;
  onOpenMap?: (order: Order) => void;
  onStatusChange: (order: Order, status: 'IN_TRANSIT' | 'DELIVERED') => void;
  onOpenDriveMode?: (order: Order) => void;
  onOpenConfirmModal?: (order: Order) => void;
}

export const DriverActiveOrderCard: React.FC<DriverActiveOrderCardProps> = ({
  order,
  driverGps,
  sequenceIndex,
  onCallCustomer,
  onOpenMap,
  onStatusChange,
  onOpenDriveMode,
  onOpenConfirmModal
}) => {
  const [showWhatsAppOptions, setShowWhatsAppOptions] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const distance = (driverGps && order.lat && order.lng)
    ? calculateDistanceKm(driverGps.lat, driverGps.lng, order.lat, order.lng)
    : null;

  const handleToggleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakOrderInstructions(order);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-200/80 mb-6 animate-in slide-in-from-bottom-4 group hover:shadow-md transition-shadow">
      
      {/* Barra de Estado y Secuencia */}
      <div className={`p-4 text-white font-black flex justify-between items-center ${
        order.status === 'IN_TRANSIT' ? 'bg-gradient-to-r from-blue-700 to-blue-600' : 'bg-slate-900'
      }`}>
        <div className="flex items-center gap-2">
          {sequenceIndex !== undefined && (
            <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
              Parada #{sequenceIndex + 1}
            </span>
          )}
          <span className="text-[10px] uppercase tracking-[0.15em] flex items-center gap-1.5">
            {order.status === 'IN_TRANSIT' ? (
              <><Loader2 className="animate-spin" size={14}/> EN RUTA 🛵</>
            ) : (
              'ESPERANDO SALIDA ⏳'
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {distance !== null && (
            <span className="bg-teal-400 text-slate-950 font-black text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wider">
              {formatDistance(distance)}
            </span>
          )}
          <span className="text-[10px] opacity-70 font-mono">#{order.id.slice(-6).toUpperCase()}</span>
        </div>
      </div>

      <div className="p-6 space-y-5">
        
        {/* Cliente e Info de Contacto */}
        <div>
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-black text-2xl text-slate-900 uppercase tracking-tight leading-none">
              {order.customerName}
            </h3>
            
            {/* Botón de Asistente de Voz */}
            <button
              onClick={handleToggleSpeak}
              className={`p-2 rounded-xl transition-colors cursor-pointer shrink-0 ${
                isSpeaking ? 'bg-teal-500 text-white animate-pulse' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title="Escuchar instrucciones en audio"
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-2">
            <button 
              onClick={() => onCallCustomer(order.customerPhone)} 
              className="flex items-center gap-1.5 text-[10px] bg-slate-100 px-3 py-1.5 rounded-full text-slate-700 font-black hover:bg-teal-50 hover:text-teal-700 transition-colors uppercase tracking-widest cursor-pointer"
            >
              <Phone size={12} /> {order.customerPhone}
            </button>

            {/* Menú Desplegable de WhatsApp Rápido */}
            <div className="relative">
              <button
                onClick={() => setShowWhatsAppOptions(!showWhatsAppOptions)}
                className="flex items-center gap-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-full font-black hover:bg-emerald-100 transition-colors uppercase tracking-widest cursor-pointer"
              >
                <MessageSquare size={12} /> WhatsApp <ChevronDown size={12} />
              </button>

              {showWhatsAppOptions && (
                <div className="absolute left-0 mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-20 space-y-1 animate-in fade-in duration-100">
                  <p className="text-[9px] font-black uppercase text-slate-400 px-2 py-1 tracking-wider">
                    Mensajes Directos
                  </p>
                  <button
                    onClick={() => {
                      openWhatsAppMessage(order.customerPhone, 'EN_CAMINO', order);
                      setShowWhatsAppOptions(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    🛵 "Ya voy en camino"
                  </button>
                  <button
                    onClick={() => {
                      openWhatsAppMessage(order.customerPhone, 'LLEGANDO', order);
                      setShowWhatsAppOptions(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    📍 "Ya estoy afuera"
                  </button>
                  <button
                    onClick={() => {
                      openWhatsAppMessage(order.customerPhone, 'REFERENCIA', order);
                      setShowWhatsAppOptions(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 transition-colors cursor-pointer"
                  >
                    ❓ "Pedir referencia de casa"
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-bold uppercase tracking-widest ml-auto">
              <Clock size={12} /> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </div>
          </div>
        </div>

        {/* Dirección de Entrega y Opciones Multimapa */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 relative">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dirección de Entrega</p>
            {order.lat && order.lng ? (
              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                📍 GPS Exacto
              </span>
            ) : (
              <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded text-[8px] font-bold uppercase">
                Por dirección
              </span>
            )}
          </div>

          <p className="flex items-start gap-2 text-slate-900 font-bold text-sm leading-snug">
            <MapPin className="shrink-0 mt-0.5 text-red-500" size={18} />
            <span>{order.customerAddress}</span>
          </p>

          {order.notes && (
            <div className="mt-2.5 p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-medium flex items-start gap-2">
              <span className="text-sm">💡</span>
              <span className="leading-tight">Nota: {order.notes}</span>
            </div>
          )}

          {/* Botonera de Navegación Multi-App */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">Navegar con:</span>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  if (onOpenMap) onOpenMap(order);
                  else launchNavigationApp('google', order);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                title="Abrir en Google Maps"
              >
                <Navigation size={10} /> Google Maps
              </button>
              <button
                onClick={() => launchNavigationApp('waze', order)}
                className="px-2.5 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                title="Abrir en Waze"
              >
                <Navigation size={10} className="rotate-45" /> Waze
              </button>
              <button
                onClick={() => launchNavigationApp('apple', order)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors cursor-pointer"
                title="Abrir en Apple Maps"
              >
                <Navigation size={10} className="-rotate-45" /> Apple
              </button>
            </div>
          </div>
        </div>

        {/* Sección de Dinero / Cobro */}
        <div className="flex justify-between items-end border-t border-slate-100 pt-4">
          <div>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto a Cobrar</p>
            <p className="text-3xl font-black text-teal-700 tabular-nums">${order.total.toFixed(2)}</p>
            <span className={`inline-block mt-2 text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${
              order.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {order.paymentMethod === 'CASH' ? '💵 EFECTIVO' : '🏦 TRANSFERENCIA'}
            </span>
          </div>

          {order.paymentMethod === 'CASH' && order.cashGiven && (
            <div className="text-right bg-red-50 p-3 rounded-2xl border border-red-100">
              <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Dar Vuelto</p>
              <p className="text-xl font-black text-red-600 tabular-nums">
                ${(order.cashGiven - order.total).toFixed(2)}
              </p>
            </div>
          )}
        </div>

        {/* Botones de Acción */}
        <div className="space-y-2 pt-2">
          {order.status === 'PENDING' ? (
            <button 
              onClick={() => onStatusChange(order, 'IN_TRANSIT')} 
              className="w-full bg-slate-900 hover:bg-black text-white py-4 rounded-2xl font-black shadow-lg shadow-slate-900/20 active:scale-98 transition-all uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <Navigation size={16} />
              <span>Empezar Entrega 🛵</span>
            </button>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              {onOpenDriveMode && (
                <button
                  type="button"
                  onClick={() => onOpenDriveMode(order)}
                  className="sm:w-1/3 py-4 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Compass size={16} />
                  <span>Modo Moto</span>
                </button>
              )}

              <button 
                onClick={() => {
                  if (onOpenConfirmModal) {
                    onOpenConfirmModal(order);
                  } else {
                    onStatusChange(order, 'DELIVERED');
                  }
                }} 
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-2xl font-black shadow-lg shadow-emerald-600/30 active:scale-98 transition-all flex justify-center items-center gap-2 uppercase tracking-[0.2em] text-xs cursor-pointer"
              >
                <CheckCircle size={18}/>
                <span>Confirmar Entrega (POD) ✅</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
