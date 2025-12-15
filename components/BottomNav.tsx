import React from 'react';
import { Home, Grid, MessageCircle, ShoppingCart } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'categories' | 'assistant';
  cartCount: number;
  onTabChange: (tab: 'home' | 'categories' | 'assistant') => void;
  onCartClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, cartCount, onTabChange, onCartClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden pb-safe">
      <div className="flex justify-around items-center h-16">
        
        <button 
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'home' ? 'text-teal-600' : 'text-gray-400'}`}
        >
          <Home className={`h-6 w-6 ${activeTab === 'home' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>

        <button 
          onClick={() => onTabChange('categories')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'categories' ? 'text-teal-600' : 'text-gray-400'}`}
        >
          <Grid className={`h-6 w-6 ${activeTab === 'categories' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">Categorías</span>
        </button>

        <button 
          onClick={onCartClick}
          className="flex flex-col items-center justify-center w-full h-full space-y-1 text-gray-400 relative"
        >
          <div className="relative">
            <ShoppingCart className="h-6 w-6" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Carrito</span>
        </button>

        <button 
          onClick={() => onTabChange('assistant')}
          className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${activeTab === 'assistant' ? 'text-teal-600' : 'text-gray-400'}`}
        >
          <MessageCircle className={`h-6 w-6 ${activeTab === 'assistant' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">Asistente</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;