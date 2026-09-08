import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { MessageCircle, Printer, AlertCircle, ShieldCheck } from 'lucide-react';
import AdminProductPriceList from './AdminProductPriceList';
import { useUSBScanner } from '../../hooks/useUSBScanner';
import { getStockAlertConfig, StockAlertConfig } from '../../services/stockAlertService';
import { sendStockAlertWhatsApp, generateShoppingListPrint, printBarcodeLabel } from './stock/stockPrintUtils';
import { StockQuickFilterBar } from './stock/StockQuickFilterBar';
import { StockQuickProductRow } from './stock/StockQuickProductRow';
import { StockQuickSummaryCards } from './stock/StockQuickSummaryCards';
import { useStockQuickFilter } from './stock/useStockQuickFilter';

interface AdminStockQuickProps {
  products: Product[];
  onUpdateStock: (id: string, s: number) => void;
}

const AdminStockQuick: React.FC<AdminStockQuickProps> = ({ products, onUpdateStock }) => {
  const [updates, setUpdates] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [alertConfig, setAlertConfig] = useState<StockAlertConfig>(() => getStockAlertConfig());
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    const handleConfigChange = () => setAlertConfig(getStockAlertConfig());
    window.addEventListener('vitalis_stock_alert_changed', handleConfigChange);
    window.addEventListener('storage', handleConfigChange);
    return () => {
      window.removeEventListener('vitalis_stock_alert_changed', handleConfigChange);
      window.removeEventListener('storage', handleConfigChange);
    };
  }, []);

  const filterState = useStockQuickFilter(products, alertConfig);

  useUSBScanner((code) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;
    const found = products.find(p => p.barcode === cleanCode || p.id === cleanCode || (p.barcode && p.barcode.toLowerCase() === cleanCode.toLowerCase()));
    if (found) {
      setUpdates(prev => ({ ...prev, [found.id]: (prev[found.id] || 0) + 1 }));
      setLastScanned(found);
      setScanError(null);
      filterState.setSelectedCategory('Todas');
      filterState.setStockStatusFilter('all');
      filterState.setSearch(found.name);
      setTimeout(() => {
        const row = document.getElementById(`product-row-${found.id}`);
        if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = document.getElementById(`input-stock-${found.id}`) as HTMLInputElement;
        if (input) { input.focus(); input.select(); }
      }, 200);
      setTimeout(() => setLastScanned(null), 5000);
    } else {
      setScanError(`Código "${cleanCode}" no reconocido en el catálogo.`);
      setTimeout(() => setScanError(null), 5000);
    }
  }, true);

  const handleUpdate = (id: string, delta: number) => {
    setUpdates(prev => {
      const currentDiff = prev[id] || 0;
      const target = products.find(p => p.id === id);
      if (!target) return prev;
      const newDiff = currentDiff + delta;
      if (target.stock + newDiff < 0) return { ...prev, [id]: -target.stock };
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
    } catch {
      alert("Error al sincronizar el inventario. Por favor reintente.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-300 max-w-full overflow-hidden pb-16">
      {/* 1. SECCIÓN DE BIENVENIDA Y ACCIONES RÁPIDAS */}
      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200/80 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-1 rounded-full w-fit">
              <ShieldCheck size={14} className="text-teal-600" />
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Consola Profesional</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">Control de Inventario y Stock Rápido</h2>
            <p className="text-slate-500 text-xs uppercase tracking-wider font-semibold">Actualización masiva ágil sin complicaciones</p>
          </div>
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <button 
              onClick={() => sendStockAlertWhatsApp(products, alertConfig)}
              className="flex-1 lg:flex-none bg-emerald-600 text-white px-5 py-3 rounded-2xl text-xs font-bold hover:bg-emerald-700 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageCircle size={16} />
              <span>Notificar WhatsApp</span>
            </button>
            <button 
              onClick={() => generateShoppingListPrint(products, alertConfig)}
              className="flex-1 lg:flex-none bg-slate-800 text-white px-5 py-3 rounded-2xl text-xs font-bold hover:bg-slate-900 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Printer size={16} />
              <span>Imprimir Pedido</span>
            </button>
            <AdminProductPriceList products={products} />
          </div>
        </div>
      </div>

      {/* 2. NOTIFICACIÓN DE ESCANEO */}
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
              <button onClick={() => setLastScanned(null)} className="text-teal-500 hover:text-teal-700 text-xs font-bold uppercase tracking-wider cursor-pointer">Cerrar</button>
            </div>
          )}
          {scanError && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-rose-800 text-sm font-semibold">
                <AlertCircle size={18} className="text-rose-500 shrink-0" />
                <span>{scanError}</span>
              </div>
              <button onClick={() => setScanError(null)} className="text-rose-500 hover:text-rose-700 text-xs font-bold uppercase tracking-wider cursor-pointer">Cerrar</button>
            </div>
          )}
        </div>
      )}

      {/* 3. FILTROS */}
      <StockQuickFilterBar
        search={filterState.search}
        setSearch={filterState.setSearch}
        stockStatusFilter={filterState.stockStatusFilter}
        setStockStatusFilter={filterState.setStockStatusFilter}
        sortBy={filterState.sortBy}
        setSortBy={filterState.setSortBy}
        categoriesList={filterState.categoriesList}
        selectedCategory={filterState.selectedCategory}
        setSelectedCategory={filterState.setSelectedCategory}
      />

      {/* 4. TABLA */}
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
              {filterState.filteredAndSorted.map(p => (
                <StockQuickProductRow
                  key={p.id}
                  product={p}
                  diff={updates[p.id] || 0}
                  onUpdate={handleUpdate}
                  onSetDirectUpdate={(id, val) => setUpdates(prev => ({ ...prev, [id]: val }))}
                  onClearDraft={(id) => setUpdates(prev => {
                    const copy = { ...prev };
                    delete copy[id];
                    return copy;
                  })}
                  onPrintBarcode={printBarcodeLabel}
                />
              ))}
              {filterState.filteredAndSorted.length === 0 && (
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

      {/* 5. RESUMEN Y GUARDADO */}
      <StockQuickSummaryCards
        products={products}
        alertConfig={alertConfig}
        updates={updates}
        isSaving={isSaving}
        onSaveAll={handleSaveAll}
      />
    </div>
  );
};

export default AdminStockQuick;
