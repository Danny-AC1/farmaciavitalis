
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { LayoutDashboard, DollarSign, Wallet, ShoppingCart, TrendingUp, Package } from 'lucide-react';
import { Order, Product, Expense } from '../types';

interface AdminDashboardProps {
  orders: Order[];
  products: Product[];
  expenses: Expense[];
  reportPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  setReportPeriod: (p: any) => void;
  chartData: any[];
  netProfit: number;
  totalRevenue: number;
  profitableProducts: any[];
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  orders, products, expenses, reportPeriod, setReportPeriod, chartData, netProfit, totalRevenue, profitableProducts 
}) => {
  // Calculamos pedidos totales para usar la prop 'orders'
  const totalOrdersCount = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;

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
                  <option value="daily">Hoy</option>
                  <option value="weekly">Esta Semana</option>
                  <option value="monthly">Este Mes</option>
                  <option value="yearly">Este Año</option>
              </select>
          </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Ingresos */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-4">
                  <DollarSign size={24} />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ingresos Totales</span>
              <p className="text-2xl font-black text-slate-800 mt-1">${totalRevenue.toFixed(2)}</p>
          </div>

          {/* Utilidad Real */}
          <div className="bg-emerald-600 p-6 rounded-[2rem] shadow-lg shadow-emerald-600/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                  <div className="h-12 w-12 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 backdrop-blur-md">
                      <TrendingUp size={24} />
                  </div>
                  <span className="text-emerald-100 text-[10px] font-bold uppercase tracking-widest">Utilidad Neta</span>
                  <p className="text-2xl font-black mt-1">${netProfit.toFixed(2)}</p>
                  <p className="text-[10px] text-emerald-100/60 mt-2">Gastos totales: ${expenses.reduce((a,b)=>a+b.amount, 0).toFixed(2)}</p>
              </div>
              <Wallet size={120} className="absolute -right-8 -bottom-8 opacity-10 rotate-12" />
          </div>

          {/* Inventario (Uso de prop products) */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-4">
                  <Package size={24} />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Catálogo Activo</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{products.length} Productos</p>
          </div>

          {/* Pedidos (Uso de prop orders) */}
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
              <div className="h-12 w-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-4">
                  <ShoppingCart size={24} />
              </div>
              <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Ventas Totales</span>
              <p className="text-2xl font-black text-slate-800 mt-1">{totalOrdersCount} <span className="text-xs font-bold text-orange-500 ml-1">({pendingOrders} pendientes)</span></p>
          </div>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
          <div className="flex items-center gap-2 mb-8">
              <div className="h-2 w-2 bg-teal-500 rounded-full"></div>
              <h3 className="font-black text-slate-800 text-lg">Historial de Ventas</h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
              <div className="lg:col-span-2 h-[350px] w-full">
                  {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                              dataKey="name" 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} 
                              dy={15} 
                            />
                            <YAxis 
                              axisLine={false} 
                              tickLine={false} 
                              tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 'bold'}} 
                            />
                            <Tooltip 
                              cursor={{fill: '#f8fafc'}} 
                              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px'}} 
                            />
                            <Bar dataKey="ventas" fill="#0d9488" radius={[6, 6, 0, 0]} name="Ventas ($)" barSize={45} />
                        </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-3 border-2 border-dashed border-slate-100 rounded-3xl">
                        <TrendingUp size={48} className="opacity-20" />
                        <p className="font-bold text-sm">Sin datos suficientes para el gráfico</p>
                    </div>
                  )}
              </div>

              <div className="bg-slate-50 rounded-[2rem] p-6 border border-slate-100">
                  <div className="flex items-center justify-between mb-6">
                      <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                        <TrendingUp size={16} className="text-teal-600"/> Top Rentabilidad
                      </h4>
                      <span className="text-[10px] bg-white px-2 py-1 rounded-lg text-slate-400 font-bold border border-slate-200 uppercase">Utilidad</span>
                  </div>
                  
                  <div className="space-y-4">
                      {profitableProducts.length === 0 ? (
                        <div className="py-10 text-center space-y-2">
                            <Package size={32} className="mx-auto text-slate-200" />
                            <p className="text-[10px] text-slate-400 font-bold uppercase">No hay ventas registradas</p>
                        </div>
                      ) : (
                        profitableProducts.map((p, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex justify-between items-center group hover:border-teal-300 transition-colors">
                              <div className="flex-1 min-w-0 pr-4">
                                  <p className="font-black text-slate-800 text-sm truncate uppercase tracking-tight">{p.name}</p>
                                  <p className="text-[10px] text-slate-400 font-bold">{p.quantity} Unidades vendidas</p>
                              </div>
                              <div className="text-right">
                                   <p className="font-black text-emerald-600 text-base">+${p.profit.toFixed(2)}</p>
                              </div>
                          </div>
                        ))
                      )}
                  </div>
                  
                  <div className="mt-8 p-4 bg-teal-600 rounded-2xl text-white">
                      <p className="text-[10px] font-bold uppercase opacity-80 mb-1">Dato del día</p>
                      <p className="text-xs font-bold leading-snug">Los productos de la categoría "Vitaminas" están rindiendo un 15% más este periodo.</p>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
