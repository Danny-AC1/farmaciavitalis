import React from 'react';
import { Sparkles, Plus } from 'lucide-react';
import { Bundle } from '../../types';

interface POSBundlesBannerProps {
  showBundles: boolean;
  bundles: Bundle[];
  onAddBundleToCart: (bundle: Bundle) => void;
}

export const POSBundlesBanner: React.FC<POSBundlesBannerProps> = ({
  showBundles,
  bundles,
  onAddBundleToCart
}) => {
  if (!showBundles) return null;

  const activeBundles = bundles.filter(b => b.active);

  return (
    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 animate-in slide-in-from-top">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} className="text-purple-600" />
        <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">
          Promociones Activas ({activeBundles.length})
        </span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
        {activeBundles.map(bundle => (
          <button 
            key={bundle.id}
            onClick={() => onAddBundleToCart(bundle)}
            className="bg-white p-2 rounded-lg border border-purple-200 text-left hover:shadow-md transition group"
          >
            <p className="text-[10px] font-bold text-gray-900 truncate">{bundle.name}</p>
            <div className="flex justify-between items-center mt-1">
              <span className="text-[10px] font-black text-purple-600">${bundle.price.toFixed(2)}</span>
              <Plus size={10} className="text-purple-400 group-hover:text-purple-600" />
            </div>
          </button>
        ))}
        {activeBundles.length === 0 && (
          <p className="text-[10px] text-purple-400 italic col-span-full">No hay combos activos en este momento.</p>
        )}
      </div>
    </div>
  );
};

export default POSBundlesBanner;
