import React from 'react';
import { CreditTicket } from '../../types';
import { 
  Search, 
  Clock, 
  User as UserIcon, 
  Phone, 
  Calendar, 
  CreditCard, 
  Trash2, 
  Check 
} from 'lucide-react';

interface CreditListProps {
  filteredCredits: CreditTicket[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  listFilter: 'ALL' | 'PENDIENTE' | 'PAGADO';
  setListFilter: (filter: 'ALL' | 'PENDIENTE' | 'PAGADO') => void;
  onSelectPaymentCredit: (credit: CreditTicket) => void;
  onDeleteCredit: (credit: CreditTicket) => void;
}

export const CreditList: React.FC<CreditListProps> = ({
  filteredCredits,
  searchTerm,
  setSearchTerm,
  listFilter,
  setListFilter,
  onSelectPaymentCredit,
  onDeleteCredit,
}) => {
  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Barra de Filtros y Búsqueda */}
      <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
        
        {/* Buscador */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar deudor..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Filtros de Estado */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          {(['PENDIENTE', 'PAGADO', 'ALL'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setListFilter(status)}
              className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all ${
                listFilter === status
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {status === 'ALL' ? 'Todos' : status === 'PENDIENTE' ? 'Pendientes' : 'Pagados'}
            </button>
          ))}
        </div>
      </div>

      {/* Listado de Créditos */}
      {filteredCredits.length === 0 ? (
        <div className="bg-white py-12 rounded-[2.5rem] border border-slate-100 text-center shadow-sm">
          <Clock size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-xs text-slate-500 font-bold">No se encontraron registros de créditos.</p>
          <p className="text-[10px] text-slate-400 mt-1">Usa el botón superior para fiar un medicamento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCredits.map((credit) => (
            <div 
              key={credit.id}
              className={`bg-white rounded-[2rem] border p-6 transition-all relative overflow-hidden flex flex-col justify-between ${
                credit.status === 'PENDIENTE' 
                  ? 'border-slate-100 hover:border-amber-200 shadow-sm' 
                  : 'border-slate-100 bg-slate-50/50 opacity-85'
              }`}
            >
              {/* Etiqueta de Estado */}
              <div className="absolute right-4 top-4">
                <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                  credit.status === 'PENDIENTE'
                    ? 'bg-amber-50 text-amber-600 border border-amber-100'
                    : 'bg-teal-50 text-teal-600 border border-teal-100'
                }`}>
                  {credit.status === 'PENDIENTE' ? 'Pendiente' : 'Pagado (Vendido)'}
                </span>
              </div>

              <div>
                {/* Información del Cliente */}
                <div className="space-y-1 mt-1">
                  <div className="flex items-center gap-1.5 text-slate-800">
                    <UserIcon size={14} className="text-slate-400" />
                    <h4 className="font-extrabold text-sm text-slate-800">{credit.customerName}</h4>
                  </div>
                  {credit.customerPhone && (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                      <Phone size={12} className="text-slate-400" />
                      <span>{credit.customerPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <Calendar size={12} className="text-slate-300" />
                    <span>Fecha: {new Date(credit.date).toLocaleDateString('es-ES')} {new Date(credit.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                {/* Detalle de Productos */}
                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Medicamentos Entregados:</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {credit.items.map((item, idx) => {
                      const isBox = item.selectedUnit === 'BOX';
                      const priceUsed = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                      return (
                        <div key={idx} className="flex justify-between items-center text-[11.5px] font-semibold text-slate-700">
                          <span className="line-clamp-1 flex-1 pr-4">
                            {item.quantity}x {item.name} <span className="text-[9px] text-slate-400">({isBox ? 'Caja' : 'Unid'})</span>
                          </span>
                          <span className="font-mono text-slate-600">${(priceUsed * item.quantity).toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Historial de abonos de este crédito */}
              {credit.payments && credit.payments.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-100/70 bg-slate-50/50 p-2.5 rounded-2xl space-y-1.5">
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Historial de Pagos / Abonos:</span>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {credit.payments.map((p, idx) => (
                      <div key={p.id || idx} className="flex justify-between items-center text-[10px] text-slate-600">
                        <span className="font-semibold">
                          • {new Date(p.date).toLocaleDateString('es-ES')} ({p.paymentMethod === 'CASH' ? '💵' : '🏦'})
                        </span>
                        <span className="font-mono font-bold text-slate-700">${p.amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pie de la tarjeta */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {credit.paidAmount && credit.paidAmount > 0 ? (
                    <div className="space-y-0.5">
                      <span className="text-[8px] text-slate-400 font-bold block uppercase tracking-wider">Deuda: ${credit.total.toFixed(2)}</span>
                      <div className="text-[10px] font-bold text-slate-600">Abonado: <span className="font-mono text-teal-600">${credit.paidAmount.toFixed(2)}</span></div>
                      <div className="text-[10.5px] font-black text-slate-700">Restante: <span className="font-mono text-rose-600">${(credit.total - credit.paidAmount).toFixed(2)}</span></div>
                    </div>
                  ) : (
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total Deuda</span>
                      <span className="text-base font-black text-slate-800 font-mono">${credit.total.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {credit.status === 'PENDIENTE' ? (
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onSelectPaymentCredit(credit)}
                      className="bg-teal-600 hover:bg-teal-700 text-white px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <CreditCard size={12} />
                      Abonar / Pagar
                    </button>
                    <button
                      onClick={() => onDeleteCredit(credit)}
                      title="Eliminar registro"
                      className="p-2 border border-slate-200 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-50 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-teal-600 text-xs font-bold bg-teal-50 px-2.5 py-1 rounded-lg">
                    <Check size={14} />
                    Cancelado
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
