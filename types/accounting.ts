export type AccountCategory = 'ACTIVO' | 'PASIVO' | 'PATRIMONIO' | 'INGRESO' | 'GASTO';

export type AccountSubtype = 
  | 'CAJA_BANCOS'
  | 'CUENTAS_POR_COBRAR'
  | 'INVENTARIO'
  | 'ACTIVO_FIJO'
  | 'CUENTAS_POR_PAGAR'
  | 'IMPUESTOS_POR_PAGAR'
  | 'CAPITAL'
  | 'RESULTADOS_ACUMULADOS'
  | 'VENTAS_MEDICAMENTOS'
  | 'INGRESOS_SERVICIOS'
  | 'OTROS_INGRESOS'
  | 'COSTO_DE_VENTAS'
  | 'GASTOS_OPERATIVOS'
  | 'ALQUILER'
  | 'SERVICIOS_BASICOS'
  | 'SALARIOS'
  | 'MERMAS_E_INVENTARIO'
  | 'GASTOS_DIVERSOS';

export interface Account {
  id: string;
  code: string; // Ej: "1.1.01"
  name: string; // Ej: "Caja General (Punto de Venta)"
  category: AccountCategory;
  subtype: AccountSubtype;
  balance: number;
  isSystemAccount?: boolean;
  description?: string;
  updatedAt?: string;
}

export interface JournalEntryLine {
  id?: string;
  accountId: string;
  accountCode: string;
  accountName: string;
  debit: number;  // DEBE
  credit: number; // HABER
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string; // Ej: "ASC-2026-0001"
  date: string; // YYYY-MM-DD
  concept: string;
  referenceType?: 'POS_SALE' | 'CREDIT_PAYMENT' | 'SUPPLIER_PURCHASE' | 'EXPENSE' | 'MANUAL_ADJUSTMENT' | 'OPENING_BALANCE';
  referenceId?: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  createdByName?: string;
  status: 'ASENTADO' | 'ANULADO';
  createdAt: string;
}

export interface IncomeStatement {
  periodLabel: string;
  totalRevenue: number;
  costOfGoodsSold: number;
  grossProfit: number;
  grossMarginPct: number;
  operatingExpenses: number;
  expenseBreakdown: { [category: string]: number };
  netOperatingIncome: number;
  taxEstimate: number; // Est. Impuestos / IVA
  netProfit: number;
  netMarginPct: number;
}

export interface BalanceSheet {
  asOfDate: string;
  totalAssets: number;
  assetsBreakdown: { name: string; amount: number; code: string }[];
  totalLiabilities: number;
  liabilitiesBreakdown: { name: string; amount: number; code: string }[];
  totalEquity: number;
  equityBreakdown: { name: string; amount: number; code: string }[];
  currentYearNetProfit: number;
  isBalanced: boolean;
  difference: number;
}

export interface AccountingKPIs {
  totalAssets: number;
  totalLiabilities: number;
  netEquity: number;
  monthlyRevenue: number;
  monthlyExpenses: number;
  monthlyNetProfit: number;
  currentRatio: number; // Liquidez Corriente (Activo Corriente / Pasivo Corriente)
  workingCapital: number; // Capital de Trabajo (Activo Corriente - Pasivo Corriente)
}
