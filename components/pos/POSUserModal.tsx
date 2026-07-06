
import React from 'react';
import { UserPlus, X } from 'lucide-react';

interface POSUserModalProps {
  showUserForm: boolean;
  resetForm: () => void;
  handleSaveUser: (e: React.FormEvent) => void;
  regCedula: string;
  setRegCedula: (s: string) => void;
  regName: string;
  setRegName: (s: string) => void;
  regPhone: string;
  setRegPhone: (s: string) => void;
}

const POSUserModal: React.FC<POSUserModalProps> = ({
  showUserForm, resetForm, handleSaveUser, regCedula, setRegCedula,
  regName, setRegName, regPhone, setRegPhone
}) => {
  if (!showUserForm) return null;

  return (
    <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
        <div className="bg-white rounded-2xl md:rounded-[2rem] w-full max-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-slate-900 p-4 md:p-5 text-white flex justify-between items-center">
                <h3 className="font-black text-sm md:text-base uppercase tracking-tight flex items-center gap-2"><UserPlus size={18}/> Nuevo Cliente</h3>
                <button onClick={resetForm} className="bg-white/10 p-1 rounded-full hover:bg-white/20 transition-colors"><X size={16}/></button>
            </div>
            <form onSubmit={handleSaveUser} className="p-4 md:p-6 space-y-3 md:space-y-4">
                <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Número de Cédula</label><input required className="w-full bg-slate-100 border-none p-2 md:p-2.5 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-xs md:text-sm" value={regCedula} onChange={e => setRegCedula(e.target.value)} /></div>
                <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nombre Completo</label><input required className="w-full bg-slate-100 border-none p-2 md:p-2.5 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold uppercase text-xs md:text-sm" value={regName} onChange={e => setRegName(e.target.value)} /></div>
                <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Teléfono</label><input required className="w-full bg-slate-100 border-none p-2 md:p-2.5 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-xs md:text-sm" value={regPhone} onChange={e => setRegPhone(e.target.value)} /></div>
                <button type="submit" className="w-full bg-teal-600 text-white py-3 md:py-3.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">REGISTRAR CLIENTE</button>
            </form>
        </div>
    </div>
  );
};

export default POSUserModal;
