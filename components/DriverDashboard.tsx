
import React, { useEffect, useState, useRef } from 'react';
import { Order } from '../types';
import { updateOrderStatusDB, updateOrderLocationDB } from '../services/db';
import { Truck, CheckCircle, MapPin, Phone, Clock, LogOut, Navigation, Radio, Loader2 } from 'lucide-react';

interface DriverDashboardProps {
    orders: Order[];
    onLogout: () => void;
}

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
                    
                    // Solo actualizar si hay un movimiento significativo (> 0.0001 aprox 10m)
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

    const openMap = (address: string) => {
        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Machalilla, Ecuador")}`, '_blank');
    };

    const callCustomer = (phone: string) => {
        window.open(`tel:${phone}`);
    };

    const generateOptimizedRoute = () => {
        if (activeOrders.length === 0) return;
        const origin = encodeURIComponent("Farmacia Vitalis, Machalilla, Ecuador");
        const stops = activeOrders.slice(0, 9).map(o => encodeURIComponent(o.customerAddress + ", Machalilla, Ecuador"));
        if (stops.length === 0) return;
        const destination = stops.pop(); 
        const waypoints = stops.join('|');
        const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-gray-100 pb-10">
            <div className="bg-teal-800 text-white p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Truck className="h-6 w-6" />
                    <h1 className="font-bold text-lg">Modo Repartidor</h1>
                </div>
                <div className="flex items-center gap-3">
                    {isGPSActive && (
                        <div className="flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded text-[10px] font-black uppercase text-green-300 border border-green-500/50 animate-pulse">
                            <Radio size={12}/> GPS Activo
                        </div>
                    )}
                    <button onClick={onLogout} className="bg-teal-900 p-2 rounded-full hover:bg-teal-700 transition-colors"><LogOut size={18}/></button>
                </div>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Por Entregar</span>
                        <p className="text-2xl font-black text-gray-800">{activeOrders.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                        <span className="text-xs text-gray-500 uppercase font-bold tracking-tighter">Entregas Hoy</span>
                        <p className="text-2xl font-black text-gray-800">{deliveredToday.length}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                    <h2 className="font-bold text-gray-700 text-lg">Hoja de Ruta</h2>
                    {activeOrders.length > 0 && (
                        <button onClick={generateOptimizedRoute} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md">
                            <Navigation size={14} /> Ruta Optimizada
                        </button>
                    )}
                </div>

                {activeOrders.length === 0 ? (
                    <div className="text-center py-16 text-gray-400">
                        <CheckCircle className="h-16 w-16 mx-auto mb-2 opacity-10" />
                        <p className="font-bold">No hay entregas pendientes.</p>
                        <p className="text-xs">Los nuevos pedidos aparecerán aquí.</p>
                    </div>
                ) : (
                    activeOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 mb-4 animate-in slide-in-from-bottom-2">
                            <div className={`p-3 text-white font-bold flex justify-between items-center ${order.status === 'IN_TRANSIT' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                <span className="text-[10px] uppercase tracking-widest flex items-center gap-2">
                                    {order.status === 'IN_TRANSIT' ? <><Loader2 className="animate-spin" size={12}/> EN CAMINO 🛵</> : 'ESPERANDO ⏳'}
                                </span>
                                <span className="text-[10px] opacity-80 font-mono">#{order.id.slice(-6)}</span>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-800 uppercase tracking-tight">{order.customerName}</h3>
                                    <div className="flex gap-4 mt-2">
                                        <button onClick={() => callCustomer(order.customerPhone)} className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700 font-medium hover:bg-gray-200">
                                            <Phone size={14} /> {order.customerPhone}
                                        </button>
                                        <div className="flex items-center gap-1 text-sm text-gray-400">
                                            <Clock size={14} /> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 cursor-pointer hover:bg-blue-50 transition-colors" onClick={() => openMap(order.customerAddress)}>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Destino en Machalilla</p>
                                    <p className="flex items-start gap-2 text-gray-800 font-medium leading-tight">
                                        <MapPin className="shrink-0 mt-0.5 text-red-500" size={16} />
                                        {order.customerAddress}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                                    <div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Cobro Pendiente</p>
                                        <p className="text-2xl font-black text-teal-700">${order.total.toFixed(2)}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${order.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {order.paymentMethod === 'CASH' ? 'Efectivo 💵' : 'Transferencia 🏦'}
                                        </span>
                                    </div>
                                    {order.paymentMethod === 'CASH' && order.cashGiven && (
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Dar Vuelto</p>
                                            <p className="text-lg font-black text-red-500">${(order.cashGiven - order.total).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                {order.status === 'PENDING' ? (
                                    <button onClick={() => handleStatusChange(order, 'IN_TRANSIT')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-black shadow-lg shadow-blue-200 active:scale-95 transition-transform uppercase tracking-widest text-sm">
                                        Empezar Entrega 🛵
                                    </button>
                                ) : (
                                    <button onClick={() => handleStatusChange(order, 'DELIVERED')} className="w-full bg-green-600 text-white py-4 rounded-xl font-black shadow-lg shadow-green-200 active:scale-95 transition-transform flex justify-center items-center gap-2 uppercase tracking-widest text-sm">
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
