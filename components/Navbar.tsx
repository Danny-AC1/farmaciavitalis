import React, { useState } from 'react';
import { Heart, ShoppingCart } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  onLogoClick: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ cartCount, onCartClick, onAdminClick, onLogoClick }) => {
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleSecretClick = () => {
    const now = Date.now();
    
    // Reset if too much time passed between clicks (e.g., more than 500ms)
    if (now - lastClickTime > 500) {
      setClickCount(1);
      onLogoClick(); // Standard home navigation behavior
    } else {
      const newCount = clickCount + 1;
      setClickCount(newCount);
      
      if (newCount >= 7) {
        onAdminClick();
        setClickCount(0); // Reset after triggering
      }
    }
    setLastClickTime(now);
  };

  return (
    <nav className="bg-teal-600 text-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div 
            className="flex items-center cursor-pointer select-none" 
            onClick={handleSecretClick}
          >
            <Heart className={`h-8 w-8 text-white mr-2 fill-current transition-transform ${clickCount > 0 ? 'scale-110' : ''}`} />
            <div>
              <h1 className="text-xl font-bold tracking-tight">VITALIS</h1>
              <p className="text-xs text-teal-100">Tu Salud Al Día</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
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
      <div className="bg-teal-700 py-1 text-center text-xs font-medium text-teal-50">
        💊 Envíos a domicilio únicamente en {`"Machalilla"`} (+ $1.00)
      </div>
    </nav>
  );
};

export default Navbar;