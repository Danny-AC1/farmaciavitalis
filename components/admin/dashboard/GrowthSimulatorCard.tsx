import React, { useState } from 'react';
import { TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface GrowthSimulatorCardProps {
  currentDailySales?: number;
}

export const GrowthSimulatorCard: React.FC<GrowthSimulatorCardProps> = ({
  currentDailySales = 20
}) => {
  const [dailySalesInput, setDailySalesInput] = useState<number>(currentDailySales);
  const [profitPct, setProfitPct] = useState<number>(20); // 20% retiro de ganancia líquida

  const monthlySales = dailySalesInput * 30;
  const monthlyLiquidProfit = (monthlySales * profitPct) / 100;
  const monthlyReplenishmentFund = monthlySales - monthlyLiquidProfit;
  const ordersPerMonth = monthlyReplenishmentFund / 120; // Cuántos pedidos de $120 se pueden hacer al mes

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-teal-950 p-6 md:p-8 rounded-[2.5rem] text-white border border-slate-800 shadow-xl relative overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 bg-teal-500/20 border border-teal-500/30 text-teal-400 rounded-2xl flex items-center justify-center">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black tracking-widest text-teal-400 uppercase">PROYECCIÓN INTELIGENTE</span>
              <span className="h-1.5 w-1.5 bg-emerald-400 rounded-full"></span>
              <span className="text-[9px] font-black tracking-widest text-slate-400 uppercase">CRECIMIENTO</span>
            </div>
            <h3 className="text-lg font-black text-white tracking-tight mt-0.5">
              Simulador de Ganancia Mensual & Metas
            </h3>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10">
          {[15, 25, 45, 75].map((val) => (
            <button
              key={val}
              onClick={() => setDailySalesInput(val)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                dailySalesInput === val 
                  ? 'bg-teal-500 text-slate-950 shadow-md' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              ${val}/día
            </button>
          ))}
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Sliders and Controls (5 Cols) */}
        <div className="md:col-span-5 space-y-4 bg-white/5 p-4 rounded-2xl border border-white/5">
          <div>
            <div className="flex justify-between text-xs font-black uppercase text-slate-300 mb-1.5">
              <span>Venta Diaria Promedio</span>
              <span className="text-teal-400 text-sm font-black">${dailySalesInput}.00 / día</span>
            </div>
            <input
              type="range"
              min="10"
              max="150"
              step="5"
              value={dailySalesInput}
              onChange={(e) => setDailySalesInput(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-1">
              <span>$10 (Inicial)</span>
              <span>$50 (Objetivo)</span>
              <span>$150+ (Consolidado)</span>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-black uppercase text-slate-300 mb-1.5">
              <span>Retiro de Ganancia</span>
              <span className="text-emerald-400 text-sm font-black">{profitPct}% ({((dailySalesInput * profitPct) / 100).toFixed(2)}/día)</span>
            </div>
            <input
              type="range"
              min="10"
              max="35"
              step="5"
              value={profitPct}
              onChange={(e) => setProfitPct(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[9px] text-slate-500 font-bold mt-1">
              <span>10% (Reinversión máx)</span>
              <span>20% (Recomendado)</span>
              <span>35% (Margen total)</span>
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center gap-1.5 text-teal-300 font-bold">
              <Sparkles size={12} />
              <span>Con esta venta mensual mueves <strong>${monthlySales.toFixed(2)}</strong></span>
            </div>
            <p>Puedes ejecutar aprox. <strong>{ordersPerMonth.toFixed(1)} pedidos</strong> de $120 a distribuidoras al mes.</p>
          </div>
        </div>

        {/* Big Outcome Cards (7 Cols) */}
        <div className="md:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Card A: Ganancia Neta Mensual Retirable */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-800 p-5 rounded-2xl shadow-lg border border-emerald-500/30 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100/90">
                  Tu Ganancia en Bolsillo
                </span>
                <span className="bg-emerald-950/40 text-emerald-200 text-[9px] font-black px-2 py-0.5 rounded">
                  AL MES
                </span>
              </div>
              <p className="text-3xl font-black tracking-tight text-white">
                ${monthlyLiquidProfit.toFixed(2)}
              </p>
              <p className="text-[11px] text-emerald-100 font-bold mt-1">
                ${((dailySalesInput * profitPct) / 100).toFixed(2)} de ahorro intocable cada día
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-white/15 text-[10px] text-emerald-100/90 font-medium">
              Dinero 100% libre para tus gastos o ahorros personales sin tocar la farmacia.
            </div>
          </div>

          {/* Card B: Fondo Total para Compras */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Fondo Reposición
                </span>
                <span className="bg-teal-500/10 text-teal-400 text-[9px] font-black px-2 py-0.5 rounded">
                  PROVEEDORES
                </span>
              </div>
              <p className="text-3xl font-black tracking-tight text-teal-300">
                ${monthlyReplenishmentFund.toFixed(2)}
              </p>
              <p className="text-[11px] text-slate-400 font-bold mt-1">
                ${((dailySalesInput * (100 - profitPct)) / 100).toFixed(2)} diarios para recompras
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[10px] text-slate-400 font-medium flex items-center justify-between">
              <span>Pedidos de $120:</span>
              <span className="text-white font-black">{Math.floor(ordersPerMonth)} pedidos/mes</span>
            </div>
          </div>

        </div>

      </div>

      {/* Actionable Tips Footer */}
      <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="flex items-start gap-2 text-slate-300">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
          <span><strong>Venta Cruzada:</strong> Ofrece Omeprazol con cada antibiótico (+ $1.50 ticket).</span>
        </div>
        <div className="flex items-start gap-2 text-slate-300">
          <CheckCircle2 size={16} className="text-teal-400 shrink-0 mt-0.5" />
          <span><strong>Combos en POS:</strong> Usa los combos de gripe y dolor para pasar de $1.50 a $4.50.</span>
        </div>
        <div className="flex items-start gap-2 text-slate-300">
          <CheckCircle2 size={16} className="text-blue-400 shrink-0 mt-0.5" />
          <span><strong>Disciplina $120:</strong> Paga el pedido solo con el fondo azul, jamás con tus ahorros.</span>
        </div>
      </div>

    </div>
  );
};

export default GrowthSimulatorCard;
