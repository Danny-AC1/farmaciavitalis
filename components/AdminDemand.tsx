
import React, { useMemo } from 'react';
import { SearchLog } from '../types';
// Fixed typo in lucide-react import: change mousePointer2 to MousePointer2
import { TrendingUp, BarChart3, Trash2, Calendar, Search, AlertCircle} from 'lucide-react';

interface AdminDemandProps {
  logs: SearchLog[];
  onDeleteLog: (id: string) => Promise<void>;
}

const AdminDemand: React.FC<AdminDemandProps> = ({ logs, onDeleteLog }) => {
  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [logs]);

  const totalSearches = useMemo(() => logs.reduce((acc, l) => acc + l.count, 0), [logs]);

  const getDemandColor = (count: number) => {
    if (count >= 10) return 'bg-red-50 text-red-600 border-red-100';
    if (count >= 5) return 'bg-orange-50 text-orange-600 border-orange-100';
    return 'bg-blue-50 text-blue-600 border-blue-100';
  };

  const getDemandBadge = (count: number) => {
    if (count >= 10) return 'ALTA DEMANDA';
    if (count >= 5) return 'FRECUENTE';
    return 'OCASIONAL';
  };

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                  <TrendingUp size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Demandas Insatisfechas</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Lo que tus clientes buscan y no encuentran</p>
              </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
              <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r pr-3">Términos Únicos</span>
                  <span className="text-lg font-black text-teal-700 leading-none">{logs.length}</span>
              </div>
              <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-r pr-3">Volumen Total</span>
                  <span className="text-lg font-black text-blue-700 leading-none">{totalSearches} <span className="text-[10px] text-slate-400 font-bold uppercase">BÚSQUEDAS</span></span>
              </div>
          </div>
      </div>

      {/* Tarjeta de Resumen IA */}
      <div className="bg-slate-900 rounded-[2rem] p-6 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10 max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                  <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-teal-400">Inteligencia de Inventario</h4>
              </div>
              <p className="text-sm font-medium leading-relaxed text-slate-300">
                  Has tenido un total de <strong>{totalSearches}</strong> búsquedas que no devolvieron resultados. 
                  Representan oportunidades de venta perdidas que puedes recuperar agregando estos productos a tu catálogo.
              </p>
          </div>
          <BarChart3 size={150} className="absolute -right-8 -bottom-8 opacity-5 rotate-12" />
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Término Buscado</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Intensidad</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Última Petición</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {sortedLogs.map(log => (
                <tr key={log.id} className="hover:bg-teal-50/20 transition group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black shadow-inner">
                        <Search size={18}/>
                      </div>
                      <span className="font-black text-slate-800 text-base uppercase tracking-tight">{log.term}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border ${getDemandColor(log.count)}`}>
                      <span className="font-black text-sm">{log.count}</span>
                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-70">{getDemandBadge(log.count)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold uppercase">
                      <Calendar size={14} className="text-teal-500"/> {new Date(log.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={() => { if(confirm('¿Deseas eliminar este registro de demanda?')) onDeleteLog(log.id); }}
                      className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Eliminar de la lista"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                        <div className="h-20 w-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto shadow-inner">
                            <AlertCircle size={40} className="text-slate-200" />
                        </div>
                        <div>
                            <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin registros pendientes</p>
                            <p className="text-xs text-slate-300 font-bold mt-1">Tus clientes han encontrado todo lo que buscan por ahora.</p>
                        </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDemand;
