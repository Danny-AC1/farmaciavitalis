import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Coins, 
  User as UserIcon, 
  Phone, 
  Calendar, 
  CreditCard, 
  PlusCircle, 
  ExternalLink 
} from 'lucide-react';
import { CreditTicket, CartItem, Product, User } from '../../types';
import { calculatePendingBalance } from '../../utils/posCreditHelpers';

interface POSCreditDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  credits: CreditTicket[];
  products?: Product[];
  posCart: CartItem[];
  selectedCustomer?: User | null;
  onSelectCustomerInPOS: (customerName: string, customerPhone?: string) => void;
  onOpenQuickPayment: (credit: CreditTicket) => void;
  onAddDebtFromCart?: (credit: CreditTicket) => void;
  onGoToFullCreditsSuite?: () => void;
  onOpenNewCreditModal?: () => void;
}

export const POSCreditDrawerModal: React.FC<POSCreditDrawerModalProps> = ({
  isOpen,
  onClose,
  credits,
  posCart,
  onSelectCustomerInPOS,
  onOpenQuickPayment,
  onAddDebtFromCart,
  onGoToFullCreditsSuite,
  onOpenNewCreditModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'PENDIENTE' | 'PAGADO' | 'ALL'>('PENDIENTE');

  // Filtrado de créditos
  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      const matchStatus = statusFilter === 'ALL' || c.status === statusFilter;
      const lowerSearch = searchTerm.toLowerCase().trim();
      const matchSearch = !lowerSearch || 
        c.customerName.toLowerCase().includes(lowerSearch) ||
        (c.customerPhone && c.customerPhone.includes(lowerSearch));
      return matchStatus && matchSearch;
    });
  }, [credits, statusFilter, searchTerm]);

  // Estadísticas rápidas
  const pendingCredits = useMemo(() => credits.filter(c => c.status === 'PENDIENTE'), [credits]);
  const totalPendingAmount = useMemo(() => calculatePendingBalance(pendingCredits), [pendingCredits]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[140] bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      
      {/* Drawer Panel */}
      <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col border-l border-slate-200 animate-in slide-in-from-right duration-300">
        
        {/* Cabecera del Drawer */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 text-white p-5 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Coins size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                  Punto de Venta • Vitalis
                </span>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[9px] px-1.5 py-0.2 rounded-full font-black">
                  {pendingCredits.length} Pendientes
                </span>
              </div>
              <h3 className="text-base font-black tracking-tight">
                Libreta Rápida de Medicamentos Fiados
              </h3>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Estadísticas y Accesos Rápidos */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 shrink-0 grid grid-cols-2 gap-3">
          
          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
              Total por Cobrar
            </span>
            <div className="text-xl font-black text-rose-600 font-mono mt-0.5">
              ${totalPendingAmount.toFixed(2)}
            </div>
            <span className="text-[10px] text-slate-500 font-semibold">
              En {pendingCredits.length} cuentas activas
            </span>
          </div>

          <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
              Acceso a la Suite
            </span>
            <div className="flex items-center gap-2 mt-1">
              {onGoToFullCreditsSuite && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onGoToFullCreditsSuite();
                  }}
                  className="flex-1 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black tracking-wide flex items-center justify-center gap-1 transition"
                >
                  <span>Suite Completa</span>
                  <ExternalLink size={12} />
                </button>
              )}
              {onOpenNewCreditModal && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenNewCreditModal();
                  }}
                  className="flex-1 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-[10px] font-black tracking-wide flex items-center justify-center gap-1 transition"
                >
                  <span>+ Fiar Carrito</span>
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-2 shrink-0">
          
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text"
              placeholder="Buscar cliente deudor o teléfono..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="flex bg-slate-100 p-0.5 rounded-xl self-end sm:self-auto shrink-0">
            {(['PENDIENTE', 'PAGADO', 'ALL'] as const).map(filter => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${
                  statusFilter === filter 
                    ? 'bg-white text-slate-900 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {filter === 'ALL' ? 'Todos' : filter === 'PENDIENTE' ? 'Pendientes' : 'Pagados'}
              </button>
            ))}
          </div>

        </div>

        {/* Listado de Deudores */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          
          {filteredCredits.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Coins size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-bold text-slate-500">No se encontraron medicamentos fiados</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {searchTerm ? 'Intenta con otro término de búsqueda' : 'No hay registros en este estado'}
              </p>
            </div>
          ) : (
            filteredCredits.map(credit => {
              const currentPaid = credit.paidAmount || 0;
              const remaining = Math.max(0, credit.total - currentPaid);
              const isPending = credit.status === 'PENDIENTE';

              return (
                <div 
                  key={credit.id}
                  className={`bg-white rounded-2xl border p-4 transition-all hover:shadow-md ${
                    isPending 
                      ? 'border-slate-200/90 hover:border-amber-300' 
                      : 'border-slate-100 opacity-75'
                  }`}
                >
                  
                  {/* Encabezado del Ticket */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <UserIcon size={14} className="text-slate-400" />
                        <h4 className="font-black text-sm text-slate-800 uppercase tracking-tight">
                          {credit.customerName}
                        </h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 font-semibold mt-1">
                        {credit.customerPhone && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Phone size={11} /> {credit.customerPhone}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {new Date(credit.date).toLocaleDateString('es-EC')}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      isPending 
                        ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}>
                      {isPending ? 'Pendiente' : 'Pagado'}
                    </span>
                  </div>

                  {/* Resumen de Medicamentos */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 bg-slate-50/70 p-2.5 rounded-xl space-y-1">
                    <span className="text-[8.5px] font-black uppercase text-slate-400 tracking-wider block">
                      Medicamentos Entregados:
                    </span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {credit.items.map((it, idx) => (
                        <div key={idx} className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                          <span className="truncate pr-2">
                            {it.quantity}x {it.name} {it.selectedUnit === 'BOX' ? '(Caja)' : '(Unid)'}
                          </span>
                          <span className="font-mono text-slate-500 shrink-0">
                            ${((it.selectedUnit === 'BOX' ? (it.publicBoxPrice || it.boxPrice || 0) : it.price) * it.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Saldo y Botones de Acción */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    
                    <div>
                      <span className="text-[8px] font-black uppercase text-slate-400 tracking-wider block">
                        Saldo Pendiente
                      </span>
                      <div className="text-base font-black text-rose-600 font-mono leading-none">
                        ${remaining.toFixed(2)}
                      </div>
                      {currentPaid > 0 && (
                        <span className="text-[9px] text-teal-600 font-bold">
                          Abonado: ${currentPaid.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      
                      {/* Botón Seleccionar este cliente en POS */}
                      <button
                        type="button"
                        onClick={() => {
                          onSelectCustomerInPOS(credit.customerName, credit.customerPhone);
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black rounded-xl transition flex items-center gap-1"
                        title="Seleccionar a este cliente en el mostrador del POS"
                      >
                        <UserIcon size={12} />
                        <span>Cargar al POS</span>
                      </button>

                      {/* Botón Cobrar Abono */}
                      {isPending && (
                        <button
                          type="button"
                          onClick={() => {
                            onOpenQuickPayment(credit);
                          }}
                          className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-[10px] font-black rounded-xl shadow-xs transition flex items-center gap-1 active:scale-95"
                          title="Registrar abono de dinero en caja"
                        >
                          <CreditCard size={12} />
                          <span>Cobrar Abono</span>
                        </button>
                      )}

                      {/* Botón Cargar Carrito a este ticket si hay items en carrito */}
                      {isPending && posCart.length > 0 && onAddDebtFromCart && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddDebtFromCart(credit);
                          }}
                          className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black rounded-xl shadow-xs transition flex items-center gap-1"
                          title="Cargar los medicamentos actuales del carrito del POS a esta cuenta fiada"
                        >
                          <PlusCircle size={12} />
                          <span>+ Sumar Carrito</span>
                        </button>
                      )}

                    </div>

                  </div>

                </div>
              );
            })
          )}

        </div>

      </div>

    </div>
  );
};

export default POSCreditDrawerModal;
