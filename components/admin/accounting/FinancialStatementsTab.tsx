import React, { useState } from 'react';
import { Account, JournalEntry } from '../../../types/accounting';
import { TrendingUp, Scale, CheckCircle2, AlertTriangle, Printer } from 'lucide-react';

interface FinancialStatementsTabProps {
  accounts: Account[];
  entries: JournalEntry[];
}

export const FinancialStatementsTab: React.FC<FinancialStatementsTabProps> = ({
  accounts,
  entries
}) => {
  const [statementType, setStatementType] = useState<'INCOME' | 'BALANCE'>('INCOME');

  // Calcular balances acumulados por cuenta
  const accountBalances: { [code: string]: number } = {};
  accounts.forEach(acc => {
    accountBalances[acc.code] = 0;
  });

  entries.forEach(entry => {
    entry.lines.forEach(line => {
      const code = line.accountCode;
      const acc = accounts.find(a => a.code === code);
      if (!acc) return;

      if (!accountBalances[code]) accountBalances[code] = 0;

      if (acc.category === 'ACTIVO' || acc.category === 'GASTO') {
        accountBalances[code] += (line.debit - line.credit);
      } else {
        accountBalances[code] += (line.credit - line.debit);
      }
    });
  });

  // --- CÁLCULOS DEL ESTADO DE RESULTADOS (P&L) ---
  const revenueSales = accountBalances['4.1.01'] || 0;
  const revenueServices = accountBalances['4.1.02'] || 0;
  const totalRevenue = revenueSales + revenueServices;

  const costOfSales = accountBalances['5.1.01'] || 0;
  const grossProfit = totalRevenue - costOfSales;
  const grossMarginPct = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const expRent = accountBalances['5.1.02'] || 0;
  const expUtilities = accountBalances['5.1.03'] || 0;
  const expSalaries = accountBalances['5.1.04'] || 0;
  const expSpoilage = accountBalances['5.1.05'] || 0;
  const expOther = accountBalances['5.1.06'] || 0;

  const totalOperatingExpenses = expRent + expUtilities + expSalaries + expSpoilage + expOther;
  const netOperatingProfit = grossProfit - totalOperatingExpenses;
  const netMarginPct = totalRevenue > 0 ? (netOperatingProfit / totalRevenue) * 100 : 0;

  // --- CÁLCULOS DEL BALANCE GENERAL ---
  const assetCash = accountBalances['1.1.01'] || 0;
  const assetBank = accountBalances['1.1.02'] || 0;
  const assetReceivables = accountBalances['1.1.03'] || 0;
  const assetInventory = accountBalances['1.1.04'] || 0;
  const assetFixed = accountBalances['1.2.01'] || 0;
  const totalAssets = assetCash + assetBank + assetReceivables + assetInventory + assetFixed;

  const liabPayables = accountBalances['2.1.01'] || 0;
  const liabTaxes = accountBalances['2.1.02'] || 0;
  const totalLiabilities = liabPayables + liabTaxes;

  const equityCapital = accountBalances['3.1.01'] || 0;
  const equityRetained = accountBalances['3.1.02'] || 0;
  const currentNetIncome = netOperatingProfit; // Ganancia del periodo incorporada al patrimonio
  const totalEquity = equityCapital + equityRetained + currentNetIncome;

  const equationDifference = Math.abs(totalAssets - (totalLiabilities + totalEquity));
  const isEquationBalanced = equationDifference < 0.05;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">

      {/* Selector de Estado Financiero y Botón Imprimir */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
          <button
            onClick={() => setStatementType('INCOME')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              statementType === 'INCOME'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp size={16} /> Estado de Resultados (P&L)
          </button>
          <button
            onClick={() => setStatementType('BALANCE')}
            className={`flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              statementType === 'BALANCE'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale size={16} /> Balance General
          </button>
        </div>

        <button
          onClick={handlePrint}
          className="w-full sm:w-auto bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition flex items-center justify-center gap-2"
        >
          <Printer size={15} /> Imprimir Estado
        </button>
      </div>

      {/* ---------------- VISTA 1: ESTADO DE RESULTADOS ---------------- */}
      {statementType === 'INCOME' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-8 animate-in fade-in duration-200">
          
          <div className="text-center border-b border-slate-100 pb-6">
            <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
              Farmacia Vitalis - RUC / Contabilidad Gerencial
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Estado de Resultados Integrales</h2>
            <p className="text-xs text-slate-500 font-medium">Resumen consolidado de ingresos, costos y ganancias operativas</p>
          </div>

          {/* Tarjetas KPI de Resumen P&L */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400">Ingresos Totales (Ventas)</span>
              <div className="text-xl font-black font-mono text-white">${totalRevenue.toFixed(2)}</div>
            </div>

            <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200/80 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Costo de Ventas (COGS)</span>
              <div className="text-xl font-black font-mono text-amber-900">-${costOfSales.toFixed(2)}</div>
            </div>

            <div className="bg-teal-50 p-5 rounded-2xl border border-teal-200/80 shadow-sm space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Utilidad Bruta ({grossMarginPct.toFixed(1)}%)</span>
              <div className="text-xl font-black font-mono text-teal-900">${grossProfit.toFixed(2)}</div>
            </div>

            <div className={`p-5 rounded-2xl border shadow-sm space-y-1 ${netOperatingProfit >= 0 ? 'bg-emerald-50 border-emerald-200/80' : 'bg-rose-50 border-rose-200/80'}`}>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${netOperatingProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                Utilidad Neta ({netMarginPct.toFixed(1)}%)
              </span>
              <div className={`text-xl font-black font-mono ${netOperatingProfit >= 0 ? 'text-emerald-900' : 'text-rose-900'}`}>
                ${netOperatingProfit.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Desglose Detallado del Estado de Resultados */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="p-3.5">Rubro / Cuenta Contable</th>
                  <th className="p-3.5 text-right">Parcial ($)</th>
                  <th className="p-3.5 text-right">Total ($)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                
                {/* SECCIÓN INGRESOS */}
                <tr className="bg-teal-50/50 font-black text-teal-900 uppercase text-[11px]">
                  <td colSpan={2} className="p-3">(+) INGRESOS OPERACIONALES</td>
                  <td className="p-3 text-right font-mono">${totalRevenue.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 pl-6 text-slate-700">Ventas de Medicamentos y Productos (4.1.01)</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${revenueSales.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 pl-6 text-slate-700">Ingresos por Servicios de Inyectología / Salud (4.1.02)</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${revenueServices.toFixed(2)}</td>
                  <td></td>
                </tr>

                {/* COSTO DE VENTAS */}
                <tr className="bg-amber-50/50 font-black text-amber-900 uppercase text-[11px]">
                  <td colSpan={2} className="p-3">(-) COSTO DE VENTAS (COGS MEDICAMENTOS)</td>
                  <td className="p-3 text-right font-mono">-${costOfSales.toFixed(2)}</td>
                </tr>

                {/* UTILIDAD BRUTA */}
                <tr className="bg-slate-100 font-black text-slate-900 uppercase border-y border-slate-300">
                  <td colSpan={2} className="p-3">(=) MARGEN DE UTILIDAD BRUTA</td>
                  <td className="p-3 text-right font-mono text-sm text-teal-700">${grossProfit.toFixed(2)}</td>
                </tr>

                {/* GASTOS OPERATIVOS */}
                <tr className="bg-rose-50/50 font-black text-rose-900 uppercase text-[11px]">
                  <td colSpan={2} className="p-3">(-) GASTOS OPERATIVOS Y DE ADMINISTRACIÓN</td>
                  <td className="p-3 text-right font-mono">-${totalOperatingExpenses.toFixed(2)}</td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 pl-6 text-slate-700">Arriendo del Local Comercial (5.1.02)</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${expRent.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 pl-6 text-slate-700">Servicios Básicos: Luz, Agua, Internet (5.1.03)</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${expUtilities.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 pl-6 text-slate-700">Sueldos y Nómina Farmacéutica (5.1.04)</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${expSalaries.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 pl-6 text-slate-700">Mermas y Caducidades de Insumos (5.1.05)</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${expSpoilage.toFixed(2)}</td>
                  <td></td>
                </tr>
                <tr className="hover:bg-slate-50">
                  <td className="p-2.5 pl-6 text-slate-700">Gastos Varios y Caja Chica (5.1.06)</td>
                  <td className="p-2.5 text-right font-mono text-slate-600">${expOther.toFixed(2)}</td>
                  <td></td>
                </tr>

                {/* UTILIDAD NETA FINAL */}
                <tr className={`font-black uppercase border-t-2 text-sm ${netOperatingProfit >= 0 ? 'bg-emerald-100 text-emerald-900 border-emerald-300' : 'bg-rose-100 text-rose-900 border-rose-300'}`}>
                  <td colSpan={2} className="p-4 font-black">(=) GANANCIA O UTILIDAD NETA DEL EJERCICIO</td>
                  <td className="p-4 text-right font-mono text-base">${netOperatingProfit.toFixed(2)}</td>
                </tr>

              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* ---------------- VISTA 2: BALANCE GENERAL ---------------- */}
      {statementType === 'BALANCE' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 md:p-8 space-y-8 animate-in fade-in duration-200">
          
          <div className="text-center border-b border-slate-100 pb-6">
            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              Ecuación Contable: Activos = Pasivos + Patrimonio
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Balance General Clasificado</h2>
            <p className="text-xs text-slate-500 font-medium">Estado de la situación financiera de Farmacia Vitalis</p>
          </div>

          {/* Verificación de Equilibrio de la Ecuación Contable */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isEquationBalanced ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-3">
              {isEquationBalanced ? (
                <CheckCircle2 className="text-emerald-600 flex-shrink-0" size={22} />
              ) : (
                <AlertTriangle className="text-rose-600 flex-shrink-0" size={22} />
              )}
              <div>
                <h4 className="text-xs font-black uppercase">
                  {isEquationBalanced ? 'Ecuación Contable Cuadrada y Equilibrada' : 'Ecuación Contable Desequilibrada'}
                </h4>
                <p className="text-[11px] font-medium opacity-80">
                  Activos (${totalAssets.toFixed(2)}) = Pasivos (${totalLiabilities.toFixed(2)}) + Patrimonio (${totalEquity.toFixed(2)})
                </p>
              </div>
            </div>

            <div className="font-mono text-xs font-black">
              Dif: ${equationDifference.toFixed(2)}
            </div>
          </div>

          {/* Columnas Activos vs Pasivos y Patrimonio */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

            {/* COLUMNA ACTIVOS */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="bg-emerald-900 text-white p-3.5 font-black text-xs uppercase tracking-wider flex items-center justify-between">
                <span>1. ACTIVOS (BIENES Y DERECHOS)</span>
                <span className="font-mono text-sm">${totalAssets.toFixed(2)}</span>
              </div>

              <div className="p-4 space-y-4 text-xs">
                <div>
                  <h5 className="font-extrabold text-slate-800 uppercase text-[10px] text-emerald-700 border-b pb-1 mb-2">Activo Corriente</h5>
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Caja General (Efectivo Ventas POS)</span>
                      <span className="font-mono font-bold">${assetCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Bancos y Transferencias Directas</span>
                      <span className="font-mono font-bold">${assetBank.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Cuentas por Cobrar (Fiados / Créditos)</span>
                      <span className="font-mono font-bold">${assetReceivables.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium text-slate-700">
                      <span>Inventario de Medicamentos e Insumos</span>
                      <span className="font-mono font-bold">${assetInventory.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-extrabold text-slate-800 uppercase text-[10px] text-emerald-700 border-b pb-1 mb-2">Activo No Corriente / Fijo</h5>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Equipos, Perchas y Refrigeración</span>
                    <span className="font-mono font-bold">${assetFixed.toFixed(2)}</span>
                  </div>
                </div>

                <div className="bg-emerald-50 p-3 rounded-xl font-black text-emerald-900 flex justify-between uppercase text-xs border border-emerald-200">
                  <span>TOTAL ACTIVOS</span>
                  <span className="font-mono">${totalAssets.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* COLUMNA PASIVOS Y PATRIMONIO */}
            <div className="space-y-6">
              
              {/* PASIVOS */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-rose-900 text-white p-3.5 font-black text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>2. PASIVOS (OBLIGACIONES Y DEUDAS)</span>
                  <span className="font-mono text-sm">${totalLiabilities.toFixed(2)}</span>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Cuentas por Pagar (Proveedores / Difare)</span>
                    <span className="font-mono font-bold">${liabPayables.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Impuestos e IVA por Pagar (SRI)</span>
                    <span className="font-mono font-bold">${liabTaxes.toFixed(2)}</span>
                  </div>

                  <div className="bg-rose-50 p-3 rounded-xl font-black text-rose-900 flex justify-between uppercase text-xs border border-rose-200 mt-3">
                    <span>TOTAL PASIVOS</span>
                    <span className="font-mono">${totalLiabilities.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* PATRIMONIO */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="bg-indigo-900 text-white p-3.5 font-black text-xs uppercase tracking-wider flex items-center justify-between">
                  <span>3. PATRIMONIO NETO</span>
                  <span className="font-mono text-sm">${totalEquity.toFixed(2)}</span>
                </div>

                <div className="p-4 space-y-2 text-xs">
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Capital Social e Inversión Inicial</span>
                    <span className="font-mono font-bold">${equityCapital.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-medium text-slate-700">
                    <span>Resultados Acumulados Anteriores</span>
                    <span className="font-mono font-bold">${equityRetained.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-black text-emerald-700 bg-emerald-50 p-2 rounded-lg">
                    <span>Utilidad Neta del Ejercicio Actual</span>
                    <span className="font-mono">${currentNetIncome.toFixed(2)}</span>
                  </div>

                  <div className="bg-indigo-50 p-3 rounded-xl font-black text-indigo-900 flex justify-between uppercase text-xs border border-indigo-200 mt-3">
                    <span>TOTAL PATRIMONIO</span>
                    <span className="font-mono">${totalEquity.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* TOTAL PASIVO + PATRIMONIO */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl font-black flex justify-between uppercase text-xs shadow-md">
                <span>TOTAL PASIVO + PATRIMONIO</span>
                <span className="font-mono text-teal-400 font-black">${(totalLiabilities + totalEquity).toFixed(2)}</span>
              </div>

            </div>

          </div>

        </div>
      )}

    </div>
  );
};
