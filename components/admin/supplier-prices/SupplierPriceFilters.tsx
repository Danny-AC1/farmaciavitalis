import React from 'react';
import { Search, AlertTriangle, Info } from 'lucide-react';
import { Supplier } from '../../../types';

interface SupplierPriceFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedSupplier: string;
  setSelectedSupplier: (id: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onlyOutRange: boolean;
  setOnlyOutRange: (val: boolean) => void;
  suppliers: Supplier[];
  categories: string[];
}

export const SupplierPriceFilters: React.FC<SupplierPriceFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  selectedSupplier,
  setSelectedSupplier,
  selectedCategory,
  setSelectedCategory,
  onlyOutRange,
  setOnlyOutRange,
  suppliers,
  categories
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Buscar por nombre, principio activo, código o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
          />
        </div>

        {/* Filtro Proveedor */}
        <div className="w-full md:w-56">
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">🏢 Todos los Proveedores</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Filtro Categoría */}
        <div className="w-full md:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 cursor-pointer"
          >
            <option value="all">📂 Todas las Categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Switch Ver solo fuera de rango */}
        <button
          onClick={() => setOnlyOutRange(!onlyOutRange)}
          className={`px-4 py-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 cursor-pointer ${
            onlyOutRange 
              ? 'bg-amber-500 text-white border-amber-600 shadow-md' 
              : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
          }`}
        >
          <AlertTriangle size={15} /> 
          <span>Solo PVP fuera de Rango</span>
        </button>
      </div>

      {/* Guía Estilo Proveedores explicativa sin icono de IA */}
      <div className="bg-teal-50/60 border border-teal-100 p-3.5 rounded-2xl flex items-start gap-3">
        <Info className="text-teal-600 shrink-0 mt-0.5" size={18} />
        <div className="text-[11px] text-teal-900 leading-snug font-medium">
          <strong>Estructura de Precios Distribuidora / Proveedores:</strong> <br />
          <strong>1. Precio de Compra:</strong> El precio neto unitario y por caja con el que adquieres el medicamento. <br />
          <strong>2. Rango Mínimo - Máximo Sugerido:</strong> Rango referencial de venta al público sugerido por la distribuidora. <br />
          <strong>3. PVP Recomendado (Unitario):</strong> Precio de venta al público recomendado por unidad (pastilla, sobre o ampolla), no por caja.
        </div>
      </div>
    </div>
  );
};
