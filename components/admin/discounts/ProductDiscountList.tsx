import React from 'react';
import { Search, Filter, Trash2 } from 'lucide-react';
import { Product } from '../../../types';
import { ActiveDiscount } from '../AdminDiscounts';

interface ProductDiscountListProps {
  processedProducts: Product[];
  discountsMap: Record<string, ActiveDiscount>;
  filterMode: 'all' | 'discounted' | 'not_discounted';
  setFilterMode: (mode: 'all' | 'discounted' | 'not_discounted') => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  categories: string[];
  onOpenDiscountForm: (product: Product) => void;
  onRemoveDiscount: (productId: string, productName: string) => void;
  getDiscountedPrice: (product: Product, d: ActiveDiscount) => number;
}

export const ProductDiscountList: React.FC<ProductDiscountListProps> = ({
  processedProducts,
  discountsMap,
  filterMode,
  setFilterMode,
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  categories,
  onOpenDiscountForm,
  onRemoveDiscount,
  getDiscountedPrice,
}) => {
  return (
    <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Filtros y Buscador de Catálogo</h4>
        
        <div className="flex flex-wrap gap-2">
          {(['all', 'discounted', 'not_discounted'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`px-3 py-1 text-[11px] font-black rounded-xl border transition-all ${
                filterMode === mode
                  ? mode === 'discounted'
                    ? 'bg-amber-500 border-amber-500 text-slate-900'
                    : mode === 'not_discounted'
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900 border-slate-900 text-white'
                  : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
              }`}
            >
              {mode === 'all' ? 'Todos' : mode === 'discounted' ? 'Con Descuento' : 'Sin Descuento'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
          <input 
            type="text"
            placeholder="Buscar por nombre o ingrediente activo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
          />
        </div>

        <div className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl flex items-center">
          <Filter size={14} className="text-slate-400 mr-2 shrink-0" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
          >
            <option value="all">Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Listado de Productos */}
      {processedProducts.length === 0 ? (
        <div className="py-12 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
          <p className="text-xs font-bold">No se encontraron productos que coincidan con la búsqueda.</p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
          {processedProducts.map(p => {
            const discount = discountsMap[p.id];
            
            return (
              <div key={p.id} className="py-4 flex items-center justify-between gap-4 group">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-xs text-slate-800 group-hover:text-amber-600 transition-colors">
                      {p.name}
                    </span>
                    {discount && (
                      <span className="px-2 py-0.5 bg-amber-500 text-slate-900 border border-amber-400/30 text-[9px] font-black rounded-full uppercase tracking-wide">
                        {discount.promoTag}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-400">
                    <span>Categoría: <strong className="text-slate-600">{p.category}</strong></span>
                    <span>•</span>
                    <span>Precio Original: <strong className="text-slate-600">${p.price.toFixed(2)}</strong></span>
                    {p.costPrice && (
                      <>
                        <span>•</span>
                        <span>Costo Proveedor: <strong className="text-slate-400 font-mono">${p.costPrice.toFixed(2)}</strong></span>
                      </>
                    )}
                    <span>•</span>
                    <span>Stock: <strong className={p.stock <= 1 ? 'text-rose-500 font-black' : 'text-slate-600'}>{p.stock} uds.</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  {discount ? (
                    <div className="text-right space-y-0.5 mr-2">
                      <span className="line-through text-[10px] text-slate-300 block">${p.price.toFixed(2)}</span>
                      <span className="font-black text-xs text-teal-600 block">
                        ${getDiscountedPrice(p, discount).toFixed(2)} 
                        <span className="text-[10px] font-normal text-amber-500 ml-1">
                          (-{discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`})
                        </span>
                      </span>
                    </div>
                  ) : null}

                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onOpenDiscountForm(p)}
                      className={`px-3 py-1.5 text-xs font-black rounded-xl transition-colors ${
                        discount 
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {discount ? 'Editar' : 'Descontar'}
                    </button>

                    {discount && (
                      <button
                        onClick={() => onRemoveDiscount(p.id, p.name)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors border border-rose-100"
                        title="Quitar descuento"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ProductDiscountList;
