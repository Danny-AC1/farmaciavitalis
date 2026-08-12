import React, { useState, useMemo } from 'react';
import { Product, Supplier } from '../../types';
import { updateProductDB } from '../../services/db.products';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Save, 
  Printer, 
  Building2, 
  Sparkles,
  RefreshCw
} from 'lucide-react';

interface AdminSupplierPricesProps {
  products: Product[];
  suppliers: Supplier[];
}

export const AdminSupplierPrices: React.FC<AdminSupplierPricesProps> = ({ products, suppliers }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyOutRange, setOnlyOutRange] = useState(false);

  // Estado local para los campos editados por producto id
  const [editedPrices, setEditedPrices] = useState<Record<string, {
    costPrice: string;
    supplierBoxPrice: string;
    supplierPriceRangeMin: string;
    supplierPriceRangeMax: string;
    suggestedRetailPrice: string;
    price: string; // PVP Actual
  }>>({});

  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  // Mapear proveedores
  const suppliersMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach(s => {
      map[s.id] = s.name;
    });
    return map;
  }, [suppliers]);

  // Obtener categorías únicas
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Inicializar o leer valores de un producto
  const getProductValues = (p: Product) => {
    const edit = editedPrices[p.id];
    if (edit) return edit;
    return {
      costPrice: p.costPrice !== undefined ? p.costPrice.toString() : '',
      supplierBoxPrice: p.supplierBoxPrice !== undefined ? p.supplierBoxPrice.toString() : (p.boxPrice !== undefined ? p.boxPrice.toString() : ''),
      supplierPriceRangeMin: p.supplierPriceRangeMin !== undefined ? p.supplierPriceRangeMin.toString() : '',
      supplierPriceRangeMax: p.supplierPriceRangeMax !== undefined ? p.supplierPriceRangeMax.toString() : '',
      suggestedRetailPrice: p.suggestedRetailPrice !== undefined ? p.suggestedRetailPrice.toString() : '',
      price: p.price !== undefined ? p.price.toString() : '',
    };
  };

  const handleValueChange = (productId: string, field: string, value: string, originalProduct: Product) => {
    const current = getProductValues(originalProduct);
    // Cada campo es 100% independiente para no afectar o sobreescribir otros valores en la sección de productos
    setEditedPrices(prev => ({
      ...prev,
      [productId]: {
        ...current,
        [field]: value
      }
    }));
  };

  // Guardar cambios individuales de un producto en Firestore/Database
  const handleSaveProductPrices = async (p: Product) => {
    const values = getProductValues(p);
    setSavingId(p.id);

    try {
      const parsedCostPrice = values.costPrice !== '' ? parseFloat(values.costPrice) : p.costPrice;
      const parsedSupplierBoxPrice = values.supplierBoxPrice !== '' ? parseFloat(values.supplierBoxPrice) : undefined;
      const parsedMinRange = values.supplierPriceRangeMin !== '' ? parseFloat(values.supplierPriceRangeMin) : undefined;
      const parsedMaxRange = values.supplierPriceRangeMax !== '' ? parseFloat(values.supplierPriceRangeMax) : undefined;
      const parsedSuggestedRetail = values.suggestedRetailPrice !== '' ? parseFloat(values.suggestedRetailPrice) : undefined;
      const parsedPrice = values.price !== '' ? parseFloat(values.price) : p.price;

      const updatedProduct: Product = {
        ...p,
        costPrice: parsedCostPrice,
        // Conservamos boxPrice intacto para la sesión de productos principal y guardamos supplierBoxPrice independientemente
        boxPrice: p.boxPrice, 
        supplierBoxPrice: parsedSupplierBoxPrice,
        supplierPriceRangeMin: parsedMinRange,
        supplierPriceRangeMax: parsedMaxRange,
        suggestedRetailPrice: parsedSuggestedRetail,
        price: parsedPrice,
      };

      await updateProductDB(updatedProduct);

      setSavedSuccessId(p.id);
      setTimeout(() => setSavedSuccessId(null), 2500);
    } catch (err) {
      console.error("Error al actualizar precio de compra:", err);
      alert("Error al guardar los precios en la base de datos.");
    } finally {
      setSavingId(null);
    }
  };

  // Filtrado de productos
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Filtro de búsqueda textual
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.activeIngredient && p.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (p.barcode && p.barcode.includes(searchTerm));

      if (!matchesSearch) return false;

      // Filtro de proveedor
      if (selectedSupplier !== 'all' && p.supplierId !== selectedSupplier) return false;

      // Filtro de categoría
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;

      // Filtro PVP fuera de rango sugerido
      if (onlyOutRange) {
        const min = p.supplierPriceRangeMin;
        const max = p.supplierPriceRangeMax;
        if (min !== undefined && max !== undefined) {
          if (p.price >= min && p.price <= max) return false;
        } else {
          return false; // Si no tiene rango configurado, se excluye cuando este filtro está activo
        }
      }

      return true;
    });
  }, [products, searchTerm, selectedSupplier, selectedCategory, onlyOutRange]);

  // Estadísticas globales de precios
  const stats = useMemo(() => {
    let totalWithCost = 0;
    let totalMarginSum = 0;
    let outOfRangeCount = 0;

    products.forEach(p => {
      if (p.costPrice && p.costPrice > 0) {
        totalWithCost++;
        const margin = ((p.price - p.costPrice) / p.price) * 100;
        totalMarginSum += margin;
      }

      if (p.supplierPriceRangeMin !== undefined && p.supplierPriceRangeMax !== undefined) {
        if (p.price < p.supplierPriceRangeMin || p.price > p.supplierPriceRangeMax) {
          outOfRangeCount++;
        }
      }
    });

    const avgMargin = totalWithCost > 0 ? (totalMarginSum / totalWithCost).toFixed(1) : '0.0';

    return {
      totalProducts: products.length,
      totalWithCost,
      avgMargin,
      outOfRangeCount,
    };
  }, [products]);

  // Imprimir Hoja de Costos de Distribuidora
  const handlePrintCostList = () => {
    if (filteredProducts.length === 0) {
      alert("No hay productos filtrados para imprimir.");
      return;
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reporte de Precios de Compra y Distribuidoras - Vitalis</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; padding: 20px; }
            h1 { color: #0f766e; margin-bottom: 4px; font-size: 18px; text-transform: uppercase; }
            p { margin-top: 0; color: #64748b; font-size: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { background-color: #f1f5f9; color: #334155; text-align: left; padding: 8px; border: 1px solid #cbd5e1; font-size: 10px; text-transform: uppercase; }
            td { padding: 6px 8px; border: 1px solid #e2e8f0; }
            .num { text-align: right; font-weight: bold; }
            .text-center { text-align: center; }
            .badge-out { color: #c2410c; font-weight: bold; }
            .badge-ok { color: #15803d; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>Vitalis - Precios de Compra y Distribuidora (Difare)</h1>
          <p>Generado el ${new Date().toLocaleString()} | Total ítems: ${filteredProducts.length}</p>
          <table>
            <thead>
              <tr>
                <th>Producto / Medicamento</th>
                <th>Categoría</th>
                <th class="num">P. Compra Unit.</th>
                <th class="num">Costo Caja</th>
                <th class="num">Rango Mínimo Sug.</th>
                <th class="num">Rango Máximo Sug.</th>
                <th class="num">PVP Sugerido (Recom.)</th>
                <th class="num">PVP Actual</th>
                <th class="num">Margen Real</th>
              </tr>
            </thead>
            <tbody>
              ${filteredProducts.map(p => {
                const cost = p.costPrice !== undefined ? `$${p.costPrice.toFixed(2)}` : 'N/A';
                const box = p.supplierBoxPrice !== undefined ? `$${p.supplierBoxPrice.toFixed(2)}` : (p.boxPrice !== undefined ? `$${p.boxPrice.toFixed(2)}` : 'N/A');
                const min = p.supplierPriceRangeMin !== undefined ? `$${p.supplierPriceRangeMin.toFixed(2)}` : '-';
                const max = p.supplierPriceRangeMax !== undefined ? `$${p.supplierPriceRangeMax.toFixed(2)}` : '-';
                const rec = p.suggestedRetailPrice !== undefined ? `$${p.suggestedRetailPrice.toFixed(2)}` : '-';
                const pvp = `$${p.price.toFixed(2)}`;
                const margin = p.costPrice ? `${(((p.price - p.costPrice) / p.price) * 100).toFixed(1)}%` : 'N/A';

                return `
                  <tr>
                    <td><strong>${p.name}</strong> ${p.activeIngredient ? `<br/><small>(${p.activeIngredient})</small>` : ''}</td>
                    <td>${p.category}</td>
                    <td class="num">${cost}</td>
                    <td class="num">${box}</td>
                    <td class="num">${min}</td>
                    <td class="num">${max}</td>
                    <td class="num">${rec}</td>
                    <td class="num">${pvp}</td>
                    <td class="num">${margin}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
      
      {/* Banner Principal Informativo */}
      <div className="bg-gradient-to-br from-slate-900 via-teal-950 to-slate-900 text-white p-6 md:p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden border border-teal-800/40">
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-500/20 border border-teal-400/30 rounded-full text-[10px] font-black text-teal-300 tracking-wider uppercase">
              <Building2 size={13} /> Gestión de Distribuidoras & Precios de Compra
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Control de Precios de Compra (Difare / Proveedores)
            </h2>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              Registra directamente el <strong className="text-teal-300 font-extrabold">Precio de Compra</strong> que te otorga tu distribuidora (ej: Difare) y los <strong className="text-teal-300 font-extrabold font-mono">Rangos de Venta Sugeridos (Mínimo - Máximo)</strong>. Ajusta los costos cuando varíen las facturas para mantener márgenes reales.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 shrink-0">
            <button
              onClick={handlePrintCostList}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl text-xs font-bold transition backdrop-blur-md active:scale-95"
            >
              <Printer size={16} /> Imprimir Hoja de Costos
            </button>
          </div>
        </div>

        {/* Tarjetas de Métricas Resumen */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-8 pt-6 border-t border-white/10">
          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Total Catálogo</span>
            <span className="text-2xl font-black text-white mt-1 block">{stats.totalProducts} <span className="text-xs text-slate-400 font-normal">items</span></span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-bold text-teal-300 uppercase tracking-widest block">Con Costo Registrado</span>
            <span className="text-2xl font-black text-teal-400 mt-1 block">{stats.totalWithCost} <span className="text-xs text-teal-200/60 font-normal">({Math.round((stats.totalWithCost/stats.totalProducts)*100 || 0)}%)</span></span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-widest block">Margen Promedio</span>
            <span className="text-2xl font-black text-emerald-400 mt-1 block">{stats.avgMargin}%</span>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-md">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest block">PVP Fuera de Rango</span>
            <span className="text-2xl font-black text-amber-400 mt-1 block">{stats.outOfRangeCount} <span className="text-xs text-amber-200/60 font-normal">alertas</span></span>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Campo Búsqueda Textual */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar medicamento, principio activo, barra..."
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200 rounded-full px-2 py-0.5"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filtro Proveedor */}
          <div className="w-full md:w-56">
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
              className="w-full p-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500"
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
            className={`px-4 py-3 rounded-2xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
              onlyOutRange 
                ? 'bg-amber-500 text-white border-amber-600 shadow-md' 
                : 'bg-slate-50 text-slate-600 border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle size={15} /> 
            <span>Solo PVP fuera de Rango</span>
          </button>

        </div>

        {/* Guía Estilo Difare explicativa */}
        <div className="bg-teal-50/60 border border-teal-100 p-3.5 rounded-2xl flex items-start gap-3">
          <Sparkles className="text-teal-600 shrink-0 mt-0.5" size={18} />
          <div className="text-[11px] text-teal-900 leading-snug font-medium">
            <strong>Estructura de Precios Distribuidora Difare:</strong> <br />
            <strong>1. Precio de Compra:</strong> El precio neto con el que adquieres el medicamento. <br />
            <strong>2. Rango Mínimo - Máximo Sugerido:</strong> El rango permitido o recomendado de venta al público (PVP). El sistema te indicará en verde si tu PVP actual se encuentra dentro de dicho rango.
          </div>
        </div>
      </div>

      {/* Listado de Productos y Editor de Precios */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              Listado de Medicamentos para Registro de Costos ({filteredProducts.length})
            </h3>
            <p className="text-xs text-slate-400">Edita los valores en la tabla y presiona el botón "Guardar" de cada fila.</p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 size={48} className="mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-700 text-sm">No se encontraron medicamentos</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Intenta cambiar los términos de búsqueda o desactiva los filtros activos.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="p-4 pl-6 min-w-[200px]">Medicamento / Info</th>
                  <th className="p-4 min-w-[130px]">P. Compra Unit. ($)</th>
                  <th className="p-4 min-w-[120px]">Costo Caja ($)</th>
                  <th className="p-4 min-w-[140px]">Rango Mín. Sugerido ($)</th>
                  <th className="p-4 min-w-[140px]">Rango Máx. Sugerido ($)</th>
                  <th className="p-4 min-w-[160px]">PVP Recomendado ($)</th>
                  <th className="p-4 min-w-[130px]">PVP Actual ($)</th>
                  <th className="p-4 text-center min-w-[120px]">Margen / Estado</th>
                  <th className="p-4 pr-6 text-right min-w-[110px]">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map(p => {
                  const values = getProductValues(p);
                  const isSaving = savingId === p.id;
                  const isSavedSuccess = savedSuccessId === p.id;

                  const costVal = parseFloat(values.costPrice) || 0;
                  const minRangeVal = parseFloat(values.supplierPriceRangeMin) || 0;
                  const maxRangeVal = parseFloat(values.supplierPriceRangeMax) || 0;
                  const pvpVal = parseFloat(values.price) || 0;

                  // Margen calculado
                  const marginPct = pvpVal > 0 && costVal > 0 
                    ? (((pvpVal - costVal) / pvpVal) * 100).toFixed(1) 
                    : null;

                  // Estado del PVP respecto al rango Difare
                  let rangeStatus: 'ok' | 'below' | 'above' | 'none' = 'none';
                  if (minRangeVal > 0 && maxRangeVal > 0 && pvpVal > 0) {
                    if (pvpVal < minRangeVal) rangeStatus = 'below';
                    else if (pvpVal > maxRangeVal) rangeStatus = 'above';
                    else rangeStatus = 'ok';
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Producto */}
                      <td className="p-4 pl-6">
                        <div className="font-extrabold text-slate-800">{p.name}</div>
                        {p.activeIngredient && (
                          <span className="text-[10px] font-semibold text-teal-600 block">{p.activeIngredient}</span>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-bold">
                            {p.category}
                          </span>
                          {p.supplierId && suppliersMap[p.supplierId] && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-[9px] font-bold border border-blue-100">
                              {suppliersMap[p.supplierId]}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 1. Precio de Compra Unitario */}
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={values.costPrice}
                            onChange={(e) => handleValueChange(p.id, 'costPrice', e.target.value, p)}
                            className="w-24 pl-6 pr-2 py-1.5 bg-amber-50/50 border border-amber-200/80 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                          />
                        </div>
                        <span className="text-[9px] text-amber-700 font-medium block mt-0.5">Precio Compra</span>
                      </td>

                      {/* Costo Caja */}
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={values.supplierBoxPrice}
                            onChange={(e) => handleValueChange(p.id, 'supplierBoxPrice', e.target.value, p)}
                            className="w-24 pl-6 pr-2 py-1.5 bg-indigo-50/60 border border-indigo-200/90 rounded-xl text-xs font-black text-indigo-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                          />
                        </div>
                        <span className="text-[9px] text-indigo-700 font-semibold block mt-0.5">
                          {p.unitsPerBox ? `Costo Caja (${p.unitsPerBox} un)` : 'Costo Caja'}
                        </span>
                      </td>

                      {/* 2. Rango Mínimo Sugerido Difare */}
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Mínimo"
                            value={values.supplierPriceRangeMin}
                            onChange={(e) => handleValueChange(p.id, 'supplierPriceRangeMin', e.target.value, p)}
                            className="w-28 pl-6 pr-2 py-1.5 bg-teal-50/40 border border-teal-200/80 rounded-xl text-xs font-extrabold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                          />
                        </div>
                        <span className="text-[9px] text-teal-600 font-medium block mt-0.5">PVP Mínimo Sug.</span>
                      </td>

                      {/* 3. Rango Máximo Sugerido Difare */}
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="Máximo"
                            value={values.supplierPriceRangeMax}
                            onChange={(e) => handleValueChange(p.id, 'supplierPriceRangeMax', e.target.value, p)}
                            className="w-28 pl-6 pr-2 py-1.5 bg-teal-50/40 border border-teal-200/80 rounded-xl text-xs font-extrabold text-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                          />
                        </div>
                        <span className="text-[9px] text-teal-600 font-medium block mt-0.5">PVP Máximo Sug.</span>
                      </td>

                      {/* 4. PVP Sugerido / Recomendación de Venta */}
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder={
                              minRangeVal > 0 && maxRangeVal > 0 
                                ? ((minRangeVal + maxRangeVal) / 2).toFixed(2)
                                : costVal > 0 ? (costVal * 1.3).toFixed(2) : 'Recomendado'
                            }
                            value={values.suggestedRetailPrice}
                            onChange={(e) => handleValueChange(p.id, 'suggestedRetailPrice', e.target.value, p)}
                            className="w-28 pl-6 pr-2 py-1.5 bg-blue-50/60 border border-blue-200/90 rounded-xl text-xs font-black text-blue-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                          />
                        </div>
                        <span className="text-[9px] text-blue-700 font-semibold block mt-0.5">PVP Recomendado</span>
                      </td>

                      {/* PVP Actual de Venta */}
                      <td className="p-4">
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            value={values.price}
                            onChange={(e) => handleValueChange(p.id, 'price', e.target.value, p)}
                            className="w-24 pl-6 pr-2 py-1.5 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs font-black text-emerald-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white"
                          />
                        </div>
                        <span className="text-[9px] text-emerald-700 font-medium block mt-0.5">Precio Venta Público</span>
                      </td>

                      {/* Margen y Diagnóstico Rango */}
                      <td className="p-4 text-center">
                        {marginPct !== null ? (
                          <div className="space-y-1">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                              parseFloat(marginPct) <= 0 
                                ? 'bg-red-100 text-red-700 border border-red-200' 
                                : parseFloat(marginPct) < 20 
                                ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {marginPct}% Margen
                            </span>

                            {rangeStatus === 'ok' && (
                              <span className="text-[9px] font-extrabold text-emerald-600 flex items-center justify-center gap-0.5">
                                <CheckCircle2 size={11} /> En rango Difare
                              </span>
                            )}
                            {rangeStatus === 'below' && (
                              <span className="text-[9px] font-extrabold text-amber-600 flex items-center justify-center gap-0.5">
                                <AlertTriangle size={11} /> Bajo mín. sugerido
                              </span>
                            )}
                            {rangeStatus === 'above' && (
                              <span className="text-[9px] font-extrabold text-orange-600 flex items-center justify-center gap-0.5">
                                <AlertTriangle size={11} /> Sobre máx. sugerido
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">Sin datos costo</span>
                        )}
                      </td>

                      {/* Botón Guardar */}
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleSaveProductPrices(p)}
                          disabled={isSaving}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ml-auto ${
                            isSavedSuccess
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-teal-600 hover:bg-teal-700 text-white shadow-sm active:scale-95'
                          }`}
                        >
                          {isSaving ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : isSavedSuccess ? (
                            <>
                              <CheckCircle2 size={13} /> ¡Guardado!
                            </>
                          ) : (
                            <>
                              <Save size={13} /> Guardar
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminSupplierPrices;
