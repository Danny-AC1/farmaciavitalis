
import React, { useState } from 'react';
import { X, Lock, ArrowRight, UserCircle, Briefcase, Truck, Key } from 'lucide-react';
import { ADMIN_PASSWORD, CASHIER_PASSWORD, DRIVER_PASSWORD, User } from '../types';

interface StaffAccessModalProps {
  onClose: () => void;
  onAuthorized: (view: 'ADMIN_DASHBOARD' | 'DRIVER_DASHBOARD', role: User['role']) => void;
}

const StaffAccessModal: React.FC<StaffAccessModalProps> = ({ onClose, onAuthorized }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const validateCode = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!code) return;
    
    setIsValidating(true);
    setError(false);
    
    // Simulación de verificación de seguridad
    setTimeout(() => {
      if (code === ADMIN_PASSWORD) {
        onAuthorized('ADMIN_DASHBOARD', 'ADMIN');
        onClose();
      } else if (code === CASHIER_PASSWORD) {
        onAuthorized('ADMIN_DASHBOARD', 'CASHIER');
        onClose();
      } else if (code === DRIVER_PASSWORD) {
        onAuthorized('DRIVER_DASHBOARD', 'DRIVER');
        onClose();
      } else {
        setError(true);
        setCode('');
        setIsValidating(false);
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
        
        {/* Header */}
        <div className="p-8 text-center relative">
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 text-white/30 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
          
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-teal-500/20 rotate-3 group">
            <Lock className="text-white h-8 w-8" />
          </div>
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Terminal Vitalis</h3>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">SISTEMA DE CONTROL DE PERSONAL</p>
        </div>

        {/* Input de Seguridad */}
        <form onSubmit={validateCode} className="px-8 pb-10 space-y-6">
            <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-teal-400 transition-colors">
                    <Key size={18} />
                </div>
                <input 
                    type="password"
                    autoFocus
                    placeholder="CÓDIGO DE ACCESO"
                    className={`w-full bg-white/5 border-2 ${error ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-teal-500'} rounded-2xl py-4 pl-12 pr-4 text-white font-black tracking-[0.5em] outline-none transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-bold placeholder:text-xs text-center`}
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError(false); }}
                    disabled={isValidating}
                />
            </div>

            {error && (
                <p className="text-red-400 text-[10px] font-black uppercase text-center tracking-widest animate-shake">
                    ❌ Código Incorrecto - Acceso Denegado
                </p>
            )}

            <button
                type="submit"
                disabled={!code || isValidating}
                className="w-full bg-teal-500 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-teal-400 transition-all active:scale-95 disabled:opacity-30 shadow-lg shadow-teal-500/20"
            >
                {isValidating ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                    <>ENTRAR A TERMINAL <ArrowRight size={16}/></>
                )}
            </button>
        </form>

        {/* Roles Informativos */}
        <div className="bg-white/5 p-6 flex justify-around items-center border-t border-white/10">
           <div className="flex flex-col items-center gap-1 opacity-30 hover:opacity-100 transition-opacity">
              <UserCircle size={16} className="text-white"/>
              <span className="text-[8px] font-black text-white uppercase">Admin</span>
           </div>
           <div className="flex flex-col items-center gap-1 opacity-30 hover:opacity-100 transition-opacity">
              <Briefcase size={16} className="text-white"/>
              <span className="text-[8px] font-black text-white uppercase">Cajero</span>
           </div>
           <div className="flex flex-col items-center gap-1 opacity-30 hover:opacity-100 transition-opacity">
              <Truck size={16} className="text-white"/>
              <span className="text-[8px] font-black text-white uppercase">Delivery</span>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-8px); }
            75% { transform: translateX(8px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default StaffAccessModal;
