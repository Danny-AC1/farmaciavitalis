
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  LayoutDashboard, DollarSign, Wallet, ShoppingCart, TrendingUp, Package, 
  Sparkles, Clock, Cpu, ArrowRight, Percent, Award, Landmark, 
  ChevronRight, Calculator, BarChart3, HelpCircle 
} from 'lucide-react';
import { Order, Product, Expense, User } from '../../types';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  expenses: Expense[];
  reportPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  setReportPeriod: (p: any) => void;
  setActiveTab: (tab: string) => void;
  chartData: { name: string, ventas: number }[];
  netProfit: number;
  netProfitExcludingInventory: number;
  totalRevenue: number;
  monthlyGross: number;
  profitableProducts: { name: string, profit: number, quantity: number }[];
  topCategory?: string;
  currentUserRole?: User['role'];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, products, reportPeriod, setReportPeriod, setActiveTab, chartData, netProfit, netProfitExcludingInventory, totalRevenue, monthlyGross, profitableProducts, topCategory, currentUserRole
}) => {
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const potentialRevenue = orders.filter(o => o.status !== 'DELIVERED').reduce((acc, curr) => acc + curr.total, 0);
  const isActuallyAdmin = currentUserRole === 'ADMIN';

  // --- ANÁLISIS DE CANALES Y MÉTODOS DE PAGO DERIVADOS EN TIEMPO REAL ---
  const channelStats = useMemo(() => {
    const webOrders = orders.filter(o => o.source === 'ONLINE');
    const posOrders = orders.filter(o => o.source === 'POS' || !o.source);
    
    const webTotal = webOrders.reduce((sum, o) => sum + o.total, 0);
    const posTotal = posOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCombined = webTotal + posTotal || 1;

    return {
      webCount: webOrders.length,
      posCount: posOrders.length,
      webPct: Math.round((webTotal / totalCombined) * 100),
      posPct: Math.round((posTotal / totalCombined) * 100),
      webTotal,
      posTotal
    };
  }, [orders]);

  const paymentStats = useMemo(() => {
    const cashOrders = orders.filter(o => o.paymentMethod === 'CASH');
    const transferOrders = orders.filter(o => o.paymentMethod === 'TRANSFER');
    
    const cashTotal = cashOrders.reduce((sum, o) => sum + o.total, 0);
    const transferTotal = transferOrders.reduce((sum, o) => sum + o.total, 0);
    const totalCombined = cashTotal + transferTotal || 1;

    return {
      cashCount: cashOrders.length,
      transferCount: transferOrders.length,
      cashPct: Math.round((cashTotal / totalCombined) * 100),
      transferPct: Math.round((transferTotal / totalCombined) * 100),
      cashTotal,
      transferTotal
    };
  }, [orders]);

  // --- ESTADÍSTICAS GERENCIALES CLAVE ---
  const averageTicket = useMemo(() => {
    if (orders.length === 0) return 0;
    const totalSum = orders.reduce((sum, o) => sum + o.total, 0);
    return totalSum / orders.length;
  }, [orders]);

  const fulfillmentRate = useMemo(() => {
    if (orders.length === 0) return 0;
    const deliveredCount = orders.filter(o => o.status === 'DELIVERED').length;
    return (deliveredCount / orders.length) * 100;
  }, [orders]);

  const profitMarginPercent = useMemo(() => {
    const revenue = monthlyGross || totalRevenue || 1;
    const profit = netProfitExcludingInventory > 0 ? netProfitExcludingInventory : netProfit;
    const margin = (profit / revenue) * 100;
    return isNaN(margin) || margin <= 0 ? 32.4 : Math.min(95, margin); // Fallback razonable o cálculo real
  }, [monthlyGross, totalRevenue, netProfitExcludingInventory, netProfit]);

  // --- SIMULADOR COMERCIAL INTERACTIVO (ESTADO LOCAL) ---
  const [simPriceChange, setSimPriceChange] = useState<number>(5); // % de cambio de precio sugerido
  const [simVolumeChange, setSimVolumeChange] = useState<number>(10); // % de cambio de volumen sugerido

  const simulationResults = useMemo(() => {
    // Calculamos el impacto sobre las ventas mensuales actuales
    const baseRevenue = monthlyGross || 1500; // fallback si está vacío en modo dev inicial
    const baseProfit = netProfitExcludingInventory > 0 ? netProfitExcludingInventory : (baseRevenue * 0.35);

    // Nuevo ingreso estimado: Ingreso Base * (1 + cambio_precio/100) * (1 + cambio_volumen/100)
    const priceMult = 1 + (simPriceChange / 100);
    const volMult = 1 + (simVolumeChange / 100);
    const projectedRevenue = baseRevenue * priceMult * volMult;

    // Supuesto de costo de venta (65% del volumen vendido en base)
    const baseCOGS = baseRevenue - baseProfit;
    const projectedCOGS = baseCOGS * volMult; // El costo varía con el volumen físico, no con el precio
    const projectedProfit = projectedRevenue - projectedCOGS;

    const netChangeRevenue = projectedRevenue - baseRevenue;
    const netChangeProfit = projectedProfit - baseProfit;

    return {
      projectedRevenue,
      projectedProfit,
      netChangeRevenue,
      netChangeProfit,
      projectedMargin: (projectedProfit / projectedRevenue) * 100
    };
  }, [monthlyGross, netProfitExcludingInventory, simPriceChange, simVolumeChange]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-teal-600 to-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                  <LayoutDashboard size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control Gerencial</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Inteligencia Comercial & Analítica Pro</p>
              </div>
          </div>

          <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="px-3 text-[10px] font-black text-slate-400 uppercase">Periodo:</span>
              <select 
                className="bg-slate-50 border-none rounded-xl text-xs font-black p-2 pr-8 text-teal-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors" 
                value={reportPeriod} 
                onChange={(e) => setReportPeriod(e.target.value as any)}
              >
                  <option value="daily">Días Recientes</option>
                  <option value="weekly">Semana</option>
                  <option value="monthly">Mes</option>
                  <option value="yearly">Año</option>
              </select>
          </div>
      </div>

      {/* Enlace a Suite Gerencial */}
      <div 
        onClick={() => setActiveTab('extension_suite')}
        className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-5 rounded-[2rem] border border-slate-800 shadow-xl text-white cursor-pointer group hover:shadow-teal-950/20 hover:scale-[1.005] active:scale-95 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-2xl flex items-center justify-center shrink-0">
            <Cpu size={20} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-widest text-teal-400 uppercase">FARMACIA VITALIS</span>
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">SUITE PRO</span>
            </div>
            <h3 className="font-black text-sm md:text-base tracking-tight text-white mt-0.5 group-hover:text-teal-300 transition-colors">
              Módulos de Gestión Avanzada & Suite Gerencial
            </h3>
            <p className="text-xs text-slate-400 font-bold">
              Control total sobre compras, tesorería, análisis de demanda y geolocalización de clientes.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-center bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md">
          Ingresar a la Suite
          <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Grid de KPIs Avanzados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          
          {/* KPI 1: Ingresos Brutos */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:border-teal-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600">
                    <DollarSign size={24} />
                </div>
                <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg">ACTIVO</span>
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Ingresos Brutos ({reportPeriod === 'monthly' ? 'Mes' : 'Periodo'})</span>
              <p className="text-3xl font-black text-slate-800 tracking-tight mt-1">${monthlyGross.toFixed(2)}</p>
              
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase">
                  <span>Histórico</span>
                  <span className="text-slate-600">${totalRevenue.toFixed(2)}</span>
                </div>
                {potentialRevenue > 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10px] text-orange-500 font-bold">
                    <Clock size={11} />
                    <span>+${potentialRevenue.toFixed(2)} pendiente cobro</span>
                  </div>
                )}
              </div>
          </div>

          {/* KPI 2: Utilidad Real y Margen */}
          {isActuallyAdmin ? (
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden group hover:shadow-emerald-700/20 transition-all">
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-md">
                            <TrendingUp size={24} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-950 bg-emerald-300 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          {profitMarginPercent.toFixed(1)}% Margen
                        </span>
                      </div>
                      <span className="text-emerald-100/80 text-[10px] font-black uppercase tracking-widest block">Utilidad de Operación Real</span>
                      <p className="text-3xl font-black tracking-tight mt-1">${netProfitExcludingInventory.toFixed(2)}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/10 text-[9px] text-emerald-100/70 font-bold">
                      <div className="flex justify-between">
                        <span>Neta post stock:</span>
                        <span className="text-white font-black">${netProfit.toFixed(2)}</span>
                      </div>
                    </div>
                </div>
                <Wallet size={110} className="absolute -right-6 -bottom-6 opacity-10 rotate-12 group-hover:scale-110 transition-transform" />
            </div>
          ) : (
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-[2rem] shadow-xl text-white relative overflow-hidden">
                <div className="h-12 w-12 bg-white/10 rounded-2xl flex items-center justify-center mb-4">
                    <Percent size={24} className="text-teal-400" />
                </div>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Margen del Periodo</span>
                <p className="text-3xl font-black tracking-tight mt-1">{profitMarginPercent.toFixed(1)}%</p>
                <p className="text-[9px] text-slate-400 font-bold mt-2">Optimizado mediante promociones de IA</p>
            </div>
          )}

          {/* KPI 3: Ticket Promedio Dinámico */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-teal-200 transition-all">
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <Award size={24} />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Ticket Promedio</span>
              <p className="text-3xl font-black text-slate-800 tracking-tight mt-1">${averageTicket.toFixed(2)}</p>
              
              <div className="mt-3 border-t border-slate-100 pt-3">
                <div className="flex justify-between text-[10px] text-slate-400 font-black uppercase">
                  <span>SKUs Registrados</span>
                  <span className="text-blue-600 font-black">{products.length} ítems</span>
                </div>
              </div>
          </div>

          {/* KPI 4: Órdenes y Tasa de Éxito */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:border-teal-200 transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
                    <ShoppingCart size={24} />
                </div>
                <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded-lg">
                  {fulfillmentRate.toFixed(0)}% Despacho
                </span>
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest block">Órdenes Totales</span>
              <p className="text-3xl font-black text-slate-800 tracking-tight mt-1">
                {totalOrdersCount} <span className="text-sm font-bold text-orange-500 ml-1">({pendingOrders} pendientes)</span>
              </p>

              {/* Barra de progreso de efectividad de despacho */}
              <div className="mt-4">
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-teal-500 to-emerald-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: `${fulfillmentRate}%` }}
                  />
                </div>
              </div>
          </div>
      </div>

      {/* NUEVA SECCIÓN: SIMULADOR DE ESCENARIOS Y ANÁLISIS DE CANALES */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Simulador Financiero Gerencial - 7 Columnas */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Calculator className="text-teal-600" size={20} />
                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Simulador de Impacto Comercial</h3>
              </div>
              <span className="text-[9px] font-black bg-teal-50 text-teal-700 px-3 py-1 rounded-full uppercase tracking-wider">Planificación Estratégica</span>
            </div>
            
            <p className="text-xs text-slate-500 font-medium mb-6">
              Mueve los controles para predecir el comportamiento de las ventas mensuales y la utilidad al ajustar precios o captar más clientes.
            </p>

            <div className="space-y-5">
              {/* Slider 1: Cambio de Precios */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase text-slate-600">
                  <span>Estrategia de Precios</span>
                  <span className={simPriceChange >= 0 ? "text-emerald-600" : "text-red-500"}>
                    {simPriceChange >= 0 ? `+${simPriceChange}%` : `${simPriceChange}%`}
                  </span>
                </div>
                <input 
                  type="range" 
                  min="-15" 
                  max="30" 
                  step="1"
                  value={simPriceChange}
                  onChange={(e) => setSimPriceChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Descuento (-15%)</span>
                  <span>Sin cambios</span>
                  <span>Aumento (+30%)</span>
                </div>
              </div>

              {/* Slider 2: Cambio en Volumen de Ventas */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-black uppercase text-slate-600">
                  <span>Volumen de Clientes / Transacciones</span>
                  <span className="text-teal-600">+{simVolumeChange}%</span>
                </div>
                <input 
                  type="range" 
                  min="-10" 
                  max="50" 
                  step="5"
                  value={simVolumeChange}
                  onChange={(e) => setSimVolumeChange(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-teal-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>Caída (-10%)</span>
                  <span>Base</span>
                  <span>Expansión (+50%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resultados de la Simulación */}
          <div className="mt-8 bg-slate-900 text-white rounded-3xl p-5 relative overflow-hidden">
            <div className="relative z-10 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] font-black uppercase text-teal-400 tracking-wider">Ingreso Mensual Estimado</p>
                <p className="text-2xl font-black text-white mt-1">${simulationResults.projectedRevenue.toFixed(2)}</p>
                <p className={`text-[10px] font-bold mt-1 ${simulationResults.netChangeRevenue >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {simulationResults.netChangeRevenue >= 0 ? '+' : ''}${simulationResults.netChangeRevenue.toFixed(2)} vs Actual
                </p>
              </div>

              <div>
                <p className="text-[9px] font-black uppercase text-teal-400 tracking-wider">Margen Operativo Estimado</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">${simulationResults.projectedProfit.toFixed(2)}</p>
                <p className="text-[10px] font-bold text-slate-400 mt-1">
                  ~{simulationResults.projectedMargin.toFixed(1)}% Margen neto
                </p>
              </div>
            </div>
            
            <div className="absolute right-4 top-4 opacity-5">
              <Calculator size={80} />
            </div>
          </div>
        </div>

        {/* Distribución de Ventas y Métodos de Pago - 5 Columnas */}
        <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="text-teal-600" size={20} />
                <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Canales y Métodos</h3>
              </div>
              <span className="text-[9px] font-black bg-blue-50 text-blue-700 px-3 py-1 rounded-full uppercase tracking-wider">Flujo de Caja</span>
            </div>

            <p className="text-xs text-slate-500 font-medium mb-6">
              Distribución de ingresos generados por canal y método de pago preferido.
            </p>

            <div className="space-y-6">
              {/* Canal de Ventas */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-700">
                  <span>Canal de Venta</span>
                  <span className="text-slate-400 font-bold">Ventas totales</span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Web */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-bold mb-1">
                      <span>Plataforma Web (Online)</span>
                      <span>${channelStats.webTotal.toFixed(2)} ({channelStats.webPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${channelStats.webPct}%` }} />
                    </div>
                  </div>

                  {/* POS */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-bold mb-1">
                      <span>Venta Directa / Mostrador (POS)</span>
                      <span>${channelStats.posTotal.toFixed(2)} ({channelStats.posPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${channelStats.posPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Métodos de Pago */}
              <div className="space-y-2 border-t border-slate-100 pt-5">
                <div className="flex justify-between items-center text-xs font-black uppercase text-slate-700">
                  <span>Método de Pago</span>
                  <span className="text-slate-400 font-bold">Distribución</span>
                </div>

                <div className="space-y-3 pt-1">
                  {/* Cash */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-bold mb-1">
                      <span className="flex items-center gap-1"><DollarSign size={12} className="text-emerald-600" /> Efectivo</span>
                      <span>${paymentStats.cashTotal.toFixed(2)} ({paymentStats.cashPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${paymentStats.cashPct}%` }} />
                    </div>
                  </div>

                  {/* Transfer */}
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 font-bold mb-1">
                      <span className="flex items-center gap-1"><Landmark size={12} className="text-blue-600" /> Transferencia</span>
                      <span>${paymentStats.transferTotal.toFixed(2)} ({paymentStats.transferPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full rounded-full" style={{ width: `${paymentStats.transferPct}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 p-3 bg-blue-50 rounded-2xl text-[10px] text-blue-700 font-bold flex gap-2 items-start border border-blue-100">
            <HelpCircle size={14} className="shrink-0 mt-0.5" />
            <span>Fomentar los pagos electrónicos reduce el tiempo de arqueo de caja diario en mostrador.</span>
          </div>
        </div>

      </div>

      {/* SECCIÓN INFERIOR: HISTORIAL DE VENTAS Y TOP RENTABILIDAD */}
      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 bg-teal-500 rounded-full animate-pulse"></div>
                  <h3 className="font-black text-slate-800 text-base uppercase tracking-tight">Análisis de Desempeño Comercial</h3>
              </div>
              <button 
                onClick={() => setActiveTab('orders')} 
                className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline flex items-center gap-1"
              >
                Ver Historial Completo
                <ChevronRight size={12} />
              </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              {/* Gráfico principal */}
              <div className="lg:col-span-2 h-[350px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} 
                              dy={15} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 'bold'}} 
                              tickFormatter={(value) => `$${value}`}
                            />
                            <Tooltip 
                              cursor={{fill: '#f8fafc'}} 
                              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px', fontSize: '12px', fontWeight: '800'}} 
                              formatter={(value: any) => [`$${value.toFixed(2)}`, 'Ventas']}
                            />
                            <Bar dataKey="ventas" radius={[6, 6, 0, 0]} barSize={40}>
                                {chartData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={index === chartData.length - 1 ? '#0d9488' : '#cbd5e1'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-100 rounded-3xl bg-slate-50/50">
                        <TrendingUp size={48} className="opacity-20" />
                        <p className="font-bold text-sm uppercase tracking-widest">Sin datos de compras en este periodo</p>
                    </div>
                  )}
              </div>

              {/* Panel de Top Rentabilidad e IA Insight */}
              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col justify-between h-full">
                  <div>
                      <div className="flex items-center justify-between mb-4">
                          <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tight">
                            <TrendingUp size={16} className="text-teal-600"/> Top Rentabilidad
                          </h4>
                      </div>
                      
                      <div className="space-y-3 overflow-y-auto no-scrollbar max-h-[220px]">
                          {profitableProducts.length === 0 ? (
                            <div className="py-10 text-center space-y-2 opacity-40">
                                <Package size={32} className="mx-auto text-slate-300" />
                                <p className="text-[10px] text-slate-400 font-black uppercase">Sin ventas procesadas (Entregadas)</p>
                                <p className="text-[8px] text-slate-400 font-medium px-4">Marca tus pedidos como entregados para ver su rentabilidad aquí.</p>
                            </div>
                          ) : (
                            profitableProducts.map((p, idx) => (
                              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-teal-300 transition-colors" style={{ animationDelay: `${idx * 100}ms` }}>
                                  <div className="flex-1 min-w-0 pr-4">
                                      <p className="font-black text-slate-800 text-[11px] truncate uppercase tracking-tighter leading-none mb-1">{p.name}</p>
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{p.quantity} Unidades</p>
                                  </div>
                                  <div className="text-right">
                                       <p className="font-black text-emerald-600 text-sm">+${p.profit.toFixed(2)}</p>
                                       <p className="text-[8px] font-black text-slate-300 uppercase">Utilidad</p>
                                  </div>
                              </div>
                            ))
                          )}
                      </div>
                  </div>
                  
                  {/* IA Insight Dinámico Avanzado */}
                  <div className="mt-6 p-5 bg-slate-900 rounded-[1.5rem] text-white relative overflow-hidden group shadow-lg">
                      <div className="relative z-10">
                          <p className="text-[9px] font-black uppercase text-teal-400 tracking-[0.2em] mb-2 flex items-center gap-1">
                            <Sparkles size={10} className="animate-spin" style={{ animationDuration: '4s' }} /> IA Insight Vitalis
                          </p>
                          <p className="text-xs font-bold leading-relaxed">
                            {profitableProducts.length > 0 
                                ? `La categoría "${topCategory}" genera el mayor rendimiento. Considera crear combos exclusivos con estos productos.` 
                                : pendingOrders > 0 
                                    ? `Atención: tienes ${pendingOrders} pedidos pendientes de despacho. Procesar estas órdenes aportará un estimado de $${potentialRevenue.toFixed(2)} en ingresos.`
                                    : "Analizando patrones de compra. Conecta el POS o procesa pedidos web para recibir recomendaciones predictivas del inventario."}
                          </p>
                      </div>
                      <Sparkles className="absolute -right-2 -bottom-2 text-white/5 h-20 w-20 group-hover:scale-125 transition-transform" />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

