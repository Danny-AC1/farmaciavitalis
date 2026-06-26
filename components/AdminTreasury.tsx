import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Coins, 
  User, 
  ArrowUpRight, 
  ArrowDownRight, 
  Plus, 
  CheckCircle, 
  AlertCircle, 
  History, 
  BookOpen, 
  ClipboardCheck, 
  Lock, 
  Unlock, 
  Info, 
  FileText, 
  Banknote,
  TrendingUp
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
} from '../services/db.treasury';
import { streamOrders } from '../services/db.orders';
import { TreasurySession, TreasuryTransaction, TreasuryDeposit, Order } from '../types';

interface AdminTreasuryProps {
  products: any[];
}

const AdminTreasury: React.FC<AdminTreasuryProps> = () => {
  // Real-time data states
  const [sessions, setSessions] = useState<TreasurySession[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [deposits, setDeposits] = useState<TreasuryDeposit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Local navigation and panel states
  const [activeSubTab, setActiveSubTab] = useState<'session' | 'transactions' | 'deposits' | 'history'>('session');
  
  // Alert/Message states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states: Session Opening
  const [initialCashStr, setInitialCashStr] = useState('50.00');
  const [cashierName, setCashierName] = useState('');

  // Form states: New Transaction (Egreso, Ingreso Extra, Retiro Parcial)
  const [txType, setTxType] = useState<'EGRESO' | 'INGRESO_EXTRA' | 'RETIRO_PARCIAL'>('EGRESO');
  const [txCategory, setTxCategory] = useState<'SUMINISTROS' | 'SERVICIOS' | 'REPARTO' | 'COMPRAS' | 'OTROS'>('SUMINISTROS');
  const [txAmountStr, setTxAmountStr] = useState('');
  const [txConcept, setTxConcept] = useState('');
  const [txBeneficiary, setTxBeneficiary] = useState('');

  // Form states: New Bank Deposit
  const [depBankName, setDepBankName] = useState('Banco Pichincha');
  const [depReference, setDepReference] = useState('');
  const [depAmountStr, setDepAmountStr] = useState('');
  const [depNotes, setDepNotes] = useState('');

  // Form states: Blind Cash Audit (Arqueo de Caja)
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

  // Subscribe to real-time updates
  useEffect(() => {
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
  }, []);

  // Compute active session if any exists
  const activeSession = useMemo(() => {
    return sessions.find(s => s.status === 'OPEN') || null;
  }, [sessions]);

  // Compute stats of orders and adjustments belonging to the active session
  const activeSessionCalculations = useMemo(() => {
    if (!activeSession) return null;

    // Filter orders created after the session opened
    const openTime = new Date(activeSession.openedAt).getTime();
    const sessionOrders = orders.filter(o => {
      const orderTime = new Date(o.date).getTime();
      return orderTime >= openTime && o.status === 'DELIVERED';
    });

    // Subdivide sales by payment methods
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

    // Filter session cash adjustments
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

    // Expected cash in drawer = Initial + Cash Sales + Extra Incomes - Expenditures - Safe Drops
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

  // Dynamic counted cash sum for Blind Cash Audit
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

  // Helper trigger alerts
  const showNotification = (msg: string, isError = false) => {
    if (isError) {
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    } else {
      setSuccessMsg(msg);
      setTimeout(() => setSuccessMsg(null), 5000);
    }
  };

  // 1. OPEN SESSION HANDLER
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierName.trim()) {
      alert('Por favor digite el nombre de la persona responsable.');
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
      setCashierName('');
      // Reset arqueo values
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
      showNotification('¡Sesión de Caja Abierta exitosamente!');
    } catch (err) {
      showNotification('Fallo al abrir caja.', true);
    }
  };

  // 2. NEW CASH ADJUSTMENT HANDLER
  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseFloat(txAmountStr) || 0;
    if (amount <= 0) {
      alert('El monto debe ser mayor a cero.');
      return;
    }
    if (!txConcept.trim()) {
      alert('Por favor digite el concepto/justificativo.');
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
      showNotification(`¡Ajuste de caja (${txType}) registrado con éxito!`);
    } catch (err) {
      showNotification('Fallo al registrar ajuste de caja.', true);
    }
  };

  // 3. NEW BANK DEPOSIT HANDLER
  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseFloat(depAmountStr) || 0;
    if (amount <= 0) {
      alert('El monto del depósito debe ser mayor a cero.');
      return;
    }
    if (!depReference.trim()) {
      alert('Por favor digite el número de comprobante o referencia bancaria.');
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
      showNotification('¡Comprobante de Depósito Bancario registrado para conciliación!');
    } catch (err) {
      showNotification('Fallo al registrar depósito.', true);
    }
  };

  // 4. CLOSE SESSION HANDLER (Blind Cash Audit & Discrepancies)
  const handleCloseSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession || !activeSessionCalculations) return;

    const actualCash = countedCashSum;
    const expectedCash = activeSessionCalculations.expectedCashInDrawer;
    const discrepancy = actualCash - expectedCash;

    const updates: Partial<TreasurySession> = {
      status: 'CLOSED',
      closedAt: new Date().toISOString(),
      closedBy: activeSession.openedBy, // Closed by whoever is logged in/active on session
      expectedCash,
      actualCash,
      discrepancy,
      notes: auditNotes.trim() || undefined,
      blindArqueo: { ...arqueo }
    };

    try {
      await updateTreasurySessionDB(activeSession.id, updates);
      showNotification(`¡Turno cerrado! Arqueo finalizado. Discrepancia calculada: $${discrepancy.toFixed(2)}`);
      setActiveSubTab('history');
    } catch (err) {
      showNotification('Fallo al registrar el cierre de caja.', true);
    }
  };

  // Delete transaction log handler (admin precaution)
  const handleDeleteTransaction = async (id: string) => {
    if (confirm('¿Está seguro de eliminar esta transacción de caja? Esto recalculará el monto esperado.')) {
      await deleteTreasuryTransactionDB(id);
      showNotification('Ajuste de caja eliminado.');
    }
  };

  // Delete deposit helper
  const handleDeleteDeposit = async (id: string) => {
    if (confirm('¿Desea eliminar este registro de depósito?')) {
      await deleteTreasuryDepositDB(id);
      showNotification('Registro de depósito eliminado.');
    }
  };

  // Toggle deposit reconciliation status
  const handleToggleDepositReconcile = async (dep: TreasuryDeposit) => {
    const newStatus = dep.status === 'CONCILIADO' ? 'PENDIENTE' : 'CONCILIADO';
    await updateTreasuryDepositStatusDB(dep.id, newStatus);
    showNotification(`Depósito marcado como ${newStatus}`);
  };

  // Denomination incrementer/decrementer helper
  const adjustDenom = (field: keyof typeof arqueo, delta: number) => {
    setArqueo(prev => ({
      ...prev,
      [field]: Math.max(0, prev[field] + delta)
    }));
  };

  // Global historical summary stats
  const historicStats = useMemo(() => {
    const closed = sessions.filter(s => s.status === 'CLOSED');
    const totalDiscrepancies = closed.reduce((sum, s) => sum + (s.discrepancy || 0), 0);
    return {
      closedCount: closed.length,
      totalDiscrepancies,
      totalInitialFunds: closed.reduce((sum, s) => sum + s.initialCash, 0),
      totalCountedCash: closed.reduce((sum, s) => sum + (s.actualCash || 0), 0)
    };
  }, [sessions]);

  return (
    <div className="space-y-6">
      
      {/* Módulo Banner */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest bg-rose-50 px-3 py-1 rounded-full inline-block">
            Módulo Premium Administrativo
          </span>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2">Tesorería Avanzada & Conciliaciones</h3>
          <p className="text-xs text-slate-500 font-medium">Controla arqueos de caja ciegos, egresos detallados, depósitos bancarios y diferencias de dinero.</p>
        </div>

        {/* Sub-navegación local */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSubTab('session')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubTab === 'session'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <BookOpen size={13} />
            {activeSession ? 'Turno Activo' : 'Apertura Caja'}
          </button>
          
          <button
            onClick={() => setActiveSubTab('transactions')}
            disabled={!activeSession}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              activeSubTab === 'transactions'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Coins size={13} />
            Egresos / Caja Chica
          </button>

          <button
            onClick={() => setActiveSubTab('deposits')}
            disabled={!activeSession}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
              activeSubTab === 'deposits'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Building2 size={13} />
            Depósitos / Conciliación
          </button>

          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              activeSubTab === 'history'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <History size={13} />
            Historial de Arqueos ({historicStats.closedCount})
          </button>
        </div>
      </div>

      {/* Alertas */}
      {successMsg && (
        <div className="bg-teal-50 border-l-4 border-teal-500 text-teal-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={18} className="text-teal-600 shrink-0" />
          <span className="text-xs font-semibold">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span className="text-xs font-semibold">{errorMsg}</span>
        </div>
      )}

      {/* VISTA 1: SESSION / APERTURA DE CAJA O CONTROL DE TURNO ACTIVO */}
      {activeSubTab === 'session' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* APERTURA DE CAJA (Si no hay sesión activa) */}
          {!activeSession ? (
            <div className="lg:col-span-12 bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm max-w-2xl mx-auto w-full text-center space-y-6">
              <div className="mx-auto h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400">
                <Lock size={32} />
              </div>

              <div className="space-y-2">
                <h4 className="text-lg font-black text-slate-800 tracking-tight">Turno Cerrado / Caja Fuera de Línea</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                  Para registrar transacciones de caja chica, conciliar depósitos y llevar el control diario de arqueos, debes realizar la apertura del cajón de efectivo con un fondo inicial para cambio.
                </p>
              </div>

              <form onSubmit={handleOpenSession} className="max-w-md mx-auto bg-slate-50/50 p-6 rounded-[2rem] border border-slate-150 space-y-4 text-left">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Fondo de Apertura (Efectivo en Caja) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={initialCashStr}
                      onChange={(e) => setInitialCashStr(e.target.value)}
                      placeholder="50.00"
                      className="w-full pl-8 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                  <span className="text-[9.5px] text-slate-400 block font-medium">Sencillo o cambio destinado a iniciar el día en la farmacia.</span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Cajero(a) Responsable *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="Ej: Milena Tigua"
                      value={cashierName}
                      onChange={(e) => setCashierName(e.target.value)}
                      className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-rose-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Unlock size={14} />
                  Abrir Turno de Caja Chica
                </button>
              </form>
            </div>
          ) : (
            /* CONTROL DE TURNO ACTIVO Y ARQUEO CIEGO */
            <>
              {/* Resumen del Balance de Efectivo */}
              <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
                      Turno Activo
                    </span>
                    <span className="text-[11px] text-slate-400 font-bold font-mono">
                      {activeSession.id}
                    </span>
                  </div>

                  <div className="mt-4 space-y-1">
                    <h4 className="text-base font-extrabold text-slate-800">Responsable: {activeSession.openedBy}</h4>
                    <span className="text-[10.5px] text-slate-400 font-semibold block">
                      Apertura: {new Date(activeSession.openedAt).toLocaleDateString('es-ES')} {new Date(activeSession.openedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Cuentas en tiempo real */}
                  {activeSessionCalculations && (
                    <div className="mt-6 space-y-3 pt-6 border-t border-slate-100">
                      
                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                        <span>Fondo Inicial de Caja:</span>
                        <span className="font-mono text-slate-800 font-bold">${activeSession.initialCash.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                        <span>Ingresos Ventas Efectivo (+):</span>
                        <span className="font-mono text-emerald-600 font-bold">${activeSessionCalculations.cashSales.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                        <span>Ingresos Extra (+):</span>
                        <span className="font-mono text-emerald-600 font-bold">${activeSessionCalculations.extraIngresos.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                        <span>Egresos Detallados (-):</span>
                        <span className="font-mono text-rose-500 font-bold">-${activeSessionCalculations.totalEgresos.toFixed(2)}</span>
                      </div>

                      <div className="flex justify-between items-center text-xs text-slate-600 font-semibold">
                        <span>Retiros Parciales / Caja Fuerte (-):</span>
                        <span className="font-mono text-rose-500 font-bold">-${activeSessionCalculations.totalRetiros.toFixed(2)}</span>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 flex justify-between items-center mt-4">
                        <div>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Saldo Teórico en Caja</span>
                          <span className="text-[10.5px] text-slate-500 font-bold">(Sistema debiese tener en Efectivo)</span>
                        </div>
                        <span className="text-xl font-black text-slate-800 font-mono">
                          ${activeSessionCalculations.expectedCashInDrawer.toFixed(2)}
                        </span>
                      </div>

                      {/* Transacciones que no alteran el efectivo en caja chica sino el banco */}
                      <div className="pt-4 border-t border-dashed border-slate-200 flex justify-between items-center text-xs text-slate-500 font-semibold">
                        <span className="flex items-center gap-1">
                          <TrendingUp size={13} className="text-sky-500" />
                          Ventas por Transferencia (Banco):
                        </span>
                        <span className="font-mono text-slate-700 font-bold">${activeSessionCalculations.transferSales.toFixed(2)}</span>
                      </div>

                    </div>
                  )}
                </div>

                <div className="bg-amber-50/50 p-3.5 rounded-2xl border border-amber-200/60 text-amber-800 text-[11px] leading-relaxed font-semibold flex items-start gap-2">
                  <Info size={15} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    El Arqueo Ciego requiere que cuentes el efectivo billete por billete y moneda por moneda a la derecha. El sistema mantendrá oculto el "Saldo Teórico" del cajero hasta que confirme el cierre para prevenir ajustes artificiales.
                  </span>
                </div>
              </div>

              {/* ARQUEO DE CAJA INTERACTIVO (Arqueo Ciego) */}
              <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <div>
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <ClipboardCheck size={16} className="text-rose-500" />
                    Arqueo de Efectivo Físico (Billetes & Monedas)
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Suma el inventario de monedas y billetes existentes en gaveta para la conciliación de fin de turno.</p>
                </div>

                <form onSubmit={handleCloseSessionSubmit} className="space-y-6">
                  
                  {/* Billetes */}
                  <div className="space-y-3">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Billetes</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      
                      {([
                        { label: '$100.00', key: 'bills100' },
                        { label: '$50.00', key: 'bills50' },
                        { label: '$20.00', key: 'bills20' },
                        { label: '$10.00', key: 'bills10' },
                        { label: '$5.00', key: 'bills5' },
                        { label: '$1.00', key: 'bills1' }
                      ] as const).map((denom) => (
                        <div key={denom.key} className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700">{denom.label}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => adjustDenom(denom.key, -1)}
                              className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-black text-slate-800 font-mono">
                              {arqueo[denom.key]}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustDenom(denom.key, 1)}
                              className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>

                  {/* Monedas */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Monedas (Fraccionarias)</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      
                      {([
                        { label: '$0.50 ctv', key: 'coins050' },
                        { label: '$0.25 ctv', key: 'coins025' },
                        { label: '$0.10 ctv', key: 'coins010' },
                        { label: '$0.05 ctv', key: 'coins005' },
                        { label: '$0.01 ctv', key: 'coins001' }
                      ] as const).map((denom) => (
                        <div key={denom.key} className="bg-slate-50/60 p-2.5 rounded-xl border border-slate-100 flex items-center justify-between">
                          <span className="text-xs font-black text-slate-700">{denom.label}</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => adjustDenom(denom.key, -1)}
                              className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                            >
                              -
                            </button>
                            <span className="w-5 text-center text-xs font-black text-slate-800 font-mono">
                              {arqueo[denom.key]}
                            </span>
                            <button
                              type="button"
                              onClick={() => adjustDenom(denom.key, 1)}
                              className="h-6 w-6 rounded bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center font-extrabold text-slate-500 text-xs transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}

                    </div>
                  </div>

                  {/* Resultados acumulativos y envío de cierre */}
                  <div className="pt-4 border-t border-slate-100 space-y-4">
                    
                    <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-2xl">
                      <div>
                        <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">TOTAL EFECTIVO CONTADO</span>
                        <span className="text-xs text-slate-300 font-semibold">(Suma de billetes y monedas contadas)</span>
                      </div>
                      <span className="text-xl font-mono font-black text-teal-400">
                        ${countedCashSum.toFixed(2)}
                      </span>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Observaciones del Turno / Arqueo</label>
                      <textarea
                        value={auditNotes}
                        onChange={(e) => setAuditNotes(e.target.value)}
                        placeholder="Ej: Entrega conforme, se deposita $150 al banco principal..."
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors h-16 resize-none"
                      />
                    </div>

                    <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100/60 flex items-center gap-3">
                      <input
                        type="checkbox"
                        id="confirm_cierre"
                        checked={isCierreConfirmed}
                        onChange={(e) => setIsCierreConfirmed(e.target.checked)}
                        className="h-4 w-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                      />
                      <label htmlFor="confirm_cierre" className="text-xs text-rose-900 font-bold select-none cursor-pointer">
                        Confirmo que el conteo físico de gaveta está correcto y deseo proceder con el cierre definitivo del turno.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={!isCierreConfirmed || countedCashSum <= 0}
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black text-xs py-3.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Lock size={14} />
                      Realizar Cierre de Caja y Calcular Discrepancia
                    </button>

                  </div>

                </form>
              </div>
            </>
          )}

        </div>
      )}

      {/* VISTA 2: TRANSACTIONS / AJUSTES DE CAJA CHICA (Ingresos, Egresos, Retiros) */}
      {activeSubTab === 'transactions' && activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Formulario de registro */}
          <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="border-b border-slate-50 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Plus size={16} className="text-teal-600" />
                Registrar Movimiento de Caja
              </h4>
              <span className="text-[10px] text-slate-400 block font-medium">Asigna salidas o entradas manuales de efectivo de la gaveta.</span>
            </div>

            <form onSubmit={handleAddTransaction} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Tipo de Movimiento</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['EGRESO', 'INGRESO_EXTRA', 'RETIRO_PARCIAL'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setTxType(type)}
                      className={`py-2 px-1.5 border rounded-lg text-[9px] font-black uppercase tracking-wider transition-all text-center ${
                        txType === type
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {type === 'EGRESO' ? 'Egreso' : type === 'INGRESO_EXTRA' ? 'Ingreso' : 'Retiro Parcial'}
                    </button>
                  ))}
                </div>
              </div>

              {txType === 'EGRESO' && (
                <div className="space-y-1 animate-in fade-in duration-150">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Categoría de Egreso</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                  >
                    <option value="SUMINISTROS">Suministros de Oficina/Limpieza</option>
                    <option value="SERVICIOS">Servicios Básicos / Internet</option>
                    <option value="REPARTO">Viáticos de Reparto / Combustible</option>
                    <option value="COMPRAS">Compras Rápidas</option>
                    <option value="OTROS">Otros Gastos</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Monto en Efectivo ($) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={txAmountStr}
                    onChange={(e) => setTxAmountStr(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Concepto / Descripción del Gasto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pago de almuerzo a motorizado de reparto"
                  value={txConcept}
                  onChange={(e) => setTxConcept(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Beneficiario / Proveedor (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Juan de la Tiendita"
                  value={txBeneficiary}
                  onChange={(e) => setTxBeneficiary(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Confirmar Transacción
              </button>

            </form>
          </div>

          {/* Listado de movimientos durante este turno */}
          <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
                <h4 className="font-extrabold text-slate-800 text-sm">Movimientos del Turno Vigente</h4>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black">
                  {activeSessionCalculations?.transactions.length || 0} registros
                </span>
              </div>

              {activeSessionCalculations?.transactions.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <FileText size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-bold">No se han registrado egresos o ingresos en este turno.</p>
                  <p className="text-[10px] text-slate-300 mt-1">Usa el formulario de la izquierda para ingresar movimientos.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {activeSessionCalculations?.transactions.map((tx) => (
                    <div key={tx.id} className="p-3 bg-slate-50/60 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                          tx.type === 'EGRESO' ? 'bg-rose-50 text-rose-600' :
                          tx.type === 'RETIRO_PARCIAL' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                        }`}>
                          {tx.type === 'EGRESO' ? <ArrowDownRight size={16} /> :
                           tx.type === 'RETIRO_PARCIAL' ? <Banknote size={16} /> : <ArrowUpRight size={16} />}
                        </div>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-800">{tx.concept}</span>
                            <span className={`text-[8.5px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                              tx.type === 'EGRESO' ? 'bg-rose-50 text-rose-600' :
                              tx.type === 'RETIRO_PARCIAL' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
                            }`}>
                              {tx.type === 'EGRESO' ? `EGRESO (${tx.category})` :
                               tx.type === 'RETIRO_PARCIAL' ? 'RETIRO DE CAJA' : 'INGRESO EXTRA'}
                            </span>
                          </div>
                          {tx.beneficiary && (
                            <span className="text-[10px] text-slate-400 block font-medium">Beneficiario: {tx.beneficiary}</span>
                          )}
                          <span className="text-[9.5px] text-slate-400 font-semibold block">Hora: {new Date(tx.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>

                      <div className="text-right space-y-1 pl-4 shrink-0">
                        <span className={`font-mono font-black text-xs block ${
                          tx.type === 'EGRESO' || tx.type === 'RETIRO_PARCIAL' ? 'text-rose-500' : 'text-emerald-600'
                        }`}>
                          {tx.type === 'EGRESO' || tx.type === 'RETIRO_PARCIAL' ? '-' : '+'}${tx.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteTransaction(tx.id)}
                          className="text-[9.5px] text-slate-400 hover:text-rose-500 font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {activeSessionCalculations && (
              <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center text-xs font-black text-slate-600 bg-slate-50 p-3.5 rounded-xl">
                <span>Egresos Totales del Turno:</span>
                <span className="font-mono text-rose-500 text-sm">-${(activeSessionCalculations.totalEgresos + activeSessionCalculations.totalRetiros).toFixed(2)}</span>
              </div>
            )}
          </div>

        </div>
      )}

      {/* VISTA 3: BANK DEPOSITS / REPORTES DE DEPOSITOS BANCARIOS (Conciliaciones) */}
      {activeSubTab === 'deposits' && activeSession && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Registrar Depósito */}
          <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
            <div className="border-b border-slate-50 pb-3">
              <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                <Building2 size={16} className="text-sky-600" />
                Declarar Depósito de Turno
              </h4>
              <span className="text-[10px] text-slate-400 block font-medium">Registra depósitos de efectivo a la cuenta bancaria de la farmacia.</span>
            </div>

            <form onSubmit={handleAddDeposit} className="space-y-4">
              
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Entidad Bancaria</label>
                <select
                  value={depBankName}
                  onChange={(e) => setDepBankName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
                >
                  <option value="Banco Pichincha">Banco Pichincha</option>
                  <option value="Banco Guayaquil">Banco Guayaquil</option>
                  <option value="Produbanco">Produbanco</option>
                  <option value="Cooperativa JEP">Cooperativa JEP</option>
                  <option value="Otros Bancos">Otros Bancos / Cooperativa</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Monto Depositado ($) *</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={depAmountStr}
                    onChange={(e) => setDepAmountStr(e.target.value)}
                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Número de Comprobante / Referencia Bancaria *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: DEP-1029384"
                  value={depReference}
                  onChange={(e) => setDepReference(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Notas Adicionales</label>
                <input
                  type="text"
                  placeholder="Ej: Depósito de efectivo del fondo del lunes..."
                  value={depNotes}
                  onChange={(e) => setDepNotes(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-sky-500"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={14} />
                Declarar Depósito
              </button>

            </form>
          </div>

          {/* Listado de depósitos */}
          <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <div className="border-b border-slate-50 pb-3 flex justify-between items-center">
                <h4 className="font-extrabold text-slate-800 text-sm">Depósitos a Conciliar en Turno</h4>
                <span className="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-black">
                  {deposits.filter(d => d.sessionId === activeSession.id).length} declaraciones
                </span>
              </div>

              {deposits.filter(d => d.sessionId === activeSession.id).length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Building2 size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-bold">No se han declarado depósitos bancarios hoy.</p>
                  <p className="text-[10px] text-slate-300 mt-1">Declara transacciones para mantener el control de arqueos de banco.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {deposits.filter(d => d.sessionId === activeSession.id).map((dep) => (
                    <div key={dep.id} className="p-3.5 bg-slate-50 hover:bg-slate-100/50 rounded-xl border border-slate-100 flex items-center justify-between text-xs transition-colors">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800">{dep.bankName}</span>
                          <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full ${
                            dep.status === 'CONCILIADO' ? 'bg-teal-50 text-teal-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                            {dep.status === 'CONCILIADO' ? 'Conciliado' : 'Pendiente Verificación'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 block font-bold">Ref: {dep.referenceNumber}</span>
                        {dep.notes && (
                          <span className="text-[9.5px] text-slate-400 block italic">Nota: {dep.notes}</span>
                        )}
                        <span className="text-[9.5px] text-slate-400 font-semibold block">Declarado: {new Date(dep.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div className="text-right pl-4 shrink-0 space-y-1.5">
                        <span className="font-mono font-black text-xs text-slate-700 block">${dep.amount.toFixed(2)}</span>
                        
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleDepositReconcile(dep)}
                            className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border transition-colors ${
                              dep.status === 'CONCILIADO'
                                ? 'bg-white border-slate-200 hover:bg-slate-50 text-slate-500'
                                : 'bg-teal-600 hover:bg-teal-700 text-white border-teal-600'
                            }`}
                          >
                            {dep.status === 'CONCILIADO' ? 'Pendiente' : 'Conciliar'}
                          </button>
                          <button
                            onClick={() => handleDeleteDeposit(dep.id)}
                            className="text-[10px] text-rose-500 hover:underline font-bold"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* VISTA 4: HISTORY / HISTORIAL DE SESIONES Y DETALLES DE ARQUEOS CERRADOS */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h4 className="font-extrabold text-slate-800 text-sm">Resumen de Turnos y Auditoría de Discrepancias</h4>
              <p className="text-xs text-slate-400 mt-0.5">Reportes consolidados de arqueos ciegos anteriores y cuadres de caja.</p>
            </div>

            {/* Estadísticas históricas de cuadre */}
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-150">
              <div className="text-center shrink-0 pr-4 border-r border-slate-200">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Turnos Cerrados</span>
                <span className="text-sm font-black text-slate-800">{historicStats.closedCount}</span>
              </div>
              <div className="text-center">
                <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Balance de Faltantes/Sobrantes</span>
                <span className={`text-sm font-black font-mono ${
                  historicStats.totalDiscrepancies >= 0 ? 'text-emerald-600' : 'text-rose-500'
                }`}>
                  {historicStats.totalDiscrepancies >= 0 ? '+' : '-'}${Math.abs(historicStats.totalDiscrepancies).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Listado de turnos */}
          {sessions.filter(s => s.status === 'CLOSED').length === 0 ? (
            <div className="bg-white py-12 rounded-[2.5rem] border border-slate-100 text-center">
              <History size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-xs text-slate-500 font-bold">No se registran turnos de arqueo cerrados en el historial.</p>
              <p className="text-[10px] text-slate-400 mt-1">Los arqueos aparecerán aquí una vez cierres una sesión activa.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sessions.filter(s => s.status === 'CLOSED').map((sess) => {
                const discVal = sess.discrepancy || 0;
                return (
                  <div key={sess.id} className="bg-white rounded-[2rem] border border-slate-100 p-6 flex flex-col justify-between hover:border-slate-200 transition-all shadow-sm">
                    <div>
                      {/* Cabecera */}
                      <div className="flex justify-between items-start border-b border-slate-50 pb-3">
                        <div className="space-y-0.5">
                          <span className="text-[9px] text-slate-400 font-bold font-mono uppercase block">{sess.id}</span>
                          <span className="text-xs text-slate-800 font-extrabold block">Cajero: {sess.openedBy}</span>
                        </div>
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          discVal === 0 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          discVal > 0 ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                          'bg-rose-50 text-rose-600 border border-rose-100'
                        }`}>
                          {discVal === 0 ? 'Cuadre Perfecto' : discVal > 0 ? 'Sobrante' : 'Faltante'}
                        </span>
                      </div>

                      {/* Detalles financieros */}
                      <div className="grid grid-cols-2 gap-4 py-4 text-xs font-semibold">
                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Fecha de Turno</span>
                          <span className="text-slate-700 block">
                            {new Date(sess.openedAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Cerrado en</span>
                          <span className="text-slate-700 block">
                            {sess.closedAt ? new Date(sess.closedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                          </span>
                        </div>

                        <div className="space-y-1 pt-1.5">
                          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Fondo Inicial</span>
                          <span className="text-slate-800 font-bold block">${sess.initialCash.toFixed(2)}</span>
                        </div>

                        <div className="space-y-1 pt-1.5">
                          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Esperado en Libro</span>
                          <span className="text-slate-800 font-bold block">${(sess.expectedCash || 0).toFixed(2)}</span>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Contado Físico</span>
                          <span className="text-slate-800 font-black font-mono block text-sm">${(sess.actualCash || 0).toFixed(2)}</span>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                          <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider">Diferencia / Cuadre</span>
                          <span className={`font-black font-mono block text-sm ${discVal >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {discVal >= 0 ? '+' : '-'}${Math.abs(discVal).toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Desglose de denominación o notas */}
                      {sess.blindArqueo && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1.5 mt-2">
                          <span className="text-[8.5px] font-black text-slate-400 uppercase tracking-widest block">Denominaciones contadas:</span>
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-600 font-bold font-mono">
                            {sess.blindArqueo.bills100 ? <span>$100({sess.blindArqueo.bills100})</span> : null}
                            {sess.blindArqueo.bills50 ? <span>$50({sess.blindArqueo.bills50})</span> : null}
                            {sess.blindArqueo.bills20 ? <span>$20({sess.blindArqueo.bills20})</span> : null}
                            {sess.blindArqueo.bills10 ? <span>$10({sess.blindArqueo.bills10})</span> : null}
                            {sess.blindArqueo.bills5 ? <span>$5({sess.blindArqueo.bills5})</span> : null}
                            {sess.blindArqueo.bills1 ? <span>$1({sess.blindArqueo.bills1})</span> : null}
                            {sess.blindArqueo.coins050 ? <span>50c({sess.blindArqueo.coins050})</span> : null}
                            {sess.blindArqueo.coins025 ? <span>25c({sess.blindArqueo.coins025})</span> : null}
                            {sess.blindArqueo.coins010 ? <span>10c({sess.blindArqueo.coins010})</span> : null}
                            {sess.blindArqueo.coins005 ? <span>5c({sess.blindArqueo.coins005})</span> : null}
                            {sess.blindArqueo.coins001 ? <span>1c({sess.blindArqueo.coins001})</span> : null}
                          </div>
                        </div>
                      )}

                      {sess.notes && (
                        <div className="mt-3 text-[10.5px] text-slate-500 font-semibold italic border-l-2 border-slate-200 pl-2">
                          Observación: "{sess.notes}"
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-3 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Auditado</span>
                      <button
                        onClick={async () => {
                          if (confirm('¿Está seguro de eliminar este registro histórico de arqueo?')) {
                            await deleteTreasurySessionDB(sess.id);
                            showNotification('Cierre eliminado del historial.');
                          }
                        }}
                        className="text-[10px] text-slate-400 hover:text-rose-500 font-bold transition-colors"
                      >
                        Eliminar Registro
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default AdminTreasury;
