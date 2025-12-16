import React, { useState } from 'react';
import { auth } from '../services/firebase';
// @ts-ignore
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { saveUserDB } from '../services/db';
import { X, LogIn, UserPlus, Loader2 } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ onClose, onSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Manejo de Login/Registro con Email
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isRegister) {
        // Validaciones básicas antes de enviar a Firebase
        if (password.length < 6) throw new Error("La contraseña debe tener al menos 6 caracteres.");
        if (!name.trim()) throw new Error("El nombre es obligatorio.");

        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        
        // Guardar datos extra en Firestore inmediatamente
        await saveUserDB({
            uid: userCred.user.uid,
            email: email,
            displayName: name,
            phone: phone || '',
            address: address || '',
            role: 'USER',
            points: 0,
            createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      let msg = "Ocurrió un error. Intenta de nuevo.";
      
      if (err.code === 'auth/operation-not-allowed') {
          msg = "Error de configuración: Habilita 'Email/Password' en la consola de Firebase > Authentication.";
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
          msg = "Credenciales incorrectas.";
      } else if (err.code === 'auth/email-already-in-use') {
          msg = "Este correo ya está registrado.";
      } else if (err.code === 'auth/weak-password') {
          msg = "La contraseña es muy débil (mínimo 6 caracteres).";
      } else if (err.message) {
          msg = err.message;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-teal-600 p-4 flex justify-between items-center text-white">
          <h3 className="font-bold text-lg">{isRegister ? 'Crear Cuenta' : 'Iniciar Sesión'}</h3>
          <button onClick={onClose}><X /></button>
        </div>
        
        <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Nombre Completo</label>
                    <input required type="text" className="w-full border-b border-gray-300 focus:border-teal-500 outline-none py-1 transition-colors" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Teléfono</label>
                    <input required type="tel" className="w-full border-b border-gray-300 focus:border-teal-500 outline-none py-1 transition-colors" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Dirección (Machalilla)</label>
                    <input required type="text" className="w-full border-b border-gray-300 focus:border-teal-500 outline-none py-1 transition-colors" value={address} onChange={e => setAddress(e.target.value)} />
                    </div>
                </div>
            )}
            
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Correo Electrónico</label>
                <input required type="email" className="w-full border-b border-gray-300 focus:border-teal-500 outline-none py-1 transition-colors" value={email} onChange={e => setEmail(e.target.value)} />
            </div>
            <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Contraseña</label>
                <input required type="password" className="w-full border-b border-gray-300 focus:border-teal-500 outline-none py-1 transition-colors" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-50 p-2 rounded border border-red-100">{error}</p>}

            <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-teal-600/20 disabled:opacity-70"
            >
                {isLoading ? <Loader2 className="animate-spin" /> : (isRegister ? <UserPlus className="h-5 w-5"/> : <LogIn className="h-5 w-5"/>)}
                {isRegister ? 'Registrarme' : 'Entrar con Email'}
            </button>
            </form>

            <div className="text-center mt-6 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => { setIsRegister(!isRegister); setError(''); }} className="text-teal-600 text-sm font-semibold hover:underline">
                {isRegister ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;