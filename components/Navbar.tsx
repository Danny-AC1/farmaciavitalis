import React, { useState } from 'react';
import { Heart, ShoppingCart, User as UserIcon, Gift } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onLogoClick: () => void;
  onUserClick: () => void;
  currentUser: User | null;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onAdminClick, onLogoClick, onUserClick, currentUser }) => {
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

  return (
    <nav className="bg-teal-600 text-white sticky top-0 z-50 border-b border-teal-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center cursor-pointer select-none" onClick={handleSecretClick}>
            <Heart className={`h-8 w-8 text-white mr-2 fill-current transition-transform ${clickCount > 0 ? 'scale-110' : ''}`} />
            <div>
              <h1 className="text-xl font-bold tracking-tight">VITALIS</h1>
              <p className="text-xs text-teal-100">Tu Salud Al Día</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            {currentUser && currentUser.points > 0 && (
                <div className="hidden md:flex items-center bg-teal-700 px-2 py-1 rounded-full text-xs font-bold text-yellow-300 border border-yellow-300/30">
                    <Gift className="h-3 w-3 mr-1" /> {currentUser.points} pts
                </div>
            )}
            <button 
              onClick={onUserClick}
              className="p-2 rounded-full hover:bg-teal-700 transition-colors flex items-center gap-2"
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
      <div className="bg-teal-800 py-1 text-center text-xs font-medium text-teal-50 flex justify-center gap-4 px-2 flex-wrap">
        <span>📍 Envíos Machalilla (+$1.00)</span>
      </div>
    </nav>
  );
};

export default Navbar;