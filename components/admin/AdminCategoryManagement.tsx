import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, AlertCircle, RefreshCw } from 'lucide-react';
import { Category, Product } from '../../types';
import { CategoryStats } from './categories/CategoryStats';
import { CategoryForm } from './categories/CategoryForm';
import { CategoryCard } from './categories/CategoryCard';

interface AdminCategoryManagementProps {
  categories: Category[];
  products: Product[];
  onAdd: (cat: string | { name: string; image: string }) => Promise<any>;
  onDelete: (id: string) => Promise<void>;
}

export const AdminCategoryManagement: React.FC<AdminCategoryManagementProps> = ({
  categories,
  products,
  onAdd,
  onDelete
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'products_count' | 'id'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Filter categories by name
  const filteredCategories = useMemo(() => {
    let result = [...categories];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter(c => c.name.toLowerCase().includes(query));
    }

    // Sorting logic
    result.sort((a, b) => {
      let valA: any = a.name;
      let valB: any = b.name;

      if (sortBy === 'id') {
        valA = a.id;
        valB = b.id;
      } else if (sortBy === 'products_count') {
        const countA = products.filter(p => p.category?.toLowerCase() === a.name.toLowerCase()).length;
        const countB = products.filter(p => p.category?.toLowerCase() === b.name.toLowerCase()).length;
        valA = countA;
        valB = countB;
      }

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        // Numbers
        return sortOrder === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });

    return result;
  }, [categories, products, searchTerm, sortBy, sortOrder]);

  const toggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const handleAddCategory = async (cat: { name: string; image: string }) => {
    await onAdd(cat);
  };

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-300" id="admin-category-management-root">
      
      {/* Header section with badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="bg-teal-50 border border-teal-100 text-teal-600 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-widest inline-block mb-1.5 shadow-2xs">
            Módulo de Control de Líneas Clínicas
          </span>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            Categorías del Catálogo
          </h2>
          <p className="text-xs text-slate-500">
            Administra las clasificaciones médicas y farmacéuticas para el inventario de Vitalis.
          </p>
        </div>
      </div>

      {/* 1. Statistics Summary */}
      <CategoryStats categories={categories} products={products} />

      {/* 2. Main Content Grid (1/3 Form, 2/3 Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left column: Form */}
        <div className="lg:col-span-4">
          <CategoryForm categories={categories} onSubmit={handleAddCategory} />
        </div>

        {/* Right column: Filters + Category Cards List */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
            
            {/* Search Input */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50/50 border border-slate-100 pl-10 pr-4 py-2.5 rounded-2xl text-xs outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 font-semibold transition-all"
              />
            </div>

            {/* Sorting controls */}
            <div className="flex gap-2 w-full sm:w-auto items-center justify-end">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-slate-50 border border-slate-100 p-2 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none cursor-pointer"
              >
                <option value="name">Nombre</option>
                <option value="products_count">Productos</option>
                <option value="id">Identificador ID</option>
              </select>

              <button
                onClick={toggleSortOrder}
                className="p-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 text-slate-600 rounded-xl transition-all"
                title={`Orden ${sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}`}
              >
                <ArrowUpDown size={14} className={sortOrder === 'desc' ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>
            </div>

          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredCategories.map(cat => (
              <CategoryCard
                key={cat.id}
                category={cat}
                products={products}
                onDelete={onDelete}
              />
            ))}
          </div>

          {/* Empty State */}
          {filteredCategories.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-200 p-12 text-center flex flex-col items-center justify-center gap-3">
              <div className="bg-slate-50 p-4 rounded-full text-slate-400">
                <AlertCircle size={32} />
              </div>
              <h4 className="font-black text-slate-700 text-sm">No se encontraron categorías</h4>
              <p className="text-xs text-slate-500 max-w-xs">
                {searchTerm 
                  ? `Ninguna clasificación clínica coincide con "${searchTerm}". Intenta con otro término.`
                  : 'Registra tu primera categoría en el panel izquierdo para clasificar tus productos.'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="mt-2 text-xs font-black text-teal-600 hover:text-teal-700 flex items-center gap-1.5"
                >
                  <RefreshCw size={12} />
                  Restaurar búsqueda
                </button>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
