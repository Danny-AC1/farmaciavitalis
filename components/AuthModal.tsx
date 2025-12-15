import React, { useState } from 'react';
import { auth, googleProvider, facebookProvider, signInWithPopup } from '../services/firebase';
// @ts-ignore
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { saveUserDB, getUserDB } from '../services/db';
import { X, LogIn, UserPlus, Loader2, Facebook } from 'lucide-react';

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

  // Manejo de Login Social (Google/Facebook)
  const handleSocialLogin = async (provider: any) => {
    setIsLoading(true);
    setError('');
    try {
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        // Verificar si el usuario ya existe en DB, si no, crearlo
        const existingUser = await getUserDB(user.uid);
        
        if (!existingUser) {
            await saveUserDB({
                uid: user.uid,
                email: user.email || '',
                displayName: user.displayName || 'Usuario',
                phone: user.phoneNumber || '',
                address: '', // Dirección vacía al inicio
                role: 'USER',
                points: 0,
                createdAt: new Date().toISOString()
            });
        }
        
        onSuccess();
        onClose();
    } catch (err: any) {
        console.error("Social Login Error:", err);
        if (err.code === 'auth/operation-not-allowed') {
            setError("Error configuración: Habilita el proveedor social (Google/Facebook) en Firebase Console.");
        } else if (err.code === 'auth/account-exists-with-different-credential') {
            setError("Ya existe una cuenta con este email usando otro método de acceso.");
        } else if (err.code === 'auth/popup-closed-by-user') {
            setError("Cancelaste el inicio de sesión.");
        } else {
            setError("No se pudo iniciar sesión con la red social.");
        }
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

            <div className="relative my-6">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
                <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">O continúa con</span></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <button 
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSocialLogin(googleProvider)}
                    className="flex items-center justify-center gap-2 w-full border border-gray-300 rounded-lg p-2.5 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                    <svg className="h-5 w-5" viewBox="0 0 24 24">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                    </svg>
                    <span className="text-sm font-semibold text-gray-600">Google</span>
                </button>
                <button 
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleSocialLogin(facebookProvider)}
                    className="flex items-center justify-center gap-2 w-full bg-[#1877F2] text-white rounded-lg p-2.5 hover:bg-[#166fe5] transition-colors disabled:opacity-50"
                >
                    <Facebook className="h-5 w-5 fill-current" />
                    <span className="text-sm font-semibold">Facebook</span>
                </button>
            </div>

            <div className="text-center mt-6">
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