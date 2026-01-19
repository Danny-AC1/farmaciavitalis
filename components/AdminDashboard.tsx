
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LayoutDashboard, DollarSign, Wallet, ShoppingCart, TrendingUp, Package, Sparkles, Clock } from 'lucide-react';
import { Order, Product, Expense } from '../types';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  expenses: Expense[];
  reportPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  setReportPeriod: (p: any) => void;
  chartData: { name: string, ventas: number }[];
  netProfit: number;
  totalRevenue: number;
  profitableProducts: { name: string, profit: number, quantity: number }[];
  topCategory?: string;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, products, reportPeriod, setReportPeriod, chartData, netProfit, totalRevenue, profitableProducts, topCategory 
}) => {
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const potentialRevenue = orders.filter(o => o.status !== 'DELIVERED').reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
          <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20">
                  <LayoutDashboard className="text-white" size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Panel de Control</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Resumen General de Vitalis</p>
              </div>
          </div>

          <div className="flex items-center bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm">
              <span className="px-3 text-[10px] font-black text-slate-400 uppercase">Periodo:</span>
              <select 
                className="bg-slate-50 border-none rounded-xl text-xs font-bold p-2 pr-8 text-teal-700 outline-none focus:ring-2 focus:ring-teal-500" 
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-4">
                  <DollarSign size={24} />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ingresos Brutos</span>
              <p className="text-2xl font-black text-slate-800 mt-1">${totalRevenue.toFixed(2)}</p>
              {potentialRevenue > 0 && (
                <p className="text-[10px] text-orange-500 font-bold mt-1 flex items-center gap-1">
                    <Clock size={10}/> +${potentialRevenue.toFixed(2)} por cobrar
                </p>
              )}
          </div>

          <div className="bg-emerald-600 p-6 rounded-[2rem] shadow-lg shadow-emerald-600/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                  <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 backdrop-blur-md">
                      <TrendingUp size={24} />
                  </div>
                  <span className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Utilidad Neta Real</span>
                  <p className="text-2xl font-black mt-1">${netProfit.toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-100/60 mt-2">Deducidos gastos y costos de compra</p>
              </div>
              <Wallet size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <Package size={24} />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ítems Registrados</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{products.length} Productos</p>
          </div>

          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                  <ShoppingCart size={24} />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Órdenes Totales</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{totalOrdersCount} <span className="text-xs font-bold text-orange-500 ml-1">({pendingOrders} ⏳)</span></p>
          </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                  <div className="h-2 w-2 bg-teal-500 rounded-full"></div>
                  <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Historial de Ventas</h3>
              </div>
              <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      <div className="h-2 w-2 bg-teal-600 rounded-full"></div> Total Periodo
                  </span>
              </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
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

              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-tight">
                        <TrendingUp size={16} className="text-teal-600"/> Top Rentabilidad
                      </h4>
                  </div>
                  
                  <div className="space-y-3 flex-grow overflow-y-auto no-scrollbar max-h-[250px]">
                      {profitableProducts.length === 0 ? (
                        <div className="py-10 text-center space-y-2 opacity-40">
                            <Package size={32} className="mx-auto text-slate-300" />
                            <p className="text-[10px] text-slate-400 font-black uppercase">Sin ventas procesadas (Entregadas)</p>
                            <p className="text-[8px] text-slate-400 font-medium px-4">Marca tus pedidos como entregados para ver su rentabilidad aquí.</p>
                        </div>
                      ) : (
                        profitableProducts.map((p, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-teal-300 transition-colors animate-in fade-in slide-in-from-right-2" style={{ animationDelay: `${idx * 100}ms` }}>
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
                  
                  <div className="mt-6 p-5 bg-slate-900 rounded-[1.5rem] text-white relative overflow-hidden group shadow-lg">
                      <div className="relative z-10">
                          <p className="text-[9px] font-black uppercase text-teal-400 tracking-[0.2em] mb-2 flex items-center gap-1">
                            <Sparkles size={10}/> IA Insight Vitalis
                          </p>
                          <p className="text-xs font-bold leading-relaxed">
                            {profitableProducts.length > 0 
                                ? `La categoría de "${topCategory}" ha sido la más demandada. Considera reponer stock pronto.` 
                                : pendingOrders > 0 
                                    ? `Tienes ${pendingOrders} compras nuevas sin entregar. Procésalas para ver datos de rentabilidad.`
                                    : "Aún no hay suficientes datos para generar sugerencias comerciales."}
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
