import React, { useState } from 'react';
import { User, FamilyMember, MedicationSchedule, Product } from '../../../types';
import { addMedicationDB, takeDoseDB, deleteMedicationDB } from '../../../services/db';
import { testTreatmentAlarm, calculateRemainingDays } from '../../../services/treatmentReminderService';
import { Pill, Clock, Plus, Check, Trash2, Volume2, AlertTriangle, ShoppingCart, Bell, X } from 'lucide-react';

interface TreatmentCalendarTabProps {
  user: User;
  members: FamilyMember[];
  medications: MedicationSchedule[];
  products: Product[];
  selectedMemberId?: string | null;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
}

export const TreatmentCalendarTab: React.FC<TreatmentCalendarTabProps> = ({
  user,
  members,
  medications,
  products,
  selectedMemberId: initialMemberId = null,
  onAddToCart,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(initialMemberId);
  const [showAddMedModal, setShowAddMedModal] = useState(false);

  // Form states
  const [medName, setMedName] = useState('');
  const [medStock, setMedStock] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [time1, setTime1] = useState('08:00');
  const [time2, setTime2] = useState('14:00');
  const [time3, setTime3] = useState('20:00');
  const [useMultipleTimes, setUseMultipleTimes] = useState(false);
  const [selectedMemberForNew, setSelectedMemberForNew] = useState<string>(
    initialMemberId || (members.length > 0 ? members[0].id : '')
  );
  const [selectedProductId, setSelectedProductId] = useState('');
  const [autoRefillEnabled, setAutoRefillEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setMedName('');
    setMedStock('');
    setMedDose('');
    setMedFreq('');
    setTime1('08:00');
    setTime2('14:00');
    setTime3('20:00');
    setUseMultipleTimes(false);
    setSelectedProductId('');
    setAutoRefillEnabled(true);
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMemberId = selectedMemberForNew || (members.length > 0 ? members[0].id : '');
    if (!targetMemberId || !medName.trim() || !medStock) {
      alert("Por favor completa el nombre del medicamento, el integrante y el stock inicial.");
      return;
    }

    setIsSaving(true);
    try {
      const timesOfDay = useMultipleTimes ? [time1, time2, time3].filter(Boolean) : [time1];
      await addMedicationDB({
        id: '',
        userId: user.uid,
        familyMemberId: targetMemberId,
        name: medName,
        totalStock: parseInt(medStock),
        currentStock: parseInt(medStock),
        dose: medDose || '1 dosis',
        frequencyLabel: medFreq || 'Cada 8 horas',
        timesOfDay,
        productId: selectedProductId || undefined,
        active: true,
        autoRefillEnabled,
        refillDaysBefore: 5,
      });

      setShowAddMedModal(false);
      resetForm();
    } catch (err) {
      console.error("Error al registrar tratamiento:", err);
      alert("Error al guardar el medicamento.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleTakeDose = async (med: MedicationSchedule, patientName?: string) => {
    if (med.currentStock <= 0) {
      alert("¡No queda stock de este tratamiento! Realiza una reorden de refill para continuar.");
      return;
    }

    const newStock = Math.max(0, med.currentStock - 1);
    await takeDoseDB(med.id, newStock);
    await testTreatmentAlarm(med.name, patientName);
  };

  const handleDeleteMed = async (med: MedicationSchedule) => {
    if (confirm(`¿Estás seguro de eliminar el tratamiento de "${med.name.toUpperCase()}"?`)) {
      await deleteMedicationDB(med.id);
    }
  };

  const formatLastTaken = (dateStr?: string) => {
    if (!dateStr) return 'Pendiente primera toma';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  // Filtrado de medicamentos
  const filteredMedications = medications.filter((m) => {
    if (!selectedMemberId) return true;
    return m.familyMemberId === selectedMemberId;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-slate-900 to-teal-900 rounded-[2rem] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-md">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full inline-block mb-1 border border-purple-400/20">
            Control de Tratamiento Continuo
          </span>
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Pill className="text-teal-400" size={24} /> Esquema de Dosis & Recordatorios
          </h3>
          <p className="text-xs text-slate-300 mt-1">
            Notificaciones automáticas en dispositivo y sonido para asegurar el cumplimiento exacto de la receta.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => testTreatmentAlarm("Omeprazol", "Demostración Vitalis")}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-3.5 py-3 rounded-2xl transition-all border border-white/10 flex items-center gap-2"
            title="Probar sonido y push de alarma"
          >
            <Volume2 size={16} /> Probar Alarma
          </button>

          <button
            onClick={() => { resetForm(); setShowAddMedModal(true); }}
            className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase px-4 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} strokeWidth={3} /> Nuevo Tratamiento
          </button>
        </div>
      </div>

      {/* Selector de Miembros Familiares */}
      {members.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          <button
            onClick={() => setSelectedMemberId(null)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
              selectedMemberId === null
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            Todos ({medications.length})
          </button>

          {members.map((member) => {
            const count = medications.filter((m) => m.familyMemberId === member.id).length;
            const isSelected = selectedMemberId === member.id;

            return (
              <button
                key={member.id}
                onClick={() => setSelectedMemberId(member.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-teal-200'
                }`}
              >
                <div className={`w-3 h-3 rounded-full ${member.color || 'bg-teal-500'}`}></div>
                <span>{member.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Lista de Medicamentos Registrados */}
      {filteredMedications.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
          <Pill className="mx-auto h-16 w-16 text-slate-200 mb-4" />
          <h4 className="font-black text-slate-700 text-lg uppercase tracking-tight mb-1">
            No hay medicamentos registrados {selectedMemberId ? 'para este familiar' : ''}
          </h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Registra los tratamientos indicados por el médico para recibir alertas de toma y calcular cuándo reordenar.
          </p>
          <button
            onClick={() => { resetForm(); setShowAddMedModal(true); }}
            className="bg-teal-600 text-white font-black text-xs uppercase px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all inline-flex items-center gap-2"
          >
            <Plus size={18} /> Registrar Primer Tratamiento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMedications.map((med) => {
            const patient = members.find((m) => m.id === med.familyMemberId);
            const productLinked = products.find((p) => p.id === med.productId);
            const remainingDays = calculateRemainingDays(med);
            const isLowStock = remainingDays <= 5 || med.currentStock <= 3;
            const percent = Math.max(0, Math.min(100, (med.currentStock / med.totalStock) * 100));

            return (
              <div
                key={med.id}
                className={`bg-white rounded-[2rem] p-6 shadow-sm border transition-all relative overflow-hidden flex flex-col justify-between ${
                  isLowStock ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-100 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Encabezado Tarjeta Medicamento */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      {patient && (
                        <span className="text-[9px] font-black uppercase tracking-widest text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-full inline-block mb-1">
                          👤 Paciente: {patient.name}
                        </span>
                      )}
                      <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-snug">{med.name}</h4>
                      <p className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mt-0.5">
                        <Clock size={13} className="text-teal-600" /> {med.dose} • Cada {med.frequencyLabel}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-2xl font-black block leading-none ${isLowStock ? 'text-amber-600' : 'text-slate-800'}`}>
                        {med.currentStock}
                      </span>
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                        Dosis Restantes
                      </span>
                    </div>
                  </div>

                  {/* Horarios de Toma */}
                  {med.timesOfDay && med.timesOfDay.length > 0 && (
                    <div className="flex items-center gap-1.5 my-3 flex-wrap">
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mr-1">Horarios:</span>
                      {med.timesOfDay.map((time, idx) => (
                        <span key={idx} className="bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1">
                          <Bell size={10} /> {time}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Barra de Progreso de Tratamiento */}
                  <div className="my-3">
                    <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      <span>Restan approx {remainingDays} días</span>
                      <span>{Math.round(percent)}% del frasco/caja</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-700 ${
                          percent > 50 ? 'bg-teal-500' : percent > 20 ? 'bg-amber-500' : 'bg-red-500 animate-pulse'
                        }`}
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Alerta de Stock / Refill */}
                  {isLowStock && (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-xl text-xs font-bold flex items-center justify-between gap-2 my-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-amber-600 shrink-0" />
                        <span>¡Se agota en ~{remainingDays} días! Reordena tu tratamiento.</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Acciones de Toma y Refill */}
                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTakeDose(med, patient?.name)}
                      disabled={med.currentStock <= 0}
                      className="flex-1 bg-slate-900 text-white py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-black transition-all flex items-center justify-center gap-2 shadow-md active:scale-95 disabled:opacity-40"
                    >
                      <Check size={16} strokeWidth={3} /> Registrar Toma
                    </button>

                    {productLinked && (
                      <button
                        onClick={() => onAddToCart(productLinked, 'UNIT')}
                        className={`py-3 px-4 rounded-xl font-black text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-sm ${
                          isLowStock
                            ? 'bg-amber-500 hover:bg-amber-600 text-white animate-pulse'
                            : 'bg-teal-50 hover:bg-teal-100 text-teal-700'
                        }`}
                        title="Reordenar producto en la farmacia"
                      >
                        <ShoppingCart size={16} /> Reordenar
                      </button>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest pt-1">
                    <span>Última toma: {formatLastTaken(med.lastTaken)}</span>
                    <button
                      onClick={() => handleDeleteMed(med)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      title="Eliminar Tratamiento"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Nuevo Tratamiento */}
      {showAddMedModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h4 className="font-black text-lg uppercase tracking-tight">Nuevo Esquema de Tratamiento</h4>
                <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Recordatorio Sonora & Refill Automático
                </p>
              </div>
              <button
                onClick={() => { setShowAddMedModal(false); resetForm(); }}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Paciente / Familiar *</label>
                <select
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  value={selectedMemberForNew}
                  onChange={(e) => setSelectedMemberForNew(e.target.value)}
                  required
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Nombre del Medicamento *</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  placeholder="Ej: Losartán 50mg, Metformina 850mg..."
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Stock Inicial (Dosis/Pastillas) *</label>
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                    placeholder="Ej: 30"
                    value={medStock}
                    onChange={(e) => setMedStock(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Dosis por Toma</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                    placeholder="Ej: 1 tableta, 5ml"
                    value={medDose}
                    onChange={(e) => setMedDose(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Frecuencia de Toma</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  placeholder="Ej: Cada 8 horas, 1 vez al día con desayuno"
                  value={medFreq}
                  onChange={(e) => setMedFreq(e.target.value)}
                />
              </div>

              {/* Horario Alarma */}
              <div>
                <label className="text-[10px] font-black text-purple-700 uppercase tracking-wider block mb-1 ml-1 flex items-center gap-1">
                  <Bell size={12} /> Horario de Alarma Sonora (Hora del día)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="time"
                    className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl font-bold text-xs text-purple-900 outline-none"
                    value={time1}
                    onChange={(e) => setTime1(e.target.value)}
                  />
                  {useMultipleTimes ? (
                    <>
                      <input
                        type="time"
                        className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl font-bold text-xs text-purple-900 outline-none"
                        value={time2}
                        onChange={(e) => setTime2(e.target.value)}
                      />
                      <input
                        type="time"
                        className="bg-purple-50 border border-purple-200 p-2.5 rounded-xl font-bold text-xs text-purple-900 outline-none"
                        value={time3}
                        onChange={(e) => setTime3(e.target.value)}
                      />
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setUseMultipleTimes(true)}
                      className="col-span-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold text-[10px] uppercase"
                    >
                      + Añadir más tomas al día
                    </button>
                  )}
                </div>
              </div>

              {/* Vincular con Producto del Catálogo */}
              <div>
                <label className="text-[10px] font-black text-teal-700 uppercase tracking-wider block mb-1 ml-1">
                  Vincular con Producto en Farmacia Vitalis (Para Reorden en 1-Clic)
                </label>
                <select
                  className="w-full bg-teal-50/60 border border-teal-200 p-3 rounded-xl font-bold text-xs text-teal-900 outline-none focus:border-teal-500 focus:bg-white transition-all"
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                >
                  <option value="">-- No vincular por ahora --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name.toUpperCase()} (${p.price.toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddMedModal(false); resetForm(); }}
                  className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-black text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-teal-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all"
                >
                  {isSaving ? 'Guardando...' : 'Crear Tratamiento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
