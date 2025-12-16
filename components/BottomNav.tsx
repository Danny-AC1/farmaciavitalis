import React from 'react';
import { Home, ClipboardList, ShoppingCart, HeartPulse, Sparkles } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'home' | 'orders' | 'assistant' | 'health';
  cartCount: number;
  onTabChange: (tab: 'home' | 'orders' | 'assistant' | 'health') => void;
  onCartClick: () => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ activeTab, cartCount, onTabChange, onCartClick }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-50 md:hidden pb-safe">
      <div className="flex justify-between items-center h-16 px-2">
        
        <button 
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${activeTab === 'home' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <Home className={`h-5 w-5 ${activeTab === 'home' ? 'fill-current' : ''}`} />
          <span className="text-[10px] font-medium">Inicio</span>
        </button>

        <button 
          onClick={() => onTabChange('orders')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${activeTab === 'orders' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <ClipboardList className={`h-5 w-5 ${activeTab === 'orders' ? 'stroke-2' : ''}`} />
          <span className="text-[10px] font-medium">Pedidos</span>
        </button>

        {/* VitalBot Central Button */}
        <button 
          onClick={() => onTabChange('assistant')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 group ${activeTab === 'assistant' ? 'text-teal-600' : 'text-gray-400'}`}
        >
           <div className={`p-2 rounded-xl transition-all duration-300 ${activeTab === 'assistant' ? 'bg-teal-600 shadow-lg shadow-teal-200 -translate-y-2' : 'bg-teal-50 group-hover:bg-teal-100'}`}>
              <Sparkles className={`h-5 w-5 ${activeTab === 'assistant' ? 'text-white fill-white' : 'text-teal-600'}`} />
           </div>
           <span className={`text-[10px] font-bold ${activeTab === 'assistant' ? 'text-teal-600' : 'text-teal-600/70'}`}>Asistente</span>
        </button>

        <button 
          onClick={() => onTabChange('health')}
          className={`flex flex-col items-center justify-center flex-1 h-full space-y-1 transition-colors ${activeTab === 'health' ? 'text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
        >
          <HeartPulse className={`h-5 w-5 ${activeTab === 'health' ? 'fill-current text-pink-500' : ''}`} />
          <span className="text-[10px] font-medium">Salud</span>
        </button>

        <button 
          onClick={onCartClick}
          className="flex flex-col items-center justify-center flex-1 h-full space-y-1 text-gray-400 hover:text-gray-600 relative transition-colors"
        >
          <div className="relative">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold h-4 w-4 flex items-center justify-center rounded-full animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] font-medium">Carrito</span>
        </button>

      </div>
    </div>
  );
};

export default BottomNav;