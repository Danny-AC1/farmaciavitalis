
import React, { useEffect, useState } from 'react';
import { User, Subscription, Product } from '../types';
import { streamUserSubscriptions, deleteSubscriptionDB, updateSubscriptionDB } from '../services/db';
import { X, RefreshCw, Calendar, Trash2, CheckCircle, Pause, Play, Package } from 'lucide-react';

interface UserSubscriptionsModalProps {
  user: User;
  products: Product[];
  onClose: () => void;
}

const UserSubscriptionsModal: React.FC<UserSubscriptionsModalProps> = ({ user, products, onClose }) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user.email) return;
    
    const unsub = streamUserSubscriptions(user.email, (data) => {
      setSubscriptions(data);
      setLoading(false);
    });
    
    return () => unsub();
  }, [user.email]);

  const handleToggleActive = async (sub: Subscription) => {
    try {
      await updateSubscriptionDB(sub.id, { active: !sub.active });
    } catch (error) {
      alert("Error al actualizar la suscripción.");
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas cancelar esta suscripción permanente? Dejarás de recibir el producto automáticamente.")) {
      try {
        await deleteSubscriptionDB(id);
      } catch (error) {
        alert("Error al eliminar la suscripción.");
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden border border-white/20">
        
        {/* Header */}
        <div className="bg-teal-600 p-8 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-8 -translate-y-8">
                <RefreshCw size={140} />
            </div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <h3 className="font-black text-2xl flex items-center gap-2 uppercase tracking-tighter">
                        Mis Suscripciones
                    </h3>
                    <p className="text-teal-100 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Entregas recurrentes Vitalis</p>
                </div>
                <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-all active:scale-90"><X size={24}/></button>
            </div>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-slate-50 no-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <RefreshCw size={40} className="text-teal-500 animate-spin" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando tus planes...</p>
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200 mx-2">
              <Package className="h-16 w-16 text-slate-100 mx-auto mb-4"/>
              <p className="text-slate-400 font-black uppercase text-xs tracking-widest">No tienes suscripciones activas</p>
              <p className="text-[10px] text-slate-300 font-bold uppercase mt-2 px-8">
                Suscríbete a tus productos frecuentes desde el catálogo para recibirlos automáticamente cada mes.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {subscriptions.map(sub => {
                const product = products.find(p => p.id === sub.productId);
                return (
                  <div key={sub.id} className={`bg-white rounded-[2rem] p-6 border transition-all ${sub.active ? 'border-slate-100 shadow-sm' : 'border-slate-200 opacity-70 grayscale'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4 items-center">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl p-2 flex items-center justify-center border border-slate-100">
                          {product ? (
                            <img src={product.image} alt={sub.productName} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                          ) : (
                            <Package className="text-slate-300" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-black text-slate-800 uppercase tracking-tight leading-tight">{sub.productName}</h4>
                          <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest">Cada {sub.frequencyDays} días</span>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${sub.active ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
                        {sub.active ? 'Activa' : 'Pausada'}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <Calendar size={10}/> Próxima Entrega
                        </p>
                        <p className="text-xs font-bold text-slate-700">{formatDate(sub.nextDelivery)}</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                          <RefreshCw size={10}/> Frecuencia
                        </p>
                        <p className="text-xs font-bold text-slate-700">Mensual</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleToggleActive(sub)}
                        className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 border-2 ${
                          sub.active 
                          ? 'border-slate-200 text-slate-600 hover:bg-slate-50' 
                          : 'border-teal-600 text-teal-700 hover:bg-teal-50'
                        }`}
                      >
                        {sub.active ? <><Pause size={14}/> Pausar</> : <><Play size={14}/> Reanudar</>}
                      </button>
                      <button 
                        onClick={() => handleDelete(sub.id)}
                        className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all border border-red-100"
                        title="Cancelar Suscripción"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-white border-t border-slate-100 shrink-0">
          <div className="flex items-start gap-3 bg-teal-50/50 p-4 rounded-2xl border border-teal-100">
            <CheckCircle className="text-teal-600 shrink-0" size={18}/>
            <p className="text-[9px] font-bold text-teal-800 leading-relaxed uppercase">
              Las suscripciones te garantizan stock de tus medicamentos críticos y te ahorran tiempo. El pago se coordina al momento de la entrega.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSubscriptionsModal;
