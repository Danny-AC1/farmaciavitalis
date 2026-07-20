import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { 
  Search, MessageCircle, Minus, Plus, Check, AlertCircle, 
  Printer, Barcode, ArrowUpDown, Trash2, RefreshCw, 
  ShieldCheck
} from 'lucide-react';
import AdminProductPriceList from './AdminProductPriceList';
import { useUSBScanner } from '../../hooks/useUSBScanner';

interface AdminStockQuickProps {
  products: Product[];
  onUpdateStock: (id: string, s: number) => void;
}

const AdminStockQuick: React.FC<AdminStockQuickProps> = ({ products, onUpdateStock }) => {
  const [search, setSearch] = useState('');
  const [updates, setUpdates] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Filtros y ordenación
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'outOfStock' | 'healthy'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'category'>('name');
  
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Lista de categorías dinámicas
  const categoriesList = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category)));
    return ['Todas', ...list];
  }, [products]);

  // Filtrado y ordenación de productos
  const filteredAndSorted = useMemo(() => {
    return products
      .filter(p => {
        // Búsqueda por texto, código de barras o ID
        const cleanSearch = search.trim().toLowerCase();
        const matchesSearch = !cleanSearch || 
          p.name.toLowerCase().includes(cleanSearch) || 
          (p.barcode && p.barcode.toLowerCase().includes(cleanSearch)) || 
          p.id.toLowerCase().includes(cleanSearch);
        
        // Filtro por categoría
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        
        // Filtro por estado de stock
        let matchesStatus = true;
        if (stockStatusFilter === 'critical') matchesStatus = p.stock <= 5;
        else if (stockStatusFilter === 'outOfStock') matchesStatus = p.stock === 0;
        else if (stockStatusFilter === 'healthy') matchesStatus = p.stock > 5;
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stockAsc') return a.stock - b.stock;
        if (sortBy === 'stockDesc') return b.stock - a.stock;
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [products, search, selectedCategory, stockStatusFilter, sortBy]);

  // Escáner USB silencioso e inteligente en segundo plano
  useUSBScanner((code) => {
    triggerScan(code);
  }, true);

  const triggerScan = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const foundProduct = products.find(p => 
      p.barcode === cleanCode || 
      p.id === cleanCode || 
      (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase())
    );
    
    if (foundProduct) {
      setUpdates(prev => ({ ...prev, [foundProduct.id]: (prev[foundProduct.id] || 0) + 1 }));
      setLastScanned(foundProduct);
      setScanError(null);
      
      // Restablecer categorías y filtros restrictivos para asegurar visibilidad total
      setSelectedCategory('Todas');
      setStockStatusFilter('all');
      
      // Filtrar el buscador con el nombre para aislar el producto escaneado de inmediato en la tabla
      setSearch(foundProduct.name);
      
      // Enfocar de forma sutil y dar foco inmediato al input numérico para digitar con teclado
      setTimeout(() => {
        const rowElement = document.getElementById(`product-row-${foundProduct.id}`);
        if (rowElement) {
          rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        
        const inputElement = document.getElementById(`input-stock-${foundProduct.id}`) as HTMLInputElement;
        if (inputElement) {
          inputElement.focus();
          inputElement.select(); // Selecciona el texto para que puedan digitar directamente
        }
      }, 200);

      // Limpiar el aviso del último escaneado tras unos segundos
      setTimeout(() => {
        setLastScanned(null);
      }, 5000);
    } else {
      setScanError(`Código "${cleanCode}" no reconocido en el catálogo.`);
      setTimeout(() => setScanError(null), 5000);
    }
  };

  const handleUpdate = (id: string, delta: number) => {
    setUpdates(prev => {
      const currentDiff = prev[id] || 0;
      const targetProduct = products.find(p => p.id === id);
      if (!targetProduct) return prev;
      
      const newDiff = currentDiff + delta;
      // Impedir que el stock resultante sea menor a 0
      if (targetProduct.stock + newDiff < 0) {
        return { ...prev, [id]: -targetProduct.stock };
      }
      return { ...prev, [id]: newDiff };
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
        const entries = Object.entries(updates).filter(([_, delta]) => delta !== 0);
        if (entries.length === 0) return;
        
        for (const [id, delta] of entries) {
            const p = products.find(x => x.id === id);
            if (p) {
              const finalStock = Math.max(0, p.stock + delta);
              await onUpdateStock(id, finalStock);
            }
        }
        setUpdates({});
        alert("¡Inventario actualizado y guardado correctamente!");
    } catch (e) {
        alert("Error al sincronizar el inventario. Por favor reintente.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleSendStockAlert = () => {
    const lowStockList = products.filter(p => p.stock <= 5);
    if (lowStockList.length === 0) {
        return alert("¡Excelente! No hay productos en nivel crítico.");
    }

    const itemsList = lowStockList.map(p => `• ${p.name}: Quedan ${p.stock} u.`).join('\n');
    const message = `*ALERTA DE REABASTECIMIENTO - FARMACIA VITALIS* ⚠️\n\nPor favor gestionar el ingreso de los siguientes medicamentos:\n\n${itemsList}`;
    
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleGenerateShoppingList = () => {
    const lowStockList = products.filter(p => p.stock <= 5);
    if (lowStockList.length === 0) {
        return alert("No hay productos con bajo stock (≤ 5) para generar lista.");
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    const itemsHtml = lowStockList.map(p => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: 600; font-size: 13px; color: #1e293b;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569; font-size: 12px;">${p.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: center; font-weight: bold; color: #ef4444;">${p.stock}</td>
        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #94a3b8;">[ &nbsp; &nbsp; &nbsp; &nbsp; ] u.</td>
      </tr>
    `).join('');

    const content = `
      <html>
        <head>
          <title>Lista de Pedidos - Vitalis</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1e293b; background: white; }
            .header { border-bottom: 2px solid #0f766e; padding-bottom: 12px; margin-bottom: 20px; }
            h1 { color: #0f766e; font-size: 20px; margin: 0; text-transform: uppercase; }
            .date { font-size: 11px; color: #64748b; margin-top: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; background: #f8fafc; padding: 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; text-transform: uppercase; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Lista Oficial de Pedidos y Reposición</h1>
            <div class="date">Farmacia Vitalis • Fecha: ${new Date().toLocaleDateString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Medicamento / Insumo</th>
                <th>Categoría</th>
                <th style="text-align: center;">Stock Actual</th>
                <th style="text-align: right;">Cantidad Requerida</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(content);
      frameDoc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 500);
    }
  };

  const handlePrintBarcodeLabel = (product: Product) => {
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    let barsHtml = '';
    for (let i = 0; i < 40; i++) {
      const width = [1, 2, 3][Math.floor(Math.random() * 3)];
      const spacing = [1, 2][Math.floor(Math.random() * 2)];
      barsHtml += `<div style="width: ${width}px; background: black; height: 35px; margin-right: ${spacing}px; display: inline-block;"></div>`;
    }

    const content = `
      <html>
        <head>
          <title>Etiqueta - ${product.name}</title>
          <style>
            @page { size: 80mm 40mm; margin: 0; }
            body {
              font-family: monospace;
              padding: 10px;
              width: 76mm;
              height: 36mm;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: white;
            }
            .header { font-size: 8px; font-weight: bold; border-bottom: 1px solid black; padding-bottom: 2px; }
            .title { font-size: 11px; font-weight: bold; text-transform: uppercase; margin: 4px 0; }
            .price { font-size: 13px; font-weight: bold; }
            .barcode-container { text-align: center; margin-top: 4px; }
            .barcode-visual { display: flex; justify-content: center; align-items: flex-end; height: 35px; }
            .barcode-text { font-size: 9px; margin-top: 2px; }
          </style>
        </head>
        <body>
          <div>
            <div class="header">FARMACIA VITALIS</div>
            <div class="title">${product.name}</div>
            <div class="price">$${product.price.toFixed(2)} - ${product.category}</div>
          </div>
          <div class="barcode-container">
            <div class="barcode-visual">${barsHtml}</div>
            <div class="barcode-text">*${product.barcode || 'V' + product.id.substring(0,8).toUpperCase()}*</div>
          </div>
        </body>
      </html>
    `;

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(content);
      frameDoc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 500);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 max-w-full overflow-hidden pb-16">
      
      {/* 1. SECCIÓN DE BIENVENIDA Y ACCIONES RÁPIDAS DE ALTA GESTIÓN */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full w-fit">
              <ShieldCheck size={14} className="text-teal-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Consola Profesional</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
              Control de Inventario y Stock Rápido
            </h2>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">
              Actualización masiva ágil sin complicaciones artificiales
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button 
              onClick={handleSendStockAlert}
              className="flex-1 lg:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
              title="Notificar productos críticos por WhatsApp"
            >
              <MessageCircle size={16} />
              <span>Notificar WhatsApp</span>
            </button>
            
            <button 
              onClick={handleGenerateShoppingList}
              className="flex-1 lg:flex-none bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm"
              title="Generar e imprimir lista de reabastecimiento para el proveedor"
            >
              <Printer size={16} />
              <span>Imprimir Pedido</span>
            </button>

            <AdminProductPriceList products={products} />
          </div>

        </div>
      </div>

      {/* 2. BARRA DE NOTIFICACIÓN SILENCIOSA DE ESCANEO DE CÓDIGO (SI APLICA) */}
      {(lastScanned || scanError) && (
        <div className="animate-in slide-in-from-top duration-300">
          {lastScanned && (
            <div className="bg-teal-50 border border-teal-200 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-white rounded-lg p-1.5 border border-teal-100 flex items-center justify-center shrink-0">
                  <img src={lastScanned.image} className="max-h-full max-w-full object-contain" alt="" />
                </div>
                <div>
                  <p className="text-xs font-bold text-teal-800 uppercase tracking-tight">Escaneado exitosamente:</p>
                  <p className="text-sm font-semibold text-teal-900">{lastScanned.name} (+1 unidad al borrador)</p>
                </div>
              </div>
              <button 
                onClick={() => setLastScanned(null)}
                className="text-teal-500 hover:text-teal-700 text-xs font-bold uppercase tracking-wider"
              >
                Cerrar
              </button>
            </div>
          )}

          {scanError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-rose-800 text-sm font-semibold">
                <AlertCircle size={18} className="text-rose-500 shrink-0" />
                <span>{scanError}</span>
              </div>
              <button 
                onClick={() => setScanError(null)}
                className="text-rose-500 hover:text-rose-700 text-xs font-bold uppercase tracking-wider"
              >
                Cerrar
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. CONSOLA DE FILTROS Y BUSCADOR INTELIGENTE */}
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-slate-400 bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded"
              >
                Limpiar
              </button>
            )}
          </div>

          {/* Selector de Estado de Stock */}
          <div className="xl:col-span-4 flex bg-white rounded-xl border border-slate-200 p-1">
            <button 
              onClick={() => setStockStatusFilter('all')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${stockStatusFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => setStockStatusFilter('critical')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${stockStatusFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-rose-600 hover:bg-rose-50'}`}
            >
              Crítico (≤5)
            </button>
            <button 
              onClick={() => setStockStatusFilter('outOfStock')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${stockStatusFilter === 'outOfStock' ? 'bg-red-600 text-white' : 'text-red-600 hover:bg-red-50'}`}
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
              className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all ${
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

      {/* 4. TABLA PRINCIPAL DE CONTROL DE STOCK */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200">
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fármaco / Medicina</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoría</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Actual</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ajustes Rápidos Express</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Etiqueta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.map(p => {
                const diff = updates[p.id] || 0;
                const finalStock = Math.max(0, p.stock + diff);
                
                return (
                  <tr 
                    key={p.id} 
                    id={`product-row-${p.id}`}
                    className={`hover:bg-slate-50/40 transition-colors ${diff !== 0 ? 'bg-teal-50/10' : ''}`}
                  >
                    
                    {/* Producto */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 bg-white rounded-xl border border-slate-100 p-1.5 shrink-0 flex items-center justify-center">
                          <img src={p.image} className="max-h-full max-w-full object-contain" alt="" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 text-sm truncate uppercase tracking-tight">{p.name}</span>
                            {p.stock === 0 && (
                              <span className="text-[8px] font-extrabold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded uppercase tracking-wider">Agotado</span>
                            )}
                          </div>
                          <p className="text-[9px] text-slate-400 font-semibold uppercase mt-0.5">Cód: {p.barcode || 'V' + p.id.substring(0,8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {p.category}
                      </span>
                    </td>

                    {/* Stock Físico */}
                    <td className="px-6 py-4 text-center">
                      <div className="relative inline-block">
                        <span className={`px-4 py-1.5 rounded-full font-bold text-xs min-w-[70px] inline-block text-center ${
                          finalStock === 0 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : finalStock <= 5 
                            ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {p.stock} u.
                        </span>
                        {diff !== 0 && (
                          <div className="absolute -top-3.5 -right-8 animate-in zoom-in duration-200">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg border-2 border-white shadow-sm ${diff > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                              {diff > 0 ? `+${diff}` : diff}
                            </span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Ajuste Rápido */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        
                        {/* Multiplicador rápido -5 */}
                        <button 
                          onClick={() => handleUpdate(p.id, -5)}
                          className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all"
                          title="Restar 5 unidades"
                        >
                          -5
                        </button>
                        
                        <button 
                          onClick={() => handleUpdate(p.id, -1)}
                          className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 active:scale-95 transition-all"
                          title="Restar 1 unidad"
                        >
                          <Minus size={14} />
                        </button>
                        
                        <input 
                          id={`input-stock-${p.id}`}
                          type="number"
                          className="w-14 h-8 border border-slate-200 rounded-lg text-center font-bold text-xs text-slate-700 focus:border-teal-500 focus:bg-white outline-none transition-all bg-slate-50/50"
                          value={updates[p.id] || ''}
                          onChange={(e) => {
                            const v = parseInt(e.target.value);
                            setUpdates({...updates, [p.id]: isNaN(v) ? 0 : v});
                          }}
                          onFocus={(e) => e.target.select()}
                          placeholder="0"
                        />
                        
                        <button 
                          onClick={() => handleUpdate(p.id, 1)}
                          className="h-8 w-8 rounded-lg bg-slate-50 border border-slate-200 text-slate-500 flex items-center justify-center hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 transition-all"
                          title="Sumar 1 unidad"
                        >
                          <Plus size={14} />
                        </button>

                        {/* Multiplicador rápido +5 */}
                        <button 
                          onClick={() => handleUpdate(p.id, 5)}
                          className="h-8 px-2 rounded-lg bg-slate-50 border border-slate-200 text-[10px] font-bold text-slate-500 hover:bg-emerald-50 hover:text-emerald-600 active:scale-95 transition-all"
                          title="Sumar 5 unidades"
                        >
                          +5
                        </button>

                        {diff !== 0 && (
                          <button
                            onClick={() => {
                              setUpdates(prev => {
                                const copy = { ...prev };
                                delete copy[p.id];
                                return copy;
                              });
                            }}
                            className="h-8 w-8 rounded-lg bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 flex items-center justify-center transition-all"
                            title="Limpiar borrador"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Impresora de Código de Barras */}
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handlePrintBarcodeLabel(p)}
                        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-900 hover:text-white text-slate-500 transition-all active:scale-95 inline-flex items-center justify-center"
                        title="Imprimir código de barra médico"
                      >
                        <Barcode size={14} />
                      </button>
                    </td>

                  </tr>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-16 bg-slate-50/30">
                    <p className="text-slate-500 font-bold uppercase text-xs">No se encontraron medicamentos</p>
                    <p className="text-slate-400 text-[10px] font-semibold mt-1">Intente redefinir los filtros o términos de búsqueda.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTÓN FLOTANTE SÓLIDO DE CONFIRMACIÓN Y GUARDADO DE BORRADOR */}
      {Object.keys(updates).some(k => updates[k] !== 0) && (
        <div className="fixed bottom-24 right-6 md:right-12 z-50 animate-in slide-in-from-bottom-10 duration-300">
          <button 
            onClick={handleSaveAll}
            disabled={isSaving}
            className="bg-teal-700 text-white px-8 py-5 rounded-full font-bold text-sm shadow-xl flex items-center gap-3 hover:bg-teal-800 hover:scale-105 active:scale-95 transition-all border-4 border-white"
          >
            {isSaving ? (
              <RefreshCw className="animate-spin" size={18} />
            ) : (
              <Check size={18} strokeWidth={3} />
            )}
            <span>
              {isSaving ? 'Guardando Inventario...' : `Guardar Cambios (${Object.keys(updates).length} editados)`}
            </span>
          </button>
        </div>
      )}

      {/* 6. INDICADORES Y RESUMEN GENERAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 flex items-center gap-4">
          <div className="h-10 w-10 bg-rose-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            {products.filter(p => p.stock <= 5).length}
          </div>
          <div>
            <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">Stock Crítico</p>
            <p className="text-xs text-rose-900 font-semibold">Requieren reposición inmediata</p>
          </div>
        </div>
        
        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 flex items-center gap-4">
          <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            {products.filter(p => p.stock > 5).length}
          </div>
          <div>
            <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Nivel Óptimo</p>
            <p className="text-xs text-emerald-900 font-semibold">Productos con stock saludable</p>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 flex items-center gap-4">
          <div className="h-10 w-10 bg-slate-700 rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            {products.length}
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Catálogo Total</p>
            <p className="text-xs text-slate-900 font-semibold">Medicinas registradas en sistema</p>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminStockQuick;
