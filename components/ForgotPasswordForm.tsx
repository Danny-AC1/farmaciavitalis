
import React, { useState } from 'react';
import { auth } from '../services/firebase';
// @ts-ignore
import { sendPasswordResetEmail } from 'firebase/auth';
import { Mail, Loader2, ArrowLeft, Send } from 'lucide-react';

interface ForgotPasswordFormProps {
  onBack: () => void;
}

const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setIsSent(true);
    } catch (err: any) {
      let msg = "Error al enviar el correo de recuperación.";
      if (err.code === 'auth/user-not-found') msg = "No existe un usuario con este correo.";
      else if (err.code === 'auth/invalid-email') msg = "Correo electrónico no válido.";
      else if (err.message) msg = err.message;
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSent) {
    return (
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <div className="bg-teal-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
          <Mail className="text-teal-600 h-8 w-8" />
        </div>
        <h3 className="text-xl font-bold text-gray-800">¡Correo Enviado!</h3>
        <p className="text-sm text-gray-600">
          Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada y sigue las instrucciones.
        </p>
        <button 
          onClick={onBack}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold transition-all shadow-lg mt-4"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  return (
    <div className="animate-in slide-in-from-right-4 duration-300">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-teal-600 font-bold text-xs uppercase mb-6 transition-colors"
      >
        <ArrowLeft size={16} /> Volver
      </button>

      <h3 className="text-xl font-bold text-gray-800 mb-2">Recuperar Contraseña</h3>
      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-6">
        Ingresa tu correo para recibir un enlace de restablecimiento.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="text-xs font-black text-gray-400 uppercase tracking-widest block mb-1 ml-1">Correo Electrónico</label>
          <div className="relative group">
            <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-teal-500 transition-colors" size={18} />
            <input 
              required 
              type="email" 
              className="w-full border-b-2 border-gray-100 focus:border-teal-500 outline-none py-2 pl-7 text-gray-700 font-bold transition-all" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-[10px] font-black text-center bg-red-50 p-2 rounded-lg border border-red-100 uppercase tracking-widest">{error}</p>}

        <button 
          type="submit" 
          disabled={isLoading || !email} 
          className="w-full bg-slate-900 hover:bg-teal-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl shadow-slate-900/20 disabled:opacity-50 transition-all active:scale-95"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : <Send className="h-4 w-4"/>}
          Enviar enlace
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordForm;
