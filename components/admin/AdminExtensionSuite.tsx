import React, { useState } from 'react';
import { ShieldCheck, Cpu, ArrowRight, Sparkles, Database, Users, Zap, Landmark, LineChart, ShoppingBag, Percent, Coins } from 'lucide-react';
import { Product, Supplier } from '../../types';
import AdminShoppingList from './AdminShoppingList';
import AdminDiscounts from './AdminDiscounts';
import AdminCredits from '../credits/AdminCredits';
import AdminTreasury from './AdminTreasury';

interface AdminExtensionSuiteProps {
  setActiveTab: (tab: string) => void;
  products: Product[];
  suppliers: Supplier[];
}

const AdminExtensionSuite: React.FC<AdminExtensionSuiteProps> = ({ setActiveTab, products, suppliers }) => {
  const [subTab, setSubTab] = useState<'hub' | 'shopping_list' | 'discounts' | 'credits' | 'treasury'>('discounts'); // Mostrar por defecto la pestaña de descuentos solicitada

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-tr from-slate-900 to-teal-800 p-3 rounded-2xl shadow-xl shadow-slate-950/20 text-white">
            <Cpu size={24} className="animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-widest bg-teal-50 px-2.5 py-1 rounded-full">Extensión del Administrador</span>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight mt-1">Suite Gerencial Pro</h2>
            <p className="text-xs text-slate-500 font-medium">Nueva extensión administrativa para monitorear y gobernar el ecosistema Vitalis.</p>
          </div>
        </div>

        <button 
          onClick={() => setActiveTab('dashboard')}
          className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 rounded-xl hover:bg-slate-50 transition-colors"
        >
          Regresar al Dashboard Anterior
        </button>
      </div>

      {/* Selector de Pestañas de la Extensión */}
      <div className="flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden border-b border-slate-200/80 -mt-2 whitespace-nowrap">
        <button
          onClick={() => setSubTab('discounts')}
          className={`px-6 py-3 text-xs font-extrabold tracking-tight border-b-2 transition-all relative flex-shrink-0 ${
            subTab === 'discounts'
              ? 'border-teal-500 text-teal-600 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Percent size={14} />
            Sistema de Descuentos
            {(() => {
              try {
                const stored = localStorage.getItem('vitalis_product_discounts');
                const count = stored ? JSON.parse(stored).length : 0;
                if (count > 0) {
                  return (
                    <span className="bg-amber-500 text-slate-900 text-[10px] px-1.5 py-0.5 rounded-full font-black font-mono">
                      {count}
                    </span>
                  );
                }
              } catch (e) {}
              return null;
            })()}
          </span>
        </button>

        <button
          onClick={() => setSubTab('shopping_list')}
          className={`px-6 py-3 text-xs font-extrabold tracking-tight border-b-2 transition-all relative flex-shrink-0 ${
            subTab === 'shopping_list'
              ? 'border-teal-500 text-teal-600 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <ShoppingBag size={14} />
            Lista de Compras (Stock Crítico)
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black font-mono">
              {products.filter(p => p.stock <= 1).length}
            </span>
          </span>
        </button>

        <button
          onClick={() => setSubTab('credits')}
          className={`px-6 py-3 text-xs font-extrabold tracking-tight border-b-2 transition-all relative flex-shrink-0 ${
            subTab === 'credits'
              ? 'border-teal-500 text-teal-600 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Coins size={14} />
            Medicamento Fiado (Créditos)
          </span>
        </button>

        <button
          onClick={() => setSubTab('treasury')}
          className={`px-6 py-3 text-xs font-extrabold tracking-tight border-b-2 transition-all relative flex-shrink-0 ${
            subTab === 'treasury'
              ? 'border-teal-500 text-teal-600 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Landmark size={14} />
            Tesorería Avanzada
          </span>
        </button>

        <button
          onClick={() => setSubTab('hub')}
          className={`px-6 py-3 text-xs font-extrabold tracking-tight border-b-2 transition-all relative flex-shrink-0 ${
            subTab === 'hub'
              ? 'border-teal-500 text-teal-600 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <span className="flex items-center gap-2">
            <Sparkles size={14} />
            Ideas y Propuestas de Módulos
          </span>
        </button>
      </div>

      {subTab === 'discounts' ? (
        /* Vista de la Funcionalidad Real: Sistema de Descuentos */
        <div className="space-y-6">
          <AdminDiscounts products={products} />
        </div>
      ) : subTab === 'shopping_list' ? (
        /* Vista de la Funcionalidad Real: Lista de Compras */
        <div className="space-y-6">
          <AdminShoppingList products={products} suppliers={suppliers} />
        </div>
      ) : subTab === 'credits' ? (
        /* Vista de la Funcionalidad Real: Medicamento Fiado / Créditos */
        <div className="space-y-6">
          <AdminCredits products={products} />
        </div>
      ) : subTab === 'treasury' ? (
        /* Vista de la Funcionalidad Real: Tesorería Avanzada */
        <div className="space-y-6">
          <AdminTreasury products={products} />
        </div>
      ) : (
        /* Vista del Catálogo de Ideas */
        <>
          {/* Banner de Estado de Integración de la Extensión */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 p-6 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
            <div className="absolute -right-16 -top-16 opacity-10 blur-2xl flex">
              <div className="h-64 w-64 bg-teal-400 rounded-full"></div>
            </div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full text-[10px] font-bold text-teal-300 tracking-wide">
                  <ShieldCheck size={12} /> ENLACE ACTIVADO Y SEGURO
                </div>
                <h3 className="text-xl font-bold tracking-tight">¡Módulo de Lista de Compras Instalado!</h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hemos agregado con éxito la pestaña "Lista de Compras" como primer módulo funcional interactivo. 
                  Explora las siguientes propuestas y decide cuál será el próximo componente exclusivo que integremos en esta Suite Gerencial.
                </p>
              </div>
              <div className="flex bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl md:self-stretch items-center justify-center">
                <div className="text-center space-y-1">
                  <span className="text-[9px] font-black tracking-widest text-teal-400 block uppercase">SISTEMA VITALIS</span>
                  <span className="text-2xl font-black block">v1.2.0-ext</span>
                  <span className="text-[10px] text-slate-400 font-bold block">100% Sincronizado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Propuestas y Próximos Módulos */}
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-black text-slate-600 uppercase tracking-wider">Ideas de Módulos para Incorporar</h4>
              <p className="text-xs text-slate-400">Selecciona o indícame cuál de estas características prefieres configurar primero en tu nueva Suite administrativa:</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Tarjeta 1 */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-4">
                  <Database size={22} />
                </div>
                <h5 className="font-bold text-slate-800 text-sm">Auditoría Extendida & Logs</h5>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Registro histórico completo de cada acción realizada por los cajeros, actualizaciones de stock, ventas canceladas, y aperturas de caja.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-indigo-600">
                  <span className="uppercase tracking-wider">Listo para implementación</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tarjeta 2 */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 mb-4">
                  <Users size={22} />
                </div>
                <h5 className="font-bold text-slate-800 text-sm">Gestión de Turnos y Personal</h5>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Monitoreo de horas de entrada/salida de farmacéuticos y repartidores, asignación de comisiones por venta y metas mensuales.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-amber-600">
                  <span className="uppercase tracking-wider">Listo para implementación</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tarjeta 3 */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-4">
                  <Landmark size={22} />
                </div>
                <h5 className="font-bold text-slate-800 text-sm">Tesorería Avanzada & Conciliación</h5>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Módulo para arqueos de caja complejos, arqueo ciego, discrepancias, reportes de depósitos bancarios, y egresos detallados.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-pink-600">
                  <span className="uppercase tracking-wider">Listo para implementación</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tarjeta 4 */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mb-4">
                  <LineChart size={22} />
                </div>
                <h5 className="font-bold text-slate-800 text-sm">Visualizador de Compras y Lotes</h5>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Reportes financieros de compras a proveedores frente a costos de venta, cálculo de margen de utilidad exacto por lote de medicamentos.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-rose-600">
                  <span className="uppercase tracking-wider">Listo para implementación</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tarjeta 5 */}
              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative group hover:shadow-md transition-shadow">
                <div className="h-12 w-12 bg-violet-50 rounded-2xl flex items-center justify-center text-violet-600 mb-4">
                  <Zap size={22} />
                </div>
                <h5 className="font-bold text-slate-800 text-sm">Acciones Masivas Rápidas</h5>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  Actualización masiva de precios por categoría, importación/exportación de inventario con excel o archivos CSV, y desactivación de productos expirados.
                </p>
                <div className="mt-4 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] font-bold text-violet-600">
                  <span className="uppercase tracking-wider">Listo para implementación</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Tarjeta 6 - Instrucción clara */}
              <div className="bg-gradient-to-br from-teal-500 to-teal-700 p-6 rounded-[2.5rem] text-white shadow-md flex flex-col justify-between">
                <div className="space-y-2">
                  <Sparkles size={28} />
                  <h5 className="font-bold text-sm">¡Tú Tienes el Control!</h5>
                  <p className="text-[11px] text-teal-100 leading-relaxed">
                    Escríbeme qué sección deseas levantar aquí. Puede ser una combinación de estas, o una idea completamentaria libre de IA.
                  </p>
                </div>
                <span className="text-[10px] font-mono opacity-80 mt-4 block">Waiting for user specs...</span>
              </div>

            </div>
          </div>
        </>
      )}

      {/* Zona Técnica del Workspace */}
      <div className="bg-slate-100/50 p-6 rounded-3xl border border-slate-200/60 no-print">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Monitor Técnico de la Extensión</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
            <span className="text-[9px] text-slate-400 font-black block uppercase">Ubicación del Archivo</span>
            <span className="text-xs font-mono font-bold text-slate-700 block mt-1">/components/</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
            <span className="text-[9px] text-slate-400 font-black block uppercase">Formato</span>
            <span className="text-xs font-mono font-bold text-slate-700 block mt-1">React + TypeScript</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
            <span className="text-[9px] text-slate-400 font-black block uppercase">Carga de Datos</span>
            <span className="text-xs font-mono font-bold text-slate-700 block mt-1">Lazy & Reactive</span>
          </div>
          <div className="bg-white p-3 rounded-2xl border border-slate-100 text-center">
            <span className="text-[9px] text-slate-400 font-black block uppercase">UI Framework</span>
            <span className="text-xs font-mono font-bold text-slate-700 block mt-1">Tailwind CSS</span>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminExtensionSuite;
