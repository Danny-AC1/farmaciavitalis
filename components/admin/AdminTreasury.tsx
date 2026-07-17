import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Coins, 
  CheckCircle, 
  AlertCircle, 
  History, 
  BookOpen 
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
import { TreasurySession, TreasuryTransaction, TreasuryDeposit, Order } from '../../types';

// Modular child components
import { TreasurySessionTab } from './treasury/TreasurySessionTab';
import { TreasuryTransactionsTab } from './treasury/TreasuryTransactionsTab';
import { TreasuryDepositsTab } from './treasury/TreasuryDepositsTab';
import { TreasuryHistoryTab } from './treasury/TreasuryHistoryTab';

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
      closedBy: activeSession.openedBy,
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

  // Delete session historical record
  const handleDeleteSession = async (id: string) => {
    if (confirm('¿Está seguro de eliminar este registro histórico de arqueo?')) {
      await deleteTreasurySessionDB(id);
      showNotification('Cierre eliminado del historial.');
    }
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
        <TreasurySessionTab
          activeSession={activeSession}
          activeSessionCalculations={activeSessionCalculations}
          arqueo={arqueo}
          auditNotes={auditNotes}
          setAuditNotes={setAuditNotes}
          isCierreConfirmed={isCierreConfirmed}
          setIsCierreConfirmed={setIsCierreConfirmed}
          countedCashSum={countedCashSum}
          handleOpenSession={handleOpenSession}
          handleCloseSessionSubmit={handleCloseSessionSubmit}
          initialCashStr={initialCashStr}
          setInitialCashStr={setInitialCashStr}
          cashierName={cashierName}
          setCashierName={setCashierName}
          adjustDenom={adjustDenom}
        />
      )}

      {/* VISTA 2: TRANSACTIONS / AJUSTES DE CAJA CHICA (Ingresos, Egresos, Retiros) */}
      {activeSubTab === 'transactions' && activeSession && (
        <TreasuryTransactionsTab
          activeSessionCalculations={activeSessionCalculations}
          txType={txType}
          setTxType={setTxType}
          txCategory={txCategory}
          setTxCategory={setTxCategory}
          txAmountStr={txAmountStr}
          setTxAmountStr={setTxAmountStr}
          txConcept={txConcept}
          setTxConcept={setTxConcept}
          txBeneficiary={txBeneficiary}
          setTxBeneficiary={setTxBeneficiary}
          handleAddTransaction={handleAddTransaction}
          handleDeleteTransaction={handleDeleteTransaction}
        />
      )}

      {/* VISTA 3: BANK DEPOSITS / REPORTES DE DEPOSITOS BANCARIOS (Conciliaciones) */}
      {activeSubTab === 'deposits' && activeSession && (
        <TreasuryDepositsTab
          activeSession={activeSession}
          deposits={deposits}
          depBankName={depBankName}
          setDepBankName={setDepBankName}
          depReference={depReference}
          setDepReference={setDepReference}
          depAmountStr={depAmountStr}
          setDepAmountStr={setDepAmountStr}
          depNotes={depNotes}
          setDepNotes={setDepNotes}
          handleAddDeposit={handleAddDeposit}
          handleToggleDepositReconcile={handleToggleDepositReconcile}
          handleDeleteDeposit={handleDeleteDeposit}
        />
      )}

      {/* VISTA 4: HISTORY / HISTORIAL DE SESIONES Y DETALLES DE ARQUEOS CERRADOS */}
      {activeSubTab === 'history' && (
        <TreasuryHistoryTab
          sessions={sessions}
          historicStats={historicStats}
          handleDeleteSession={handleDeleteSession}
        />
      )}

    </div>
  );
};

export default AdminTreasury;
