import React, { useMemo } from 'react';
import { Layers, CheckCircle2, AlertTriangle, BarChart3 } from 'lucide-react';
import { Category, Product } from '../../../types';

interface CategoryStatsProps {
  categories: Category[];
  products: Product[];
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({ categories, products }) => {
  const stats = useMemo(() => {
    const totalCategories = categories.length;
    const totalProducts = products.length;

    // Count how many products are successfully categorized
    const categoryNames = new Set(categories.map(c => c.name.toLowerCase()));
    const categorizedProducts = products.filter(p => p.category && categoryNames.has(p.category.toLowerCase())).length;
    const uncategorizedProducts = totalProducts - categorizedProducts;

    const coveragePercentage = totalProducts > 0 
      ? Math.round((categorizedProducts / totalProducts) * 100) 
      : 100;

    // Find the category with the most products
    const productCounts: Record<string, number> = {};
    products.forEach(p => {
      if (p.category) {
        const catKey = p.category.toLowerCase();
        productCounts[catKey] = (productCounts[catKey] || 0) + 1;
      }
    });

    let topCategoryName = 'Ninguna';
    let topCategoryCount = 0;

    categories.forEach(c => {
      const count = productCounts[c.name.toLowerCase()] || 0;
      if (count > topCategoryCount) {
        topCategoryCount = count;
        topCategoryName = c.name;
      }
    });

    return {
      totalCategories,
      coveragePercentage,
      uncategorizedProducts,
      topCategoryName,
      topCategoryCount
    };
  }, [categories, products]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="category-stats-panel">
      
      {/* KPI: Total Categories */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className="bg-teal-50 p-3.5 rounded-2xl border border-teal-100 text-teal-600">
          <Layers size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Categorías</span>
          <p className="text-xl font-black text-slate-800">{stats.totalCategories}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Registros activos</span>
        </div>
      </div>

      {/* KPI: Coverage Percentage */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className={`p-3.5 rounded-2xl border ${
          stats.coveragePercentage >= 90 ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'
        }`}>
          <CheckCircle2 size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Cobertura</span>
          <p className="text-xl font-black text-slate-800">{stats.coveragePercentage}%</p>
          <span className="text-[10px] text-slate-500 font-semibold">Productos clasificados</span>
        </div>
      </div>

      {/* KPI: Uncategorized Alert */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className={`p-3.5 rounded-2xl border ${
          stats.uncategorizedProducts > 0 ? 'bg-amber-50 border-amber-150 text-amber-600 animate-pulse' : 'bg-slate-50 border-slate-150 text-slate-400'
        }`}>
          <AlertTriangle size={20} />
        </div>
        <div>
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Sin Categoría</span>
          <p className="text-xl font-black text-slate-800">{stats.uncategorizedProducts}</p>
          <span className="text-[10px] text-slate-500 font-semibold">Medicamentos huérfanos</span>
        </div>
      </div>

      {/* KPI: Top Category */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-xs flex items-center gap-4">
        <div className="bg-blue-50 p-3.5 rounded-2xl border border-blue-100 text-blue-600">
          <BarChart3 size={20} />
        </div>
        <div className="min-w-0">
          <span className="text-[9px] font-black uppercase text-slate-400 tracking-widest block">Líder Catálogo</span>
          <p className="text-sm font-black text-slate-800 truncate uppercase">{stats.topCategoryName}</p>
          <span className="text-[10px] text-slate-500 font-semibold">{stats.topCategoryCount} productos asignados</span>
        </div>
      </div>

    </div>
  );
};
