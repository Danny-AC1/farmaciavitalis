import React, { useEffect, useState } from 'react';
import { User, FamilyMember, MedicationSchedule, Product } from '../types';
import { streamFamilyMembers, addFamilyMemberDB, streamMedications, addMedicationDB, takeDoseDB, deleteMedicationDB, deleteFamilyMemberDB } from '../services/db';
import { X, Users, Pill, Plus, Check, Trash2, Smile, Clock, AlertCircle, ShoppingCart, UserX } from 'lucide-react';

interface FamilyHealthModalProps {
  user: User;
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
}

const COLORS = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];

const FamilyHealthModal: React.FC<FamilyHealthModalProps> = ({ user, products, onClose, onAddToCart }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Form States
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState<'PARENT'|'CHILD'|'PARTNER'|'OTHER'>('OTHER');

  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medStock, setMedStock] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [selectedProductLink, setSelectedProductLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
              id: '', // Firebase genera el ID
              userId: user.uid,
              name: newMemberName,
              relationship: newMemberRel,
              color
          });
          setNewMemberName('');
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
              name: medName,
              totalStock: parseInt(medStock),
              currentStock: parseInt(medStock),
              dose: medDose,
              frequencyLabel: medFreq,
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
  };

  const handleDeleteMed = async (id: string) => {
      if(confirm("¿Estás seguro de eliminar este tratamiento?")) await deleteMedicationDB(id);
  };

  const formatLastTaken = (dateStr?: string) => {
      if (!dateStr) return 'Nunca';
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString([], { day: '2-digit', month: 'short' });
  };

  const activeMember = members.find(m => m.id === selectedMemberId);
  const filteredMeds = medications.filter(m => m.familyMemberId === selectedMemberId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/20">
        
        {/* Header Vitalis Family */}
        <div className="bg-slate-900 p-6 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-8 -translate-y-8">
                <Users size={120} fill="white" />
            </div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <h3 className="font-black text-2xl flex items-center gap-2 uppercase tracking-tighter">
                        Salud Familiar
                    </h3>
                    <p className="text-teal-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Control de medicamentos Vitalis</p>
                </div>
                <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-all active:scale-90"><X size={24}/></button>
            </div>
        </div>

        {/* Barra de Miembros (Horizontal Scroll) */}
        <div className="bg-white border-b border-slate-100 p-4 shrink-0">
             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar px-2">
                 <button 
                    onClick={() => setShowAddMember(true)} 
                    className="flex flex-col items-center gap-2 shrink-0 group transition-all"
                 >
                     <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 group-hover:border-teal-500 group-hover:text-teal-500 transition-colors bg-slate-50">
                         <Plus size={24} strokeWidth={3}/>
                     </div>
                     <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Añadir</span>
                 </button>

                 {members.map(member => (
                     <button 
                        key={member.id} 
                        onClick={() => { setSelectedMemberId(member.id); setShowAddMember(false); setShowAddMed(false); }}
                        className={`flex flex-col items-center gap-2 shrink-0 transition-all duration-300 ${selectedMemberId === member.id ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}
                     >
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border-4 ${selectedMemberId === member.id ? 'border-teal-500 ring-4 ring-teal-50' : 'border-white'} ${member.color}`}>
                             {member.name.charAt(0).toUpperCase()}
                         </div>
                         <span className={`text-[10px] font-black uppercase tracking-tight ${selectedMemberId === member.id ? 'text-slate-800' : 'text-slate-400'}`}>{member.name}</span>
                     </button>
                 ))}
             </div>
        </div>

        {/* Contenido Principal */}
        <div className="flex-grow overflow-y-auto p-5 bg-slate-50 no-scrollbar">
            {showAddMember ? (
                <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-slate-100 animate-in slide-in-from-top-4">
                    <h4 className="font-black text-slate-800 mb-6 uppercase tracking-tight text-lg">Nuevo Integrante</h4>
                    <form onSubmit={handleAddMember} className="space-y-5">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold" placeholder="Ej: Abuelito Juan" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} autoFocus required />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
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
                                    className={`p-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${newMemberRel === rel.id ? 'bg-teal-600 border-teal-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}
                                >
                                    {rel.label}
                                </button>
                             ))}
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 bg-slate-100 text-slate-500 py-3 rounded-xl font-black text-xs uppercase">Cancelar</button>
                            <button type="submit" disabled={isSaving} className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-black text-xs uppercase shadow-lg shadow-teal-100">{isSaving ? 'Guardando...' : 'Crear Perfil'}</button>
                        </div>
                    </form>
                </div>
            ) : !activeMember ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-slate-200 mx-4">
                    <Users className="h-16 w-16 text-slate-100 mx-auto mb-4"/>
                    <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Empieza creando un perfil familiar</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Encabezado del Pastillero */}
                    <div className="flex justify-between items-center px-2">
                        <div className="flex items-center gap-3">
                            <div>
                                <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                                    <Pill className="text-teal-600" size={20}/> Tratamientos
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Gestión para {activeMember.name}</p>
                            </div>
                            <button 
                                onClick={() => handleDeleteMember(activeMember.id, activeMember.name)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Eliminar Perfil"
                            >
                                <UserX size={18}/>
                            </button>
                        </div>
                        <button 
                            onClick={() => setShowAddMed(!showAddMed)} 
                            className={`p-2.5 rounded-xl transition-all shadow-md active:scale-90 ${showAddMed ? 'bg-slate-800 text-white' : 'bg-teal-600 text-white hover:bg-teal-700'}`}
                        >
                            <Plus size={20} strokeWidth={3}/>
                        </button>
                    </div>

                    {showAddMed && (
                        <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-teal-100 animate-in zoom-in duration-300">
                            <form onSubmit={handleAddMedication} className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Medicamento</label>
                                    <input className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold" placeholder="Nombre (Ej: Enalapril)" value={medName} onChange={e => setMedName(e.target.value)} required />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stock Actual</label>
                                        <input type="number" className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold" placeholder="Unidades" value={medStock} onChange={e => setMedStock(e.target.value)} required />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Frecuencia</label>
                                        <input className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold" placeholder="Ej: 8 horas" value={medFreq} onChange={e => setMedFreq(e.target.value)} required />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dosis recomendada</label>
                                    <input className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold" placeholder="Ej: 1 tableta" value={medDose} onChange={e => setMedDose(e.target.value)} required />
                                </div>
                                
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest ml-1">Vincular con nuestro catálogo</label>
                                    <select className="w-full bg-teal-50/50 border-2 border-teal-100 p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold text-sm text-teal-800" value={selectedProductLink} onChange={e => setSelectedProductLink(e.target.value)}>
                                        <option value="">-- No vincular --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
                                    </select>
                                </div>
                                <button disabled={isSaving} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                    {isSaving ? 'Registrando...' : 'Añadir al Pastillero'}
                                </button>
                            </form>
                        </div>
                    )}

                    {filteredMeds.length === 0 && !showAddMed ? (
                         <div className="text-center py-12 bg-white rounded-[2rem] border border-slate-100 shadow-sm mx-2">
                             <Smile className="h-12 w-12 text-slate-100 mx-auto mb-3"/>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">No hay medicinas activas</p>
                         </div>
                    ) : (
                        <div className="space-y-4 px-2 pb-10">
                        {filteredMeds.map(med => {
                            const percent = Math.max(0, (med.currentStock / med.totalStock) * 100);
                            const isCritical = med.currentStock <= (med.totalStock * 0.2) || med.currentStock <= 3;
                            const productLinked = products.find(p => p.id === med.productId);

                            return (
                                <div key={med.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-100 p-5 relative group overflow-hidden animate-in fade-in slide-in-from-bottom-2">
                                    <div className="flex justify-between items-start mb-3 relative z-10">
                                        <div className="min-w-0">
                                            <h5 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-none mb-1 truncate">{med.name}</h5>
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-tight">
                                                <Clock size={10} className="text-teal-500"/> Cada {med.frequencyLabel} • {med.dose}
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <span className={`text-2xl font-black leading-none block ${isCritical ? 'text-red-600' : 'text-slate-800'}`}>
                                                {med.currentStock}
                                            </span>
                                            <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Restantes</span>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden shadow-inner">
                                        <div 
                                            className={`h-full transition-all duration-1000 ease-out ${
                                                percent > 50 ? 'bg-teal-500' : percent > 20 ? 'bg-orange-400' : 'bg-red-500'
                                            }`} 
                                            style={{ width: `${percent}%` }}
                                        ></div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleTakeDose(med)} 
                                            disabled={med.currentStock <= 0}
                                            className="flex-[2] bg-slate-900 text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
                                        >
                                            <Check size={16} strokeWidth={3}/> Tomar Dosis
                                        </button>
                                        
                                        {productLinked && (
                                            <button 
                                                onClick={() => onAddToCart(productLinked, 'UNIT')} 
                                                className={`flex-1 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${isCritical ? 'bg-red-600 text-white animate-pulse' : 'bg-teal-50 text-teal-700 hover:bg-teal-100'}`}
                                                title="Comprar más"
                                            >
                                                <ShoppingCart size={16}/> {isCritical ? 'Pedir Ya' : 'Comprar'}
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 flex justify-between items-center border-t border-slate-50 pt-3">
                                        <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                                            Última: {formatLastTaken(med.lastTaken)}
                                        </div>
                                        <button onClick={() => handleDeleteMed(med.id)} className="text-slate-300 hover:text-red-500 transition-colors p-1"><Trash2 size={14}/></button>
                                    </div>

                                    {isCritical && med.currentStock > 0 && (
                                        <div className="absolute top-2 right-12 bg-red-100 text-red-600 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase animate-bounce flex items-center gap-1">
                                            <AlertCircle size={8}/> Stock Bajo
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Footer Informativo */}
        <div className="p-4 bg-white border-t border-slate-100 shrink-0">
             <div className="flex items-start gap-3 bg-blue-50/50 p-3 rounded-2xl border border-blue-100">
                 <AlertCircle className="text-blue-500 shrink-0" size={16}/>
                 <p className="text-[9px] font-bold text-blue-700 leading-relaxed uppercase">
                    Vitalis te ayuda a recordar, pero recuerda que el control médico profesional es indispensable. Siempre consulta a tu médico.
                 </p>
             </div>
        </div>
      </div>
    </div>
  );
};

export default FamilyHealthModal;