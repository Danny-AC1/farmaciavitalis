import { firestore } from './firebase';
// @ts-ignore
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { Account, JournalEntry } from '../types/accounting';
import { Order, CreditTicket, Expense } from '../types';
import { cleanData } from './db.utils';

const ACCOUNTS_COLLECTION = 'accounting_accounts';
const ENTRIES_COLLECTION = 'accounting_entries';

export const DEFAULT_ACCOUNTS: Account[] = [
  // ACTIVOS
  { id: '1.1.01', code: '1.1.01', name: 'Caja General (Efectivo Ventas POS)', category: 'ACTIVO', subtype: 'CAJA_BANCOS', balance: 0, isSystemAccount: true, description: 'Efectivo recibido en caja chica y ventas físicas' },
  { id: '1.1.02', code: '1.1.02', name: 'Bancos y Transferencias Directas', category: 'ACTIVO', subtype: 'CAJA_BANCOS', balance: 0, isSystemAccount: true, description: 'Cuentas bancarias de la farmacia para transferencias' },
  { id: '1.1.03', code: '1.1.03', name: 'Cuentas por Cobrar (Medicamentos Fiados / Créditos)', category: 'ACTIVO', subtype: 'CUENTAS_POR_COBRAR', balance: 0, isSystemAccount: true, description: 'Deudas pendientes de clientes en compras fiadas' },
  { id: '1.1.04', code: '1.1.04', name: 'Inventario de Medicamentos y Productos', category: 'ACTIVO', subtype: 'INVENTARIO', balance: 0, isSystemAccount: true, description: 'Valorizado total del stock de farmacia a precio costo' },
  { id: '1.2.01', code: '1.2.01', name: 'Equipos, Perchas y Refrigeración Farmacéutica', category: 'ACTIVO', subtype: 'ACTIVO_FIJO', balance: 0, isSystemAccount: true, description: 'Mobiliario, computadoras e impresoras térmicas' },

  // PASIVOS
  { id: '2.1.01', code: '2.1.01', name: 'Cuentas por Pagar (Proveedores y Distribuidoras)', category: 'PASIVO', subtype: 'CUENTAS_POR_PAGAR', balance: 0, isSystemAccount: true, description: 'Facturas pendientes con Difare, Farmaenlace, etc.' },
  { id: '2.1.02', code: '2.1.02', name: 'Impuestos e IVA por Pagar (SRI)', category: 'PASIVO', subtype: 'IMPUESTOS_POR_PAGAR', balance: 0, isSystemAccount: true, description: 'Acumulado de IVA cobrado en ventas' },

  // PATRIMONIO
  { id: '3.1.01', code: '3.1.01', name: 'Capital Social / Aporte de Socios', category: 'PATRIMONIO', subtype: 'CAPITAL', balance: 0, isSystemAccount: true, description: 'Capital inicial invertido en Farmacia Vitalis' },
  { id: '3.1.02', code: '3.1.02', name: 'Resultados Acumulados (Ganancias Retenidas)', category: 'PATRIMONIO', subtype: 'RESULTADOS_ACUMULADOS', balance: 0, isSystemAccount: true, description: 'Utilidades netas acumuladas de periodos anteriores' },

  // INGRESOS
  { id: '4.1.01', code: '4.1.01', name: 'Ventas de Medicamentos y Productos', category: 'INGRESO', subtype: 'VENTAS_MEDICAMENTOS', balance: 0, isSystemAccount: true, description: 'Ingreso operacional bruto por ventas POS y Online' },
  { id: '4.1.02', code: '4.1.02', name: 'Ingresos por Servicios de Salud e Inyectología', category: 'INGRESO', subtype: 'INGRESOS_SERVICIOS', balance: 0, isSystemAccount: true, description: 'Inyectología, medición de glucosa y toma de presión' },

  // GASTOS
  { id: '5.1.01', code: '5.1.01', name: 'Costo de Ventas (COGS Medicamentos)', category: 'GASTO', subtype: 'COSTO_DE_VENTAS', balance: 0, isSystemAccount: true, description: 'Costo real de compra de los medicamentos vendidos' },
  { id: '5.1.02', code: '5.1.02', name: 'Arriendo del Local Farmacéutico', category: 'GASTO', subtype: 'ALQUILER', balance: 0, isSystemAccount: true, description: 'Pago mensual del local comercial' },
  { id: '5.1.03', code: '5.1.03', name: 'Servicios Básicos (Luz, Agua, Telecomunicaciones)', category: 'GASTO', subtype: 'SERVICIOS_BASICOS', balance: 0, isSystemAccount: true, description: 'Facturas de electricidad, agua e internet' },
  { id: '5.1.04', code: '5.1.04', name: 'Sueldos, Salarios y Nómina', category: 'GASTO', subtype: 'SALARIOS', balance: 0, isSystemAccount: true, description: 'Pagos al personal farmacéutico y regente' },
  { id: '5.1.05', code: '5.1.05', name: 'Mermas, Caducidades y Medicamentos Venidos a Menos', category: 'GASTO', subtype: 'MERMAS_E_INVENTARIO', balance: 0, isSystemAccount: true, description: 'Pérdidas por productos rotos o caducados' },
  { id: '5.1.06', code: '5.1.06', name: 'Gastos Operativos Varios y Caja Chica', category: 'GASTO', subtype: 'GASTOS_DIVERSOS', balance: 0, isSystemAccount: true, description: 'Insumos de oficina, fundas impresas, limpieza' },
];

