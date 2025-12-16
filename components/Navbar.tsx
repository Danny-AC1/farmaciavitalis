
import React, { useState } from 'react';
import { ShoppingCart, User as UserIcon, Gift, Plus, Leaf, Home, ClipboardList, HeartPulse, Sparkles, Stethoscope } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onLogoClick: () => void;
  onUserClick: () => void;
  currentUser: User | null;
  onTabChange: (tab: 'home' | 'orders' | 'assistant' | 'health' | 'services') => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onAdminClick, onLogoClick, onUserClick, currentUser, onTabChange }) => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleSecretClick = () => {
    const now = Date.now();
    if (now - lastClickTime > 500) {
      setClickCount(1);
      onLogoClick();
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      if (newCount >= 7) {
        onAdminClick();
        setClickCount(0);
      }
    }
    setLastClickTime(now);
  };

  const NavButton = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
    <button 
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-2 rounded-lg text-teal-100 hover:text-white hover:bg-teal-500/50 transition-all font-medium text-sm"
    >
      <Icon size={18} />
      <span>{label}</span>
    </button>
  );

  return (
    <nav className="bg-teal-600 text-white sticky top-0 z-50 border-b border-teal-700 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* LOGO */}
          <div className="flex items-center cursor-pointer select-none shrink-0" onClick={handleSecretClick}>
            <div className={`relative h-10 w-10 bg-gradient-to-br from-teal-500 to-teal-700 rounded-xl flex items-center justify-center mr-3 border border-white/20 shadow-md transition-transform duration-200 ${clickCount > 0 ? 'scale-110' : ''}`}>
                <Plus className="h-7 w-7 text-white" strokeWidth={3.5} />
                <Leaf className="absolute h-5 w-5 text-green-300 bottom-1 right-0.5 fill-green-300/80 drop-shadow-sm rotate-12" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">VITALIS</h1>
              <p className="text-xs text-teal-100 font-medium">Tu Salud Al Día</p>
            </div>
          </div>

          {/* DESKTOP MENU (Centered) */}
          <div className="hidden md:flex items-center space-x-1 bg-teal-800/30 p-1 rounded-xl backdrop-blur-sm mx-4">
             <NavButton icon={Home} label="Inicio" onClick={() => onTabChange('home')} />
             <NavButton icon={ClipboardList} label="Mis Pedidos" onClick={() => onTabChange('orders')} />
             <NavButton icon={Stethoscope} label="Servicios" onClick={() => onTabChange('services')} />
             <NavButton icon={HeartPulse} label="Salud Familiar" onClick={() => onTabChange('health')} />
             <NavButton icon={Sparkles} label="Asistente IA" onClick={() => onTabChange('assistant')} />
          </div>

          {/* RIGHT ACTIONS */}
          <div className="flex items-center space-x-3 shrink-0">
            {currentUser && currentUser.points > 0 && (
                <div className="hidden md:flex items-center bg-teal-700 px-2 py-1 rounded-full text-xs font-bold text-yellow-300 border border-yellow-300/30 cursor-help" title="Puntos canjeables en el checkout">
                    <Gift className="h-3 w-3 mr-1" /> {currentUser.points} pts
                </div>
            )}
            <button 
              onClick={onUserClick}
              className="p-2 rounded-full hover:bg-teal-700 transition-colors flex items-center gap-2"
              title="Mi Perfil"
            >
              {currentUser ? (
                 <div className="h-8 w-8 bg-teal-800 rounded-full flex items-center justify-center font-bold text-xs border border-teal-400 relative">
                    {currentUser.displayName.charAt(0)}
                    {currentUser.points > 0 && <span className="absolute -top-1 -right-1 h-3 w-3 bg-yellow-400 rounded-full border-2 border-teal-600"></span>}
                 </div>
              ) : (
                 <UserIcon className="h-6 w-6" />
              )}
            </button>
            <button 
              onClick={onCartClick}
              className="relative p-2 rounded-full hover:bg-teal-700 transition-colors"
              title="Ver Carrito"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-teal-600 transform translate-x-1/4 -translate-y-1/4 bg-white rounded-full">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="bg-teal-800 py-1 text-center text-xs font-medium text-teal-50 flex justify-center gap-4 px-2 flex-wrap shadow-inner">
        <span>📍 Envíos Machalilla (+$1.00)</span>
      </div>
    </nav>
  );
};

export default Navbar;
