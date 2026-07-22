import React from 'react';
import { 
  Search, 
  X, 
  Clock, 
  ShieldCheck, 
  ClipboardList, 
  Volume2, 
  VolumeX 
} from 'lucide-react';
import { User } from '../../types';

interface ChatSidebarInfoProps {
  currentUser: User;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenPrescriptionModal: () => void;
}

export const ChatSidebarInfo: React.FC<ChatSidebarInfoProps> = ({
  currentUser,
  searchQuery,
  setSearchQuery,
  soundEnabled,
  setSoundEnabled,
  onOpenPrescriptionModal,
}) => {
  return (
    <div className="lg:col-span-4 bg-slate-50/70 border-r border-slate-200/60 p-4 flex flex-col justify-between overflow-y-auto custom-scrollbar">
      <div className="space-y-4">
        {/* Pharmacy Branding Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center font-black text-sm shadow-md shadow-teal-600/20">
              V
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                Farmacia Vitalis
              </h3>
              <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                Atención Farmacéutica
              </p>
            </div>
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-all border ${
              soundEnabled 
                ? 'bg-teal-50 text-teal-600 border-teal-100 shadow-2xs' 
                : 'bg-white text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? "Silenciar" : "Activar Sonido"}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>

        {/* Message Search */}
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase tracking-wider text-slate-400">Buscar en conversación</label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search size={13} />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por palabra clave..."
              className="w-full pl-8 pr-8 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:border-teal-500 transition shadow-2xs"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')} 
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>

        {/* Info & Medical Confidentiality Card */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-100 space-y-2.5 shadow-2xs">
          <div className="flex items-start gap-2.5 text-[10px] text-slate-600">
            <Clock size={12} className="text-teal-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-black uppercase tracking-wider text-slate-800 text-[9px]">Horario de Atención</p>
              <p className="text-slate-400 font-semibold mt-0.5">Lunes a Domingo: 8:00 AM - 8:00 PM</p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 text-[10px] text-slate-600">
            <ShieldCheck size={12} className="text-teal-600 mt-0.5 shrink-0" />
            <div>
              <p className="font-black uppercase tracking-wider text-slate-800 text-[9px]">Confidencialidad Médica</p>
              <p className="text-slate-400 font-semibold mt-0.5">Tus datos, recetas y consultas están protegidos por secreto farmacéutico.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPrescriptionModal}
            className="w-full mt-2 py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
          >
            <ClipboardList size={14} /> Subir Receta Médica
          </button>
        </div>
      </div>

      {/* User Card */}
      <div className="mt-6 pt-5 border-t border-slate-200/60 hidden lg:block">
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sesión Iniciada como</span>
        <p className="text-xs font-black text-slate-800 mt-0.5 truncate uppercase">{currentUser.displayName}</p>
        <p className="text-[10px] font-semibold text-slate-400 truncate">{currentUser.email}</p>
      </div>
    </div>
  );
};

export default ChatSidebarInfo;