/**
 * Escucha el Plan de Cuentas desde Firestore con fallback en localStorage.
 */
export const streamAccounts = (callback: (accounts: Account[]) => void) => {
  const q = query(collection(firestore, ACCOUNTS_COLLECTION), orderBy('code', 'asc'));
  return onSnapshot(q, (snapshot) => {
    if (snapshot.empty) {
      // Auto-sembrar plan de cuentas por defecto si está vacío
      seedDefaultAccounts().then(() => {
        callback(DEFAULT_ACCOUNTS);
      });
      return;
    }
    const accounts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Account[];
    callback(accounts);
  }, (err) => {
    console.warn("Error en Firestore streamAccounts, usando respaldo local:", err);
    try {
      const local = localStorage.getItem('vitalis_accounting_accounts');
      if (local) {
        callback(JSON.parse(local));
      } else {
        localStorage.setItem('vitalis_accounting_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
        callback(DEFAULT_ACCOUNTS);
      }
    } catch (e) {
      callback(DEFAULT_ACCOUNTS);
    }
  });
};

/**
 * Escucha los Asientos Contables (Libro Diario) con fallback en localStorage.
 */
export const streamJournalEntries = (callback: (entries: JournalEntry[]) => void) => {
  const q = query(collection(firestore, ENTRIES_COLLECTION), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const entries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as JournalEntry[];
    callback(entries);
  }, (err) => {
    console.warn("Error en Firestore streamJournalEntries, usando respaldo local:", err);
    try {
      const local = localStorage.getItem('vitalis_accounting_entries');
      if (local) {
        callback(JSON.parse(local));
      } else {
        callback([]);
      }
    } catch (e) {
      callback([]);
    }
  });
};

/**
 * Siembras iniciales de cuentas contables.
 */
export const seedDefaultAccounts = async () => {
  try {
    for (const acc of DEFAULT_ACCOUNTS) {
      const docRef = doc(firestore, ACCOUNTS_COLLECTION, acc.id);
      await setDoc(docRef, cleanData(acc));
    }
  } catch (err) {
    console.error("Error sembrando plan de cuentas en Firestore:", err);
  }
  try {
    localStorage.setItem('vitalis_accounting_accounts', JSON.stringify(DEFAULT_ACCOUNTS));
  } catch (e) {}
};

/**
 * Asentar un nuevo Asiento Contable (Partida Doble)
 */
export const addJournalEntryDB = async (entry: JournalEntry): Promise<void> => {
  // Validar partida doble estricta
  const diff = Math.abs(entry.totalDebit - entry.totalCredit);
  if (diff > 0.01) {
    throw new Error(`El asiento contable no está cuadrado. Debe ($${entry.totalDebit.toFixed(2)}) != Haber ($${entry.totalCredit.toFixed(2)})`);
  }

  try {
    const docRef = doc(firestore, ENTRIES_COLLECTION, entry.id);
    await setDoc(docRef, cleanData(entry));
  } catch (err) {
    console.error("Error al guardar asiento en Firestore, guardando en localStorage:", err);
  }

  // Actualizar copia local
  try {
    const local = localStorage.getItem('vitalis_accounting_entries');
    const list: JournalEntry[] = local ? JSON.parse(local) : [];
    const filtered = list.filter(e => e.id !== entry.id);
    filtered.unshift(entry);
    localStorage.setItem('vitalis_accounting_entries', JSON.stringify(filtered));
  } catch (e) {
    console.error(e);
  }
};

/**
 * Guardar o actualizar una Cuenta Contable
 */
