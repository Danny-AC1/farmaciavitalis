import React, { useState } from 'react';
import { User, FamilyMember, MedicationSchedule } from '../../../types';
import { addFamilyMemberDB, updateFamilyMemberDB, deleteFamilyMemberDB } from '../../../services/db';
import { Users, Plus, Trash2, Edit3, Heart, Stethoscope, Droplet, ShieldAlert, X } from 'lucide-react';

interface FamilyProfilesTabProps {
  user: User;
  members: FamilyMember[];
  medications: MedicationSchedule[];
  onSelectMemberForMed?: (memberId: string) => void;
}

const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-teal-500', 'bg-rose-500', 'bg-indigo-500'];

const RELATIONSHIPS = [
  { id: 'SELF', label: 'Yo (Titular)' },
  { id: 'PARENT', label: 'Padre / Madre' },
  { id: 'CHILD', label: 'Hijo / Mía' },
  { id: 'PARTNER', label: 'Pareja' },
  { id: 'GRANDPARENT', label: 'Abuelo / Abuela' },
  { id: 'PET', label: 'Mascota' },
  { id: 'OTHER', label: 'Otro Familiar' },
];

export const FamilyProfilesTab: React.FC<FamilyProfilesTabProps> = ({
  user,
  members,
  medications,
  onSelectMemberForMed,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<FamilyMember['relationship']>('OTHER');
  const [allergies, setAllergies] = useState('');
  const [medicalConditions, setMedicalConditions] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName('');
    setRelationship('OTHER');
    setAllergies('');
    setMedicalConditions('');
    setBloodType('');
    setBirthDate('');
    setDoctorName('');
    setNotes('');
    setEditingMember(null);
  };

  const openEdit = (member: FamilyMember) => {
    setEditingMember(member);
    setName(member.name);
    setRelationship(member.relationship);
    setAllergies(member.allergies || '');
    setMedicalConditions(member.medicalConditions || '');
    setBloodType(member.bloodType || '');
    setBirthDate(member.birthDate || '');
    setDoctorName(member.doctorName || '');
    setNotes(member.notes || '');
    setShowAddModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      if (editingMember) {
        await updateFamilyMemberDB(editingMember.id, {
          name,
          relationship,
          allergies,
          medicalConditions,
          bloodType,
          birthDate,
          doctorName,
          notes,
        });
      } else {
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        await addFamilyMemberDB({
          id: '',
          userId: user.uid,
          name,
          relationship,
          color,
          allergies,
          medicalConditions,
          bloodType,
          birthDate,
          doctorName,
          notes,
        });
      }
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error("Error al guardar perfil familiar:", err);
      alert("Error al guardar la información del integrante.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (member: FamilyMember) => {
    if (confirm(`¿Estás seguro de eliminar el perfil de "${member.name.toUpperCase()}"? Se borrarán sus tratamientos y ficha de salud asociadas.`)) {
      await deleteFamilyMemberDB(member.id);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 to-slate-900 rounded-[2rem] p-6 text-white flex justify-between items-center shadow-md">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
            <Users className="text-teal-400" size={24} /> Perfiles de Salud Familiares
          </h3>
          <p className="text-xs text-teal-200/80 mt-1 font-medium">
            Organiza alergias, antecedentes médicos y esquemas de salud de toda tu familia en un solo lugar.
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs uppercase px-4 py-3 rounded-2xl transition-all shadow-lg flex items-center gap-2 shrink-0 active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Agregar Integrante
        </button>
      </div>

      {/* Lista de Miembros */}
      {members.length === 0 ? (
        <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
          <Users className="mx-auto h-16 w-16 text-slate-200 mb-4" />
          <h4 className="font-black text-slate-700 text-lg uppercase tracking-tight mb-1">Aún no has agregado integrantes</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto mb-6">
            Crea sub-perfiles para Papá, Mamá, tus Hijos o Mascotas para registrar sus medicamentos y alergias.
          </p>
          <button
            onClick={() => { resetForm(); setShowAddModal(true); }}
            className="bg-teal-600 text-white font-black text-xs uppercase px-6 py-3.5 rounded-2xl shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all inline-flex items-center gap-2"
          >
            <Plus size={18} /> Crear Primer Perfil Familiar
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {members.map((member) => {
            const memberMeds = medications.filter((m) => m.familyMemberId === member.id);
            const relObj = RELATIONSHIPS.find((r) => r.id === member.relationship);

            return (
              <div
                key={member.id}
                className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100 hover:shadow-md transition-all relative group flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 rounded-2xl ${member.color || 'bg-teal-600'} flex items-center justify-center text-white text-xl font-black shadow-md border-2 border-white shrink-0`}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full inline-block mb-0.5">
                          {relObj?.label || 'Familiar'}
                        </span>
                        <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight leading-snug">{member.name}</h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(member)}
                        className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all"
                        title="Editar Ficha"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                        title="Eliminar Integrante"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Ficha Médica */}
                  <div className="space-y-2.5 bg-slate-50/80 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700">
                    <div className="flex items-start gap-2">
                      <ShieldAlert size={15} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest block">Alergias</span>
                        <span className="font-bold text-slate-800">{member.allergies || 'Ninguna registrada'}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Heart size={15} className="text-purple-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-black text-[10px] text-slate-400 uppercase tracking-widest block">Condiciones / Diagnóstico</span>
                        <span className="font-bold text-slate-800">{member.medicalConditions || 'Ninguna preexistente'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                      <div className="flex items-center gap-1.5">
                        <Droplet size={14} className="text-red-500" />
                        <span className="text-[10px] font-bold text-slate-600">
                          Sangre: <strong className="text-slate-900">{member.bloodType || 'N/R'}</strong>
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <Stethoscope size={14} className="text-teal-600" />
                        <span className="text-[10px] font-bold text-slate-600 truncate">
                          Dr: <strong className="text-slate-900">{member.doctorName || 'N/R'}</strong>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    {memberMeds.length} Treatment(s) Activo(s)
                  </span>

                  {onSelectMemberForMed && (
                    <button
                      onClick={() => onSelectMemberForMed(member.id)}
                      className="text-[10px] font-black text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl uppercase tracking-wider transition-all"
                    >
                      Ver / Añadir Tomas
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Miembro Familiar */}
      {showAddModal && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in duration-200">
            <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
              <div>
                <h4 className="font-black text-lg uppercase tracking-tight">
                  {editingMember ? 'Editar Ficha Médica' : 'Nuevo Integrante Familiar'}
                </h4>
                <p className="text-teal-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Salud y Medicación Personalizada
                </p>
              </div>
              <button
                onClick={() => { setShowAddModal(false); resetForm(); }}
                className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-all"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto no-scrollbar">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Nombre Completo *</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  placeholder="Ej: Mamá Teresa, Papá Jorge..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Parentesco</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {RELATIONSHIPS.map((rel) => (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => setRelationship(rel.id as any)}
                      className={`p-2.5 rounded-xl border text-[10px] font-black uppercase transition-all ${
                        relationship === rel.id
                          ? 'bg-teal-600 border-teal-600 text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {rel.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Alergias Conocidas</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                    placeholder="Ej: Penicilina, AINEs, Polen"
                    value={allergies}
                    onChange={(e) => setAllergies(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Diagnósticos / Condiciones</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                    placeholder="Ej: Hipertensión, Diabetes T2"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Tipo de Sangre</label>
                  <select
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                  >
                    <option value="">-- Seleccionar --</option>
                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map((bt) => (
                      <option key={bt} value={bt}>{bt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Médico de Cabecera</label>
                  <input
                    className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                    placeholder="Ej: Dr. Ramírez"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Notas Médicas Adicionales</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-xs outline-none focus:border-teal-500 focus:bg-white transition-all"
                  placeholder="Instrucciones especiales o contactos de emergencia..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="flex-1 bg-slate-100 text-slate-600 py-3.5 rounded-xl font-black text-xs uppercase"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-teal-600 text-white py-3.5 rounded-xl font-black text-xs uppercase tracking-wider shadow-lg shadow-teal-100 hover:bg-teal-700 transition-all"
                >
                  {isSaving ? 'Guardando...' : editingMember ? 'Actualizar Ficha' : 'Guardar Perfil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
