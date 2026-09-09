import React, { useEffect, useState, useRef } from 'react';
import { Order } from '../../types';
import { updateOrderStatusDB, updateOrderLocationDB } from '../../services/db';
import { Truck, CheckCircle, LogOut, Navigation, Radio, ClipboardList } from 'lucide-react';
import OfflineStatusBar from '../OfflineStatusBar';
import { DriverActiveOrderCard } from './DriverActiveOrderCard';
import { DriverHistoryTab } from './DriverHistoryTab';

interface DriverDashboardProps {
  orders: Order[];
  onLogout: () => void;
}

const VITALIS_LOCATION = { lat: -1.483699, lng: -80.77338 };

const DriverDashboard: React.FC<DriverDashboardProps> = ({ orders, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isGPSActive, setIsGPSActive] = useState(false);
  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED');
  const inTransitOrders = activeOrders.filter((o) => o.status === 'IN_TRANSIT');

  useEffect(() => {
    if (inTransitOrders.length > 0 && navigator.geolocation) {
      setIsGPSActive(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          if (
            !lastPosRef.current ||
            Math.abs(lastPosRef.current.lat - latitude) > 0.0001 ||
            Math.abs(lastPosRef.current.lng - longitude) > 0.0001
          ) {
            lastPosRef.current = { lat: latitude, lng: longitude };
            inTransitOrders.forEach((order) => {
              updateOrderLocationDB(order.id, latitude, longitude);
            });
          }
        },
        (error) => {
          console.error('Error GPS:', error);
          setIsGPSActive(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsGPSActive(false);
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    }

    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, [inTransitOrders.length]);

  const deliveredToday = orders.filter(
    (o) => o.status === 'DELIVERED' && new Date(o.date).toDateString() === new Date().toDateString()
  );

  const handleStatusChange = async (order: Order, status: 'IN_TRANSIT' | 'DELIVERED') => {
    if (window.confirm(`¿Cambiar estado a ${status === 'IN_TRANSIT' ? 'En Camino' : 'Entregado'}?`)) {
      await updateOrderStatusDB(order.id, status, order);
    }
  };

  const openMap = (order: Order) => {
    const destination =
      order.lat && order.lng
        ? `${order.lat},${order.lng}`
        : encodeURIComponent(order.customerAddress + ', Machalilla, Ecuador');
    window.open(`https://www.google.com/maps/search/?api=1&query=${destination}`, '_blank');
  };

  const callCustomer = (phone: string) => {
    window.open(`tel:${phone}`);
  };

  const generateOptimizedRoute = () => {
    if (inTransitOrders.length === 0) {
      alert("Primero marca los pedidos como 'Empezar Entrega' para generar la ruta optimizada.");
      return;
    }

    const origin = lastPosRef.current
      ? `${lastPosRef.current.lat},${lastPosRef.current.lng}`
      : `${VITALIS_LOCATION.lat},${VITALIS_LOCATION.lng}`;

    const stops = inTransitOrders.map((o) => {
      if (o.lat && o.lng) return `${o.lat},${o.lng}`;
      return encodeURIComponent(o.customerAddress + ', Machalilla, Ecuador');
    });

    const finalDestination = stops.pop();
    const waypoints = stops.join('|');

    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const url = `${baseUrl}&origin=${origin}&destination=${finalDestination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;

    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-100 pb-12 font-sans">
      <OfflineStatusBar />

      {/* Barra de Encabezado */}
      <div className="bg-teal-900 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 bg-teal-700 rounded-xl flex items-center justify-center shadow-inner">
            <Truck className="h-5 w-5 text-teal-200" />
          </div>
          <div>
            <h1 className="font-black text-base uppercase tracking-tight leading-none">Panel de Reparto</h1>
            <p className="text-[10px] text-teal-300 font-bold uppercase tracking-widest mt-0.5">Vitalis Delivery</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isGPSActive && (
            <div className="flex items-center gap-1.5 bg-green-500/20 px-2.5 py-1 rounded-xl text-[9px] font-black uppercase text-green-300 border border-green-500/30 animate-pulse">
              <Radio size={12} /> GPS Activo
            </div>
          )}
          <button
            onClick={onLogout}
            className="bg-teal-800 p-2.5 rounded-xl hover:bg-red-600 transition-colors flex items-center gap-1 text-xs font-bold"
            title="Cerrar Sesión de Reparto"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline text-[10px] uppercase font-black">Salir</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-6 max-w-lg mx-auto">
        {/* Pestañas: Reparto Activo vs Pedidos */}
        <div className="bg-slate-200/80 p-1.5 rounded-2xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'active'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck size={16} />
            <span>Reparto ({activeOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'history'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList size={16} />
            <span>Pedidos ({deliveredToday.length})</span>
          </button>
        </div>

        {/* Contenido Condicional */}
        {activeTab === 'active' ? (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Métricas rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border-l-4 border-orange-500">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Pendientes</span>
                <p className="text-3xl font-black text-slate-800">{activeOrders.length}</p>
              </div>
              <div className="bg-white p-5 rounded-[1.8rem] shadow-sm border-l-4 border-green-500">
                <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Éxitos Hoy</span>
                <p className="text-3xl font-black text-slate-800">{deliveredToday.length}</p>
              </div>
            </div>

            {/* Hoja de Ruta Activa */}
            <div className="flex items-center justify-between border-b border-gray-300 pb-3">
              <h2 className="font-black text-slate-700 text-xs uppercase tracking-[0.2em]">Hoja de Ruta Activa</h2>
              {inTransitOrders.length > 0 && (
                <button
                  onClick={generateOptimizedRoute}
                  className="bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-200 active:scale-95 transition-all"
                >
                  <Navigation size={14} className="animate-pulse" /> Ruta Optimizada ({inTransitOrders.length})
                </button>
              )}
            </div>

            {activeOrders.length === 0 ? (
              <div className="text-center py-20 text-gray-400">
                <div className="bg-white h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                  <CheckCircle className="h-12 w-12 text-slate-200" />
                </div>
                <p className="font-black uppercase tracking-widest text-sm text-slate-700">Sin entregas pendientes</p>
                <p className="text-[10px] uppercase font-bold mt-1 text-slate-400">
                  Los nuevos pedidos aparecerán aquí automáticamente.
                </p>
              </div>
            ) : (
              activeOrders.map((order) => (
                <DriverActiveOrderCard
                  key={order.id}
                  order={order}
                  onCallCustomer={callCustomer}
                  onOpenMap={openMap}
                  onStatusChange={handleStatusChange}
                />
              ))
            )}
          </div>
        ) : (
          <DriverHistoryTab deliveredOrders={deliveredToday} />
        )}
      </div>
    </div>
  );
};

export default DriverDashboard;