export const saveAccountDB = async (account: Account): Promise<void> => {
  try {
    const docRef = doc(firestore, ACCOUNTS_COLLECTION, account.id);
    await setDoc(docRef, cleanData(account));
  } catch (err) {
    console.error("Error guardando cuenta contable:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_accounting_accounts');
    const list: Account[] = local ? JSON.parse(local) : DEFAULT_ACCOUNTS;
    const filtered = list.filter(a => a.id !== account.id);
    filtered.push(account);
    filtered.sort((a, b) => a.code.localeCompare(b.code));
    localStorage.setItem('vitalis_accounting_accounts', JSON.stringify(filtered));
  } catch (e) {}
};

/**
 * Eliminar una Cuenta Contable no del sistema
 */
export const deleteAccountDB = async (accountId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, ACCOUNTS_COLLECTION, accountId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error("Error eliminando cuenta contable:", err);
  }

  try {
    const local = localStorage.getItem('vitalis_accounting_accounts');
    if (local) {
      const list: Account[] = JSON.parse(local);
      const filtered = list.filter(a => a.id !== accountId);
      localStorage.setItem('vitalis_accounting_accounts', JSON.stringify(filtered));
    }
  } catch (e) {}
};

/**
 * Función de Sincronización Automática:
 * Genera asientos contables para ventas POS, cobranzas de créditos y gastos operativos
 * que no hayan sido contabilizados previamente.
 */
