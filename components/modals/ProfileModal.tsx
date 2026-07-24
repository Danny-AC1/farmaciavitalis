import React, { useState, useEffect } from 'react';
import { User, Product, FamilyMember, MedicationSchedule } from '../../types';
import { streamFamilyMembers, streamMedications } from '../../services/db';
import { auth } from '../../services/firebase';
import { ProfileOverviewTab } from '../user/profile/ProfileOverviewTab';
import { FamilyProfilesTab } from '../user/profile/FamilyProfilesTab';
import { TreatmentCalendarTab } from '../user/profile/TreatmentCalendarTab';
import { ContinuousRefillTab } from '../user/profile/ContinuousRefillTab';
import { OrdersAndPrescriptionsTab } from '../user/profile/OrdersAndPrescriptionsTab';
import { calculateRemainingDays } from '../../services/treatmentReminderService';
import { X, LogOut, UserCheck, Users, Pill, RefreshCw, Package } from 'lucide-react';

interface ProfileModalProps {
  user: User;
  products: Product[];
  onClose: () => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  onOpenSubscriptions?: () => void;
  initialTab?: 'overview' | 'family' | 'calendar' | 'refill' | 'orders';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  products,
  onClose,
  onAddToCart,
  initialTab = 'overview',
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'family' | 'calendar' | 'refill' | 'orders'>(initialTab);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [medications, setMedications] = useState<MedicationSchedule[]>([]);
  const [selectedMemberForMed, setSelectedMemberForMed] = useState<string | null>(null);

  useEffect(() => {
    if (!user.uid) return;
    const unsubFamily = streamFamilyMembers(user.uid, (data) => setFamilyMembers(data));
    const unsubMeds = streamMedications(user.uid, (data) => setMedications(data));
    return () => {
      unsubFamily();
      unsubMeds();
    };
  }, [user.uid]);

  const refillCount = medications.filter((m) => {
    const days = calculateRemainingDays(m);
    return m.active && days <= 5;
  }).length;

  const handleLogout = () => {
    if (confirm("¿Estás seguro de que deseas cerrar tu sesión en Farmacia Vitalis?")) {
      auth.signOut();
      onClose();
    }
  };

  const handleSelectMemberForMed = (memberId: string) => {
    setSelectedMemberForMed(memberId);
    setActiveTab('calendar');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-white/20 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-6 shrink-0 relative overflow-hidden border-b border-slate-800">
          <div className="flex justify-between items-center relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-lg border border-teal-400/30">
                {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white leading-none">
                    {user.displayName || 'Mi Perfil Vitalis'}
                  </h3>
                  <span className="bg-teal-500/20 text-teal-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full border border-teal-500/30">
                    {user.points || 0} PTS
                  </span>
                </div>
                <p className="text-slate-400 text-xs font-medium mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-2xl transition-all font-bold text-xs flex items-center gap-1.5"
                title="Cerrar Sesión"
              >
                <LogOut size={16} /> <span className="hidden sm:inline uppercase text-[10px] font-black">Salir</span>
              </button>
              <button
                onClick={onClose}
                className="p-2.5 bg-white/10 hover:bg-white/20 rounded-2xl transition-all text-white"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex items-center gap-2 overflow-x-auto mt-6 no-scrollbar pt-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-900/50 scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <UserCheck size={16} /> Mi Cuenta
            </button>

            <button
              onClick={() => setActiveTab('family')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'family'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-900/50 scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Users size={16} /> Familia ({familyMembers.length})
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'calendar'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-900/50 scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Pill size={16} /> Tomas ({medications.length})
            </button>

            <button
              onClick={() => setActiveTab('refill')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 relative ${
                activeTab === 'refill'
                  ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-900/50 scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <RefreshCw size={16} /> Refill 1-Clic
              {refillCount > 0 && (
                <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.2 rounded-full animate-pulse">
                  {refillCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shrink-0 ${
                activeTab === 'orders'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-900/50 scale-105'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Package size={16} /> Historial
            </button>
          </div>
        </div>

        {/* Contenido Dinámico de la Pestaña */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow no-scrollbar">
          {activeTab === 'overview' && (
            <ProfileOverviewTab
              user={user}
              familyCount={familyMembers.length}
              medsCount={medications.length}
              refillCount={refillCount}
              onNavigateTab={(tab) => {
                if (tab === 'family') setActiveTab('family');
                if (tab === 'calendar') setActiveTab('calendar');
                if (tab === 'refill') setActiveTab('refill');
                if (tab === 'orders') setActiveTab('orders');
              }}
            />
          )}

          {activeTab === 'family' && (
            <FamilyProfilesTab
              user={user}
              members={familyMembers}
              medications={medications}
              onSelectMemberForMed={handleSelectMemberForMed}
            />
          )}

          {activeTab === 'calendar' && (
            <TreatmentCalendarTab
              user={user}
              members={familyMembers}
              medications={medications}
              products={products}
              selectedMemberId={selectedMemberForMed}
              onAddToCart={onAddToCart}
            />
          )}

          {activeTab === 'refill' && (
            <ContinuousRefillTab
              user={user}
              medications={medications}
              products={products}
              members={familyMembers}
              onAddToCart={onAddToCart}
            />
          )}

          {activeTab === 'orders' && <OrdersAndPrescriptionsTab user={user} />}
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
