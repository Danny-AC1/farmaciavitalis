import React from 'react';
import { Truck, MapPin } from 'lucide-react';

interface DeliveryInfoProps {
  isServiceActive: boolean;
}

const DeliveryInfo: React.FC<DeliveryInfoProps> = ({ isServiceActive }) => {
  return (
    <div className="bg-white rounded-[1.5rem] p-4 mb-8 shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4 relative overflow-hidden group hover:shadow-md transition-all">
        <div className="flex items-center gap-4 relative z-10">
            <div className="bg-slate-900 p-3 rounded-[1rem] text-teal-400 shadow-lg group-hover:rotate-3 transition-transform duration-300">
                <Truck size={22} strokeWidth={2.5}/>
            </div>
            <div>
                <p className="text-[8px] font-black text-teal-600 uppercase tracking-[0.2em] mb-0.5">Servicio Express</p>
                <h3 className="text-sm md:text-base font-black text-slate-800 uppercase tracking-tight leading-none">
                    Entrega a domicilio <span className="text-teal-600 italic font-serif">"Machalilla"</span>
                </h3>
            </div>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border relative z-10 transition-colors ${isServiceActive ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
            <div className="relative flex h-2 w-2 mt-0.5">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isServiceActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isServiceActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </div>
            <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.05em] leading-tight">
                    {isServiceActive ? 'Cobertura Total Activa' : 'Cobertura Inactiva'}
                </span>
                <span className="text-[8px] font-bold opacity-80 uppercase tracking-tighter leading-tight mt-0.5">
                    {isServiceActive ? 'Horario: 07:00 AM - 09:00 PM' : 'Iniciamos a las 07:00 AM'}
                </span>
            </div>
        </div>

        {/* Decoración de fondo */}
        <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-10 pointer-events-none group-hover:scale-105 transition-transform duration-700">
            <MapPin size={100} strokeWidth={1} />
        </div>
    </div>
  );
};

export default DeliveryInfo;
