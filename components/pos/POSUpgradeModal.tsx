import React from 'react';
import { Sparkles, X } from 'lucide-react';
import { Bundle, Product } from '../../types';

interface POSUpgradeModalProps {
  upgradeSuggestion: Bundle | null;
  products: Product[];
  onClose: () => void;
  onAcceptUpgrade: (bundle: Bundle) => void;
}

export const POSUpgradeModal: React.FC<POSUpgradeModalProps> = ({
  upgradeSuggestion,
  products,
  onClose,
  onAcceptUpgrade
}) => {
  if (!upgradeSuggestion) return null;

  const originalTotal = upgradeSuggestion.productIds.reduce((acc, id) => {
    const p = products.find(x => x.id === id);
    return acc + (p?.price || 0);
  }, 0);

  const discountPercent = originalTotal > 0 
    ? Math.round((1 - upgradeSuggestion.price / originalTotal) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
        <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
          <h3 className="text-sm font-bold flex items-center gap-2">
            <Sparkles size={18}/> ¡Sugerencia de Combo Upgrade!
          </h3>
          <button 
            onClick={onClose} 
            className="hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <X size={20}/>
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Por solo un poco más, lleva el:</p>
            <h4 className="text-xl font-black text-purple-700">{upgradeSuggestion.name}</h4>
            <p className="text-sm text-gray-600 mt-2">{upgradeSuggestion.description}</p>
          </div>

          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-bold text-gray-600">Precio Combo:</span>
              <span className="text-lg font-black text-purple-700">${upgradeSuggestion.price.toFixed(2)}</span>
            </div>
            {discountPercent > 0 && (
              <p className="text-[10px] text-purple-400 italic text-center">
                Ahorras un {discountPercent}% comparado con compra individual.
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition"
            >
              No, gracias
            </button>
            <button 
              onClick={() => {
                onAcceptUpgrade(upgradeSuggestion);
                onClose();
              }}
              className="flex-[2] bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg active:scale-95"
            >
              ¡Aceptar Combo!
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSUpgradeModal;