export const syncAutomaticAccountingEntries = async (
  existingEntries: JournalEntry[],
  orders: Order[],
  credits: CreditTicket[],
  expenses: Expense[]
): Promise<number> => {
  const existingRefIds = new Set(existingEntries.map(e => e.referenceId).filter(Boolean));
  let countCreated = 0;

  // 1. Procesar Ventas (POS / Online)
  for (const order of orders) {
    if (existingRefIds.has(`ORDER_${order.id}`)) continue;

    // Calcular costo total aproximado de los items vendidos
    const totalCost = order.items.reduce((acc, item) => {
      const cost = item.costPrice || (item.price * 0.7); // 30% estimado si no tiene costo asignado
      return acc + (cost * item.quantity);
    }, 0);

    const isCash = order.paymentMethod === 'CASH';
    const targetAccountId = isCash ? '1.1.01' : '1.1.02';
    const targetAccountName = isCash ? 'Caja General (Efectivo Ventas POS)' : 'Bancos y Transferencias Directas';

    // Asiento 1: Por el Ingreso de la Venta
    // DEBE: Caja/Bancos (Monto Total)
    // HABER: Ventas de Medicamentos (Monto Total)
    const saleEntry: JournalEntry = {
      id: `ASC_ORD_${order.id}`,
      entryNumber: `ASC-VTA-${order.id.slice(0, 6).toUpperCase()}`,
      date: order.date ? order.date.split('T')[0] : new Date().toISOString().split('T')[0],
      concept: `Venta POS de Farmacia - Cliente: ${order.customerName || 'Consumidor Final'} (${order.paymentMethod})`,
      referenceType: 'POS_SALE',
      referenceId: `ORDER_${order.id}`,
      lines: [
        {
          accountId: targetAccountId,
          accountCode: isCash ? '1.1.01' : '1.1.02',
          accountName: targetAccountName,
          debit: order.total,
          credit: 0,
          memo: `Cobro en ${isCash ? 'Efectivo' : 'Transferencia'}`
        },
        {
          accountId: '4.1.01',
          accountCode: '4.1.01',
          accountName: 'Ventas de Medicamentos y Productos',
          debit: 0,
          credit: order.total,
          memo: `Ingreso por venta orden ${order.id.slice(0, 6)}`
        }
      ],
      totalDebit: order.total,
      totalCredit: order.total,
      createdByName: 'Sistema Contable Automático',
      status: 'ASENTADO',
      createdAt: new Date().toISOString()
    };

    await addJournalEntryDB(saleEntry);
    countCreated++;

    // Asiento 2: Por el Costo de Ventas e Inventario (Si costo > 0)
    if (totalCost > 0) {
      const cogsEntry: JournalEntry = {
        id: `ASC_COGS_${order.id}`,
        entryNumber: `ASC-COS-${order.id.slice(0, 6).toUpperCase()}`,
        date: order.date ? order.date.split('T')[0] : new Date().toISOString().split('T')[0],
        concept: `Costo de Ventas y Salida de Stock - Orden ${order.id.slice(0, 6)}`,
        referenceType: 'POS_SALE',
        referenceId: `COGS_ORDER_${order.id}`,
        lines: [
          {
            accountId: '5.1.01',
            accountCode: '5.1.01',
            accountName: 'Costo de Ventas (COGS Medicamentos)',
            debit: totalCost,
            credit: 0,
            memo: 'Costo de insumos despachados'
          },
          {
            accountId: '1.1.04',
            accountCode: '1.1.04',
            accountName: 'Inventario de Medicamentos y Productos',
            debit: 0,
            credit: totalCost,
            memo: 'Disminución de valor de inventario'
          }
        ],
        totalDebit: totalCost,
        totalCredit: totalCost,
        createdByName: 'Sistema Contable Automático',
        status: 'ASENTADO',
        createdAt: new Date().toISOString()
      };
      await addJournalEntryDB(cogsEntry);
      countCreated++;
    }
  }

  // 2. Procesar Gastos Operativos
  for (const exp of expenses) {
    if (existingRefIds.has(`EXPENSE_${exp.id}`)) continue;

    let expenseAccountId = '5.1.06'; // Gastos diversos por defecto
    let expenseAccountName = 'Gastos Operativos Varios y Caja Chica';

    const catUpper = (exp.category || '').toUpperCase();
    if (catUpper.includes('ARRIENDO') || catUpper.includes('ALQUILER')) {
      expenseAccountId = '5.1.02';
      expenseAccountName = 'Arriendo del Local Farmacéutico';
    } else if (catUpper.includes('LUZ') || catUpper.includes('AGUA') || catUpper.includes('SERVICIO') || catUpper.includes('INTERNET')) {
      expenseAccountId = '5.1.03';
      expenseAccountName = 'Servicios Básicos (Luz, Agua, Telecomunicaciones)';
    } else if (catUpper.includes('SUELDO') || catUpper.includes('SALARIO') || catUpper.includes('NOMINA')) {
      expenseAccountId = '5.1.04';
      expenseAccountName = 'Sueldos, Salarios y Nómina';
    }

    const expEntry: JournalEntry = {
      id: `ASC_EXP_${exp.id}`,
      entryNumber: `ASC-GTO-${exp.id.slice(0, 6).toUpperCase()}`,
      date: exp.date ? exp.date.split('T')[0] : new Date().toISOString().split('T')[0],
      concept: `Registro de Gasto Operativo: ${exp.description || exp.category}`,
      referenceType: 'EXPENSE',
      referenceId: `EXPENSE_${exp.id}`,
      lines: [
        {
          accountId: expenseAccountId,
          accountCode: expenseAccountId,
          accountName: expenseAccountName,
          debit: exp.amount,
          credit: 0,
          memo: exp.description || 'Gasto registrado en caja'
        },
        {
          accountId: '1.1.01',
          accountCode: '1.1.01',
          accountName: 'Caja General (Efectivo Ventas POS)',
          debit: 0,
          credit: exp.amount,
          memo: 'Salida de caja por pago de gasto'
        }
      ],
      totalDebit: exp.amount,
      totalCredit: exp.amount,
      createdByName: 'Sistema Contable Automático',
      status: 'ASENTADO',
      createdAt: new Date().toISOString()
    };

    await addJournalEntryDB(expEntry);
    countCreated++;
  }

  // 3. Procesar Créditos / Fiados (Medicamentos entregados a crédito)
  for (const cred of credits) {
    if (existingRefIds.has(`CREDIT_${cred.id}`)) continue;

    const creditEntry: JournalEntry = {
      id: `ASC_CRE_${cred.id}`,
      entryNumber: `ASC-CRD-${cred.id.slice(0, 6).toUpperCase()}`,
      date: cred.date ? cred.date.split('T')[0] : new Date().toISOString().split('T')[0],
      concept: `Entrega de Medicamento Fiado a Cliente: ${cred.customerName}`,
      referenceType: 'CREDIT_PAYMENT',
      referenceId: `CREDIT_${cred.id}`,
      lines: [
        {
          accountId: '1.1.03',
          accountCode: '1.1.03',
          accountName: 'Cuentas por Cobrar (Medicamentos Fiados / Créditos)',
          debit: cred.total,
          credit: 0,
          memo: `Crédito otorgado a ${cred.customerName}`
        },
        {
          accountId: '4.1.01',
          accountCode: '4.1.01',
          accountName: 'Ventas de Medicamentos y Productos',
          debit: 0,
          credit: cred.total,
          memo: `Venta a crédito ticket ${cred.id.slice(0,6)}`
        }
      ],
      totalDebit: cred.total,
      totalCredit: cred.total,
      createdByName: 'Sistema Contable Automático',
      status: 'ASENTADO',
      createdAt: new Date().toISOString()
    };

    await addJournalEntryDB(creditEntry);
    countCreated++;
  }

  return countCreated;
};
