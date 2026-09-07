import React, { useState, useMemo } from 'react';
import { Search, X, Package, Boxes, Plus, Check, Filter, Truck } from 'lucide-react';
import { Product, Supplier } from '../../../types';
import { PurchaseOrderItem } from '../../../types/purchases';

interface ProductPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  existingItems: PurchaseOrderItem[];
  onAddProduct: (product: Product, unitType: 'BOX' | 'UNIT', quantity?: number) => void;
}

export const ProductPickerModal: React.FC<ProductPickerModalProps> = ({
  isOpen,
  onClose,
  products,
  suppliers,
  existingItems,
  onAddProduct,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('ALL');

  // Mapa de proveedores
  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [suppliers]);

  // Categorías disponibles
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [products]);

  // Mapa de productos que ya están en la orden
  const inCartMap = useMemo(() => {
    const map = new Map<string, { quantity: number; unitType: string }>();
    existingItems.forEach((it) => {
      map.set(it.productId, { quantity: it.quantity, unitType: it.unitType });
    });
    return map;
  }, [existingItems]);

  // Filtrar productos
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return products.filter((p) => {
      const matchSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.activeIngredient && p.activeIngredient.toLowerCase().includes(term)) ||
        (p.barcode && p.barcode.includes(term));

      const matchCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
      const matchSupplier =
        selectedSupplierId === 'ALL' ||
        (selectedSupplierId === 'NONE' ? !p.supplierId : p.supplierId === selectedSupplierId);

      return matchSearch && matchCategory && matchSupplier;
    });
  }, [products, searchTerm, selectedCategory, selectedSupplierId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20">
              <Package size={20} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                Agregar Productos a la Orden de Compra
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Selecciona cualquier medicamento o insumo de tu catálogo para sumarlo al pedido.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            title="Cerrar ventana"
          >
            <X size={20} />
          </button>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 md:p-6 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Buscar por nombre de medicamento, principio activo, código de barras..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs md:text-sm font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Filtro Categoría */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
              <Filter size={13} className="text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todas las Categorías ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtro Proveedor */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl">
              <Truck size={13} className="text-slate-400" />
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="ALL">Todos los Proveedores</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
                <option value="NONE">Sin proveedor asignado</option>
              </select>
            </div>

            <div className="ml-auto text-[11px] font-bold text-slate-400">
              Mostrando {filteredProducts.length} medicamentos
            </div>
          </div>
        </div>

        {/* Lista de Productos con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 divide-y divide-slate-100">
          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Package size={36} className="mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No se encontraron productos coincidentes</p>
              <p className="text-xs text-slate-400">Prueba con otro término de búsqueda o limpia los filtros.</p>
            </div>
          ) : (
            filteredProducts.map((p) => {
              const inCart = inCartMap.get(p.id);
              const unitsPerBox = p.unitsPerBox || 1;
              const hasBox = unitsPerBox > 1;
              const unitCost = p.costPrice || (p.price > 0 ? p.price * 0.7 : 0);
              const boxCost = p.supplierBoxPrice || p.boxPrice || (unitCost * unitsPerBox);

              return (
                <div
                  key={p.id}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-2xl transition-colors"
                >
                  {/* Información del Medicamento */}
                  <div className="space-y-1 max-w-md">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs md:text-sm font-black text-slate-800">{p.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {p.category}
                      </span>
                      {p.supplierId && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                          {supplierMap.get(p.supplierId) || 'Distribuidora'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                      <span>
                        Stock actual:{' '}
                        <strong
                          className={
                            p.stock <= 0
                              ? 'text-rose-600 font-black'
                              : p.stock <= 1
                              ? 'text-amber-600 font-black'
                              : 'text-slate-700 font-bold'
                          }
                        >
                          {p.stock} uds
                        </strong>
                      </span>
                      <span>•</span>
                      <span>
                        Costo Unit.: <strong className="text-slate-700 font-mono">${unitCost.toFixed(2)}</strong>
                      </span>
                      {hasBox && (
                        <>
                          <span>•</span>
                          <span>
                            Costo Caja (x{unitsPerBox}):{' '}
                            <strong className="text-slate-700 font-mono">${boxCost.toFixed(2)}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Botones de Agregar */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    {inCart ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center gap-1">
                        <Check size={12} />
                        En orden: {inCart.quantity} {inCart.unitType === 'BOX' ? 'cajas' : 'uds'}
                      </span>
                    ) : null}

                    {hasBox && (
                      <button
                        onClick={() => onAddProduct(p, 'BOX', 1)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200/80 rounded-xl text-xs font-bold transition-colors"
                        title={`Agregar 1 caja de ${unitsPerBox} unidades`}
                      >
                        <Boxes size={13} />
                        <span>+ 1 Caja (x{unitsPerBox})</span>
                      </button>
                    )}

                    <button
                      onClick={() => onAddProduct(p, 'UNIT', hasBox ? unitsPerBox : 10)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                      title="Agregar unidades sueltas"
                    >
                      <Plus size={13} />
                      <span>+ {hasBox ? `${unitsPerBox} Uds` : '10 Uds'}</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie de modal */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            {existingItems.length} productos en la orden de compra actual
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition-colors shadow-sm"
          >
            Listo, volver a la orden
          </button>
        </div>
      </div>
    </div>
  );
};
