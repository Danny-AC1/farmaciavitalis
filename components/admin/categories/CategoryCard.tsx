import React, { useState, useMemo } from 'react';
import { Trash2, ChevronDown, ChevronUp, Package, Search } from 'lucide-react';
import { Category, Product } from '../../../types';
import { getCategoryStyle } from '../../../utils/CategoryStyles';

interface CategoryCardProps {
  category: Category;
  products: Product[];
  onDelete: (id: string) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({ category, products, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get dynamic styles based on name
  const style = useMemo(() => {
    return getCategoryStyle(category.name);
  }, [category.name]);

  // Find products associated with this category
  const associatedProducts = useMemo(() => {
    const catLower = category.name.toLowerCase();
    return products.filter(p => p.category && p.category.toLowerCase() === catLower);
  }, [category.name, products]);

  // Filter associated products by search inside the expanded view
  const filteredProducts = useMemo(() => {
    if (!searchTerm.trim()) return associatedProducts;
    const cleanSearch = searchTerm.toLowerCase().trim();
    return associatedProducts.filter(p => 
      p.name.toLowerCase().includes(cleanSearch) || 
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(cleanSearch))
    );
  }, [associatedProducts, searchTerm]);

  const handleDeleteClick = () => {
    const productCount = associatedProducts.length;
    if (productCount > 0) {
      if (window.confirm(`⚠️ ADVERTENCIA: Esta categoría tiene ${productCount} productos asignados (como "${associatedProducts[0].name}"). Si la eliminas, estos productos quedarán sin clasificación.\n\n¿Deseas continuar con la eliminación de "${category.name}"?`)) {
        onDelete(category.id);
      }
    } else {
      if (window.confirm(`¿Estás seguro de que deseas eliminar la categoría "${category.name}"? Esta acción no se puede deshacer.`)) {
        onDelete(category.id);
      }
    }
  };

  const IconComponent = style.icon;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-all duration-300" id={`category-card-${category.id}`}>
      
      {/* Category Header Card */}
      <div className={`p-5 relative ${style.bg} border-b ${style.border} flex flex-col justify-between h-36 relative overflow-hidden group`}>
        {/* Dynamic decorative backdrop icon */}
        <IconComponent className={`absolute -right-4 -bottom-4 h-24 w-24 ${style.text} opacity-10 transform rotate-12 group-hover:rotate-0 transition-transform duration-500`} />
        
        <div className="flex justify-between items-start relative z-10">
          <div className={`p-2.5 rounded-xl ${style.accent} bg-opacity-60 text-slate-800`}>
            <IconComponent className={`h-6 w-6 ${style.text}`} />
          </div>
          <button 
            onClick={handleDeleteClick}
            className="p-2 bg-white/60 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-xl transition-all shadow-xs border border-white/40"
            title="Eliminar categoría"
          >
            <Trash2 size={15} />
          </button>
        </div>

        <div className="relative z-10 flex justify-between items-end">
          <div className="min-w-0 pr-2">
            <h4 className={`font-black text-base uppercase tracking-wide truncate ${style.text}`}>{category.name}</h4>
            <span className="text-[10px] text-slate-500 font-bold bg-white/70 px-2 py-0.5 rounded-full border border-white/20">
              ID: {category.id.substring(0, 6)}...
            </span>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-xs font-black uppercase ${style.text} bg-white px-2.5 py-1 rounded-full border ${style.border}`}>
              {associatedProducts.length} {associatedProducts.length === 1 ? 'Prod' : 'Prods'}
            </p>
          </div>
        </div>
      </div>

      {/* Accordion Inspector to view products */}
      <div className="bg-white">
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-5 py-3.5 flex justify-between items-center text-xs font-bold text-slate-600 hover:bg-slate-50 border-b border-slate-50 transition-all"
        >
          <span className="flex items-center gap-1.5">
            <Package size={14} className="text-teal-600" />
            {isExpanded ? 'Ocultar catálogo' : 'Inspeccionar catálogo'}
          </span>
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {isExpanded && (
          <div className="p-4 bg-slate-50/50 border-b border-slate-50 space-y-3 animate-in slide-in-from-top-2 duration-200">
            {/* Search inside category */}
            {associatedProducts.length > 5 && (
              <div className="relative">
                <Search size={12} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filtrar medicamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-slate-100 pl-8 pr-3 py-1.5 rounded-xl text-[11px] outline-none focus:ring-1 focus:ring-teal-500 font-medium"
                />
              </div>
            )}

            {/* Product List */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
              {filteredProducts.map(p => (
                <div key={p.id} className="bg-white border border-slate-100 p-2.5 rounded-xl flex justify-between items-center text-xs shadow-xs">
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 truncate">{p.name}</p>
                    {p.activeIngredient && (
                      <p className="text-[10px] text-teal-600 truncate font-semibold">{p.activeIngredient}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      p.stock > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      Stock: {p.stock}
                    </span>
                  </div>
                </div>
              ))}

              {filteredProducts.length === 0 && (
                <div className="py-6 text-center text-[11px] text-slate-400 italic">
                  {searchTerm ? 'Ningún medicamento coincide.' : 'Sin productos asignados en esta categoría.'}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
