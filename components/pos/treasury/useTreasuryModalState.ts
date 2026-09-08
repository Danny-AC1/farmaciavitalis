import { useState, useEffect, useMemo } from 'react';
import { 
  streamTreasurySessions, saveTreasurySessionDB, updateTreasurySessionDB, deleteTreasurySessionDB,
  streamTreasuryTransactions, saveTreasuryTransactionDB, deleteTreasuryTransactionDB,
  streamTreasuryDeposits, saveTreasuryDepositDB, updateTreasuryDepositStatusDB, deleteTreasuryDepositDB
} from '../../../services/db.treasury';
import { streamOrders } from '../../../services/db.orders';
import { TreasurySession, TreasuryTransaction, TreasuryDeposit, Order, User } from '../../../types';
import { printTreasuryShiftTicket } from '../../../utils/posTicketPrinter';
import { ArqueoDenominations } from './TreasuryDenominationCounter';

const INITIAL_ARQUEO: ArqueoDenominations = {
  bills100: 0, bills50: 0, bills20: 0, bills10: 0, bills5: 0, bills1: 0,
  coins050: 0, coins025: 0, coins010: 0, coins005: 0, coins001: 0
};

export function useTreasuryModalState(isOpen: boolean, currentUser?: User | null) {
  const [sessions, setSessions] = useState<TreasurySession[]>([]);
  const [transactions, setTransactions] = useState<TreasuryTransaction[]>([]);
  const [deposits, setDeposits] = useState<TreasuryDeposit[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'session' | 'transactions' | 'deposits' | 'history'>('session');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [initialCashStr, setInitialCashStr] = useState('50.00');
  const [cashierName, setCashierName] = useState(currentUser?.displayName || 'Cajero POS');
  const [txType, setTxType] = useState<'EGRESO' | 'INGRESO_EXTRA' | 'RETIRO_PARCIAL'>('EGRESO');
  const [txCategory, setTxCategory] = useState<'SUMINISTROS' | 'SERVICIOS' | 'REPARTO' | 'COMPRAS' | 'OTROS'>('SUMINISTROS');
  const [txAmountStr, setTxAmountStr] = useState('');
  const [txConcept, setTxConcept] = useState('');
  const [txBeneficiary, setTxBeneficiary] = useState('');
  const [depBankName, setDepBankName] = useState('Banco Pichincha');
  const [depReference, setDepReference] = useState('');
  const [depAmountStr, setDepAmountStr] = useState('');
  const [depNotes, setDepNotes] = useState('');
  const [arqueo, setArqueo] = useState<ArqueoDenominations>(INITIAL_ARQUEO);
  const [auditNotes, setAuditNotes] = useState('');
  const [isCierreConfirmed, setIsCierreConfirmed] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const unsubS = streamTreasurySessions(setSessions);
    const unsubT = streamTreasuryTransactions(setTransactions);
    const unsubD = streamTreasuryDeposits(setDeposits);
    const unsubO = streamOrders(setOrders);
    return () => {
      if (typeof unsubS === 'function') unsubS();
      if (typeof unsubT === 'function') unsubT();
      if (typeof unsubD === 'function') unsubD();
      if (typeof unsubO === 'function') unsubO();
    };
  }, [isOpen]);

  useEffect(() => {
    if (currentUser?.displayName && (!cashierName || cashierName === 'Cajero POS')) {
      setCashierName(currentUser.displayName);
    }
  }, [currentUser, cashierName]);

  const activeSession = useMemo(() => sessions.find(s => s.status === 'OPEN') || null, [sessions]);

  const activeSessionCalculations = useMemo(() => {
    if (!activeSession) return null;
    const openTime = new Date(activeSession.openedAt).getTime();
    const sessionOrders = orders.filter(o => new Date(o.date).getTime() >= openTime && o.status === 'DELIVERED');
    const cashSales = sessionOrders
      .filter(o => ['CASH', 'EFECTIVO', 'PAGADO EN EFECTIVO'].includes((o.paymentMethod || '').toUpperCase()))
      .reduce((sum, o) => sum + o.total, 0);
    const transferSales = sessionOrders
      .filter(o => ['TRANSFER', 'TRANSFERENCIA', 'CARD', 'TARJETA'].includes((o.paymentMethod || '').toUpperCase()))
      .reduce((sum, o) => sum + o.total, 0);
    const sessionTxs = transactions.filter(t => t.sessionId === activeSession.id);
    const extraIngresos = sessionTxs.filter(t => t.type === 'INGRESO_EXTRA').reduce((sum, t) => sum + t.amount, 0);
    const totalEgresos = sessionTxs.filter(t => t.type === 'EGRESO').reduce((sum, t) => sum + t.amount, 0);
    const totalRetiros = sessionTxs.filter(t => t.type === 'RETIRO_PARCIAL').reduce((sum, t) => sum + t.amount, 0);
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

  const countedCashSum = useMemo(() => {
    const bills = (arqueo.bills100 * 100) + (arqueo.bills50 * 50) + (arqueo.bills20 * 20) + (arqueo.bills10 * 10) + (arqueo.bills5 * 5) + (arqueo.bills1 * 1);
    const coins = (arqueo.coins050 * 0.50) + (arqueo.coins025 * 0.25) + (arqueo.coins010 * 0.10) + (arqueo.coins005 * 0.05) + (arqueo.coins001 * 0.01);
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

  const adjustDenom = (field: keyof ArqueoDenominations, delta: number) => {
    setArqueo(prev => ({ ...prev, [field]: Math.max(0, prev[field] + delta) }));
  };

  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cashierName.trim()) return alert('Por favor ingrese el nombre del responsable de caja.');
    const initialCash = parseFloat(initialCashStr) || 0;
    try {
      await saveTreasurySessionDB({
        id: `SESS-${Date.now()}`,
        status: 'OPEN',
        openedBy: cashierName.trim(),
        openedAt: new Date().toISOString(),
        initialCash
      });
      setArqueo(INITIAL_ARQUEO);
      setAuditNotes('');
      setIsCierreConfirmed(false);
      showNotification('¡Turno de caja abierto exitosamente!');
    } catch {
      showNotification('Error al abrir turno de caja.', true);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseFloat(txAmountStr) || 0;
    if (amount <= 0 || !txConcept.trim()) return alert('Ingrese monto mayor a cero y concepto.');
    try {
      await saveTreasuryTransactionDB({
        id: `TX-${Date.now()}`,
        sessionId: activeSession.id,
        type: txType,
        category: txType === 'EGRESO' ? txCategory : 'OTROS',
        amount,
        concept: txConcept.trim(),
        beneficiary: txBeneficiary.trim() || undefined,
        date: new Date().toISOString(),
        performedBy: activeSession.openedBy
      });
      setTxAmountStr('');
      setTxConcept('');
      setTxBeneficiary('');
      showNotification(`¡Movimiento (${txType}) registrado con éxito!`);
    } catch {
      showNotification('Error al registrar movimiento.', true);
    }
  };

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSession) return;
    const amount = parseFloat(depAmountStr) || 0;
    if (amount <= 0 || !depReference.trim()) return alert('Ingrese monto y número de comprobante.');
    try {
      await saveTreasuryDepositDB({
        id: `DEP-${Date.now()}`,
        sessionId: activeSession.id,
        bankName: depBankName,
        referenceNumber: depReference.trim(),
        amount,
        date: new Date().toISOString(),
        status: 'PENDIENTE',
        notes: depNotes.trim() || undefined
      });
      setDepReference('');
      setDepAmountStr('');
      setDepNotes('');
      showNotification('¡Depósito registrado para conciliación!');
    } catch {
      showNotification('Error al registrar depósito.', true);
    }
  };

  const handleCloseSessionSubmit = async (printTicket = false) => {
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
      if (printTicket) printTreasuryShiftTicket({ ...activeSession, ...updates }, activeSessionCalculations);
      showNotification(`¡Turno cerrado con éxito! Discrepancia: $${discrepancy.toFixed(2)}`);
      setActiveTab('history');
    } catch {
      showNotification('Error al registrar el cierre de turno.', true);
    }
  };

  const deleteTransaction = async (id: string) => {
    if (confirm('¿Eliminar este movimiento de caja?')) {
      await deleteTreasuryTransactionDB(id);
      showNotification('Movimiento eliminado.');
    }
  };

  const toggleDepositStatus = async (dep: TreasuryDeposit) => {
    const newSt = dep.status === 'CONCILIADO' ? 'PENDIENTE' : 'CONCILIADO';
    await updateTreasuryDepositStatusDB(dep.id, newSt);
    showNotification(`Depósito marcado como ${newSt}`);
  };

  const deleteDeposit = async (id: string) => {
    if (confirm('¿Eliminar este registro de depósito?')) {
      await deleteTreasuryDepositDB(id);
      showNotification('Depósito eliminado.');
    }
  };

  const deleteSession = async (id: string) => {
    if (confirm('¿Eliminar este registro de cierre del historial?')) {
      await deleteTreasurySessionDB(id);
      showNotification('Cierre eliminado.');
    }
  };

  return {
    sessions, activeSession, activeSessionCalculations, activeTab, setActiveTab,
    successMsg, errorMsg, cashierName, setCashierName, initialCashStr, setInitialCashStr,
    txType, setTxType, txCategory, setTxCategory, txAmountStr, setTxAmountStr,
    txConcept, setTxConcept, txBeneficiary, setTxBeneficiary,
    depBankName, setDepBankName, depReference, setDepReference, depAmountStr, setDepAmountStr,
    depNotes, setDepNotes, deposits, arqueo, setArqueo, auditNotes, setAuditNotes,
    isCierreConfirmed, setIsCierreConfirmed, countedCashSum, adjustDenom,
    handleOpenSession, handleAddTransaction, handleAddDeposit, handleCloseSessionSubmit,
    deleteTransaction, toggleDepositStatus, deleteDeposit, deleteSession
  };
}
