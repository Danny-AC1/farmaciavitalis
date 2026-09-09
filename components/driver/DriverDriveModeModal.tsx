import React, { useState } from 'react';
import { Order } from '../../types';
import { 
  X, Volume2, VolumeX, Navigation, Phone, MessageSquare, 
  CheckCircle, ChevronLeft, ChevronRight, MapPin, 
  AlertCircle, Compass
} from 'lucide-react';
import { 
  speakOrderInstructions, 
  stopSpeaking, 
  launchNavigationApp, 
  openWhatsAppMessage,
  formatDistance,
  calculateDistanceKm
} from '../../services/driverService';

interface DriverDriveModeModalProps {
  orders: Order[];
  driverGps: { lat: number; lng: number } | null;
  onClose: () => void;
  onOpenConfirmDelivery: (order: Order) => void;
}

export const DriverDriveModeModal: React.FC<DriverDriveModeModalProps> = ({
  orders,
  driverGps,
  onClose,
  onOpenConfirmDelivery
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const activeOrders = orders.filter(o => o.status === 'IN_TRANSIT');
  const displayOrders = activeOrders.length > 0 ? activeOrders : orders.filter(o => o.status !== 'DELIVERED');
  
  const currentOrder = displayOrders[currentIndex] || displayOrders[0];

  if (!currentOrder) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
          <AlertCircle size={32} className="text-amber-400" />
        </div>
        <h2 className="text-xl font-black uppercase tracking-wider mb-2">Sin Entregas en Ruta</h2>
        <p className="text-sm text-slate-400 mb-6">Marca un pedido como 'Empezar Entrega' para usar el Modo Conducción.</p>
        <button
          onClick={onClose}
          className="px-6 py-3 bg-teal-500 text-slate-950 font-black rounded-2xl uppercase tracking-wider"
        >
          Volver al Panel
        </button>
      </div>
    );
  }

  const distance = (driverGps && currentOrder.lat && currentOrder.lng)
    ? calculateDistanceKm(driverGps.lat, driverGps.lng, currentOrder.lat, currentOrder.lng)
    : null;

  const handleSpeak = () => {
    if (isSpeaking) {
      stopSpeaking();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      speakOrderInstructions(currentOrder);
      setTimeout(() => setIsSpeaking(false), 8000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col justify-between overflow-hidden select-none font-sans">
      
      {/* Barra Superior de Estado */}
      <div className="bg-slate-900/90 border-b border-white/10 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <Compass className="animate-spin" size={24} style={{ animationDuration: '6s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-amber-400">Modo Conducción</span>
              <span className="bg-blue-500 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded-full">
                {currentIndex + 1} de {displayOrders.length}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Controles táctiles de gran tamaño para moto</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Botón de Asistente de Voz */}
          <button
            onClick={handleSpeak}
            className={`p-3 rounded-2xl transition-all font-black text-xs flex items-center gap-1.5 cursor-pointer ${
              isSpeaking ? 'bg-teal-400 text-slate-950 animate-pulse shadow-lg shadow-teal-400/50' : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
            title="Escuchar instrucciones en voz alta"
          >
            {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider">{isSpeaking ? 'Detener' : 'Voz'}</span>
          </button>

          <button
            onClick={() => {
              stopSpeaking();
              onClose();
            }}
            className="p-3 bg-red-500/20 hover:bg-red-500 text-red-400 hover:text-white rounded-2xl transition-colors cursor-pointer"
            title="Salir del Modo Conducción"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Contenido Central: Gran tarjeta de pedido activo */}
      <div className="flex-1 p-5 flex flex-col justify-center max-w-xl mx-auto w-full space-y-4 overflow-y-auto">
        
        {/* Encabezado del Pedido & Distancia */}
        <div className="bg-slate-900 border-2 border-slate-700 rounded-3xl p-5 shadow-2xl relative overflow-hidden">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-mono font-bold text-amber-400 tracking-wider">
              ORDEN #{currentOrder.id.slice(-6).toUpperCase()}
            </span>
            {distance !== null && (
              <span className="bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-black px-3 py-1 rounded-full uppercase">
                📍 {formatDistance(distance)}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight leading-tight mb-2">
            {currentOrder.customerName}
          </h1>

          <div className="flex items-start gap-2.5 text-slate-300 text-sm font-bold bg-white/5 p-3 rounded-2xl border border-white/5 mb-3">
            <MapPin size={22} className="text-red-400 shrink-0 mt-0.5" />
            <p className="leading-snug">{currentOrder.customerAddress}</p>
          </div>

          {currentOrder.notes && (
            <div className="bg-amber-500/15 border border-amber-500/30 p-3 rounded-2xl mb-3 text-amber-200 text-xs font-semibold flex items-center gap-2">
              <span className="text-base">💡</span>
              <p className="leading-tight">"{currentOrder.notes}"</p>
            </div>
          )}

          {/* Bloque de Cobro Gigante */}
          <div className="bg-white/10 rounded-2xl p-4 flex items-center justify-between border border-white/10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total a Cobrar</p>
              <p className="text-3xl sm:text-4xl font-black text-teal-400 tabular-nums">${currentOrder.total.toFixed(2)}</p>
            </div>
            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider ${
                currentOrder.paymentMethod === 'CASH' ? 'bg-orange-500 text-white' : 'bg-blue-500 text-white'
              }`}>
                {currentOrder.paymentMethod === 'CASH' ? '💵 Efectivo' : '🏦 Transferencia'}
              </span>
              {currentOrder.paymentMethod === 'CASH' && currentOrder.cashGiven && (
                <p className="text-xs text-red-300 font-bold mt-1">
                  Vuelto: ${(currentOrder.cashGiven - currentOrder.total).toFixed(2)}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Acciones de Navegación Rápida */}
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            onClick={() => launchNavigationApp('google', currentOrder)}
            className="py-4 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer active:scale-95 transition-all"
          >
            <Navigation size={22} />
            <span>Google Maps</span>
          </button>
          <button
            onClick={() => launchNavigationApp('waze', currentOrder)}
            className="py-4 px-2 bg-sky-500 hover:bg-sky-400 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 shadow-lg cursor-pointer active:scale-95 transition-all"
          >
            <Navigation size={22} className="rotate-45" />
            <span>Waze</span>
          </button>
          <button
            onClick={() => launchNavigationApp('apple', currentOrder)}
            className="py-4 px-2 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-1 border border-white/10 shadow-lg cursor-pointer active:scale-95 transition-all"
          >
            <Navigation size={22} className="-rotate-45" />
            <span>Apple Maps</span>
          </button>
        </div>

        {/* Acciones de Comunicación con el Cliente */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => window.open(`tel:${currentOrder.customerPhone}`)}
            className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
          >
            <Phone size={20} />
            <span>Llamar al Cliente</span>
          </button>
          <button
            onClick={() => openWhatsAppMessage(currentOrder.customerPhone, 'LLEGANDO', currentOrder)}
            className="py-4 bg-emerald-700 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg cursor-pointer active:scale-95 transition-all"
          >
            <MessageSquare size={20} />
            <span>"Ya llegué" WhatsApp</span>
          </button>
        </div>

      </div>

      {/* Barra Inferior: Paginador & Botón Gigante de Llegada / Entrega */}
      <div className="bg-slate-900 border-t border-white/10 p-5 flex flex-col gap-3">
        {displayOrders.length > 1 && (
          <div className="flex items-center justify-between max-w-xl mx-auto w-full">
            <button
              onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-3 bg-white/10 rounded-2xl disabled:opacity-30 text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              <ChevronLeft size={20} /> Anterior
            </button>
            <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Entrega {currentIndex + 1} de {displayOrders.length}
            </span>
            <button
              onClick={() => setCurrentIndex(prev => Math.min(displayOrders.length - 1, prev + 1))}
              disabled={currentIndex === displayOrders.length - 1}
              className="p-3 bg-white/10 rounded-2xl disabled:opacity-30 text-white flex items-center gap-1 text-xs font-bold cursor-pointer"
            >
              Siguiente <ChevronRight size={20} />
            </button>
          </div>
        )}

        <div className="max-w-xl mx-auto w-full">
          <button
            onClick={() => {
              stopSpeaking();
              onOpenConfirmDelivery(currentOrder);
            }}
            className="w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 rounded-2xl font-black text-base uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-emerald-500/30 cursor-pointer active:scale-98 transition-all"
          >
            <CheckCircle size={26} />
            <span>Llegué a Destino • Entregar ✅</span>
          </button>
        </div>
      </div>

    </div>
  );
};
