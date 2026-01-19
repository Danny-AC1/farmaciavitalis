
import React from 'react';
import { Order } from '../types';
import { updateOrderStatusDB } from '../services/db';
import { Truck, CheckCircle, MapPin, Phone, Clock, LogOut, Navigation } from 'lucide-react';

interface DriverDashboardProps {
    orders: Order[];
    onLogout: () => void;
}

const DriverDashboard: React.FC<DriverDashboardProps> = ({ orders, onLogout }) => {
    // Los pedidos ya vienen ordenados por fecha descendente desde el stream.
    // Aquí filtramos solo los que NO están entregados.
    const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
    
    const deliveredToday = orders.filter(o => 
        o.status === 'DELIVERED' && 
        new Date(o.date).toDateString() === new Date().toDateString()
    );

    const handleStatusChange = async (order: Order, status: 'IN_TRANSIT' | 'DELIVERED') => {
        if (window.confirm(`¿Cambiar estado a ${status === 'IN_TRANSIT' ? 'En Camino' : 'Entregado'}?`)) {
            // Usamos el ID del documento (Firestore ID) que ahora es el mismo que ORD-XXX
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
                <button onClick={onLogout} className="bg-teal-900 p-2 rounded-full hover:bg-teal-700"><LogOut size={18}/></button>
            </div>

            <div className="p-4 space-y-6 max-w-lg mx-auto">
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-orange-500">
                        <span className="text-xs text-gray-500 uppercase font-bold">Por Entregar</span>
                        <p className="text-2xl font-black text-gray-800">{activeOrders.length}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                        <span className="text-xs text-gray-500 uppercase font-bold">Listos Hoy</span>
                        <p className="text-2xl font-black text-gray-800">{deliveredToday.length}</p>
                    </div>
                </div>

                <div className="flex items-center justify-between border-b border-gray-300 pb-2">
                    <h2 className="font-bold text-gray-700 text-lg">Lista de Entregas</h2>
                    {activeOrders.length > 0 && (
                        <button onClick={generateOptimizedRoute} className="bg-blue-600 text-white text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 shadow-md">
                            <Navigation size={14} /> Ruta GPS
                        </button>
                    )}
                </div>

                {activeOrders.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <CheckCircle className="h-16 w-16 mx-auto mb-2 opacity-20" />
                        <p className="font-bold">No hay pedidos pendientes.</p>
                        <p className="text-xs">Los pedidos nuevos aparecerán aquí automáticamente.</p>
                    </div>
                ) : (
                    activeOrders.map(order => (
                        <div key={order.id} className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 animate-in slide-in-from-bottom-2">
                            <div className={`p-3 text-white font-bold flex justify-between items-center ${order.status === 'IN_TRANSIT' ? 'bg-blue-600' : 'bg-orange-500'}`}>
                                <span className="text-xs uppercase tracking-widest">{order.status === 'IN_TRANSIT' ? 'En Camino 🛵' : 'Nuevo Pedido ⏳'}</span>
                                <span className="text-xs opacity-80 font-mono">{order.id}</span>
                            </div>
                            <div className="p-5 space-y-4">
                                <div>
                                    <h3 className="font-bold text-xl text-gray-800">{order.customerName}</h3>
                                    <div className="flex gap-4 mt-2">
                                        <button onClick={() => callCustomer(order.customerPhone)} className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full text-gray-700 font-medium hover:bg-gray-200">
                                            <Phone size={14} /> {order.customerPhone}
                                        </button>
                                        <div className="flex items-center gap-1 text-sm text-gray-500 px-1 py-1">
                                            <Clock size={14} /> {new Date(order.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100" onClick={() => openMap(order.customerAddress)}>
                                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Dirección</p>
                                    <p className="flex items-start gap-2 text-gray-800 font-medium cursor-pointer hover:text-blue-600">
                                        <MapPin className="shrink-0 mt-0.5 text-red-500" size={18} />
                                        {order.customerAddress}
                                    </p>
                                </div>

                                <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Total a Cobrar</p>
                                        <p className="text-2xl font-black text-teal-700">
                                            ${order.total.toFixed(2)}
                                        </p>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">
                                            Metodo: {order.paymentMethod === 'CASH' ? 'Efectivo 💵' : 'Transferencia 🏦'}
                                        </span>
                                    </div>
                                    {order.paymentMethod === 'CASH' && order.cashGiven && (
                                        <div className="text-right">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Dar Vuelto</p>
                                            <p className="text-lg font-black text-red-500">${(order.cashGiven - order.total).toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-2">
                                    {order.status === 'PENDING' ? (
                                        <button onClick={() => handleStatusChange(order, 'IN_TRANSIT')} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-600/20 active:scale-95">
                                            ACEPTAR Y SALIR 🛵
                                        </button>
                                    ) : (
                                        <button onClick={() => handleStatusChange(order, 'DELIVERED')} className="w-full bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition flex justify-center items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95">
                                            <CheckCircle size={20}/> CONFIRMAR ENTREGA ✅
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;
