import React, { useState, useEffect } from 'react';
import { User, MedicationSchedule, Product, Subscription, FamilyMember } from '../../../types';
import { calculateRemainingDays, isRefillNeeded } from '../../../services/treatmentReminderService';
import { streamUserSubscriptions, deleteSubscriptionDB, addSubscriptionDB, updateSubscriptionDB } from '../../../services/db';
import { RefreshCw, ShoppingCart, AlertTriangle, CheckCircle, Sparkles, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

interface ContinuousRefillTabProps {
  user: User;
  medications: MedicationSchedule[];
  products: Product[];
  members: FamilyMember[];
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
}

export const ContinuousRefillTab: React.FC<ContinuousRefillTabProps> = ({
  user,
  medications,
  products,
  members,
  onAddToCart,
}) => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showNewSubModal, setShowNewSubModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [isSavingSub, setIsSavingSub] = useState(false);

  useEffect(() => {
    if (!user.email) return;
    const unsub = streamUserSubscriptions(user.email, (data) => setSubscriptions(data));
    return () => unsub();
  }, [user.email]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setIsSavingSub(true);
    try {
      await addSubscriptionDB(user.email, prod.id, prod.name, frequencyDays);
      setShowNewSubModal(false);
      setSelectedProductId('');
    } catch (err) {
      console.error("Error al crear suscripción de refill:", err);
      alert("Error al guardar la recarga programada.");
    } finally {
      setIsSavingSub(false);
    }
  };

  const handleToggleSub = async (sub: Subscription) => {
    await updateSubscriptionDB(sub.id, { active: !sub.active });
  };

  const handleDeleteSub = async (id: string) => {
    if (confirm("¿Deseas cancelar este programa de reorden programada?")) {
      await deleteSubscriptionDB(id);
    }
  };

  // Tratamientos que requieren reorden pronto (<= 5 días o sin stock)
  const urgentRefillMeds = medications.filter((m) => isRefillNeeded(m, 5));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-slate-900 to-teal-900 rounded-[2rem] p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-300 bg-amber-500/20 px-3 py-1 rounded-full inline-block mb-1 border border-amber-400/20">
            Programa de Pacientes Crónicos
          </span>
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <RefreshCw className="text-amber-400" size={24} /> Recarga Continua & Reorden 1-Clic
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Calculamos automáticamente 5 días antes de que tu tratamiento finalice para sugerirte la reorden directa.
          </p>
        </div>

        <button
          onClick={() => setShowNewSubModal(true)}
          className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase px-4 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Programar Reorden Automático
        </button>
      </div>

      {/* Sección 1: Alertas Prioritarias de Reorden (<= 5 Días) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm flex items-center gap-2">
            <AlertTriangle className="text-amber-500" size={18} /> Sugerencias de Reorden Inmediata ({urgentRefillMeds.length})
          </h4>
          <span className="text-[10px] font-bold text-slate-400 uppercase">Stock para &le; 5 días</span>
        </div>

        {urgentRefillMeds.length === 0 ? (
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 text-emerald-800 text-xs font-bold flex items-center gap-3">
            <CheckCircle className="text-emerald-600 shrink-0" size={20} />
            <span>
              ¡Excelente! Todos tus tratamientos registrados cuentan con suficiente stock para los próximos días.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentRefillMeds.map((med) => {
              const remainingDays = calculateRemainingDays(med);
              const product = products.find((p) => p.id === med.productId);
              const patient = members.find((m) => m.id === med.familyMemberId);

              return (
                <div
                  key={med.id}
                  className="bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-[2rem] p-5 border-2 border-amber-300 shadow-md flex flex-col justify-between relative overflow-hidden"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        {patient && (
                          <span className="text-[8px] font-black uppercase tracking-widest text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full inline-block mb-1">
                            Paciente: {patient.name}
                          </span>
                        )}
                        <h5 className="font-black text-slate-900 text-base uppercase tracking-tight">{med.name}</h5>
                        <p className="text-[11px] font-bold text-slate-500">{med.dose} • Cada {med.frequencyLabel}</p>
                      </div>

                      <div className="bg-amber-500 text-white font-black text-xs px-2.5 py-1 rounded-xl text-center shadow-sm">
                        <span>{remainingDays === 0 ? '¡AGOTADO!' : `~${remainingDays} DÍAS`}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium mb-4">
                      Stock actual: <strong className="text-slate-900">{med.currentStock} dosis</strong> restantes. Te sugerimos reordenar hoy para evitar interrumpir el tratamiento.
                    </p>
                  </div>

                  <div className="pt-3 border-t border-amber-200/60 flex items-center justify-between gap-2">
                    {product ? (
                      <button
                        onClick={() => onAddToCart(product, 'UNIT')}
                        className="w-full bg-amber-500 hover:bg-amber-600 text-white font-black text-xs uppercase tracking-wider py-3 rounded-xl shadow-lg shadow-amber-200 transition-all flex items-center justify-center gap-2 active:scale-95 animate-bounce"
                      >
                        <ShoppingCart size={16} /> Reordenar en 1-Clic (${product.price.toFixed(2)})
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase italic">
                        Sin producto de farmacia vinculado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sección 2: Programas de Recarga Automática Recurrente (Suscripciones) */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="font-black text-slate-800 uppercase tracking-tight text-sm flex items-center gap-2">
            <Sparkles className="text-teal-600" size={18} /> Mis Recargas Automáticas Programadas
          </h4>
          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-full">
            {subscriptions.length} Activa(s)
          </span>
        </div>

        {subscriptions.length === 0 ? (
          <p className="text-xs text-slate-400 italic">
            No tienes recargas automáticas programadas por el momento. Puedes programar que un medicamento se envíe automáticamente cada 15, 30 o 60 días.
          </p>
        ) : (
          <div className="space-y-3">
            {subscriptions.map((sub) => {
              const nextDate = new Date(sub.nextDelivery);

              return (
                <div
                  key={sub.id}
                  className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-black text-xs shrink-0">
                      <RefreshCw size={18} />
                    </div>
                    <div>
                      <h5 className="font-black text-slate-800 text-sm uppercase tracking-tight">{sub.productName}</h5>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Frecuencia: Cada {sub.frequencyDays} días • Próximo despacho: {nextDate.toLocaleDateString([], { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button
                      onClick={() => handleToggleSub(sub)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 ${
                        sub.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {sub.active ? <ToggleRight size={18} className="text-emerald-600" /> : <ToggleLeft size={18} />}
                      {sub.active ? 'Activa' : 'Pausada'}
                    </button>

                    <button
                      onClick={() => handleDeleteSub(sub.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-xl hover:bg-red-50 transition-all"
                      title="Cancelar programa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Programar Nueva Recarga Continuada */}
      {showNewSubModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h4 className="font-black text-lg uppercase tracking-tight">Programar Recarga Continuada</h4>
                <p className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Garantía de stock para tu salud
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateSubscription} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">
                  Producto de la Farmacia *
                </label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-amber-500 focus:bg-white transition-all"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">-- Seleccionar producto --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.toUpperCase()} (${p.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">
                  Frecuencia de Despacho Automático
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setFrequencyDays(days)}
                      className={`p-3 rounded-xl border text-xs font-black uppercase transition-all ${
                        frequencyDays === days
                          ? 'bg-amber-500 border-amber-500 text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      Cada {days} Días
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowNewSubModal(false)}
                  className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-black text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSub}
                  className="flex-1 bg-amber-500 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-100 hover:bg-amber-600 transition-all"
                >
                  {isSavingSub ? 'Guardando...' : 'Activar Recarga'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
