
import React from 'react';
import { Subscription } from '../types';
import { RefreshCw, User, Calendar, Trash2, Truck, AlertCircle} from 'lucide-react';

interface AdminSubscriptionsProps {
  subscriptions: Subscription[];
  onProcess: (sub: Subscription) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AdminSubscriptions: React.FC<AdminSubscriptionsProps> = ({ subscriptions, onProcess, onDelete }) => {
  const isOverdue = (date: string) => new Date(date) < new Date();

  return (
    <div className="space-y-6 animate-in fade-in pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
            <RefreshCw size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Suscripciones Recurrentes</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Planificación de entregas programadas</p>
          </div>
        </div>
        
        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black text-slate-400 uppercase">Por Procesar: {subscriptions.filter(s => isOverdue(s.nextDelivery)).length}</span>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {subscriptions.length === 0 ? (
          <div className="py-20 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center">
             <RefreshCw size={48} className="text-slate-100 mb-4" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-sm">Sin suscripciones activas</p>
             <p className="text-slate-300 text-xs mt-1 uppercase">Los clientes que se suscriban a productos aparecerán aquí.</p>
          </div>
        ) : (
          subscriptions.map(sub => {
            const overdue = isOverdue(sub.nextDelivery);
            return (
              <div key={sub.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-6 items-center relative overflow-hidden group">
                {overdue && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>}
                {!overdue && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-500"></div>}
                
                <div className="flex-1 min-w-0 w-full md:w-auto">
                   <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${overdue ? 'bg-red-50 text-red-600' : 'bg-teal-50 text-teal-700'}`}>
                         {overdue ? 'ENTREGA VENCIDA' : 'PROGRAMADA'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">• CADA {sub.frequencyDays} DÍAS</span>
                   </div>
                   
                   <h4 className="text-xl font-black text-slate-900 uppercase truncate mb-1">{sub.productName}</h4>
                   
                   <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-bold">
                        <User size={14} className="text-teal-500"/> {sub.userId}
                      </div>
                      <div className={`flex items-center gap-1.5 text-xs font-black ${overdue ? 'text-red-500' : 'text-slate-500'}`}>
                        <Calendar size={14}/> {overdue ? 'DEBIÓ ENTREGARSE:' : 'PRÓXIMA:'} {new Date(sub.nextDelivery).toLocaleDateString()}
                      </div>
                   </div>
                </div>

                <div className="shrink-0 flex gap-2 w-full md:w-auto border-t md:border-t-0 md:border-l border-slate-50 pt-4 md:pt-0 md:pl-6">
                   <button 
                      onClick={() => onProcess(sub)}
                      className={`flex-grow md:flex-none px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${overdue ? 'bg-red-600 text-white hover:bg-red-700 shadow-red-200' : 'bg-teal-600 text-white hover:bg-teal-700 shadow-teal-200'}`}
                   >
                      <Truck size={16}/> Procesar Entrega
                   </button>
                   <button 
                      onClick={() => onDelete(sub.id)}
                      className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors border border-slate-100"
                      title="Eliminar Suscripción"
                   >
                      <Trash2 size={18}/>
                   </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100 flex items-start gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg"><AlertCircle/></div>
          <div>
            <h5 className="font-black text-blue-900 text-sm uppercase tracking-tight mb-1">¿Cómo funcionan las suscripciones?</h5>
            <p className="text-xs text-blue-700 leading-relaxed font-medium">
              Al hacer clic en <strong>"Procesar Entrega"</strong>, el sistema generará un pedido automático en la sección de "Pedidos" y actualizará la fecha de la próxima entrega sumando los días de frecuencia definidos por el cliente. No olvides contactar al cliente para coordinar el pago si es efectivo.
            </p>
          </div>
      </div>
    </div>
  );
};

export default AdminSubscriptions;
