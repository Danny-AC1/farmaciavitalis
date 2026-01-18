
import React from 'react';
import { StockAlert, Product } from '../types';
import { BellRing, Mail, Package, Trash2, Calendar } from 'lucide-react';

interface AdminStockAlertsProps {
  alerts: StockAlert[];
  products: Product[];
  onDelete: (id: string) => Promise<void>;
}

const AdminStockAlerts: React.FC<AdminStockAlertsProps> = ({ alerts, products, onDelete }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3">
        <div className="bg-orange-500 p-2.5 rounded-2xl shadow-lg shadow-orange-500/20 text-white">
          <BellRing size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Alertas de Stock</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clientes esperando reposición de productos</p>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Usuario Interesado</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto Solicitado</th>
                <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fecha de Alerta</th>
                <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {alerts.map(alert => {
                const product = products.find(p => p.id === alert.productId);
                return (
                  <tr key={alert.id} className="hover:bg-orange-50/20 transition group">
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2 font-bold text-sm text-slate-700">
                            <Mail size={14} className="text-orange-500"/> {alert.email}
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                            <Package size={14} className="text-slate-400"/>
                            <span className="font-black text-slate-800 text-sm uppercase">{product?.name || 'Producto eliminado'}</span>
                        </div>
                    </td>
                    <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold">
                            <Calendar size={14}/> {new Date(alert.createdAt).toLocaleDateString()}
                        </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                        <button 
                            onClick={() => { if(confirm('¿Eliminar esta alerta?')) onDelete(alert.id); }}
                            className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={18}/>
                        </button>
                    </td>
                  </tr>
                );
              })}
              {alerts.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                        <BellRing size={40} className="mx-auto text-slate-200 mb-2" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay alertas de stock pendientes</p>
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

export default AdminStockAlerts;
