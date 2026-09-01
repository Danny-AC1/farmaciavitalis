import React from 'react';
import { CreditCard, ChevronRight, Coins } from 'lucide-react';
import { CreditTicket, User } from '../../types';
import { calculatePendingBalance } from '../../utils/posCreditHelpers';

interface POSCustomerDebtAlertProps {
  customer: User;
  matchingCredits: CreditTicket[];
  onOpenCreditDrawer: () => void;
  onOpenQuickPayment: (credit: CreditTicket) => void;
  onChargeCartAsCredit?: () => void;
  hasCartItems?: boolean;
}

export const POSCustomerDebtAlert: React.FC<POSCustomerDebtAlertProps> = ({
  customer,
  matchingCredits,
  onOpenCreditDrawer,
  onOpenQuickPayment,
}) => {
  if (!matchingCredits || matchingCredits.length === 0) return null;

  const totalPending = calculatePendingBalance(matchingCredits);
  const primaryCredit = matchingCredits[0];

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-orange-500/10 border border-amber-300/80 rounded-xl p-2.5 sm:p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-xs animate-in slide-in-from-top-1 duration-200">
      
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
          <Coins size={16} />
        </div>
        
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black uppercase tracking-wider bg-amber-200/80 text-amber-900 px-1.5 py-0.2 rounded-md">
              Cuenta Fiada Activa
            </span>
            <span className="text-[10px] text-amber-800 font-medium hidden sm:inline">
              ({matchingCredits.length} {matchingCredits.length === 1 ? 'ticket pendiente' : 'tickets pendientes'})
            </span>
          </div>
          <p className="text-xs font-bold text-slate-800 truncate">
            Deuda pendiente de {customer.displayName}:{' '}
            <span className="font-mono text-sm font-black text-rose-600">
              ${totalPending.toFixed(2)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end shrink-0">
        
        {/* Botón Cobrar Abono */}
        <button
          type="button"
          onClick={() => onOpenQuickPayment(primaryCredit)}
          className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black rounded-lg transition-all shadow-xs flex items-center gap-1 active:scale-95"
          title="Registrar un abono o cobrar esta deuda en caja"
        >
          <CreditCard size={12} />
          <span>Cobrar Abono</span>
        </button>

        {/* Botón Ver Libreta de Fiados */}
        <button
          type="button"
          onClick={onOpenCreditDrawer}
          className="px-2.5 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-900 text-[10px] font-black rounded-lg transition-all flex items-center gap-1 shadow-xs"
          title="Ver detalle de compras fiadas de este cliente"
        >
          <span>Ver Ficha ({matchingCredits.length})</span>
          <ChevronRight size={12} />
        </button>

      </div>

    </div>
  );
};

export default POSCustomerDebtAlert;
