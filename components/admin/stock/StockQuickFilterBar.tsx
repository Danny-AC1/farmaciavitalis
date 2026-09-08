import React from 'react';
import { Search, ArrowUpDown } from 'lucide-react';

interface StockQuickFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  stockStatusFilter: 'all' | 'critical' | 'outOfStock' | 'healthy';
  setStockStatusFilter: (val: 'all' | 'critical' | 'outOfStock' | 'healthy') => void;
  sortBy: 'name' | 'stockAsc' | 'stockDesc' | 'category';
  setSortBy: (val: 'name' | 'stockAsc' | 'stockDesc' | 'category') => void;
  categoriesList: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
}

export const StockQuickFilterBar: React.FC<StockQuickFilterBarProps> = ({
  search,
  setSearch,
  stockStatusFilter,
  setStockStatusFilter,
  sortBy,
  setSortBy,
  categoriesList,
  selectedCategory,
  setSelectedCategory
}) => {
  return (
    <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-4">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4">
        {/* Búsqueda en vivo */}
        <div className="xl:col-span-5 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input 
            className="w-full bg-white border border-slate-200 p-3 pl-11 pr-16 rounded-xl outline-none focus:border-teal-600 text-sm font-medium" 
            placeholder="Buscar por nombre, categoría o código de barras..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
          {search && (
            <button 
              onClick={() => setSearch('')} 
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>

        {/* Selector de Estado de Stock */}
        <div className="xl:col-span-4 flex bg-white rounded-xl border border-slate-200 p-1">
          <button 
            onClick={() => setStockStatusFilter('all')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${stockStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}
          >
            Todos
          </button>
          <button 
            onClick={() => setStockStatusFilter('critical')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${stockStatusFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-rose-600 hover:bg-rose-50'}`}
          >
            Crítico (≤5)
          </button>
          <button 
            onClick={() => setStockStatusFilter('outOfStock')}
            className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${stockStatusFilter === 'outOfStock' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}
          >
            Agotado (0)
          </button>
        </div>

        {/* Ordenar */}
        <div className="xl:col-span-3 flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
          <ArrowUpDown size={14} className="text-slate-400 shrink-0" />
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value as any)}
            className="bg-transparent outline-none w-full cursor-pointer text-slate-800 font-semibold"
          >
            <option value="name">Alfabético (A-Z)</option>
            <option value="stockAsc">Stock (Menor a Mayor)</option>
            <option value="stockDesc">Stock (Mayor a Menor)</option>
            <option value="category">Por Categoría</option>
          </select>
        </div>
      </div>

      {/* Píldoras de Categorías */}
      <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-200/40">
        {categoriesList.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
              selectedCategory === cat 
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/60'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};
