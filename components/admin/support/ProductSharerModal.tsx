import React from 'react';
import { Search, Plus, X } from 'lucide-react';
import { Product } from '../../../types';

interface ProductSharerModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchProductQuery: string;
  setSearchProductQuery: (val: string) => void;
  filteredProducts: Product[];
  onSelectProduct: (product: Product) => void;
}

export const ProductSharerModal: React.FC<ProductSharerModalProps> = ({
  isOpen,
  onClose,
  searchProductQuery,
  setSearchProductQuery,
  filteredProducts,
  onSelectProduct,
}) => {
  if (!isOpen) return null;

  return (
    <div className="p-3 bg-teal-50/80 border-b border-teal-100 shrink-0 space-y-2 animate-in slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase text-teal-800 tracking-wider">Catálogo - Selecciona un Producto para Enviar</span>
        <button onClick={onClose} className="text-teal-600 hover:text-teal-800 p-1">
          <X size={14} />
        </button>
      </div>

      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-teal-500 pointer-events-none">
          <Search size={12} />
        </span>
        <input 
          type="text"
          value={searchProductQuery}
          onChange={e => setSearchProductQuery(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-teal-200 rounded-xl outline-none font-bold text-slate-800"
        />
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 custom-scrollbar pr-1">
        {filteredProducts.length === 0 ? (
          <p className="text-[10px] text-teal-700/70 font-semibold text-center py-3">No hay productos que coincidan.</p>
        ) : (
          filteredProducts.map(prod => (
            <div 
              key={prod.id} 
              className="flex items-center justify-between p-2 bg-white rounded-xl border border-teal-100 hover:border-teal-300 transition"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <img 
                  src={prod.image} 
                  alt={prod.name} 
                  referrerPolicy="no-referrer"
                  className="h-8 w-8 rounded-lg object-cover border border-slate-100 shrink-0 bg-slate-50"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=80';
                  }}
                />
                <div className="min-w-0">
                  <h5 className="text-[11px] font-bold text-slate-800 truncate">{prod.name}</h5>
                  <p className="text-[9px] font-mono font-bold text-teal-600">${prod.price.toFixed(2)}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onSelectProduct(prod)}
                className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-[9px] uppercase tracking-wider rounded-lg transition flex items-center gap-1 shrink-0"
              >
                <Plus size={11} /> Recomendar
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductSharerModal;
