
import React, { useState } from 'react';
import { Package, Trash2, Edit2, Search, Plus, Minus } from 'lucide-react';
import { Product } from '../types';

interface AdminProductListProps {
  products: Product[];
  handleEditClick: (p: Product) => void;
  onDeleteProduct: (id: string) => void | Promise<void>;
  onUpdateStock: (id: string, s: number) => void | Promise<void>;
}

const AdminProductList: React.FC<AdminProductListProps> = ({ products, handleEditClick, onDeleteProduct, onUpdateStock }) => {
  const [listSearch, setListSearch] = useState('');

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(listSearch.toLowerCase()) || 
    p.category.toLowerCase().includes(listSearch.toLowerCase()) ||
    (p.barcode && p.barcode.includes(listSearch))
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h4 className="text-lg font-bold text-gray-800">Catálogo de Productos</h4>
          <p className="text-xs text-gray-400 font-medium">{filteredProducts.length} productos registrados</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar por nombre, categoría o barra..." 
            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-teal-500 outline-none transition-all"
            value={listSearch}
            onChange={e => setListSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Producto</th>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Categoría</th>
              <th className="px-6 py-4 text-center text-xs font-black text-gray-500 uppercase tracking-widest">Stock</th>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Precio Unit.</th>
              <th className="px-6 py-4 text-left text-xs font-black text-gray-500 uppercase tracking-widest">Precio Caja</th>
              <th className="px-6 py-4 text-right text-xs font-black text-gray-500 uppercase tracking-widest">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-teal-50/30 transition group">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-white border border-gray-100 rounded-lg p-1 shrink-0 flex items-center justify-center">
                      <img src={p.image} className="max-h-full max-w-full object-contain mix-blend-multiply" alt={p.name} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-gray-900 text-sm leading-tight truncate uppercase">{p.name}</p>
                      {p.barcode && <p className="text-[10px] text-gray-400 font-mono mt-0.5">{p.barcode}</p>}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="text-[10px] font-black text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-tighter border border-teal-100">
                    {p.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                      className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Minus size={14} strokeWidth={3} />
                    </button>
                    <span className={`text-xs font-black px-3 py-1 rounded-lg min-w-[36px] text-center shadow-inner ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {p.stock}
                    </span>
                    <button 
                      onClick={() => onUpdateStock(p.id, p.stock + 1)}
                      className="p-1 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors"
                    >
                      <Plus size={14} strokeWidth={3} />
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-black text-gray-800 tabular-nums">${p.price.toFixed(2)}</td>
                <td className="px-6 py-4 text-sm font-black text-blue-600 tabular-nums">
                  {p.publicBoxPrice ? `$${p.publicBoxPrice.toFixed(2)}` : '---'}
                </td>
                <td className="px-6 py-4 text-right space-x-1">
                  <button onClick={() => handleEditClick(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-all" title="Editar"><Edit2 size={16}/></button>
                  <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" title="Eliminar"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredProducts.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-2 opacity-30">
            <Package size={48} />
            <p className="font-bold uppercase tracking-widest text-xs">Sin resultados en el catálogo</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminProductList;
