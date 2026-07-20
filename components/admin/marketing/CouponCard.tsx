import React, { useState } from 'react';
import { Trash2, Copy, Check, Percent, DollarSign } from 'lucide-react';
import { Coupon } from '../../../types';

interface CouponCardProps {
  coupon: Coupon;
  onDelete: (id: string) => void;
}

export const CouponCard: React.FC<CouponCardProps> = ({ coupon, onDelete }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDeleteClick = () => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el cupón "${coupon.code}"? Esta acción cancelará inmediatamente el descuento para los clientes.`)) {
      onDelete(coupon.id);
    }
  };

  return (
    <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between h-40 group hover:shadow-2xl hover:shadow-teal-900/10 transition-all duration-300" id={`coupon-card-${coupon.id}`}>
      
      {/* Decorative side ticket cutouts */}
      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full z-20"></div>
      <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full z-20"></div>

      {/* Decorative backdrop glow */}
      <div className="absolute -right-6 -bottom-6 bg-teal-500/10 w-28 h-28 rounded-full blur-2xl group-hover:bg-teal-500/20 transition-all duration-500"></div>

      {/* Upper Section */}
      <div className="p-5 flex justify-between items-start relative z-10">
        <div>
          <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest block mb-0.5">CÓDIGO ACTIVADO</span>
          <p className="text-xl font-black tracking-widest text-white uppercase truncate max-w-[140px]">{coupon.code}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <button
            onClick={handleCopy}
            className="p-2 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all border border-white/5 active:scale-90"
            title="Copiar código"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
          <button
            onClick={handleDeleteClick}
            className="p-2 bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 rounded-xl transition-all border border-red-500/5 active:scale-90"
            title="Eliminar cupón"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Middle/Lower Section */}
      <div className="px-5 pb-5 relative z-10 flex justify-between items-end border-t border-dashed border-white/15 pt-3">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-2 rounded-xl border border-white/5 text-teal-400">
            {coupon.type === 'PERCENTAGE' ? <Percent size={14} /> : <DollarSign size={14} />}
          </div>
          <div>
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider block">Beneficio</span>
            <p className="text-sm font-black text-white">
              {coupon.type === 'PERCENTAGE' ? `${coupon.value}% DE DESCUENTO` : `$${coupon.value} DE DESCUENTO`}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-[9px] font-black text-teal-400 bg-teal-500/10 border border-teal-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
            Activo
          </span>
        </div>
      </div>

    </div>
  );
};
