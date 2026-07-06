import React from 'react';

interface CreditStatsCardsProps {
  stats: {
    pendingCount: number;
    pendingAmount: number;
    paidCount: number;
    paidAmount: number;
  };
}

export const CreditStatsCards: React.FC<CreditStatsCardsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 animate-in fade-in">
        <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
          ${stats.pendingAmount.toFixed(2)}
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Por Cobrar</span>
          <span className="text-sm font-black text-slate-800 block">Deuda Pendiente ({stats.pendingCount} per.)</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 animate-in fade-in">
        <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
          ${stats.paidAmount.toFixed(2)}
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cobrado Histórico</span>
          <span className="text-sm font-black text-slate-800 block">Cuentas Liquidadas ({stats.paidCount})</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 animate-in fade-in">
        <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
          ${(stats.pendingAmount + stats.paidAmount).toFixed(2)}
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Flujo Total Registrado</span>
          <span className="text-sm font-black text-slate-800 block">Cartera Total</span>
        </div>
      </div>
    </div>
  );
};
