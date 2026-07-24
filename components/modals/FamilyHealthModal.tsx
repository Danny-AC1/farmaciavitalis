import React, { useEffect, useState, useMemo } from 'react';
import { User, FamilyMember, MedicationSchedule, Product } from '../../types';
import { 
  streamFamilyMembers, addFamilyMemberDB, streamMedications, addMedicationDB, 
  takeDoseDB, deleteMedicationDB, deleteFamilyMemberDB 
} from '../../services/db';
import { testTreatmentAlarm } from '../../services/treatmentReminderService';
import { 
  X, Users, Pill, Plus, Check, Trash2, Clock, 
  ShoppingCart, UserX, HeartPulse, Volume2, 
  ShieldAlert, Copy, CheckCircle2, FileText, ChevronRight
} from 'lucide-react';

interface FamilyHealthModalProps {
  user: User;
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
}

const COLORS = ['bg-emerald-600', 'bg-blue-600', 'bg-purple-600', 'bg-pink-600', 'bg-amber-600', 'bg-teal-600'];

type FamilyTab = 'MEDICATIONS' | 'PROFILES' | 'SUMMARY';

export const FamilyHealthModal: React.FC<FamilyHealthModalProps> = ({ user, products, onClose, onAddToCart }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FamilyTab>('MEDICATIONS');

  // Form States
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState<'PARENT'|'CHILD'|'PARTNER'|'OTHER'>('OTHER');
  const [memberAge, setMemberAge] = useState('');
  const [memberAllergies, setMemberAllergies] = useState('');
  const [memberBloodType, setMemberBloodType] = useState('');

  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medStock, setMedStock] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [selectedProductLink, setSelectedProductLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [lastDoseMessage, setLastDoseMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user.uid) return;
    
    const unsubMembers = streamFamilyMembers(user.uid, (data) => {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setMembers(sorted);
        if (sorted.length > 0 && !selectedMemberId) {
            setSelectedMemberId(sorted[0].id);
        } else if (sorted.length === 0) {
            setSelectedMemberId(null);
        }
    });
    
    const unsubMeds = streamMedications(user.uid, (data) => setMedications(data));
    
    return () => { unsubMembers(); unsubMeds(); };
  }, [user.uid]);

  const handleAddMember = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!newMemberName.trim()) return;
      setIsSaving(true);
      try {
          const color = COLORS[Math.floor(Math.random() * COLORS.length)];
          await addFamilyMemberDB({
              id: '',
              userId: user.uid,
              name: newMemberName.trim(),
              relationship: newMemberRel,
              color,
              notes: [
                memberAge ? `Edad: ${memberAge} años` : '',
                memberBloodType ? `Tipo de sangre: ${memberBloodType}` : '',
                memberAllergies ? `Alergias: ${memberAllergies}` : ''
              ].filter(Boolean).join(' • ')
          });
          setNewMemberName('');
          setMemberAge('');
          setMemberAllergies('');
          setMemberBloodType('');
          setShowAddMember(false);
      } finally {
          setIsSaving(false);
      }
  };

  const handleDeleteMember = async (id: string, name: string) => {
      if (confirm(`¿Estás seguro de eliminar el perfil de "${name.toUpperCase()}"? Se borrarán también todos sus medicamentos registrados.`)) {
          await deleteFamilyMemberDB(id);
          if (selectedMemberId === id) {
              const remaining = members.filter(m => m.id !== id);
              setSelectedMemberId(remaining.length > 0 ? remaining[0].id : null);
          }
      }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMemberId || !medName.trim() || !medStock) return;
      
      setIsSaving(true);
      try {
          await addMedicationDB({
              id: '',
              userId: user.uid,
              familyMemberId: selectedMemberId,
              name: medName.trim(),
              totalStock: parseInt(medStock),
              currentStock: parseInt(medStock),
              dose: medDose.trim() || '1 toma',
              frequencyLabel: medFreq.trim() || 'Cada 8 horas',
              productId: selectedProductLink || undefined,
              active: true
          });
          setMedName(''); setMedStock(''); setMedDose(''); setMedFreq(''); setSelectedProductLink('');
          setShowAddMed(false);
      } finally {
          setIsSaving(false);
      }
  };

  const handleTakeDose = async (med: MedicationSchedule) => {
      if (med.currentStock <= 0) {
          alert("¡No queda stock de este medicamento! Realiza un pedido para continuar.");
          return;
      }
      const newStock = Math.max(0, med.currentStock - 1);
      await takeDoseDB(med.id, newStock);
      testTreatmentAlarm(med.name, activeMember?.name);
      
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastDoseMessage(`✓ Dosis de ${med.name} registrada a las ${now}`);
      setTimeout(() => setLastDoseMessage(null), 4000);
  };

  const handleDeleteMed = async (id: string) => {
      if(confirm("¿Estás seguro de eliminar este tratamiento?")) await deleteMedicationDB(id);
  };

  const formatLastTaken = (dateStr?: string) => {
      if (!dateStr) return 'Pendiente hoy';
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' • ' + date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const activeMember = useMemo(() => members.find(m => m.id === selectedMemberId), [members, selectedMemberId]);
  const filteredMeds = useMemo(() => medications.filter(m => m.familyMemberId === selectedMemberId), [medications, selectedMemberId]);

  // Generador de Ficha Resumen para Médico / WhatsApp
  const generateMedicalSummary = () => {
    let summary = `📋 *FICHA DE SALUD FAMILIAR VITALIS*\n\n`;
    members.forEach(member => {
      const memberMeds = medications.filter(m => m.familyMemberId === member.id);
      summary += `👤 *${member.name.toUpperCase()}* (${member.relationship})\n`;
      if (member.notes) summary += `ℹ️ ${member.notes}\n`;
      if (memberMeds.length === 0) {
        summary += `   • Sin medicamentos registrados\n`;
      } else {
        memberMeds.forEach(m => {
          summary += `   💊 *${m.name}*: ${m.dose} (Cada ${m.frequencyLabel}) - Stock: ${m.currentStock} unidades\n`;
        });
      }
      summary += `\n`;
    });
    summary += `Farmacia Vitalis Machalilla - Control de Tratamientos`;
    return summary;
  };

  const handleCopySummary = () => {
    const summaryText = generateMedicalSummary();
    navigator.clipboard.writeText(summaryText);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(null as any), 3000);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-md p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 w-full max-w-xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-emerald-500/30 text-white">
        
        {/* Header Salud Familiar */}
        <div className="bg-gradient-to-r from-teal-900 via-emerald-900 to-slate-950 p-5 shrink-0 border-b border-emerald-800/60 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <HeartPulse size={110} className="text-emerald-400" />
            </div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Módulo de Control Multi-Paciente
                    </span>
                    <h3 className="font-black text-xl sm:text-2xl flex items-center gap-2 uppercase tracking-tight text-white mt-0.5">
                        <Users size={24} className="text-emerald-400"/> Salud Familiar & Dosis
                    </h3>
                </div>
                <button onClick={onClose} className="bg-slate-800 hover:bg-slate-700 p-2.5 rounded-full transition-all text-slate-300 active:scale-90">
                  <X size={20}/>
                </button>
            </div>
        </div>

        {/* Banner de alerta de dosis tomada */}
        {lastDoseMessage && (
          <div className="bg-emerald-500 text-slate-950 font-black text-xs px-4 py-2 flex items-center justify-between animate-in slide-in-from-top duration-200">
            <span>{lastDoseMessage}</span>
            <CheckCircle2 size={16} />
          </div>
        )}

        {/* Tab Switcher Superior */}
        <div className="bg-slate-950 p-2 border-b border-slate-800 flex gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('MEDICATIONS')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'MEDICATIONS'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Pill size={15} />
            <span>Pastillero ({medications.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('PROFILES')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'PROFILES'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <Users size={15} />
            <span>Perfiles ({members.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SUMMARY')}
            className={`flex-1 py-2.5 px-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'SUMMARY'
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <FileText size={15} />
            <span>Ficha Médica</span>
          </button>
        </div>

        {/* Barra Horizontal de Selección de Paciente */}
        {activeTab === 'MEDICATIONS' && (
          <div className="bg-slate-900 border-b border-slate-800 p-3 shrink-0">
               <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar px-1 items-center">
                   <button 
                      onClick={() => setShowAddMember(true)} 
                      className="flex items-center gap-2 shrink-0 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-dashed border-emerald-500/40 px-3.5 py-2.5 rounded-2xl transition-all"
                   >
                       <Plus size={16} strokeWidth={3}/>
                       <span className="text-xs font-black uppercase">Nuevo Perfil</span>
                   </button>

                   {members.map(member => {
                       const isSelected = selectedMemberId === member.id;
                       const memberMeds = medications.filter(m => m.familyMemberId === member.id);
                       const hasAlert = memberMeds.some(m => m.currentStock <= 3);

                       return (
                           <button 
                              key={member.id} 
                              onClick={() => { setSelectedMemberId(member.id); setShowAddMember(false); setShowAddMed(false); }}
                              className={`flex items-center gap-2.5 shrink-0 px-3.5 py-2 rounded-2xl transition-all border ${
                                isSelected 
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500 font-black shadow-md' 
                                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-white'
                              }`}
                           >
                               <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-white font-black text-xs ${member.color || 'bg-teal-600'}`}>
                                   {member.name.charAt(0).toUpperCase()}
                               </div>
                               <span className="text-xs uppercase font-bold">{member.name}</span>
                               {hasAlert && (
                                 <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" title="Medicamento bajo" />
                               )}
                           </button>
                       );
                   })}
               </div>
          </div>
        )}

        {/* Contenido Principal Modal */}
        <div className="flex-grow overflow-y-auto p-4 sm:p-5 bg-slate-900/90 no-scrollbar">
            
            {/* VISTA 1: PASTILLERO & TRATAMIENTOS DE PACIENTE */}
            {activeTab === 'MEDICATIONS' && (
              <div className="space-y-4">
                {showAddMember ? (
                  <div className="bg-slate-800 p-6 rounded-[2rem] shadow-xl border border-emerald-500/40 animate-in slide-in-from-top-4">
                      <h4 className="font-black text-white mb-4 uppercase tracking-tight text-lg flex items-center gap-2">
                          <Users size={20} className="text-emerald-400" /> Nuevo Perfil Familiar
                      </h4>
                      <form onSubmit={handleAddMember} className="space-y-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre / Apodo</label>
                              <input 
                                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-sm" 
                                placeholder="Ej: Papá, Abuela María, Sofía" 
                                value={newMemberName} 
                                onChange={e => setNewMemberName(e.target.value)} 
                                autoFocus 
                                required 
                              />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                               {[
                                  {id: 'PARENT', label: 'Padre/Madre'},
                                  {id: 'CHILD', label: 'Hijo/a'},
                                  {id: 'PARTNER', label: 'Pareja'},
                                  {id: 'OTHER', label: 'Otro'}
                               ].map(rel => (
                                  <button 
                                      key={rel.id}
                                      type="button" 
                                      onClick={() => setNewMemberRel(rel.id as any)} 
                                      className={`p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${newMemberRel === rel.id ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'}`}
                                  >
                                      {rel.label}
                                  </button>
                               ))}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Edad (Años)</label>
                              <input 
                                type="number" 
                                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-xs" 
                                placeholder="Ej: 68" 
                                value={memberAge} 
                                onChange={e => setMemberAge(e.target.value)} 
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Tipo de Sangre</label>
                              <input 
                                className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-xs" 
                                placeholder="Ej: O+, A+" 
                                value={memberBloodType} 
                                onChange={e => setMemberBloodType(e.target.value)} 
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Alergias o Notas Médicas</label>
                            <input 
                              className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-xs" 
                              placeholder="Ej: Alérgico a la Penicilina, Hipertensión" 
                              value={memberAllergies} 
                              onChange={e => setMemberAllergies(e.target.value)} 
                            />
                          </div>

                          <div className="flex gap-3 pt-2">
                              <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 bg-slate-700 text-slate-300 py-3 rounded-xl font-black text-xs uppercase">Cancelar</button>
                              <button type="submit" disabled={isSaving} className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-3 rounded-xl font-black text-xs uppercase shadow-lg">{isSaving ? 'Guardando...' : 'Crear Perfil'}</button>
                          </div>
                      </form>
                  </div>
                ) : !activeMember ? (
                  <div className="text-center py-16 bg-slate-800/40 rounded-[2rem] border border-dashed border-slate-700 p-6">
                      <Users className="h-14 w-14 text-slate-600 mx-auto mb-3"/>
                      <p className="text-white font-black uppercase text-sm tracking-widest">Añade tu primer perfil familiar</p>
                      <p className="text-slate-400 text-xs mt-1 max-w-xs mx-auto">Organiza las recetas de tus padres, hijos o pareja en un solo lugar.</p>
                      <button 
                        onClick={() => setShowAddMember(true)}
                        className="mt-4 bg-emerald-600 hover:bg-emerald-500 text-slate-950 px-5 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg"
                      >
                        + Crear Primer Perfil
                      </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                      {/* Sub-Header del integrante seleccionado */}
                      <div className="flex justify-between items-center bg-slate-800/80 p-4 rounded-3xl border border-slate-700">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-lg ${activeMember.color || 'bg-emerald-600'}`}>
                                  {activeMember.name.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                  <h4 className="font-black text-white text-base uppercase tracking-tight flex items-center gap-2">
                                      {activeMember.name}
                                  </h4>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase">
                                    {activeMember.notes || 'Control de dosis diario activa'}
                                  </p>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <button 
                                onClick={() => testTreatmentAlarm("Prueba de Alarma", activeMember.name)}
                                className="p-2.5 bg-slate-700 hover:bg-slate-600 text-emerald-400 rounded-xl transition-all"
                                title="Probar Alarma Sonora"
                            >
                                <Volume2 size={16}/>
                            </button>
                            <button 
                                onClick={() => setShowAddMed(!showAddMed)} 
                                className={`p-2.5 rounded-xl transition-all shadow-md active:scale-90 ${showAddMed ? 'bg-slate-700 text-white' : 'bg-emerald-600 text-slate-950 font-black'}`}
                            >
                                <Plus size={18} strokeWidth={3}/>
                            </button>
                          </div>
                      </div>

                      {/* Formulario de registro de medicamento */}
                      {showAddMed && (
                          <div className="bg-slate-800 p-5 rounded-[2rem] shadow-xl border border-emerald-500/40 animate-in zoom-in duration-200">
                              <form onSubmit={handleAddMedication} className="space-y-3.5">
                                  <h5 className="font-black text-white text-sm uppercase tracking-wider mb-2">Añadir Medicina al Pastillero</h5>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Nombre del Medicamento</label>
                                      <input 
                                        className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-sm" 
                                        placeholder="Ej: Enalapril 10mg, Losartán 50mg" 
                                        value={medName} 
                                        onChange={e => setMedName(e.target.value)} 
                                        required 
                                      />
                                  </div>
                                  <div className="grid grid-cols-2 gap-3">
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Stock Inicial (Tabletas)</label>
                                          <input 
                                            type="number" 
                                            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-sm" 
                                            placeholder="Ej: 30" 
                                            value={medStock} 
                                            onChange={e => setMedStock(e.target.value)} 
                                            required 
                                          />
                                      </div>
                                      <div>
                                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Frecuencia</label>
                                          <input 
                                            className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-sm" 
                                            placeholder="Ej: Cada 8 horas" 
                                            value={medFreq} 
                                            onChange={e => setMedFreq(e.target.value)} 
                                            required 
                                          />
                                      </div>
                                  </div>
                                  <div>
                                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Dosis recomendada</label>
                                      <input 
                                        className="w-full bg-slate-900 border border-slate-700 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-white text-sm" 
                                        placeholder="Ej: 1 pastilla con agua" 
                                        value={medDose} 
                                        onChange={e => setMedDose(e.target.value)} 
                                      />
                                  </div>
                                  
                                  <div>
                                      <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest ml-1 mb-1 block">Vincular Producto para Reabastecer en 1-Clic</label>
                                      <select 
                                        className="w-full bg-slate-900 border border-emerald-500/40 p-3 rounded-xl outline-none focus:border-emerald-500 font-bold text-xs text-emerald-300" 
                                        value={selectedProductLink} 
                                        onChange={e => setSelectedProductLink(e.target.value)}
                                      >
                                          <option value="">-- No vincular --</option>
                                          {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                      </select>
                                  </div>
                                  <button disabled={isSaving} className="w-full bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all">
                                      {isSaving ? 'Guardando...' : 'Añadir al Pastillero'}
                                  </button>
                              </form>
                          </div>
                      )}

                      {/* Lista de Tratamientos del Paciente */}
                      {filteredMeds.length === 0 && !showAddMed ? (
                           <div className="text-center py-12 bg-slate-800/40 rounded-[2rem] border border-dashed border-slate-700 p-6">
                               <Pill className="h-12 w-12 text-slate-600 mx-auto mb-2"/>
                               <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin medicamentos activos</p>
                               <p className="text-[11px] text-slate-500 mt-1">Añade los medicamentos de {activeMember.name} para activar el control de tomas.</p>
                           </div>
                      ) : (
                          <div className="space-y-3.5">
                          {filteredMeds.map(med => {
                              const percent = Math.max(0, (med.currentStock / med.totalStock) * 100);
                              const isCritical = med.currentStock <= 3 || med.currentStock <= (med.totalStock * 0.2);
                              const productLinked = products.find(p => p.id === med.productId);

                              return (
                                  <div key={med.id} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-md relative group overflow-hidden">
                                      <div className="flex justify-between items-start mb-3 relative z-10">
                                          <div className="min-w-0">
                                              <h5 className="font-black text-white text-base uppercase tracking-tight leading-none mb-1.5 truncate">{med.name}</h5>
                                              <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                                                  <Clock size={12} className="text-emerald-400"/> Cada {med.frequencyLabel} • {med.dose}
                                              </div>
                                          </div>
                                          <div className="text-right shrink-0">
                                              <span className={`text-2xl font-black leading-none block ${isCritical ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
                                                  {med.currentStock}
                                              </span>
                                              <span className="text-[9px] font-bold text-slate-400 uppercase">Unidades</span>
                                          </div>
                                      </div>
                                      
                                      {/* Barra de nivel de stock */}
                                      <div className="w-full bg-slate-900 rounded-full h-2.5 mb-4 overflow-hidden border border-slate-700">
                                          <div 
                                              className={`h-full transition-all duration-1000 ${
                                                  percent > 50 ? 'bg-emerald-500' : percent > 20 ? 'bg-amber-400' : 'bg-red-500'
                                              }`} 
                                              style={{ width: `${percent}%` }}
                                          />
                                      </div>

                                      <div className="flex gap-2">
                                          <button 
                                              onClick={() => handleTakeDose(med)} 
                                              disabled={med.currentStock <= 0}
                                              className="flex-[2] bg-emerald-600 hover:bg-emerald-500 text-slate-950 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 shadow-md shadow-emerald-900/30"
                                          >
                                              <Check size={16} strokeWidth={3}/> Tomar Dosis
                                          </button>
                                          
                                          {productLinked ? (
                                              <button 
                                                  onClick={() => onAddToCart(productLinked, 'UNIT')} 
                                                  className={`flex-1 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 shadow-md ${
                                                    isCritical 
                                                      ? 'bg-red-500 hover:bg-red-400 text-white animate-pulse' 
                                                      : 'bg-slate-700 hover:bg-slate-600 text-white'
                                                  }`}
                                                  title="Reabastecer medicamento"
                                              >
                                                  <ShoppingCart size={15}/> {isCritical ? 'Reabastecer' : 'Comprar'}
                                              </button>
                                          ) : (
                                              <button 
                                                  onClick={() => handleDeleteMed(med.id)}
                                                  className="p-3 bg-slate-900 hover:bg-red-950/60 text-slate-400 hover:text-red-400 rounded-2xl border border-slate-700 transition-colors"
                                                  title="Eliminar tratamiento"
                                              >
                                                  <Trash2 size={16}/>
                                              </button>
                                          )}
                                      </div>

                                      <div className="mt-3.5 flex justify-between items-center border-t border-slate-700/80 pt-2.5">
                                          <div className="text-[10px] font-bold text-slate-400 uppercase">
                                              Última toma: <span className="text-slate-200">{formatLastTaken(med.lastTaken)}</span>
                                          </div>
                                          {productLinked && (
                                            <button onClick={() => handleDeleteMed(med.id)} className="text-slate-500 hover:text-red-400 transition-colors text-[10px] font-bold uppercase">
                                              Borrar
                                            </button>
                                          )}
                                      </div>
                                  </div>
                              );
                          })}
                          </div>
                      )}
                  </div>
                )}
              </div>
            )}

            {/* VISTA 2: GESTIÓN DE PERFILES FAMILIARES */}
            {activeTab === 'PROFILES' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <h4 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em]">Todos tus Pacientes Registrados</h4>
                  <button 
                    onClick={() => { setShowAddMember(true); setActiveTab('MEDICATIONS'); }}
                    className="text-xs font-black text-emerald-400 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-xl border border-emerald-500/30"
                  >
                    + Nuevo Perfil
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {members.map(member => {
                    const memberMeds = medications.filter(m => m.familyMemberId === member.id);

                    return (
                      <div key={member.id} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-md flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl ${member.color || 'bg-emerald-600'}`}>
                            {member.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-black text-white text-base uppercase tracking-tight">{member.name}</h5>
                            <p className="text-[10px] font-bold text-emerald-400 uppercase">{member.notes || 'Sin alergias especificadas'}</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">{memberMeds.length} tratamiento{memberMeds.length !== 1 ? 's' : ''} activo{memberMeds.length !== 1 ? 's' : ''}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedMemberId(member.id); setActiveTab('MEDICATIONS'); }}
                            className="p-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all"
                            title="Ver Pastillero"
                          >
                            <ChevronRight size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            className="p-2.5 bg-slate-900 hover:bg-red-900/50 text-slate-400 hover:text-red-400 rounded-xl transition-all"
                            title="Borrar Perfil"
                          >
                            <UserX size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VISTA 3: FICHA MÉDICA RESUMEN & EXPORTAR */}
            {activeTab === 'SUMMARY' && (
              <div className="space-y-4">
                <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 shadow-xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-white text-lg uppercase tracking-tight flex items-center gap-2">
                        <FileText className="text-emerald-400" size={20} /> Ficha de Tratamientos Familiar
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">Resumen preparado para enviar a tu médico o consulta rápida.</p>
                    </div>
                    <button
                      onClick={handleCopySummary}
                      className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black px-3.5 py-2 rounded-xl text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                    >
                      {copiedSummary ? <Check size={16} /> : <Copy size={16} />}
                      <span>{copiedSummary ? '¡Copiado!' : 'Copiar'}</span>
                    </button>
                  </div>

                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 font-mono text-xs text-slate-300 space-y-3 max-h-80 overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans leading-relaxed">{generateMedicalSummary()}</pre>
                  </div>
                </div>
              </div>
            )}
        </div>

        {/* Footer Informativo */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 shrink-0">
             <div className="flex items-start gap-3 bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
                 <ShieldAlert className="text-emerald-400 shrink-0 mt-0.5" size={18}/>
                 <p className="text-[10px] font-bold text-emerald-200 leading-relaxed uppercase">
                    Vitalis Machalilla realiza alertas automáticas de dosis, pero nunca sustituye el diagnóstico o indicación directa de tu médico tratante.
                 </p>
             </div>
        </div>

      </div>
    </div>
  );
};

export default FamilyHealthModal;
