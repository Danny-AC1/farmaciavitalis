import React, { useEffect, useState } from 'react';
import { User, FamilyMember, MedicationSchedule, Product } from '../types';
import { streamFamilyMembers, addFamilyMemberDB, streamMedications, addMedicationDB, takeDoseDB, deleteMedicationDB } from '../services/db';
import { X, Heart, Users, Pill, Plus, Check, RefreshCw, Trash2, Smile } from 'lucide-react';

interface FamilyHealthModalProps {
  user: User;
  products: Product[]; // Para vincular reabastecimiento
  onClose: () => void;
  onAddToCart: (product: Product) => void;
}

const COLORS = ['bg-blue-500', 'bg-pink-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-teal-500'];

const FamilyHealthModal: React.FC<FamilyHealthModalProps> = ({ user, products, onClose, onAddToCart }) => {
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Forms
  const [showAddMember, setShowAddMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState<'PARENT'|'CHILD'|'PARTNER'|'OTHER'>('OTHER');

  const [showAddMed, setShowAddMed] = useState(false);
  const [medName, setMedName] = useState('');
  const [medStock, setMedStock] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medFreq, setMedFreq] = useState('');
  const [selectedProductLink, setSelectedProductLink] = useState('');

  useEffect(() => {
    if (!user.uid) return;
    
    const unsubMembers = streamFamilyMembers(user.uid, (data) => {
        // Ordenamos localmente para no fallar si falta el índice en Firebase
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setMembers(sorted);
        // Autoseleccionar si hay miembros
        if (sorted.length > 0 && !selectedMemberId) {
            setSelectedMemberId(sorted[0].id);
        }
    });
    const unsubMeds = streamMedications(user.uid, (data) => setMedications(data));
    return () => { unsubMembers(); unsubMeds(); };
  }, [user.uid]);

  const handleAddMember = async (e: React.FormEvent) => {
      e.preventDefault();
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      await addFamilyMemberDB({
          id: `mem_${Date.now()}`,
          userId: user.uid,
          name: newMemberName,
          relationship: newMemberRel,
          color
      });
      setNewMemberName(''); setShowAddMember(false);
  };

  const handleAddMedication = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedMemberId) return alert("Selecciona un familiar primero.");
      
      await addMedicationDB({
          id: `med_${Date.now()}`,
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
  };

  const handleTakeDose = async (med: MedicationSchedule) => {
      const newStock = Math.max(0, med.currentStock - 1); // Asumimos 1 por dosis simplificado
      await takeDoseDB(med.id, newStock);
  };

  const handleDeleteMed = async (id: string) => {
      if(confirm("¿Borrar este medicamento?")) await deleteMedicationDB(id);
  };

  const activeMember = members.find(m => m.id === selectedMemberId);
  const filteredMeds = medications.filter(m => m.familyMemberId === selectedMemberId);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header Colorido */}
        <div className="bg-gradient-to-r from-teal-500 to-blue-600 p-5 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10 transform translate-x-4 -translate-y-4">
                <Heart size={100} fill="white" />
            </div>
            <div className="flex justify-between items-center relative z-10">
                <div>
                    <h3 className="font-bold text-xl flex items-center gap-2">
                        <Users className="h-6 w-6"/> Vitalis Family
                    </h3>
                    <p className="text-teal-100 text-xs">Cuidamos de los que amas</p>
                </div>
                <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition"><X/></button>
            </div>
        </div>

        {/* Members Scroll Horizontal */}
        <div className="bg-gray-50 border-b border-gray-200 p-4 shrink-0">
             <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                 {/* Botón Agregar */}
                 <button onClick={() => setShowAddMember(true)} className="flex flex-col items-center gap-2 shrink-0 group">
                     <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 group-hover:border-teal-500 group-hover:text-teal-500 transition-colors bg-white">
                         <Plus size={24}/>
                     </div>
                     <span className="text-[10px] font-bold text-gray-500 uppercase">Agregar</span>
                 </button>

                 {members.map(member => (
                     <button 
                        key={member.id} 
                        onClick={() => setSelectedMemberId(member.id)}
                        className={`flex flex-col items-center gap-2 shrink-0 transition-transform ${selectedMemberId === member.id ? 'scale-110' : 'opacity-70 hover:opacity-100'}`}
                     >
                         <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md border-2 ${selectedMemberId === member.id ? 'border-teal-500 ring-2 ring-teal-200' : 'border-white'} ${member.color}`}>
                             {member.name.charAt(0).toUpperCase()}
                         </div>
                         <span className={`text-xs font-bold ${selectedMemberId === member.id ? 'text-teal-700' : 'text-gray-500'}`}>{member.name}</span>
                     </button>
                 ))}
                 
                 {members.length === 0 && !showAddMember && (
                     <p className="text-xs text-gray-400 flex items-center">Agrega a tu familia para empezar &rarr;</p>
                 )}
             </div>
        </div>

        {/* Content Body */}
        <div className="flex-grow overflow-y-auto p-4 bg-gray-50">
            {showAddMember ? (
                <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 animate-in slide-in-from-top-4">
                    <h4 className="font-bold text-gray-800 mb-4">Nuevo Familiar</h4>
                    <form onSubmit={handleAddMember} className="space-y-4">
                        <input className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nombre (Ej: Mamá)" value={newMemberName} onChange={e => setNewMemberName(e.target.value)} autoFocus required />
                        <div className="grid grid-cols-2 gap-2">
                             <button type="button" onClick={() => setNewMemberRel('PARENT')} className={`p-2 rounded border text-sm ${newMemberRel === 'PARENT' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-white text-gray-500'}`}>Padre/Madre</button>
                             <button type="button" onClick={() => setNewMemberRel('CHILD')} className={`p-2 rounded border text-sm ${newMemberRel === 'CHILD' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-white text-gray-500'}`}>Hijo/a</button>
                             <button type="button" onClick={() => setNewMemberRel('PARTNER')} className={`p-2 rounded border text-sm ${newMemberRel === 'PARTNER' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-white text-gray-500'}`}>Pareja</button>
                             <button type="button" onClick={() => setNewMemberRel('OTHER')} className={`p-2 rounded border text-sm ${newMemberRel === 'OTHER' ? 'bg-teal-50 border-teal-500 text-teal-700 font-bold' : 'bg-white text-gray-500'}`}>Otro</button>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setShowAddMember(false)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg font-bold">Cancelar</button>
                            <button type="submit" className="flex-1 bg-teal-600 text-white py-2 rounded-lg font-bold">Guardar</button>
                        </div>
                    </form>
                </div>
            ) : !activeMember ? (
                <div className="text-center py-10">
                    <Users className="h-16 w-16 text-gray-200 mx-auto mb-4"/>
                    <p className="text-gray-500">Selecciona o crea un perfil familiar.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {/* Pastillero */}
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-gray-700 text-lg flex items-center gap-2">
                            <Pill className="text-teal-500"/> Pastillero de {activeMember.name}
                        </h4>
                        <button onClick={() => setShowAddMed(!showAddMed)} className="text-teal-600 text-sm font-bold flex items-center gap-1 hover:bg-teal-50 px-3 py-1 rounded-lg transition">
                            <Plus size={16}/> Agregar Medicamento
                        </button>
                    </div>

                    {showAddMed && (
                        <div className="bg-white p-4 rounded-xl shadow-md border border-teal-100 animate-in fade-in">
                            <form onSubmit={handleAddMedication} className="space-y-3">
                                <input className="w-full border p-2 rounded-lg text-sm" placeholder="Nombre Medicamento (Ej: Losartán)" value={medName} onChange={e => setMedName(e.target.value)} required />
                                <div className="grid grid-cols-2 gap-3">
                                    <input type="number" className="w-full border p-2 rounded-lg text-sm" placeholder="Stock Total" value={medStock} onChange={e => setMedStock(e.target.value)} required />
                                    <input className="w-full border p-2 rounded-lg text-sm" placeholder="Frecuencia (Ej: 8 horas)" value={medFreq} onChange={e => setMedFreq(e.target.value)} required />
                                </div>
                                <input className="w-full border p-2 rounded-lg text-sm" placeholder="Dosis (Ej: 1 tableta)" value={medDose} onChange={e => setMedDose(e.target.value)} required />
                                
                                <select className="w-full border p-2 rounded-lg text-sm bg-gray-50" value={selectedProductLink} onChange={e => setSelectedProductLink(e.target.value)}>
                                    <option value="">-- Vincular Producto (Opcional) --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <button className="w-full bg-teal-600 text-white py-2 rounded-lg font-bold text-sm mt-2">Guardar Tratamiento</button>
                            </form>
                        </div>
                    )}

                    {filteredMeds.length === 0 ? (
                         <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                             <Smile className="h-10 w-10 text-gray-200 mx-auto mb-2"/>
                             <p className="text-sm text-gray-500">No hay medicamentos activos.</p>
                         </div>
                    ) : (
                        filteredMeds.map(med => {
                            const percent = Math.max(0, (med.currentStock / med.totalStock) * 100);
                            const isLow = med.currentStock <= 5;
                            const productLinked = products.find(p => p.id === med.productId);

                            return (
                                <div key={med.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h5 className="font-bold text-gray-800 text-lg">{med.name}</h5>
                                            <p className="text-xs text-gray-500 font-medium">{med.dose} • {med.frequencyLabel}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-2xl font-black ${isLow ? 'text-red-500' : 'text-teal-600'}`}>
                                                {med.currentStock}
                                            </span>
                                            <span className="text-[10px] uppercase font-bold text-gray-400 block">Restantes</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 mb-3 overflow-hidden">
                                        <div className={`h-2 rounded-full transition-all duration-500 ${isLow ? 'bg-red-500' : 'bg-teal-500'}`} style={{ width: `${percent}%` }}></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => handleTakeDose(med)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition flex items-center justify-center gap-1"><Check size={16}/> Tomar Dosis</button>
                                        {isLow && productLinked && (
                                            <button onClick={() => { onClose(); onAddToCart(productLinked); }} className="flex-1 bg-red-50 text-red-600 py-2 rounded-lg text-sm font-bold hover:bg-red-100 transition flex items-center justify-center gap-1 animate-pulse"><RefreshCw size={16}/> Reabastecer</button>
                                        )}
                                    </div>
                                    <button onClick={() => handleDeleteMed(med.id)} className="absolute top-2 right-2 p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default FamilyHealthModal;