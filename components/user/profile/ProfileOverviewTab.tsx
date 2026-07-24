import React, { useState } from 'react';
import { User } from '../../../types';
import { updateUserFieldsDB } from '../../../services/db';
import { Mail, Phone, MapPin, Award, ShieldCheck, Edit3, Save, Check, UserCheck, Sparkles, HeartPulse, Pill, RefreshCw } from 'lucide-react';

interface ProfileOverviewTabProps {
  user: User;
  familyCount: number;
  medsCount: number;
  refillCount: number;
  onNavigateTab: (tab: 'family' | 'calendar' | 'refill' | 'orders') => void;
}

export const ProfileOverviewTab: React.FC<ProfileOverviewTabProps> = ({
  user,
  familyCount,
  medsCount,
  refillCount,
  onNavigateTab,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [cedula, setCedula] = useState(user.cedula || '');
  const [address, setAddress] = useState(user.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Cómputo de Nivel de Fidelidad Vitalis
  const points = user.points || 0;
  const level = points >= 1000 ? 'ORO' : points >= 300 ? 'PLATA' : 'BRONCE';
  const levelColor = level === 'ORO' ? 'from-amber-400 to-yellow-600 text-amber-950' : level === 'PLATA' ? 'from-slate-300 to-slate-500 text-slate-900' : 'from-amber-700 to-amber-900 text-amber-100';
  const pointsToNextLevel = level === 'BRONCE' ? 300 - points : level === 'PLATA' ? 1000 - points : 0;
  const levelProgress = level === 'BRONCE' ? Math.min(100, (points / 300) * 100) : level === 'PLATA' ? Math.min(100, ((points - 300) / 700) * 100) : 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUserFieldsDB(user.uid, {
        displayName,
        phone,
        cedula,
        address,
      });
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Error al guardar perfil:", err);
      alert("Error al actualizar la información del perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Banner de Nivel Vitalis y Puntos */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 rounded-[2.5rem] p-6 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-10 -translate-y-10 pointer-events-none">
          <Award size={180} />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-tr from-teal-500 to-emerald-400 rounded-3xl flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-teal-900/50 border-2 border-white/20 shrink-0">
              {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-gradient-to-r ${levelColor} shadow-sm`}>
                  Nivel {level}
                </span>
                <span className="text-teal-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1">
                  <ShieldCheck size={12} /> Cliente Verificado
                </span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white">{user.displayName || 'Usuario Vitalis'}</h2>
              <p className="text-xs text-slate-300 font-medium">{user.email}</p>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 min-w-[200px]">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[10px] font-black text-teal-300 uppercase tracking-wider">Puntos Vitalis</span>
              <span className="text-xl font-black text-white">{points} PTS</span>
            </div>
            {level !== 'ORO' ? (
              <div>
                <div className="w-full bg-black/40 rounded-full h-1.5 mb-1.5 overflow-hidden">
                  <div className="bg-teal-400 h-full rounded-full transition-all duration-1000" style={{ width: `${levelProgress}%` }}></div>
                </div>
                <p className="text-[9px] text-slate-300 font-medium">Faltan {pointsToNextLevel} pts para nivel {level === 'BRONCE' ? 'PLATA' : 'ORO'}</p>
              </div>
            ) : (
              <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest flex items-center gap-1">
                <Sparkles size={10} /> ¡Nivel Máximo de Beneficios!
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Resumen Métricas Rápidas */}
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => onNavigateTab('family')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-teal-200 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <HeartPulse size={20} />
          </div>
          <span className="text-2xl font-black text-slate-800 block leading-none">{familyCount}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Familiares</span>
        </button>

        <button
          onClick={() => onNavigateTab('calendar')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all text-left group"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <Pill size={20} />
          </div>
          <span className="text-2xl font-black text-slate-800 block leading-none">{medsCount}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Tratamientos</span>
        </button>

        <button
          onClick={() => onNavigateTab('refill')}
          className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left group relative overflow-hidden"
        >
          {refillCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          )}
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
            <RefreshCw size={20} />
          </div>
          <span className="text-2xl font-black text-slate-800 block leading-none">{refillCount}</span>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Refills Pendientes</span>
        </button>
      </div>

      {/* Formulario / Vista Datos Personales */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-slate-100">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-base flex items-center gap-2">
            <UserCheck className="text-teal-600" size={20} /> Información Personal & Entrega
          </h3>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-black text-teal-600 hover:text-teal-700 bg-teal-50 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1"
            >
              <Edit3 size={14} /> Editar
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600"
            >
              Cancelar
            </button>
          )}
        </div>

        {saveSuccess && (
          <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <Check size={16} /> ¡Información guardada exitosamente!
          </div>
        )}

        {!isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Nombre Completo</span>
              <p className="text-sm font-bold text-slate-800">{user.displayName || 'No registrado'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Correo Electrónico</span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Mail size={14} className="text-teal-600" /> {user.email}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Teléfono Móvil</span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Phone size={14} className="text-teal-600" /> {user.phone || 'Sin número registrado'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Cédula / RUC</span>
              <p className="text-sm font-bold text-slate-800">{user.cedula || 'Sin cédula registrada'}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl md:col-span-2">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1">Dirección Principal de Despacho</span>
              <p className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <MapPin size={14} className="text-teal-600 shrink-0" /> {user.address || 'Sin dirección guardada'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Nombre Completo</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Teléfono Móvil</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  placeholder="0991234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Cédula de Identidad</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  placeholder="1312345678"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1 ml-1">Dirección de Despacho</label>
                <input
                  className="w-full bg-slate-50 border border-slate-200 p-3 rounded-xl font-bold text-sm outline-none focus:border-teal-500 focus:bg-white transition-all"
                  placeholder="Ej: Barrio Central, Calle Principal..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-teal-600 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-wider hover:bg-teal-700 shadow-lg shadow-teal-100 flex items-center gap-2 transition-all"
              >
                <Save size={16} /> {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
