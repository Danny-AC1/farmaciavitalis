
import React from 'react';
import { User } from '../types';
import { X, LogOut, User as Mail, Phone, Award, ShieldCheck } from 'lucide-react';
import { auth } from '../services/firebase';

interface ProfileModalProps {
  user: User;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, onClose }) => {
  const handleLogout = () => {
    if (confirm("¿Estás seguro de que deseas cerrar tu sesión?")) {
      auth.signOut();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-[2.5rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="bg-slate-900 p-8 text-center text-white relative">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
          >
            <X size={20} />
          </button>
          <div className="w-24 h-24 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-slate-800 shadow-xl text-3xl font-black">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight">{user.displayName}</h3>
          <p className="text-teal-400 text-xs font-bold uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
            <ShieldCheck size={12}/> Cliente Vitalis
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-teal-600 transition-colors">
                <Mail size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Correo Electrónico</p>
                <p className="text-sm font-bold text-slate-800">{user.email}</p>
              </div>
            </div>

            {user.phone && (
              <div className="flex items-center gap-4 group">
                <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-teal-600 transition-colors">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Teléfono</p>
                  <p className="text-sm font-bold text-slate-800">{user.phone}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 group">
              <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 group-hover:text-teal-600 transition-colors">
                <Award size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase leading-none mb-1">Puntos Acumulados</p>
                <p className="text-sm font-black text-teal-600">{user.points} PTS</p>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100">
            <button 
              onClick={handleLogout}
              className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center justify-center gap-2"
            >
              <LogOut size={18} /> Cerrar Sesión
            </button>
          </div>
          
          <p className="text-[9px] text-center text-slate-300 font-bold uppercase tracking-widest">
            Vitalis Machalilla v2.5
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
