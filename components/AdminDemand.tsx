
import React from 'react';
import { SearchLog } from '../types';
import { TrendingUp, Clock, BarChart3 } from 'lucide-react';

const AdminDemand: React.FC<{logs: SearchLog[]}> = ({ logs }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3 mb-6">
          <div className="bg-teal-100 p-3 rounded-2xl text-teal-600"><TrendingUp/></div>
          <div>
              <h2 className="text-2xl font-bold text-gray-800">Demanda Insatisfecha</h2>
              <p className="text-sm text-gray-500">Productos buscados que no dieron resultados.</p>
          </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {logs.map(log => (
            <div key={log.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between group hover:border-teal-200 transition">
                <div>
                    <h4 className="text-lg font-black text-gray-800 uppercase group-hover:text-teal-600 transition">{log.term}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Clock size={12}/> Último: {new Date(log.date).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-black text-teal-700">{log.count}</span>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Búsquedas</p>
                </div>
            </div>
          ))}
          {logs.length === 0 && (
              <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-200 text-center text-gray-400 font-bold">
                  <BarChart3 size={48} className="mx-auto mb-4 opacity-10" />
                  No se han registrado búsquedas fallidas todavía.
              </div>
          )}
      </div>
    </div>
  );
};

export default AdminDemand;
