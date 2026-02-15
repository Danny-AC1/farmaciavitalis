
import React from 'react';
import { Search, Package, Plus, ShoppingCart } from 'lucide-react';
import { Product } from '../types';

interface POSProductSearchProps {
  posSearch: string;
  setPosSearch: (s: string) => void;
  filteredProducts: Product[];
  addToPosCart: (p: Product, unitType?: 'UNIT' | 'BOX') => void;
}

const POSProductSearch: React.FC<POSProductSearchProps> = ({
  posSearch, setPosSearch, filteredProducts, addToPosCart
}) => {
  return (
    <div className="relative">
      <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
      <input 
        autoFocus
        className="w-full bg-teal-50 border-2 border-teal-100 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-10 md:pl-12 pr-4 md:pr-6 text-sm md:text-lg font-black text-teal-900 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all placeholder:text-teal-200" 
        placeholder="BUSCAR PRODUCTO O SCAN..." 
        value={posSearch} 
        onChange={e => setPosSearch(e.target.value)} 
      />
      {filteredProducts.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[90] bg-white border border-slate-200 shadow-2xl rounded-lg md:rounded-xl overflow-hidden mt-1 animate-in zoom-in-95 origin-top max-h-80 overflow-y-auto">
          {filteredProducts.map(p => {
            const hasBox = (p.unitsPerBox ?? 0) > 1;
            const boxPrice = p.publicBoxPrice || p.boxPrice || 0;
            const unitsInBox = p.unitsPerBox || 1;
            
            const canAddUnit = p.stock >= 1;
            const canAddBox = hasBox && p.stock >= unitsInBox;
            
            return (
              <div key={p.id} className="flex items-center justify-between p-2 md:p-3 hover:bg-teal-50 transition-colors border-b last:border-0 group">
                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                  <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center p-1 shrink-0"><Package size={14} className="text-slate-400"/></div>
                  <div className="min-w-0">
                    <p className="text-[10px] md:text-xs font-black text-slate-800 uppercase truncate">{p.name}</p>
                    <p className={`text-[8px] md:text-[9px] font-bold uppercase truncate ${p.stock <= 5 ? 'text-red-500' : 'text-slate-400'}`}>
                        {p.category} • STOCK: {p.stock} UNID.
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 md:gap-2 shrink-0">
                  {/* Botón Unidad */}
                  <button 
                    disabled={!canAddUnit}
                    onClick={() => { addToPosCart(p, 'UNIT'); setPosSearch(''); }}
                    className={`flex flex-col items-center border px-2 md:px-3 py-1 rounded-lg transition-all group/btn ${canAddUnit ? 'bg-white border-slate-200 hover:border-teal-500 hover:bg-teal-50' : 'bg-gray-50 border-gray-100 opacity-40 cursor-not-allowed'}`}
                  >
                    <span className={`text-[10px] md:text-xs font-black ${canAddUnit ? 'text-teal-600' : 'text-gray-400'}`}>${p.price.toFixed(2)}</span>
                    <span className="text-[7px] font-black text-slate-300 uppercase group-hover/btn:text-teal-400">Unid.</span>
                  </button>

                  {/* Botón Caja (Si aplica) */}
                  {hasBox && boxPrice > 0 && (
                    <button 
                      disabled={!canAddBox}
                      onClick={() => { addToPosCart(p, 'BOX'); setPosSearch(''); }}
                      className={`flex flex-col items-center border px-2 md:px-3 py-1 rounded-lg transition-all shadow-sm group/btn ${canAddBox ? 'bg-blue-600 border-blue-600 hover:bg-blue-700' : 'bg-gray-200 border-gray-200 opacity-40 cursor-not-allowed'}`}
                    >
                      <span className={`text-[10px] md:text-xs font-black ${canAddBox ? 'text-white' : 'text-gray-500'}`}>${boxPrice.toFixed(2)}</span>
                      <span className={`text-[7px] font-black uppercase ${canAddBox ? 'text-blue-200 group-hover/btn:text-white' : 'text-gray-400'}`}>Caja x{p.unitsPerBox}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default POSProductSearch;
