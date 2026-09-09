import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Order } from '../../types';
import { updateOrderStatusDB, updateOrderLocationDB } from '../../services/db';
import { 
  Truck, CheckCircle, LogOut, Radio, ClipboardList, 
  Compass, DollarSign, ArrowUpDown, Route 
} from 'lucide-react';
import OfflineStatusBar from '../OfflineStatusBar';
import { DriverActiveOrderCard } from './DriverActiveOrderCard';
import { DriverHistoryTab } from './DriverHistoryTab';
import { DriverDeliveryConfirmModal } from './DriverDeliveryConfirmModal';
import { DriverDriveModeModal } from './DriverDriveModeModal';
import { DriverShiftLiquidationModal } from './DriverShiftLiquidationModal';
import { 
  VITALIS_STORE_LOCATION, 
  optimizeRouteSequence 
} from '../../services/driverService';

interface DriverDashboardProps {
  orders: Order[];
  onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ orders, onLogout }) => {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [isGPSActive, setIsGPSActive] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [currentGps, setCurrentGps] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByProximity, setSortByProximity] = useState(true);

  // Estados para Modales de Primer Nivel
  const [confirmingOrder, setConfirmingOrder] = useState<Order | null>(null);
  const [isDriveModeOpen, setIsDriveModeOpen] = useState(false);
  const [isLiquidationOpen, setIsLiquidationOpen] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);

  const activeOrders = orders.filter((o) => o.status !== 'DELIVERED');
  const inTransitOrders = activeOrders.filter((o) => o.status === 'IN_TRANSIT');

  // Rastreo GPS Continuo con telemetría en tiempo real
  useEffect(() => {
    if (navigator.geolocation) {
      setIsGPSActive(true);
      watchIdRef.current = navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setGpsAccuracy(Math.round(accuracy));
          setCurrentGps({ lat: latitude, lng: longitude });

          if (
            !lastPosRef.current ||
            Math.abs(lastPosRef.current.lat - latitude) > 0.00008 ||
            Math.abs(lastPosRef.current.lng - longitude) > 0.00008
          ) {
            lastPosRef.current = { lat: latitude, lng: longitude };
            // Actualizar ubicación en la nube para cada orden en tránsito
            inTransitOrders.forEach((order) => {
              updateOrderLocationDB(order.id, latitude, longitude);
            });
          }
        },
        (error) => {
          console.warn('Alerta GPS:', error);
          setIsGPSActive(false);
        },
        { enableHighAccuracy: true, timeout: 12000, maximumAge: 2000 }
      );
    }

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [inTransitOrders.length]);

  const deliveredToday = orders.filter(
    (o) => o.status === 'DELIVERED' && new Date(o.date).toDateString() === new Date().toDateString()
  );

  // Optimización secuencial de ruta por proximidad
  const orderedActiveList = useMemo(() => {
    if (!sortByProximity || activeOrders.length <= 1) {
      return activeOrders;
    }
    const origin = currentGps || VITALIS_STORE_LOCATION;
    const optimized = optimizeRouteSequence(origin, activeOrders);
    return optimized.map(item => item.order);
  }, [activeOrders, sortByProximity, currentGps]);

  const handleStartTransit = async (order: Order) => {
    await updateOrderStatusDB(order.id, 'IN_TRANSIT', order);
    // Enviar posición inicial de inmediato
    if (currentGps) {
      updateOrderLocationDB(order.id, currentGps.lat, currentGps.lng);
    }
  };

  const handleConfirmDeliveryPOD = async (
    order: Order,
    proofData: {
      deliveryProofPhoto?: string;
      paymentProofPhoto?: string;
      deliveryOtp?: string;
      driverNotes?: string;
      changeGiven?: number;
      paymentConfirmed: boolean;
      deliveredAt: string;
    }
  ) => {
    await updateOrderStatusDB(order.id, 'DELIVERED', order, proofData);
    setConfirmingOrder(null);
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
    const ordersToRoute = inTransitOrders.length > 0 ? inTransitOrders : activeOrders;

    if (ordersToRoute.length === 0) {
      alert("No hay pedidos activos para trazar la ruta.");
      return;
    }

    const origin = currentGps
      ? `${currentGps.lat},${currentGps.lng}`
      : `${VITALIS_STORE_LOCATION.lat},${VITALIS_STORE_LOCATION.lng}`;

    // Ordenar paradas con nearest neighbor
    const optimized = optimizeRouteSequence(
      currentGps || VITALIS_STORE_LOCATION,
      ordersToRoute
    );

    const stops = optimized.map((item) => {
      const o = item.order;
      if (o.lat && o.lng) return `${o.lat},${o.lng}`;
      return encodeURIComponent(o.customerAddress + ', Machalilla, Ecuador');
    });

    const finalDestination = stops.pop();
    const waypoints = stops.join('|');

    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const url = `${baseUrl}&origin=${origin}&destination=${finalDestination}${
      waypoints ? `&waypoints=${waypoints}` : ''
    }&travelmode=driving`;

    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-100 pb-16 font-sans">
      <OfflineStatusBar />

      {/* Barra de Encabezado Superior */}
      <div className="bg-slate-900 text-white p-4 shadow-lg sticky top-0 z-40 border-b border-white/10">
        <div className="max-w-lg mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 bg-teal-500 text-slate-950 rounded-2xl flex items-center justify-center font-black shadow-md shadow-teal-500/20">
              <Truck size={20} />
            </div>
            <div>
              <h1 className="font-black text-base uppercase tracking-tight leading-none text-white">
                Vitalis Delivery Pro
              </h1>
              <p className="text-[10px] text-teal-400 font-bold uppercase tracking-widest mt-0.5">
                Panel Repartidor • Operaciones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Acceso Rápido a Modo Conducción en Moto */}
            <button
              onClick={() => setIsDriveModeOpen(true)}
              className="px-2.5 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5 transition-all shadow cursor-pointer active:scale-95"
              title="Abrir Modo Conducción / Moto"
            >
              <Compass size={14} />
              <span className="hidden sm:inline">Modo Moto</span>
            </button>

            {/* Acceso a Cuadre de Turno */}
            <button
              onClick={() => setIsLiquidationOpen(true)}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors cursor-pointer"
              title="Cuadre y Liquidación de Caja"
            >
              <DollarSign size={16} />
            </button>

            {/* Botón Salir */}
            <button
              onClick={onLogout}
              className="p-2 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white rounded-xl transition-colors cursor-pointer"
              title="Cerrar Sesión de Reparto"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Telemetría GPS en Vivo */}
        <div className="max-w-lg mx-auto mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
              isGPSActive ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/20 text-red-400'
            }`}>
              <Radio size={10} className={isGPSActive ? 'animate-pulse' : ''} />
              {isGPSActive ? 'GPS en Vivo' : 'Buscando GPS'}
            </span>
            {gpsAccuracy !== null && (
              <span className="text-slate-400">
                Precisión: ±{gpsAccuracy}m
              </span>
            )}
          </div>

          <span className="text-slate-400 font-mono">
            {inTransitOrders.length > 0 
              ? `${inTransitOrders.length} orden(es) en telemetría` 
              : 'Sin pedidos en ruta'
            }
          </span>
        </div>
      </div>

      <div className="p-4 space-y-5 max-w-lg mx-auto">
        
        {/* Pestañas: Reparto Activo vs Historial */}
        <div className="bg-slate-200 p-1.5 rounded-2xl flex gap-1 shadow-inner">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'active'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck size={16} />
            <span>Reparto Activo ({activeOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ClipboardList size={16} />
            <span>Entregas ({deliveredToday.length})</span>
          </button>
        </div>

        {/* Contenido Condicional */}
        {activeTab === 'active' ? (
          <div className="space-y-5 animate-in fade-in duration-150">
            
            {/* Métricas rápidas de trabajo */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">
                  Por Entregar
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-black text-slate-900">{activeOrders.length}</p>
                  <span className="text-[10px] font-bold text-blue-600">
                    ({inTransitOrders.length} en ruta)
                  </span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-3xl shadow-sm border border-slate-200/80">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest block">
                  Entregadas Hoy
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-3xl font-black text-emerald-600">{deliveredToday.length}</p>
                  <span className="text-[10px] font-bold text-slate-400">éxitos</span>
                </div>
              </div>
            </div>

            {/* Barra de Herramientas de Hoja de Ruta Inteligente */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSortByProximity(!sortByProximity)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    sortByProximity 
                      ? 'bg-teal-50 text-teal-800 border border-teal-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}
                  title="Ordenar por proximidad geográfica"
                >
                  <ArrowUpDown size={13} />
                  <span>{sortByProximity ? 'Ruta Secuencial ON' : 'Orden Normal'}</span>
                </button>
              </div>

              {activeOrders.length > 0 && (
                <button
                  onClick={generateOptimizedRoute}
                  className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20 active:scale-95 transition-all cursor-pointer"
                  title="Generar ruta multi-parada en Google Maps"
                >
                  <Route size={14} />
                  <span>Ruta Multi-Parada</span>
                </button>
              )}
            </div>

            {/* Lista de Pedidos en Cola */}
            {orderedActiveList.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200/80 p-8">
                <div className="bg-slate-100 h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-10 w-10 text-teal-600" />
                </div>
                <p className="font-black uppercase tracking-widest text-sm text-slate-800">
                  Sin entregas pendientes
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Cuando la farmacia o la tienda web asignen nuevos despachos, se actualizarán aquí al instante.
                </p>
              </div>
            ) : (
              orderedActiveList.map((order, idx) => (
                <DriverActiveOrderCard
                  key={order.id}
                  order={order}
                  driverGps={currentGps}
                  sequenceIndex={sortByProximity ? idx : undefined}
                  onCallCustomer={callCustomer}
                  onOpenMap={openMap}
                  onStatusChange={(ord, status) => {
                    if (status === 'IN_TRANSIT') {
                      handleStartTransit(ord);
                    } else {
                      setConfirmingOrder(ord);
                    }
                  }}
                  onOpenDriveMode={() => setIsDriveModeOpen(true)}
                  onOpenConfirmModal={(ord) => setConfirmingOrder(ord)}
                />
              ))
            )}
          </div>
        ) : (
          <DriverHistoryTab 
            deliveredOrders={deliveredToday} 
            onOpenLiquidation={() => setIsLiquidationOpen(true)} 
          />
        )}
      </div>

      {/* 1. Modal de Confirmación de Entrega con POD (Prueba Digital de Entrega) */}
      {confirmingOrder && (
        <DriverDeliveryConfirmModal
          order={confirmingOrder}
          driverGps={currentGps}
          onClose={() => setConfirmingOrder(null)}
          onConfirm={handleConfirmDeliveryPOD}
        />
      )}

      {/* 2. Modal de Modo Conducción en Moto / Manos Libres */}
      {isDriveModeOpen && (
        <DriverDriveModeModal
          orders={orderedActiveList}
          driverGps={currentGps}
          onClose={() => setIsDriveModeOpen(false)}
          onOpenConfirmDelivery={(ord) => {
            setIsDriveModeOpen(false);
            setConfirmingOrder(ord);
          }}
        />
      )}

      {/* 3. Modal de Cuadre de Turno y Liquidación de Caja */}
      {isLiquidationOpen && (
        <DriverShiftLiquidationModal
          deliveredOrders={deliveredToday}
          onClose={() => setIsLiquidationOpen(false)}
        />
      )}
    </div>
  );
};

export default DriverDashboard;
