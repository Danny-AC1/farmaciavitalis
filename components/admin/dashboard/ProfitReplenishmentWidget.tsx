import React, { useState, useMemo, useEffect } from 'react';
import { 
  PiggyBank, 
  Wallet, 
  ShoppingBag, 
  Sparkles, 
  Check, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Calculator, 
  ShieldCheck, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Order, Product } from '../../../types';
import ReplenishmentOptimizerModal from './ReplenishmentOptimizerModal';
import GrowthSimulatorCard from './GrowthSimulatorCard';

interface ProfitReplenishmentWidgetProps {
  orders: Order[];
  products: Product[];
  setActiveTab?: (tab: string) => void;
}

const STORAGE_KEY_REPLENISHMENT = 'vitalis_replenishment_pot_v1';
const STORAGE_KEY_TOTAL_SAVINGS = 'vitalis_total_personal_savings_v1';

export const ProfitReplenishmentWidget: React.FC<ProfitReplenishmentWidgetProps> = ({
  orders,
  products
}) => {
  // 1. Estados de configuración y almacenamiento local
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [profitPct, setProfitPct] = useState<number>(20); // 20% retiro recomendado
  const [targetOrderBudget, setTargetOrderBudget] = useState<number>(120);
  const [showOptimizerModal, setShowOptimizerModal] = useState<boolean>(false);
  const [showGrowthSimulator, setShowGrowthSimulator] = useState<boolean>(false);
  const [justSaved, setJustSaved] = useState<boolean>(false);

  // Acumulado de fondo de reposición persistido
  const [replenishmentPot, setReplenishmentPot] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REPLENISHMENT);
      return saved !== null ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Total de ahorros personales guardados en el bolsillo
  const [totalSavedInPocket, setTotalSavedInPocket] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_TOTAL_SAVINGS);
      return saved !== null ? parseFloat(saved) : 0;
    } catch {
      return 0;
    }
  });

  // Guardar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_REPLENISHMENT, replenishmentPot.toString());
    } catch (e) {
      console.error(e);
    }
  }, [replenishmentPot]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_TOTAL_SAVINGS, totalSavedInPocket.toString());
    } catch (e) {
      console.error(e);
    }
  }, [totalSavedInPocket]);

  // 2. Ventas del día de hoy calculadas en vivo
  const todaySales = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      if (!o.date) return false;
      return o.date.startsWith(todayStr);
    });

    const sum = todayOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
    // Si no hay ventas registradas hoy en el preview o entorno local, damos una base de referencia interactiva
    return sum;
  }, [orders]);

  // Modo de edición manual si el usuario desea simular o ingresar la venta del día
  const [customTodaySales, setCustomTodaySales] = useState<string>('');
  const activeDailySales = useMemo(() => {
    if (customTodaySales !== '' && !isNaN(parseFloat(customTodaySales))) {
      return parseFloat(customTodaySales);
    }
    return todaySales > 0 ? todaySales : 25; // Si no hay órdenes hoy, sugiere $25
  }, [customTodaySales, todaySales]);

  // 3. Cálculos de la división de dinero del día
  const todayLiquidProfit = useMemo(() => {
    return (activeDailySales * profitPct) / 100;
  }, [activeDailySales, profitPct]);

  const todayReplenishmentFund = useMemo(() => {
    return activeDailySales - todayLiquidProfit;
  }, [activeDailySales, todayLiquidProfit]);

  // 4. Progreso hacia la meta de los $120
  const progressPercent = useMemo(() => {
    return Math.min(100, Math.round((replenishmentPot / targetOrderBudget) * 100));
  }, [replenishmentPot, targetOrderBudget]);

  const remainingForOrder = useMemo(() => {
    return Math.max(0, targetOrderBudget - replenishmentPot);
  }, [targetOrderBudget, replenishmentPot]);

  const isGoalReached = replenishmentPot >= targetOrderBudget;

  // Acciones
  const handleAddToPot = (amount: number, profitAmount: number) => {
    setReplenishmentPot(prev => prev + amount);
    setTotalSavedInPocket(prev => prev + profitAmount);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2500);
  };

  const handleMarkOrderDone = () => {
    if (window.confirm(`¿Confirmas que realizaste el pedido a la distribuidora por $${targetOrderBudget.toFixed(2)}? Esto descontará los $${targetOrderBudget.toFixed(2)} del fondo de reposición acumulado.`)) {
      setReplenishmentPot(prev => Math.max(0, prev - targetOrderBudget));
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Contenedor Principal Plegable / Comprimido */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
        
        {/* Cabecera / Banner Comprimido (Siempre visible y accionable) */}
        <div 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/80 transition select-none"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 bg-gradient-to-tr from-teal-600 to-emerald-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-teal-600/20 shrink-0">
              <PiggyBank size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-teal-700 bg-teal-50 px-2 py-0.5 rounded uppercase">
                  ESTRATEGIA $120
                </span>
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full"></span>
                <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">
                  REGLA 80/20
                </span>
              </div>
              <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight mt-0.5 flex items-center gap-2">
                Control de Ganancias & Reposición ($120)
              </h3>
            </div>
          </div>

          {/* Quick Summary Pill & Expand Toggle */}
          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Mini resumen en barra comprimida */}
            <div className="flex items-center gap-2 bg-slate-100/90 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <span className="text-slate-400 text-[10px] uppercase font-black">Pote:</span>
              <span className="text-teal-700 font-black">${replenishmentPot.toFixed(2)}</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-500 text-[11px]">${targetOrderBudget}</span>
              {isGoalReached && (
                <span className="bg-emerald-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded">¡LISTO!</span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-xs font-black text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-xl transition">
              <span>{isExpanded ? 'Comprimir' : 'Abrir Panel'}</span>
              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
        </div>

        {/* Contenido Detallado Expandible */}
        {isExpanded && (
          <div className="p-6 md:p-8 pt-2 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Botones de acción superior */}
            <div className="flex items-center justify-end gap-2 pb-5 mb-2 flex-wrap">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowGrowthSimulator(!showGrowthSimulator);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-xs rounded-xl transition active:scale-95"
              >
                <Calculator size={14} className="text-teal-600" />
                <span>Simular Metas</span>
                {showGrowthSimulator ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowOptimizerModal(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-xs rounded-xl shadow-md shadow-teal-600/20 transition active:scale-95"
              >
                <ShoppingBag size={14} />
                <span>Armar Pedido $120</span>
              </button>
            </div>

            {/* Sección 1: Desglose Diario en Vivo (Regla 80/20) */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                  <span className="text-xs font-black text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                    <Sparkles size={14} className="text-teal-600" />
                    Venta del Día & División Inteligente
                  </span>
                  <p className="text-xs text-slate-400 font-medium">
                    De cada venta, separa automáticamente tu ganancia personal intocable y el fondo para pagar a las distribuidoras.
                  </p>
                </div>

                {/* Input para ajustar venta del día y porcentaje */}
                <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                  <div className="flex items-center bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-xl">
                    <span className="text-[10px] font-black text-slate-400 mr-1.5 uppercase">Retiro:</span>
                    {[15, 20, 25].map(pct => (
                      <button
                        key={pct}
                        onClick={(e) => {
                          e.stopPropagation();
                          setProfitPct(pct);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-black transition ${profitPct === pct ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
                    <span className="text-xs font-black text-slate-400 mr-1">$</span>
                    <input
                      type="number"
                      placeholder={todaySales > 0 ? todaySales.toFixed(2) : "25.00"}
                      value={customTodaySales}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setCustomTodaySales(e.target.value)}
                      className="w-16 bg-transparent text-xs font-black text-slate-800 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Tarjetas de División Diaria */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Tarjeta 1: Total del Día */}
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                      Venta Diaria Registrada
                    </span>
                    <p className="text-2xl font-black text-slate-800 tracking-tight mt-1">
                      ${activeDailySales.toFixed(2)}
                    </p>
                  </div>
                  <div className="mt-3 text-[10px] text-slate-400 font-medium">
                    {todaySales > 0 && customTodaySales === '' ? (
                      <span className="text-teal-600 font-bold flex items-center gap-1">
                        <Clock size={11} />
                        Sincronizado en vivo con POS
                      </span>
                    ) : (
                      <span>Modo interactivo manual</span>
                    )}
                  </div>
                </div>

                {/* Tarjeta 2: Ganancia Personal a Retirar (20%) */}
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-5 rounded-2xl border border-emerald-200/80 flex flex-col justify-between relative overflow-hidden">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">
                        Tu Ganancia de Hoy (20%)
                      </span>
                      <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                        AL BOLSILLO
                      </span>
                    </div>
                    <p className="text-3xl font-black text-emerald-700 tracking-tight mt-1">
                      ${todayLiquidProfit.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-emerald-800 font-bold mt-0.5">
                      Dinero intocable para ti
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-[10px] text-emerald-900 font-medium">
                    No se gasta en reponer medicina.
                  </div>
                </div>

                {/* Tarjeta 3: Fondo para Distribuidoras (80%) */}
                <div className="bg-gradient-to-br from-blue-50 to-slate-50 p-5 rounded-2xl border border-blue-200/80 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-800 uppercase tracking-widest">
                        Fondo Reposición (80%)
                      </span>
                      <span className="bg-blue-600 text-white text-[9px] font-black px-2 py-0.5 rounded-md">
                        DIFARE / FARMA
                      </span>
                    </div>
                    <p className="text-3xl font-black text-blue-700 tracking-tight mt-1">
                      ${todayReplenishmentFund.toFixed(2)}
                    </p>
                    <p className="text-[11px] text-blue-800 font-bold mt-0.5">
                      Para acumular a la meta de $120
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-blue-200/60 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToPot(todayReplenishmentFund, todayLiquidProfit);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-black py-1.5 px-3 rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      {justSaved ? (
                        <>
                          <Check size={13} className="text-emerald-300" />
                          <span>¡Guardado con éxito!</span>
                        </>
                      ) : (
                        <>
                          <Wallet size={13} />
                          <span>Acumular Día al Fondo</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* Sección 2: Termómetro de la Meta de $120 */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-tight">
                      Termómetro del Pedido a Distribuidoras
                    </span>
                    {isGoalReached ? (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        ¡Meta de $120 Lista!
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Faltan ${remainingForOrder.toFixed(2)}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Acumula el 80% de tus ventas aquí hasta llegar a $120. Cuando llegues, haz el pedido exacto.
                  </p>
                </div>

                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 mb-1">
                    {[80, 120, 160].map(b => (
                      <button
                        key={b}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTargetOrderBudget(b);
                        }}
                        className={`px-1.5 py-0.5 rounded text-[9px] font-black transition ${targetOrderBudget === b ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        ${b}
                      </button>
                    ))}
                  </div>
                  <div>
                    <span className="text-2xl font-black text-slate-800">
                      ${replenishmentPot.toFixed(2)}
                    </span>
                    <span className="text-xs text-slate-400 font-bold"> / ${targetOrderBudget.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Barra de Progreso */}
              <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200/60 relative">
                <div
                  className={`h-full rounded-full transition-all duration-700 flex items-center justify-end pr-2 text-[9px] font-black text-white ${
                    isGoalReached 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-md shadow-emerald-500/20' 
                      : 'bg-gradient-to-r from-blue-500 to-teal-500'
                  }`}
                  style={{ width: `${Math.max(5, progressPercent)}%` }}
                >
                  {progressPercent > 15 && `${progressPercent}%`}
                </div>
              </div>

              {/* Alertas y Acciones de la Meta */}
              <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex items-center gap-2.5">
                  {isGoalReached ? (
                    <div className="h-8 w-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                      <ShieldCheck size={18} />
                    </div>
                  ) : (
                    <div className="h-8 w-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                      <AlertCircle size={18} />
                    </div>
                  )}
                  <div className="text-xs">
                    {isGoalReached ? (
                      <p className="font-black text-emerald-900">
                        ¡Tienes el dinero completo para tu pedido! Paga los $120 a Difare sin tocar tus ahorros.
                      </p>
                    ) : (
                      <p className="text-slate-600 font-medium">
                        Sigue acumulando. Con tus ventas de hoy sumas <strong>+${todayReplenishmentFund.toFixed(2)}</strong> al pote.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowOptimizerModal(true);
                    }}
                    className="flex-1 sm:flex-none px-3 py-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-black text-slate-700 transition"
                  >
                    Ver Lista Sugerida
                  </button>

                  {isGoalReached && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMarkOrderDone();
                      }}
                      className="flex-1 sm:flex-none px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <RotateCcw size={12} />
                      <span>Marcar Pedido Pagado ($120)</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Sección 3: Resumen de Ahorros Personales Acumulados */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-black text-slate-700">Ahorros Personales en Bolsillo (Total acumulado):</span>
                <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-sm">
                  ${totalSavedInPocket.toFixed(2)}
                </span>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm('¿Deseas reiniciar el contador de ahorros personales?')) {
                    setTotalSavedInPocket(0);
                  }
                }}
                className="text-[10px] text-slate-400 hover:text-slate-600 underline text-left sm:text-right"
              >
                Reiniciar contador de ahorros
              </button>
            </div>

          </div>
        )}

      </div>

      {/* Simulador de Crecimiento Desplegable */}
      {showGrowthSimulator && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300">
          <GrowthSimulatorCard currentDailySales={activeDailySales} />
        </div>
      )}

      {/* Modal de Optimización de Pedido de $120 */}
      <ReplenishmentOptimizerModal
        isOpen={showOptimizerModal}
        onClose={() => setShowOptimizerModal(false)}
        products={products}
        orders={orders}
        targetBudget={targetOrderBudget}
      />

    </div>
  );
};

export default ProfitReplenishmentWidget;
