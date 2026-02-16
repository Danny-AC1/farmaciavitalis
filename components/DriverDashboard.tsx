import React, { useEffect, useState, useRef } from 'react';
import { Order } from '../types';
import { updateOrderStatusDB, updateOrderLocationDB } from '../services/db';
import { Truck, CheckCircle, MapPin, Phone, Clock, LogOut, Navigation, Radio, Loader2, Map as MapIcon } from 'lucide-react';

interface DriverDashboardProps {
    orders: Order[];
    onLogout: () => void;
}

const VITALIS_LOCATION = { lat: -1.483699, lng: -80.77338 };

const DriverDashboard: React.FC<DriverDashboardProps> = ({ orders, onLogout }) => {
    const [isGPSActive, setIsGPSActive] = useState(false);
    const watchIdRef = useRef<number | null>(null);
    const lastPosRef = useRef<{lat: number, lng: number} | null>(null);

    const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
    const inTransitOrders = activeOrders.filter(o => o.status === 'IN_TRANSIT');

    useEffect(() => {
        if (inTransitOrders.length > 0 && navigator.geolocation) {
            setIsGPSActive(true);
            watchIdRef.current = navigator.geolocation.watchPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    
                    if (!lastPosRef.current || 
                        Math.abs(lastPosRef.current.lat - latitude) > 0.0001 || 
                        Math.abs(lastPosRef.current.lng - longitude) > 0.0001) {
                        
                        lastPosRef.current = { lat: latitude, lng: longitude };
                        inTransitOrders.forEach(order => {
                            updateOrderLocationDB(order.id, latitude, longitude);
                        });
                    }
                },
                (error) => {
                    console.error("Error GPS:", error);
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

    const deliveredToday = orders.filter(o => 
        o.status === 'DELIVERED' && 
        new Date(o.date).toDateString() === new Date().toDateString()
    );

    const handleStatusChange = async (order: Order, status: 'IN_TRANSIT' | 'DELIVERED') => {
        if (window.confirm(`¿Cambiar estado a ${status === 'IN_TRANSIT' ? 'En Camino' : 'Entregado'}?`)) {
            await updateOrderStatusDB(order.id, status, order);
        }
    };

    const openMap = (order: Order) => {
        const destination = order.lat && order.lng 
            ? `${order.lat},${order.lng}` 
            : encodeURIComponent(order.customerAddress + ", Machalilla, Ecuador");
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

        // 1. Definir Origen (GPS Real o Local Vitalis)
        const origin = lastPosRef.current 
            ? `${lastPosRef.current.lat},${lastPosRef.current.lng}` 
            : `${VITALIS_LOCATION.lat},${VITALIS_LOCATION.lng}`;

        // 2. Preparar destinos (Preferir coordenadas GPS si existen)
        const stops = inTransitOrders.map(o => {
            if (o.lat && o.lng) return `${o.lat},${o.lng}`;
            return encodeURIComponent(o.customerAddress + ", Machalilla, Ecuador");
        });

        // 3. Construir URL multi-parada de Google Maps
        // El último de la lista será el 'destination' final, los demás van en 'waypoints'
        const finalDestination = stops.pop();
        const waypoints = stops.join('|');
        
        const baseUrl = "https://www.google.com/maps/dir/?api=1";
        const url = `${baseUrl}&origin=${origin}&destination=${finalDestination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
        
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-100 pb-10">
            <div className="bg-teal-800 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    <h1 className="font-black text-lg uppercase tracking-tighter">Modo Repartidor</h1>
                </div>
                <div className="flex items-center gap-3">
                    {isGPSActive && (
                        <div className="flex items-center gap-1.5 bg-green-500/20 px-2 py-1 rounded-lg text-[9px] font-black uppercase text-green-300 border border-green-500/30 animate-pulse">
                            <Radio size={12}/> GPS Activo
                        </div>
                    )}
                    <button onClick={onLogout} className="bg-teal-900 p-2 rounded-full hover:bg-teal-700 transition-colors"><LogOut size={18}/></button>
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border-l-4 border-orange-500">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Pendientes</span>
                        <p className="text-3xl font-black text-slate-800">{activeOrders.length}</p>
                    </div>
                    <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border-l-4 border-green-500">
                        <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Éxitos Hoy</span>
                        <p className="text-3xl font-black text-slate-800">{deliveredToday.length}</p>
                    </div>
                </div>

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
                            <CheckCircle className="h-12 w-12 text-slate-100" />
                        </div>
                        <p className="font-black uppercase tracking-widest text-sm">Sin entregas</p>
                        <p className="text-[10px] uppercase font-bold mt-1">Los nuevos pedidos aparecerán aquí.</p>
                    </div>
                ) : (
                    activeOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-[2rem] shadow-sm overflow-hidden border border-slate-100 mb-6 animate-in slide-in-from-bottom-4 group">
                            <div className={`p-4 text-white font-black flex justify-between items-center ${order.status === 'IN_TRANSIT' ? 'bg-blue-600' : 'bg-slate-900'}`}>
                                <span className="text-[10px] uppercase tracking-[0.15em] flex items-center gap-2">
                                    {order.status === 'IN_TRANSIT' ? <><Loader2 className="animate-spin" size={14}/> EN RUTA 🛵</> : 'ESPERANDO ⏳'}
                                </span>
                                <span className="text-[10px] opacity-60 font-mono">#{order.id.slice(-6)}</span>
                            </div>
                            <div className="p-6 space-y-5">
                                <div>
                                    <h3 className="font-black text-2xl text-slate-800 uppercase tracking-tight leading-none mb-2">{order.customerName}</h3>
                                    <div className="flex gap-4">
                                        <button onClick={() => callCustomer(order.customerPhone)} className="flex items-center gap-2 text-[10px] bg-slate-100 px-3 py-1.5 rounded-full text-slate-700 font-black hover:bg-teal-50 hover:text-teal-600 transition-colors uppercase tracking-widest">
                                            <Phone size={12} /> {order.customerPhone}
                                        </button>
                                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                                            <Clock size={12} /> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors relative" onClick={() => openMap(order)}>
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Dirección de Entrega</p>
                                        {order.lat && order.lng && (
                                            <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[8px] font-black uppercase">📍 GPS Exacto</span>
                                        )}
                                    </div>
                                    <p className="flex items-start gap-3 text-slate-800 font-bold text-sm leading-snug uppercase">
                                        <MapPin className="shrink-0 mt-0.5 text-red-500" size={18} />
                                        {order.customerAddress}
                                    </p>
                                    <div className="absolute bottom-2 right-2 opacity-20 group-hover:opacity-100 transition-opacity">
                                        <MapIcon size={20} className="text-blue-600"/>
                                    </div>
                                </div>

                                <div className="flex justify-between items-end border-t border-slate-100 pt-5">
                                    <div>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Monto a Cobrar</p>
                                        <p className="text-3xl font-black text-teal-700 tabular-nums">${order.total.toFixed(2)}</p>
                                        <span className={`inline-block mt-2 text-[9px] font-black px-3 py-1 rounded-lg uppercase tracking-widest ${order.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {order.paymentMethod === 'CASH' ? '💵 EFECTIVO' : '🏦 TRANSFERENCIA'}
                                        </span>
                                    </div>
                                    {order.paymentMethod === 'CASH' && order.cashGiven && (
                                        <div className="text-right bg-red-50 p-3 rounded-2xl border border-red-100">
                                            <p className="text-[9px] font-black text-red-400 uppercase tracking-widest mb-1">Dar Vuelto</p>
                                            <p className="text-xl font-black text-red-600 tabular-nums">${(order.cashGiven - order.total).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                {order.status === 'PENDING' ? (
                                    <button 
                                        onClick={() => handleStatusChange(order, 'IN_TRANSIT')} 
                                        className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black shadow-xl hover:bg-black active:scale-95 transition-all uppercase tracking-[0.2em] text-xs"
                                    >
                                        Empezar Entrega 🛵
                                    </button>
                                ) : (
                                    <button 
                                        onClick={() => handleStatusChange(order, 'DELIVERED')} 
                                        className="w-full bg-emerald-600 text-white py-4.5 rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all flex justify-center items-center gap-3 uppercase tracking-[0.2em] text-xs"
                                    >
                                        <CheckCircle size={20}/> Confirmar Entrega ✅
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;