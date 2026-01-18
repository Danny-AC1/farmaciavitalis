
import React from 'react';
import { Subscription } from '../types';
import { RefreshCw, User, Calendar, Trash2 } from 'lucide-react';

interface AdminSubscriptionsProps {
  subscriptions: Subscription[];
  onDelete: (id: string) => Promise<void>;
}

const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ subscriptions, onDelete }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
          <RefreshCw size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Suscripciones Recurrentes</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pedidos automáticos programados por clientes</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Frecuencia</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Próxima Entrega</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {subscriptions.map(sub => (
                <tr key={sub.id} className="hover:bg-teal-50/20 transition group">
                  <td className="px-6 py-5 font-bold text-sm text-slate-700">
                    <div className="flex items-center gap-2">
                        <User size={14} className="text-teal-500" /> {sub.userId}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black text-slate-800 text-sm uppercase">{sub.productName}</span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase">Cada {sub.frequencyDays} días</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                        <Calendar size={14}/> {new Date(sub.nextDelivery).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                        onClick={() => { if(confirm('¿Cancelar esta suscripción?')) onDelete(sub.id); }}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                        <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
              {subscriptions.length === 0 && (
                <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                        <RefreshCw size={40} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay suscripciones activas</p>
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

export default AdminSubscriptions;
