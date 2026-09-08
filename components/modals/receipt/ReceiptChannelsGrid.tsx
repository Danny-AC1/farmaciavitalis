import React from 'react';
import { MessageSquare, Send, Smartphone, Mail } from 'lucide-react';
import { Order } from '../../../types';

interface ReceiptChannelsGridProps {
  order: Order;
  handleWhatsApp: () => void;
  handleTelegram: () => void;
  handleSms: () => void;
  handleEmail: () => void;
}

export const ReceiptChannelsGrid: React.FC<ReceiptChannelsGridProps> = ({
  order,
  handleWhatsApp,
  handleTelegram,
  handleSms,
  handleEmail
}) => {
  return (
    <div>
      <span className="text-xs font-black text-slate-700 uppercase tracking-tight block mb-3">
        Selecciona el Canal de Envío
      </span>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* WhatsApp */}
        <button
          onClick={handleWhatsApp}
          className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
        >
          <div className="h-11 w-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-black text-emerald-950">WhatsApp</span>
          <span className="text-[9px] font-bold text-emerald-700 mt-0.5">Mensaje directo</span>
        </button>

        {/* Telegram */}
        <button
          onClick={handleTelegram}
          className="flex flex-col items-center justify-center p-3.5 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
        >
          <div className="h-11 w-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center mb-2 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
            <Send size={20} />
          </div>
          <span className="text-xs font-black text-sky-950">Telegram</span>
          <span className="text-[9px] font-bold text-sky-700 mt-0.5">Chat o bot</span>
        </button>

        {/* SMS / Mensaje de Texto */}
        <button
          onClick={handleSms}
          className="flex flex-col items-center justify-center p-3.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
        >
          <div className="h-11 w-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            <Smartphone size={20} />
          </div>
          <span className="text-xs font-black text-amber-950">SMS Móvil</span>
          <span className="text-[9px] font-bold text-amber-700 mt-0.5">Sin internet</span>
        </button>

        {/* Correo Electrónico */}
        <button
          onClick={handleEmail}
          className="flex flex-col items-center justify-center p-3.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
        >
          <div className="h-11 w-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center mb-2 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Mail size={20} />
          </div>
          <span className="text-xs font-black text-indigo-950">Email</span>
          <span className="text-[9px] font-bold text-indigo-700 mt-0.5">
            {order.customerEmail ? 'Registrado' : 'Redactar'}
          </span>
        </button>
      </div>
    </div>
  );
};
