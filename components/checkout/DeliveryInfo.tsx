import React from 'react';
import { MapPin } from 'lucide-react';

interface DeliveryInfoProps {
  isServiceActive: boolean;
}

const DeliveryInfo: React.FC<DeliveryInfoProps> = ({ isServiceActive }) => {
  return (
    <div className="flex items-center justify-center mb-3 -mt-4 sm:-mt-5">
      <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 px-3.5 py-1.5 rounded-full text-[11px] font-bold text-slate-600 shadow-xs hover:border-slate-200/80 transition-colors">
        <MapPin size={13} className="text-teal-600 shrink-0" strokeWidth={2.5} />
        <span className="tracking-tight">
          Entrega a domicilio <span className="text-teal-700 font-black font-serif italic">'Machalilla'</span> - <span className="font-mono font-black text-slate-700">08:00 AM - 20:00 PM</span>
        </span>
        <div className="relative flex h-2 w-2 ml-0.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isServiceActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isServiceActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
        </div>
      </div>
    </div>
  );
};

export default DeliveryInfo;

