
import React, { useMemo } from 'react';
import { Order } from '../types';
import { Map, MapPin, TrendingUp, Users, Target, Search } from 'lucide-react';

interface AdminGeoStatsProps {
  orders: Order[];
}

const AdminGeoStats: React.FC<AdminGeoStatsProps> = ({ orders }) => {
  // Algoritmo de normalización de zonas en Machalilla
  const areaStats = useMemo(() => {
    const areas: Record<string, number> = {};
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    
    deliveredOrders.forEach(o => {
      // Normalizamos la dirección: pasamos a mayúsculas y tomamos la primera palabra significativa (barrio o calle)
      let zone = o.customerAddress.split(',')[0].toUpperCase().trim();
      // Limpieza básica de conectores
      zone = zone.replace(/CALLE|AVENIDA|BARRIO|SECTOR|COOP|ASOC/g, '').trim();
      const mainToken = zone.split(' ')[0] || 'CENTRO';
      
      areas[mainToken] = (areas[mainToken] || 0) + 1;
    });
    
    return Object.entries(areas)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [orders]);

  const totalDelivered = orders.filter(o => o.status === 'DELIVERED').length;
  const bestZone = areaStats[0]?.[0] || '---';

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
              <Map size={24} />
          </div>
          <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Mapa de Ventas</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inteligencia Geográfica Machalilla</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* VISTA DEL MAPA INTERACTIVO - Centrado en coordenadas exactas */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[550px]">
            <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                    <Target size={16} className="text-red-500" /> Monitoreo de Entregas
                </h3>
                <div className="flex gap-2">
                    <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Vista Satelital</span>
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter">Machalilla Activa</span>
                </div>
            </div>
            <div className="flex-grow relative bg-slate-200">
                {/* Mapa centrado en la ubicación exacta de la farmacia */}
                <iframe 
                    title="Análisis Geográfico Vitalis"
                    className="w-full h-full border-0 grayscale-[0.2] contrast-[1.1]"
                    src="https://www.google.com/maps?q=-1.483699,-80.77338&hl=es&z=15&output=embed"
                    allowFullScreen
                    loading="lazy"
                ></iframe>
                
                {/* Panel Flotante de Datos en el Mapa */}
                <div className="absolute top-6 left-6 flex flex-col gap-2">
                    <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                        <div className="h-8 w-8 bg-teal-500 rounded-xl flex items-center justify-center text-white"><MapPin size={16}/></div>
                        <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-1">Punto Matriz</p>
                            <p className="text-[10px] font-black text-slate-800 uppercase">Farmacia Vitalis</p>
                        </div>
                    </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 flex flex-col md:flex-row gap-3">
                    <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl flex-1 flex items-center gap-4 border border-slate-700">
                        <div className="h-10 w-10 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
                            <TrendingUp size={20}/>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Zona más rentable</p>
                            <p className="text-sm font-black text-white uppercase">{bestZone}</p>
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-2xl flex-1 flex items-center gap-4 border border-slate-100">
                        <div className="h-10 w-10 bg-red-100 rounded-xl flex items-center justify-center text-red-600">
                            <Target size={20}/>
                        </div>
                        <div>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pedidos Entregados</p>
                            <p className="text-sm font-black text-slate-800 uppercase">{totalDelivered} Éxitos</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* LISTADO DE SECTORES (ZONAS DE CALOR) */}
        <div className="space-y-6">
            <div className="bg-gradient-to-br from-slate-900 to-teal-950 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                    <h4 className="font-black text-lg uppercase tracking-tight mb-2">Análisis de Zonas</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                        Este gráfico de calor representa la concentración de ventas por sector. Úsalo para planificar promociones localizadas.
                    </p>
                </div>
                <Users size={120} className="absolute -right-8 -bottom-8 opacity-5 group-hover:scale-110 transition-transform duration-700" />
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
                <h4 className="font-black text-slate-800 text-[10px] uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse"></div>
                    Sectores con más demanda
                </h4>
                <div className="space-y-5">
                    {areaStats.length === 0 ? (
                        <div className="text-center py-10">
                            <Search className="h-10 w-10 text-slate-100 mx-auto mb-2" />
                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Sin datos de entrega</p>
                        </div>
                    ) : (
                        areaStats.map(([name, count], idx) => {
                            const percentage = Math.round((count / (totalDelivered || 1)) * 100);
                            return (
                                <div key={idx} className="space-y-2 animate-in slide-in-from-right-2" style={{animationDelay: `${idx * 100}ms`}}>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">{name}</span>
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg">{count} Pedidos</span>
                                    </div>
                                    <div className="w-full bg-slate-50 h-3 rounded-full overflow-hidden border border-slate-100 shadow-inner">
                                        <div 
                                            className={`h-full transition-all duration-1000 ease-out shadow-sm ${
                                                idx === 0 ? 'bg-blue-600' : 
                                                idx === 1 ? 'bg-blue-500' : 
                                                'bg-slate-300'
                                            }`} 
                                            style={{ width: `${percentage}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            <div className="bg-emerald-50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200 group-hover:rotate-12 transition-transform">
                        <Users size={20}/>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest leading-none mb-1">Fidelidad Local</p>
                        <p className="text-lg font-black text-emerald-950 uppercase tracking-tighter">Zona Central</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-[11px] font-black text-emerald-600 uppercase">Top</p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGeoStats;
