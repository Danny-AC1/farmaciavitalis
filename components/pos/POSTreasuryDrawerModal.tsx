import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Building2, 
  Coins, 
  History, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  Printer, 
  Lock, 
  Unlock, 
  Trash2, 
  ExternalLink,
  DollarSign,
  Landmark
} from 'lucide-react';
import { 
  streamTreasurySessions, 
  saveTreasurySessionDB, 
  updateTreasurySessionDB, 
  deleteTreasurySessionDB,
  streamTreasuryTransactions,
  saveTreasuryTransactionDB,
  deleteTreasuryTransactionDB,
  streamTreasuryDeposits,
  saveTreasuryDepositDB,
  updateTreasuryDepositStatusDB,
  deleteTreasuryDepositDB
} from '../../services/db.treasury';
import { streamOrders } from '../../services/db.orders';
import { TreasurySession, TreasuryTransaction, TreasuryDeposit, Order, User } from '../../types';
import { printTreasuryShiftTicket } from '../../utils/posTicketPrinter';

interface POSTreasuryDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  users?: User[];
  onGoToExtensionSuite?: () => void;
}

export const POSTreasuryDrawerModal: React.FC<POSTreasuryDrawerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users = [],
  onGoToExtensionSuite
}) => {
  // Streams de datos en tiempo real
  const [sessions, setSessions] = useState<TreasurySession[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [deposits, setDeposits] = useState<TreasuryDeposit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Subpestañas del modal
  const [activeTab, setActiveTab] = useState<'session' | 'transactions' | 'deposits' | 'history'>('session');

  // Alertas / Mensajes
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form: Apertura de Turno
  const [initialCashStr, setInitialCashStr] = useState('50.00');
  const [cashierName, setCashierName] = useState(currentUser?.displayName || 'Cajero POS');

  // Form: Ajuste / Egreso de Caja Chica
  const [txType, setTxType] = useState<'EGRESO' | 'INGRESO_EXTRA' | 'RETIRO_PARCIAL'>('EGRESO');
  const [txCategory, setTxCategory] = useState<'SUMINISTROS' | 'SERVICIOS' | 'REPARTO' | 'COMPRAS' | 'OTROS'>('SUMINISTROS');
  const [txAmountStr, setTxAmountStr] = useState('');
  const [txConcept, setTxConcept] = useState('');
  const [txBeneficiary, setTxBeneficiary] = useState('');

  // Form: Depósito Bancario
  const [depBankName, setDepBankName] = useState('Banco Pichincha');
  const [depReference, setDepReference] = useState('');
  const [depAmountStr, setDepAmountStr] = useState('');
  const [depNotes, setDepNotes] = useState('');

  // Form: Arqueo Ciego de Billetes y Monedas
  const [arqueo, setArqueo] = useState({
    bills100: 0,
    bills50: 0,
    bills20: 0,
    bills10: 0,
    bills5: 0,
    bills1: 0,
    coins050: 0,
    coins025: 0,
    coins010: 0,
    coins005: 0,
    coins001: 0
  });
  const [auditNotes, setAuditNotes] = useState('');
  const [isCierreConfirmed, setIsCierreConfirmed] = useState(false);

  // Subscripción a datos
  useEffect(() => {
    if (!isOpen) return;
    const unsubSessions = streamTreasurySessions(setSessions);
    const unsubTransactions = streamTreasuryTransactions(setTransactions);
    const unsubDeposits = streamTreasuryDeposits(setDeposits);
    const unsubOrders = streamOrders(setOrders);

    return () => {
      if (typeof unsubSessions === 'function') unsubSessions();
      if (typeof unsubTransactions === 'function') unsubTransactions();
      if (typeof unsubDeposits === 'function') unsubDeposits();
      if (typeof unsubOrders === 'function') unsubOrders();
    };
  }, [isOpen]);

  useEffect(() => {
    if (currentUser?.displayName && (!cashierName || cashierName === 'Cajero POS')) {
      setCashierName(currentUser.displayName);
    }
  }, [currentUser, cashierName]);

  // Sesión activa
  const activeSession = useMemo(() => {
    return sessions.find(s => s.status === 'OPEN') || null;
  }, [sessions]);

  // Cálculos financieros en vivo del turno actual
  const activeSessionCalculations = useMemo(() => {
    if (!activeSession) return null;

    const openTime = new Date(activeSession.openedAt).getTime();
    const sessionOrders = orders.filter(o => {
      const orderTime = new Date(o.date).getTime();
      return orderTime >= openTime && o.status === 'DELIVERED';
    });

    const cashSales = sessionOrders
      .filter(o => {
        const payStr = (o.paymentMethod || '').toUpperCase();
        return payStr === 'CASH' || payStr === 'EFECTIVO' || payStr === 'PAGADO EN EFECTIVO';
      })
      .reduce((sum, o) => sum + o.total, 0);

    const transferSales = sessionOrders
      .filter(o => {
        const payStr = (o.paymentMethod || '').toUpperCase();
        return payStr === 'TRANSFER' || payStr === 'TRANSFERENCIA' || payStr === 'CARD' || payStr === 'TARJETA';
      })
      .reduce((sum, o) => sum + o.total, 0);

    const sessionTxs = transactions.filter(t => t.sessionId === activeSession.id);
    
    const extraIngresos = sessionTxs
      .filter(t => t.type === 'INGRESO_EXTRA')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalEgresos = sessionTxs
      .filter(t => t.type === 'EGRESO')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalRetiros = sessionTxs
      .filter(t => t.type === 'RETIRO_PARCIAL')
      .reduce((sum, t) => sum + t.amount, 0);

    const expectedCashInDrawer = activeSession.initialCash + cashSales + extraIngresos - totalEgresos - totalRetiros;

    return {
      ordersCount: sessionOrders.length,
      cashSales,
      transferSales,
      totalSales: cashSales + transferSales,
      extraIngresos,
      totalEgresos,
      totalRetiros,
      expectedCashInDrawer,
      transactions: sessionTxs
    };
  }, [activeSession, orders, transactions]);

  // Suma de efectivo físico en arqueo
  const countedCashSum = useMemo(() => {
    const bills = 
      (arqueo.bills100 * 100) +
      (arqueo.bills50 * 50) +
      (arqueo.bills20 * 20) +
      (arqueo.bills10 * 10) +
      (arqueo.bills5 * 5) +
      (arqueo.bills1 * 1);

    const coins = 
      (arqueo.coins050 * 0.50) +
      (arqueo.coins025 * 0.25) +
      (arqueo.coins010 * 0.10) +
      (arqueo.coins005 * 0.05) +
      (arqueo.coins001 * 0.01);

    return bills + coins;
  }, [arqueo]);

  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 4000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 4000);
    }
  };

  const adjustDenom = (field: keyof typeof arqueo, delta: number) => {
    setArqueo(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  // 1. Apertura de Turno
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierName.trim()) {
      alert('Por favor ingrese el nombre del responsable de caja.');
      return;
    }
    const initialCash = parseFloat(initialCashStr) || 0;
    
    const newSession: TreasurySession = {
      id: `SESS-${Date.now()}`,
      status: 'OPEN',
      openedBy: cashierName.trim(),
      openedAt: new Date().toISOString(),
      initialCash
    };

    try {
      await saveTreasurySessionDB(newSession);
      setArqueo({
        bills100: 0,
        bills50: 0,
        bills20: 0,
        bills10: 0,
        bills5: 0,
        bills1: 0,
        coins050: 0,
        coins025: 0,
        coins010: 0,
        coins005: 0,
        coins001: 0
      });
      setAuditNotes('');
      setIsCierreConfirmed(false);
      showNotification('¡Turno de caja abierto exitosamente!');
    } catch {
      showNotification('Error al abrir turno de caja.', true);
    }
  };

  // 2. Registro de Egreso o Ajuste
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseFloat(txAmountStr) || 0;
    if (amount <= 0) {
      alert('El monto debe ser mayor a cero.');
      return;
    }
    if (!txConcept.trim()) {
      alert('Por favor ingrese el concepto del egreso o movimiento.');
      return;
    }

    const newTx: TreasuryTransaction = {
      id: `TX-${Date.now()}`,
      sessionId: activeSession.id,
      type: txType,
      category: txType === 'EGRESO' ? txCategory : 'OTROS',
      amount,
      concept: txConcept.trim(),
      beneficiary: txBeneficiary.trim() || undefined,
      date: new Date().toISOString(),
      performedBy: activeSession.openedBy
    };

    try {
      await saveTreasuryTransactionDB(newTx);
      setTxAmountStr('');
      setTxConcept('');
      setTxBeneficiary('');
      showNotification(`¡Movimiento (${txType}) registrado con éxito!`);
    } catch {
      showNotification('Error al registrar movimiento.', true);
    }
  };

  // 3. Registro de Depósito Bancario
  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseFloat(depAmountStr) || 0;
    if (amount <= 0) {
      alert('El monto debe ser mayor a cero.');
      return;
    }
    if (!depReference.trim()) {
      alert('Por favor ingrese la referencia o número de comprobante.');
      return;
    }

    const newDeposit: TreasuryDeposit = {
      id: `DEP-${Date.now()}`,
      sessionId: activeSession.id,
      bankName: depBankName,
      referenceNumber: depReference.trim(),
      amount,
      date: new Date().toISOString(),
      status: 'PENDIENTE',
      notes: depNotes.trim() || undefined
    };

    try {
      await saveTreasuryDepositDB(newDeposit);
      setDepReference('');
      setDepAmountStr('');
      setDepNotes('');
      showNotification('¡Depósito registrado para conciliación!');
    } catch {
      showNotification('Error al registrar depósito.', true);
    }
  };

  // 4. Cierre de Turno y Arqueo Ciego
  const handleCloseSessionSubmit = async (printTicket: boolean = false) => {
    if (!activeSession || !activeSessionCalculations) return;

    const actualCash = countedCashSum;
    const expectedCash = activeSessionCalculations.expectedCashInDrawer;
    const discrepancy = actualCash - expectedCash;

    const updates: Partial<TreasurySession> = {
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: activeSession.openedBy,
      expectedCash,
      actualCash,
      discrepancy,
      notes: auditNotes.trim() || undefined,
      blindArqueo: { ...arqueo }
    };

    try {
      await updateTreasurySessionDB(activeSession.id, updates);
      
      const fullClosedSession: TreasurySession = {
        ...activeSession,
        ...updates
      };

      if (printTicket) {
        printTreasuryShiftTicket(fullClosedSession, activeSessionCalculations);
      }

      showNotification(`¡Turno cerrado con éxito! Discrepancia: $${discrepancy.toFixed(2)}`);
      setActiveTab('history');
    } catch {
      showNotification('Error al registrar el cierre de turno.', true);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-50 border border-slate-200 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        
        {/* HEADER DE TESORERÍA POS */}
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-rose-400 flex items-center justify-center shadow-md">
              <Landmark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Tesorería Avanzada & Caja POS</h3>
                {activeSession ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    TURNO ABIERTO: {activeSession.openedBy}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <Lock size={10} />
                    CAJA CERRADA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">Control de arqueo de billetes, egresos de caja chica y cuadre de efectivo.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onGoToExtensionSuite && (
              <button
                onClick={() => {
                  onClose();
                  onGoToExtensionSuite();
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition"
                title="Abrir en Módulo Completo de Suite Gerencial"
              >
                <ExternalLink size={13} />
                Suite Gerencial
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* NAVEGACIÓN DE SUBPESTAÑAS */}
        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            onClick={() => setActiveTab('session')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'session'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <BookOpen size={13} />
            {activeSession ? 'Turno Activo & Arqueo' : 'Apertura de Caja'}
          </button>

          <button
            onClick={() => setActiveTab('transactions')}
            disabled={!activeSession}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Coins size={13} />
            Egresos / Caja Chica {activeSessionCalculations?.totalEgresos ? `(-$${activeSessionCalculations.totalEgresos.toFixed(2)})` : ''}
          </button>

          <button
            onClick={() => setActiveTab('deposits')}
            disabled={!activeSession}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed ${
              activeTab === 'deposits'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <Building2 size={13} />
            Depósitos Bancarios
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <History size={13} />
            Historial de Cierres ({sessions.filter(s => s.status === 'CLOSED').length})
          </button>
        </div>

        {/* ALERTAS */}
        {successMsg && (
          <div className="mx-5 mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mx-5 mt-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CONTENIDO PRINCIPAL */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: TURNO Y ARQUEO */}
          {activeTab === 'session' && (
            <>
              {!activeSession ? (
                /* FORMULARIO DE APERTURA RÁPIDA */
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm max-w-xl mx-auto space-y-5 text-center">
                  <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Lock size={28} />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-slate-800">Apertura de Turno en POS</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Inicia el turno de caja indicando el fondo inicial para cambio. Todas las ventas en efectivo se acumularán automáticamente.
                    </p>
                  </div>

                  <form onSubmit={handleOpenSession} className="space-y-4 text-left">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                        Cajero(a) Responsable *
                      </label>
                      <input
                        type="text"
                        required
                        value={cashierName}
                        onChange={(e) => setCashierName(e.target.value)}
                        placeholder="Nombre del responsable"
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition"
                      />
                      {users.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          <span className="text-[9px] text-slate-400 font-bold self-center">Personal:</span>
                          {users.filter(u => u.displayName).slice(0, 4).map(u => (
                            <button
                              key={u.uid}
                              type="button"
                              onClick={() => setCashierName(u.displayName || '')}
                              className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[9px] font-bold text-slate-700 transition"
                            >
                              {u.displayName}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                        Fondo de Apertura (Efectivo en Caja) *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={initialCashStr}
                          onChange={(e) => setInitialCashStr(e.target.value)}
                          placeholder="50.00"
                          className="w-full pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800 transition"
                        />
                      </div>

                      {/* Presets rápidos */}
                      <div className="flex gap-2 mt-2">
                        {['20.00', '30.00', '50.00', '100.00'].map(val => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => setInitialCashStr(val)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] font-bold text-slate-700 transition"
                          >
                            ${val}
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-md active:scale-98 flex items-center justify-center gap-2"
                    >
                      <Unlock size={14} className="text-emerald-400" />
                      <span>Abrir Turno de Caja</span>
                    </button>
                  </form>
                </div>
              ) : (
                /* PANEL EN VIVO: TURNO ACTIVO Y ARQUEO */
                <div className="space-y-4">
                  {/* RESUMEN DE CIFRAS DEL TURNO */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Fondo Inicial</span>
                      <span className="text-sm font-black text-slate-800 mt-1 block">
                        ${activeSession.initialCash.toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 truncate block">Desde {new Date(activeSession.openedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block">Ventas Efectivo</span>
                      <span className="text-sm font-black text-emerald-700 mt-1 block">
                        +${(activeSessionCalculations?.cashSales || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block">{activeSessionCalculations?.ordersCount || 0} pedidos</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block">Transferencias</span>
                      <span className="text-sm font-black text-blue-700 mt-1 block">
                        ${(activeSessionCalculations?.transferSales || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block">Bancos/Tarjetas</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest block">Egresos Caja</span>
                      <span className="text-sm font-black text-rose-700 mt-1 block">
                        -${(activeSessionCalculations?.totalEgresos || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block">Gastos menores</span>
                    </div>

                    <div className="bg-white p-3 rounded-2xl border border-slate-200">
                      <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest block">Retiros Caja</span>
                      <span className="text-sm font-black text-purple-700 mt-1 block">
                        -${(activeSessionCalculations?.totalRetiros || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block">Caja fuerte</span>
                    </div>

                    <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-sm">
                      <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest block">Efectivo Esperado</span>
                      <span className="text-base font-black text-white mt-1 block">
                        ${(activeSessionCalculations?.expectedCashInDrawer || 0).toFixed(2)}
                      </span>
                      <span className="text-[9px] text-slate-400 block">En Gaveta</span>
                    </div>
                  </div>

                  {/* ARQUEO CIEGO: CONTEO DE BILLETES Y MONEDAS */}
                  <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-150 pb-3">
                      <div>
                        <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                          <DollarSign size={16} className="text-rose-600" />
                          Arqueo de Efectivo (Billetes y Monedas)
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">Cuenta las cantidades físicas en la gaveta para calcular el cuadre de caja.</p>
                      </div>

                      {/* Contador total contado vs esperado */}
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-[9px] font-bold text-slate-400 uppercase block">Total Contado</span>
                          <span className="text-base font-black text-slate-900">${countedCashSum.toFixed(2)}</span>
                        </div>

                        {/* Indicador de Descuadre */}
                        {activeSessionCalculations && (
                          <div className={`px-3 py-1.5 rounded-xl border text-xs font-black ${
                            Math.abs(countedCashSum - activeSessionCalculations.expectedCashInDrawer) < 0.01
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : countedCashSum > activeSessionCalculations.expectedCashInDrawer
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {Math.abs(countedCashSum - activeSessionCalculations.expectedCashInDrawer) < 0.01 ? (
                              '✓ CUADRE EXACTO'
                            ) : countedCashSum > activeSessionCalculations.expectedCashInDrawer ? (
                              `SOBRANTE: +$${(countedCashSum - activeSessionCalculations.expectedCashInDrawer).toFixed(2)}`
                            ) : (
                              `FALTANTE: -$${Math.abs(countedCashSum - activeSessionCalculations.expectedCashInDrawer).toFixed(2)}`
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* GRID DE DENOMINACIONES */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                      {[
                        { label: '$100', field: 'bills100', mult: 100, isCoin: false },
                        { label: '$50', field: 'bills50', mult: 50, isCoin: false },
                        { label: '$20', field: 'bills20', mult: 20, isCoin: false },
                        { label: '$10', field: 'bills10', mult: 10, isCoin: false },
                        { label: '$5', field: 'bills5', mult: 5, isCoin: false },
                        { label: '$1 (Billete/Moneda)', field: 'bills1', mult: 1, isCoin: false },
                        { label: '50¢ (Moneda)', field: 'coins050', mult: 0.50, isCoin: true },
                        { label: '25¢ (Moneda)', field: 'coins025', mult: 0.25, isCoin: true },
                        { label: '10¢ (Moneda)', field: 'coins010', mult: 0.10, isCoin: true },
                        { label: '5¢ (Moneda)', field: 'coins005', mult: 0.05, isCoin: true },
                        { label: '1¢ (Moneda)', field: 'coins001', mult: 0.01, isCoin: true }
                      ].map(denom => {
                        const count = (arqueo as any)[denom.field] || 0;
                        const subtotal = count * denom.mult;
                        return (
                          <div key={denom.field} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
                              <span>{denom.label}</span>
                              <span className="font-black text-rose-600">${subtotal.toFixed(2)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => adjustDenom(denom.field as any, -1)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-black text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                              >
                                -
                              </button>
                              
                              <input
                                type="number"
                                min="0"
                                value={count}
                                onChange={(e) => {
                                  const val = parseInt(e.target.value) || 0;
                                  setArqueo(prev => ({ ...prev, [denom.field]: Math.max(0, val) }));
                                }}
                                className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => adjustDenom(denom.field as any, 1)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-black text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center"
                              >
                                +
                              </button>
                            </div>

                            {/* Atajos rápidos +5 y +10 */}
                            <div className="flex gap-1 justify-center pt-0.5">
                              <button
                                type="button"
                                onClick={() => adjustDenom(denom.field as any, 5)}
                                className="px-1.5 py-0.5 bg-slate-200/60 hover:bg-slate-200 rounded text-[8px] font-bold text-slate-600"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => adjustDenom(denom.field as any, 10)}
                                className="px-1.5 py-0.5 bg-slate-200/60 hover:bg-slate-200 rounded text-[8px] font-bold text-slate-600"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* NOTAS Y CIERRE DEFINITIVO */}
                    <div className="pt-3 border-t border-slate-150 space-y-3">
                      <div>
                        <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">
                          Observaciones / Justificativo de Arqueo (Opcional)
                        </label>
                        <input
                          type="text"
                          value={auditNotes}
                          onChange={(e) => setAuditNotes(e.target.value)}
                          placeholder="Ej: Se entregó $50 de fondo al siguiente turno, cuadre exacto sin novedades."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isCierreConfirmed}
                            onChange={(e) => setIsCierreConfirmed(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                          />
                          <span className="text-xs font-bold text-slate-700">
                            He verificado el conteo de efectivo y confirmo el cierre de turno.
                          </span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={!isCierreConfirmed}
                            onClick={() => handleCloseSessionSubmit(false)}
                            className="px-4 py-2.5 rounded-xl font-black text-xs bg-slate-800 hover:bg-slate-900 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
                          >
                            Cerrar Turno
                          </button>

                          <button
                            type="button"
                            disabled={!isCierreConfirmed}
                            onClick={() => handleCloseSessionSubmit(true)}
                            className="px-4 py-2.5 rounded-xl font-black text-xs bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
                          >
                            <Printer size={14} />
                            <span>Cerrar e Imprimir Ticket</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: EGRESOS Y CAJA CHICA */}
          {activeTab === 'transactions' && activeSession && (
            <div className="space-y-4">
              {/* FORMULARIO DE NUEVO EGRESO */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Coins size={16} className="text-rose-600" />
                  Registrar Movimiento de Caja Chica
                </h4>

                <form onSubmit={handleAddTransaction} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Tipo de Movimiento</label>
                      <select
                        value={txType}
                        onChange={(e) => setTxType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="EGRESO">Egreso / Gasto Menor (-)</option>
                        <option value="INGRESO_EXTRA">Ingreso Extra (+)</option>
                        <option value="RETIRO_PARCIAL">Retiro / Envío a Caja Fuerte (-)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Categoría</label>
                      <select
                        value={txCategory}
                        onChange={(e) => setTxCategory(e.target.value as any)}
                        disabled={txType !== 'EGRESO'}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 disabled:opacity-50"
                      >
                        <option value="SUMINISTROS">Suministros (Fundas, Limpieza, etc.)</option>
                        <option value="SERVICIOS">Servicios Básicos / Internet / Agua</option>
                        <option value="REPARTO">Flete / Reparto a Domicilio</option>
                        <option value="COMPRAS">Compras Urgentes de Medicamentos</option>
                        <option value="OTROS">Otros Gastos</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Monto ($) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={txAmountStr}
                          onChange={(e) => setTxAmountStr(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Concepto / Motivo *</label>
                      <input
                        type="text"
                        required
                        value={txConcept}
                        onChange={(e) => setTxConcept(e.target.value)}
                        placeholder="Ej: Pago de fundas plásticas para mostrador"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Beneficiario / Proveedor</label>
                      <input
                        type="text"
                        value={txBeneficiary}
                        onChange={(e) => setTxBeneficiary(e.target.value)}
                        placeholder="Ej: Comercial Don Pepe / Mensajero"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Atajos de conceptos comunes */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Atajos:</span>
                    {['Fundas / Bolsas', 'Agua de botellón', 'Pago Delivery', 'Artículos de limpieza', 'Pago flete medicina'].map(shortcut => (
                      <button
                        key={shortcut}
                        type="button"
                        onClick={() => {
                          setTxConcept(shortcut);
                          setTxType('EGRESO');
                        }}
                        className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded-md text-[9px] font-bold text-slate-600 transition"
                      >
                        {shortcut}
                      </button>
                    ))}
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm"
                    >
                      Registrar Movimiento
                    </button>
                  </div>
                </form>
              </div>

              {/* LISTADO DE MOVIMIENTOS DEL TURNO */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">
                    Movimientos de la Sesión Actual ({activeSessionCalculations?.transactions.length || 0})
                  </span>
                  <span className="text-xs font-black text-rose-600">
                    Total Egresos: -${(activeSessionCalculations?.totalEgresos || 0).toFixed(2)}
                  </span>
                </div>

                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {activeSessionCalculations?.transactions.map(tx => (
                    <div key={tx.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            tx.type === 'EGRESO' ? 'bg-rose-100 text-rose-700' :
                            tx.type === 'INGRESO_EXTRA' ? 'bg-emerald-100 text-emerald-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {tx.type} {tx.category ? `(${tx.category})` : ''}
                          </span>
                          <span className="font-bold text-slate-900">{tx.concept}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-2">
                          <span>{new Date(tx.date).toLocaleTimeString()}</span>
                          {tx.beneficiary && <span>• Para: {tx.beneficiary}</span>}
                          <span>• Por: {tx.performedBy}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`font-black ${
                          tx.type === 'EGRESO' ? 'text-rose-600' :
                          tx.type === 'INGRESO_EXTRA' ? 'text-emerald-600' :
                          'text-purple-600'
                        }`}>
                          {tx.type === 'INGRESO_EXTRA' ? '+' : '-'}${tx.amount.toFixed(2)}
                        </span>
                        
                        <button
                          onClick={async () => {
                            if (confirm('¿Eliminar este movimiento de caja?')) {
                              await deleteTreasuryTransactionDB(tx.id);
                              showNotification('Movimiento eliminado.');
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {(!activeSessionCalculations?.transactions || activeSessionCalculations.transactions.length === 0) && (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No se han registrado egresos o movimientos adicionales en este turno.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DEPÓSITOS BANCARIOS */}
          {activeTab === 'deposits' && activeSession && (
            <div className="space-y-4">
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h4 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 size={16} className="text-blue-600" />
                  Registrar Depósito Bancario / Conciliación
                </h4>

                <form onSubmit={handleAddDeposit} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Banco Destino *</label>
                      <select
                        value={depBankName}
                        onChange={(e) => setDepBankName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                      >
                        <option value="Banco Pichincha">Banco Pichincha</option>
                        <option value="Banco Guayaquil">Banco Guayaquil</option>
                        <option value="Banco Bolivariano">Banco Bolivariano</option>
                        <option value="Banco del Pacífico">Banco del Pacífico</option>
                        <option value="Produbanco">Produbanco</option>
                        <option value="Cooperativa JEP">Cooperativa JEP</option>
                        <option value="Otros">Otros</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Nº Comprobante / Papeleta *</label>
                      <input
                        type="text"
                        required
                        value={depReference}
                        onChange={(e) => setDepReference(e.target.value)}
                        placeholder="Ej: DEP-891048"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Monto Depositado ($) *</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={depAmountStr}
                          onChange={(e) => setDepAmountStr(e.target.value)}
                          placeholder="0.00"
                          className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-wider block mb-1">Notas / Detalle</label>
                    <input
                      type="text"
                      value={depNotes}
                      onChange={(e) => setDepNotes(e.target.value)}
                      placeholder="Ej: Depósito de ventas de la mañana en ventanilla"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black text-xs uppercase tracking-wider transition shadow-sm"
                    >
                      Registrar Depósito
                    </button>
                  </div>
                </form>
              </div>

              {/* LISTADO DE DEPÓSITOS */}
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider">
                  Depósitos Registrados ({deposits.length})
                </div>

                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {deposits.map(dep => (
                    <div key={dep.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900">{dep.bankName}</span>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono">Ref: {dep.referenceNumber}</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                            dep.status === 'CONCILIADO' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {dep.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(dep.date).toLocaleString()} {dep.notes ? `• ${dep.notes}` : ''}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="font-black text-blue-600">${dep.amount.toFixed(2)}</span>
                        <button
                          onClick={async () => {
                            const newSt = dep.status === 'CONCILIADO' ? 'PENDIENTE' : 'CONCILIADO';
                            await updateTreasuryDepositStatusDB(dep.id, newSt);
                            showNotification(`Depósito marcado como ${newSt}`);
                          }}
                          className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700"
                        >
                          {dep.status === 'CONCILIADO' ? 'Revertir' : 'Conciliar'}
                        </button>
                        <button
                          onClick={async () => {
                            if (confirm('¿Eliminar este registro de depósito?')) {
                              await deleteTreasuryDepositDB(dep.id);
                              showNotification('Depósito eliminado.');
                            }
                          }}
                          className="p-1 text-slate-300 hover:text-rose-600 rounded"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))}

                  {deposits.length === 0 && (
                    <div className="p-6 text-center text-xs text-slate-400 italic">
                      No hay depósitos bancarios registrados aún.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL DE ARQUEOS Y CIERRES */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-3 bg-slate-100/70 border-b border-slate-200 text-xs font-black text-slate-800 uppercase tracking-wider">
                  Historial de Turnos y Arqueos Pasados ({sessions.filter(s => s.status === 'CLOSED').length})
                </div>

                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {sessions.filter(s => s.status === 'CLOSED').map(s => {
                    const discrepancy = s.discrepancy || 0;
                    return (
                      <div key={s.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-900 text-xs">{s.id}</span>
                            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-600">
                              Responsable: {s.openedBy}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${
                              Math.abs(discrepancy) < 0.01 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : discrepancy > 0 
                                ? 'bg-blue-100 text-blue-800' 
                                : 'bg-rose-100 text-rose-800'
                            }`}>
                              {Math.abs(discrepancy) < 0.01 ? 'Cuadre Exacto' : discrepancy > 0 ? `Sobrante +$${discrepancy.toFixed(2)}` : `Faltante -$${Math.abs(discrepancy).toFixed(2)}`}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                            <span>Apertura: {new Date(s.openedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                            {s.closedAt && <span>Cierre: {new Date(s.closedAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>}
                            <span>Fondo: ${s.initialCash.toFixed(2)}</span>
                            {s.notes && <span className="italic text-slate-400">"{s.notes}"</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <div className="text-right">
                            <span className="text-[9px] font-bold text-slate-400 uppercase block">Efectivo Contado</span>
                            <span className="text-xs font-black text-slate-800">${(s.actualCash || 0).toFixed(2)}</span>
                          </div>

                          <button
                            onClick={() => printTreasuryShiftTicket(s)}
                            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                            title="Reimprimir Comprobante Térmico de Arqueo"
                          >
                            <Printer size={15} />
                          </button>

                          <button
                            onClick={async () => {
                              if (confirm('¿Eliminar este registro de cierre del historial?')) {
                                await deleteTreasurySessionDB(s.id);
                                showNotification('Cierre eliminado.');
                              }
                            }}
                            className="p-2 text-slate-300 hover:text-rose-600 rounded-xl transition"
                            title="Eliminar registro"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {sessions.filter(s => s.status === 'CLOSED').length === 0 && (
                    <div className="p-8 text-center text-xs text-slate-400 italic">
                      No hay historial de turnos cerrados todavía.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default POSTreasuryDrawerModal;
