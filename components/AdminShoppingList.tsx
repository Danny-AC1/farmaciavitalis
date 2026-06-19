import React, { useState, useMemo } from 'react';
import { Product, Supplier } from '../types';
import { 
  Search, 
  Printer, 
  FileText, 
  ShoppingBag, 
  Filter, 
  CheckCircle,
  Truck
} from 'lucide-react';

interface AdminShoppingListProps {
  products: Product[];
  suppliers: Supplier[];
}

const AdminShoppingList: React.FC<AdminShoppingListProps> = ({ products, suppliers }) => {
  // Estado para la búsqueda y filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category' | 'supplier'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estado para las cantidades personalizadas a comprar
  const [purchaseQuantities, setPurchaseQuantities] = useState<Record<string, number>>({});
  // Estado de aviso/copiado con un banner sutil
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Mapear proveedores para acceso rápido O(1)
  const suppliersMap = useMemo(() => {
    const map: Record<string, Supplier> = {};
    suppliers.forEach(s => {
      map[s.id] = s;
    });
    return map;
  }, [suppliers]);

  // Obtener categorías únicas presentes en productos con stock <= 1
  const categoriesInNeed = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.stock <= 1) {
        set.add(p.category);
      }
    });
    return Array.from(set);
  }, [products]);

  // Filtrar productos cuyo stock sea <= 1
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= 1);
  }, [products]);

  // Procesar búsqueda, filtros y ordenamiento
  const processedProducts = useMemo(() => {
    let result = [...lowStockProducts];

    // Buscar
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => {
        const supplierName = p.supplierId ? (suppliersMap[p.supplierId]?.name || '').toLowerCase() : 'sin proveedor';
        return (
          p.name.toLowerCase().includes(term) ||
          p.category.toLowerCase().includes(term) ||
          p.id.toLowerCase().includes(term) ||
          (p.activeIngredient && p.activeIngredient.toLowerCase().includes(term)) ||
          supplierName.includes(term)
        );
      });
    }

    // Filtrar por Proveedor
    if (selectedSupplierId !== 'all') {
      if (selectedSupplierId === 'none') {
        result = result.filter(p => !p.supplierId || !suppliersMap[p.supplierId]);
      } else {
        result = result.filter(p => p.supplierId === selectedSupplierId);
      }
    }

    // Filtrar por Categoría
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Ordenar
    result.sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortBy === 'name') {
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
      } else if (sortBy === 'stock') {
        valA = a.stock;
        valB = b.stock;
      } else if (sortBy === 'category') {
        valA = a.category.toLowerCase();
        valB = b.category.toLowerCase();
      } else if (sortBy === 'supplier') {
        valA = a.supplierId ? (suppliersMap[a.supplierId]?.name || '').toLowerCase() : 'zzzz';
        valB = b.supplierId ? (suppliersMap[b.supplierId]?.name || '').toLowerCase() : 'zzzz';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [lowStockProducts, searchTerm, selectedSupplierId, selectedCategory, sortBy, sortOrder, suppliersMap]);

  // Cuenta rápida de desgloses de stock y estimación de costos de compra
  const { stats, totalPurchaseCost } = useMemo(() => {
    const total = lowStockProducts.length;
    const outOfStock = lowStockProducts.filter(p => p.stock === 0).length;
    const criticalStock = lowStockProducts.filter(p => p.stock === 1).length;
    
    let cost = 0;
    lowStockProducts.forEach(p => {
      const qty = purchaseQuantities[p.id] || 0;
      if (qty > 0) {
        // Se toma el precio de costo (costPrice) como de mayor jerarquía; si falta, usamos el precio normal de venta (price)
        cost += qty * (p.costPrice || p.price || 0);
      }
    });

    return { 
      stats: { total, outOfStock, criticalStock },
      totalPurchaseCost: cost
    };
  }, [lowStockProducts, purchaseQuantities]);

  // Cambiar sentido del ordenamiento o el campo
  const handleSort = (field: 'name' | 'stock' | 'category' | 'supplier') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  // Manejar el cambio de cantidad programada
  const handleQuantityChange = (productId: string, val: number) => {
    const safeVal = Math.max(0, val);
    setPurchaseQuantities(prev => ({
      ...prev,
      [productId]: safeVal
    }));
  };

  // Sugerir cantidades óptimas para restablecer inventario
  const fillSuggestedQuantities = () => {
    const defaults: Record<string, number> = {};
    lowStockProducts.forEach(p => {
      // Si el producto describe unidades por caja, sugerimos pedir 1 caja, si no, un valor estándar (ej: 10 unidades)
      const suggestions = p.unitsPerBox ? p.unitsPerBox : 12;
      defaults[p.id] = suggestions;
    });
    setPurchaseQuantities(defaults);
  };

  const clearQuantities = () => {
    setPurchaseQuantities({});
  };

  // Formatear texto para WhatsApp/Distribuidor y copiarlo al portapapeles
  const copyToClipboard = () => {
    // Filtrar productos con cantidad a comprar mayor a cero
    const productsWithQty = processedProducts.filter(p => (purchaseQuantities[p.id] || 0) > 0);
    
    if (productsWithQty.length === 0) {
      alert("No hay productos con cantidades mayores a 0 para generar la orden.");
      return;
    }

    let text = `📦 *ORDEN DE COMPRA GENERADA - FARMACIA VITALIS*\n`;
    text += `Fecha: ${new Date().toLocaleDateString('es-ES')} | Productos con Stock Crítico (<= 1)\n`;
    text += `=========================================\n\n`;

    // Agrupar por proveedor en la copia del texto para mayor orden del distribuidor
    const groupedBySupplier: Record<string, typeof productsWithQty> = {};
    productsWithQty.forEach(p => {
      const supplierName = p.supplierId ? (suppliersMap[p.supplierId]?.name || 'Sin Proveedor Asignado') : 'Sin Proveedor Asignado';
      if (!groupedBySupplier[supplierName]) {
        groupedBySupplier[supplierName] = [];
      }
      groupedBySupplier[supplierName].push(p);
    });

    Object.entries(groupedBySupplier).forEach(([supplierName, items]) => {
      text += `🏢 *PROVEEDOR: ${supplierName.toUpperCase()}*\n`;
      items.forEach(item => {
        const qty = purchaseQuantities[item.id] || 0;
        text += `- ${item.name}: ${qty} uds.\n`;
      });
      text += `-----------------------------------------\n\n`;
    });

    if (totalPurchaseCost > 0) {
      text += `💰 *GASTO TOTAL ESTIMADO:* $${totalPurchaseCost.toFixed(2)}\n`;
      text += `=========================================\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      setCopiedNotification(true);
      setTimeout(() => setCopiedNotification(false), 3500);
    }).catch(err => {
      alert("Error al copiar al portapapeles: " + err);
    });
  };

  // Imprimir una vista altamente legible y libre del resto del panel web
  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Superior de Instrucciones */}
      <div className="bg-gradient-to-tr from-teal-50 to-emerald-50 border border-teal-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-teal-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-teal-500/10">
            <ShoppingBag size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800 tracking-tight">Generador de Lista de Compras</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Este módulo rastrea en tiempo real todo el inventario con existencias críticamente bajas 
              (productos con stock de 0 o 1 unidad). Agrupa proveedores de forma automática y asiste en 
              la estimación visual para tu próximo reabastecimiento.
            </p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap shrink-0">
          <button 
            onClick={fillSuggestedQuantities}
            className="px-3.5 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-xs font-black rounded-xl border border-slate-200"
          >
            Sugerir Abastecimiento
          </button>
          
          {Object.keys(purchaseQuantities).length > 0 && (
            <button 
              onClick={clearQuantities}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-black rounded-xl border border-rose-100"
            >
              Limpiar Cantidades
            </button>
          )}
        </div>
      </div>

      {/* Notificación de copiado flotante */}
      {copiedNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-800 animate-bounce">
          <CheckCircle size={18} className="text-teal-400" />
          <div className="text-xs font-bold font-mono">¡Copiado al portapapeles con formato para WhatsApp!</div>
        </div>
      )}

      {/* Tarjetas de Estadísticas Mini */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            {stats.total}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Items Críticos</span>
            <span className="text-lg font-black text-slate-800 block">Total en Lista</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border-l-2 border-r border-y border-l-rose-500 border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            {stats.outOfStock}
          </div>
          <div>
            <span className="text-[10px] text-rose-500 font-bold uppercase tracking-wider block">Estante Vacío (Stock 0)</span>
            <span className="text-lg font-black text-slate-800 block">Agotados Totalmente</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border-l-2 border-r border-y border-l-amber-500 border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            {stats.criticalStock}
          </div>
          <div>
            <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider block">Última Unidad (Stock 1)</span>
            <span className="text-lg font-black text-slate-800 block">En Alerta Máxima</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border-l-2 border-r border-y border-l-teal-500 border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold font-mono text-center">
            ${totalPurchaseCost.toFixed(2)}
          </div>
          <div>
            <span className="text-[10px] text-teal-600 font-bold uppercase tracking-wider block">Gasto Estimado (Costo)</span>
            <span className="text-lg font-black text-slate-800 block">Total de Compra</span>
          </div>
        </div>
      </div>

      {/* Sección con Filtros y Buscador */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-6 space-y-6">
        
        {/* Filtros Activos Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar producto, categoría o proveedor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            
            {/* Filtro por Proveedor */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-2xl">
              <Truck size={14} className="text-slate-400" />
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">Todos los Proveedores</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
                <option value="none">Sin Proveedor Asignado</option>
              </select>
            </div>

            {/* Filtro por Categoría */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-2xl">
              <Filter size={14} className="text-slate-400" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-transparent border-none text-[11px] font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas las Categorías</option>
                {categoriesInNeed.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Imprimir y Exportar */}
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                disabled={processedProducts.length === 0}
                className="flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200/80 px-3 py-1.5 rounded-2xl text-[11px] font-black transition-colors"
                title="Copiar lista de compras para WhatsApp"
              >
                <FileText size={14} />
                <span>Copiar</span>
              </button>
              
              <button
                onClick={triggerPrint}
                disabled={processedProducts.length === 0}
                className="flex items-center gap-1.5 bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-slate-900 px-3 py-1.5 rounded-2xl text-[11px] font-black transition-colors"
                title="Imprimir lista limpia para tienda o distribuidor"
              >
                <Printer size={14} />
                <span>Imprimir</span>
              </button>
            </div>

          </div>

        </div>

        {/* Tabla / Lista de Contenido print-optimized */}
        {processedProducts.length === 0 ? (
          <div className="py-16 text-center space-y-3 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
            <div className="h-12 w-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              {searchTerm || selectedSupplierId !== 'all' || selectedCategory !== 'all' ? (
                <Search size={22} />
              ) : (
                <CheckCircle size={22} className="text-teal-500" />
              )}
            </div>
            <div className="space-y-1">
              <p className="text-xs font-black text-slate-800">
                {searchTerm || selectedSupplierId !== 'all' || selectedCategory !== 'all' 
                  ? "Ningún producto crítico coincide con los filtros aplicados" 
                  : "¡Todo el catálogo se encuentra abastecido!"}
              </p>
              <p className="text-[11px] text-slate-400">
                {searchTerm || selectedSupplierId !== 'all' || selectedCategory !== 'all'
                  ? "Prueba restableciendo los buscadores u opciones de filtrado."
                  : "No tenemos productos con 0 o 1 unidad en stock por ahora."}
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {/* Contenedor Imprimible Exclusivo */}
            <div className="print:block">
              {/* Encabezado visible sólo en impresión */}
              <div className="hidden print:block mb-8 border-b-2 border-slate-950 pb-4">
                <div className="flex justify-between items-end">
                  <div>
                    <h1 className="text-2xl font-black text-slate-950">FARMACIA VITALIS</h1>
                    <p className="text-xs text-slate-500">Machalilla | Reporte de Reabastecimiento Crítico</p>
                  </div>
                  <div className="text-right text-xs font-mono">
                    <p>Fecha de Reporte: {new Date().toLocaleDateString('es-ES')}</p>
                    <p>Productos con baja existencia (Stock &le; 1)</p>
                  </div>
                </div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 print:bg-slate-100 print:border-b-2 print:border-slate-300">
                    <th 
                      onClick={() => handleSort('name')}
                      className="p-4 text-[10px] font-black text-slate-500 tracking-wider uppercase cursor-pointer select-none hover:bg-slate-100/80 transition-colors"
                    >
                      <span className="flex items-center gap-1">
                        Producto {sortBy === 'name' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('category')}
                      className="p-4 text-[10px] font-black text-slate-500 tracking-wider uppercase cursor-pointer select-none hover:bg-slate-100/80 transition-colors print:hidden"
                    >
                      <span className="flex items-center gap-1">
                        Categoría {sortBy === 'category' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('stock')}
                      className="p-4 text-[10px] font-black text-slate-500 tracking-wider uppercase cursor-pointer select-none hover:bg-slate-100/80 transition-colors print:hidden"
                    >
                      <span className="flex items-center gap-1">
                        Stock {sortBy === 'stock' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </span>
                    </th>
                    <th 
                      onClick={() => handleSort('supplier')}
                      className="p-4 text-[10px] font-black text-slate-500 tracking-wider uppercase cursor-pointer select-none hover:bg-slate-100/80 transition-colors print:hidden"
                    >
                      <span className="flex items-center gap-1">
                        Proveedor {sortBy === 'supplier' && (sortOrder === 'asc' ? '▲' : '▼')}
                      </span>
                    </th>
                    <th className="p-4 text-[10px] font-black text-slate-500 tracking-wider uppercase print:text-right">
                      Cant. a Pedir
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 print:divide-y print:divide-slate-200">
                  {processedProducts.map((p) => {
                    const sup = p.supplierId ? suppliersMap[p.supplierId] : undefined;
                    const stockIsZero = p.stock === 0;
                    const qtyToOrder = purchaseQuantities[p.id] || 0;
                    const hasQty = qtyToOrder > 0;
                    
                    return (
                      <tr 
                        key={p.id} 
                        className={`hover:bg-slate-50/40 transition-colors group print:break-inside-avoid print:hover:bg-transparent ${!hasQty ? 'print:hidden' : ''}`}
                      >
                        {/* Celda del Producto */}
                        <td className="p-4">
                          <div className="space-y-0.5">
                            <span className="font-extrabold text-xs text-slate-800 block group-hover:text-teal-600 transition-colors">
                              {p.name}
                            </span>
                            {p.expiryDate && (
                              <span className="text-[10px] font-semibold text-slate-400 block font-mono print:hidden">
                                Caducidad: {new Date(p.expiryDate).toLocaleDateString('es-ES')}
                              </span>
                            )}
                            {p.activeIngredient && (
                              <span className="text-[10px] italic font-medium text-slate-400/90 block print:hidden">
                                PA: {p.activeIngredient}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Celda de Categoría */}
                        <td className="p-4 print:hidden">
                          <span className="inline-flex px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-full text-[10.5px] font-extrabold text-slate-600 tracking-wide">
                            {p.category}
                          </span>
                        </td>

                        {/* Celda de Stock */}
                        <td className="p-4 print:hidden">
                          <div className="flex items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${stockIsZero ? 'bg-rose-500 animate-ping' : 'bg-amber-400'}`}></span>
                            <span className={`text-xs font-black ${stockIsZero ? 'text-rose-600' : 'text-amber-600'}`}>
                              {p.stock} uds.
                            </span>
                          </div>
                        </td>

                        {/* Celda del Proveedor */}
                        <td className="p-4 print:hidden">
                          {sup ? (
                            <div className="space-y-0.5">
                              <span className="text-xs font-bold text-slate-700 block">
                                {sup.name}
                              </span>
                              {(sup.phone || sup.email) && (
                                <span className="text-[10px] font-medium text-slate-400 block font-mono">
                                  {sup.phone || sup.email}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-semibold text-slate-400/80 italic block">
                              Sin Proveedor Asignado
                            </span>
                          )}
                        </td>

                        {/* Celda de Cantidad a Comprar */}
                        <td className="p-4">
                          <div className="flex items-center gap-2 print:hidden">
                            <button
                              onClick={() => handleQuantityChange(p.id, (purchaseQuantities[p.id] || 0) - 1)}
                              className="h-7 w-7 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 rounded-lg transition-colors"
                            >
                              -
                            </button>
                            <input 
                              type="number"
                              min="0"
                              value={purchaseQuantities[p.id] !== undefined ? purchaseQuantities[p.id] : ''}
                              onChange={(e) => handleQuantityChange(p.id, parseInt(e.target.value) || 0)}
                              placeholder="Cant."
                              className="w-14 text-center py-1 bg-slate-50/50 border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                            />
                            <button
                              onClick={() => handleQuantityChange(p.id, (purchaseQuantities[p.id] || 0) + 1)}
                              className="h-7 w-7 bg-slate-50 border border-slate-200/80 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-600 rounded-lg transition-colors"
                            >
                              +
                            </button>
                          </div>
                          
                          {/* Visible en impresión */}
                          <div className="hidden print:block text-right">
                            <span className="text-xs font-bold border-b border-dashed border-slate-400 font-mono px-4">
                              {purchaseQuantities[p.id] !== undefined ? `${purchaseQuantities[p.id]} uds.` : '        ____'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pie de página exclusivo para impresión (PDF) */}
              {totalPurchaseCost > 0 && (
                <div className="hidden print:flex justify-end items-center mt-6 border-t border-slate-500 pt-3 text-right">
                  <div>
                    <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500 block">
                      Gasto Comercial Estimado
                    </span>
                    <span className="text-base font-black text-slate-950 font-mono block">
                      Total: ${totalPurchaseCost.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

export default AdminShoppingList;
