
import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Search, MessageCircle, Minus, Plus, Check, AlertCircle, ShoppingCart, Printer } from 'lucide-react';

interface AdminStockQuickProps {
  products: Product[];
  onUpdateStock: (id: string, s: number) => void;
}

const AdminStockQuick: React.FC<AdminStockQuickProps> = ({ products, onUpdateStock }) => {
  const [search, setSearch] = useState('');
  const [updates, setUpdates] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  const filtered = useMemo(() => 
    products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.barcode === search
    ), [products, search]);

  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= 10), [products]);

  const handleUpdate = (id: string, delta: number) => {
    setUpdates(prev => ({ ...prev, [id]: (prev[id] || 0) + delta }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
        const entries = Object.entries(updates).filter(([_, delta]) => delta !== 0);
        if (entries.length === 0) return;
        
        for (const [id, delta] of entries) {
            const p = products.find(x => x.id === id);
            if (p) await onUpdateStock(id, p.stock + delta);
        }
        setUpdates({});
        alert("¡Inventario sincronizado con éxito!");
    } catch (e) {
        alert("Error en la sincronización.");
    } finally {
        setIsSaving(false);
    }
  };

  // --- NUEVA FUNCIÓN: ENVIAR ALERTA WHATSAPP ---
  const handleSendStockAlert = () => {
    if (lowStockProducts.length === 0) {
        return alert("¡Todo en orden! No hay productos con stock crítico.");
    }

    const itemsList = lowStockProducts.map(p => `- ${p.name}: Quedan ${p.stock} unid.`).join('\n');
    const message = `*ALERTA DE STOCK CRÍTICO - VITALIS* ⚠️\n\nLos siguientes productos necesitan reabastecimiento urgente:\n\n${itemsList}\n\n_Generado el ${new Date().toLocaleString()}_`;
    
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  // --- NUEVA FUNCIÓN: GENERAR LISTA DE COMPRA (IMPRIMIBLE) ---
  const handleGenerateShoppingList = () => {
    if (lowStockProducts.length === 0) {
        return alert("No hay productos con bajo stock para la lista de compras.");
    }

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsHtml = lowStockProducts.map(p => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.name}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${p.stock}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right; color: #999;">__________</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Lista de Compras - Vitalis</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            h2 { color: #0d9488; margin-bottom: 5px; }
            .date { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; background: #f8fafc; padding: 10px; border-bottom: 2px solid #0d9488; font-size: 12px; text-transform: uppercase; }
            .footer { margin-top: 30px; font-size: 11px; text-align: center; color: #999; }
          </style>
        </head>
        <body onload="window.print();">
          <h2>LISTA DE COMPRA / REPOSICIÓN</h2>
          <div class="date">Farmacia Vitalis - Generado: ${new Date().toLocaleString()}</div>
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th style="text-align: center;">Stock Actual</th>
                <th style="text-align: right;">Cantidad a Pedir</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="footer">Este documento es para control interno de inventario.</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-full overflow-hidden">
      
      <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 w-full lg:w-auto">
            <div className="space-y-1">
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[0.9] tracking-tighter">
                  Control de <br /> Inventario
                </h2>
                <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Gestión masiva de farmacia</p>
            </div>
            
            <div className="flex gap-4 w-full sm:w-auto">
                <button 
                    onClick={handleSendStockAlert}
                    className="flex-1 sm:flex-none bg-[#10B981] text-white p-4 md:px-6 md:py-5 rounded-2xl font-black flex flex-col items-center justify-center min-w-[110px] shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <MessageCircle size={24} className="mb-1.5" />
                    <span className="text-[10px] leading-tight uppercase tracking-widest text-center">Enviar<br/>Alerta Stock</span>
                </button>
                
                <button 
                    onClick={handleGenerateShoppingList}
                    className="flex-1 sm:flex-none bg-[#2563EB] text-white p-4 md:px-6 md:py-5 rounded-2xl font-black flex flex-col items-center justify-center min-w-[110px] shadow-lg shadow-blue-600/20 hover:scale-105 active:scale-95 transition-all"
                >
                    <Printer size={24} className="mb-1.5" />
                    <span className="text-[10px] leading-tight uppercase tracking-widest text-center">Lista<br/>Compra</span>
                </button>
            </div>
          </div>

          <div className="relative w-full lg:w-96">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input 
              className="w-full bg-gray-50 border-2 border-transparent p-5 pl-14 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-base shadow-inner" 
              placeholder="Buscar por nombre o código..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>
      </div>

      {/* TABLA OPTIMIZADA */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-gray-100">
                <th className="px-6 py-6 text-left text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Producto</th>
                <th className="px-6 py-6 text-center text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Stock Actual</th>
                <th className="px-6 py-6 text-right text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">Acción Rápida</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(p => {
                const diff = updates[p.id] || 0;
                const finalStock = p.stock + diff;
                
                return (
                  <tr key={p.id} className="hover:bg-teal-50/30 transition-all group">
                    <td className="px-6 py-7">
                      <div className="flex items-center gap-5">
                        <div className="h-14 w-14 bg-white rounded-2xl border border-gray-100 p-2 shrink-0 shadow-sm flex items-center justify-center group-hover:rotate-3 transition-transform">
                            <img src={p.image} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-black text-slate-800 text-lg leading-tight truncate">{p.name}</p>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{p.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-7 text-center">
                      <div className="relative inline-block">
                        <span className={`px-6 py-2.5 rounded-full font-black text-base min-w-[80px] inline-block shadow-inner ${finalStock <= 10 ? 'bg-red-100 text-red-600' : 'bg-[#D1FAE5] text-[#065F46]'}`}>
                          {finalStock}
                        </span>
                        {diff !== 0 && (
                            <span className={`absolute -top-3 -right-4 text-[11px] font-black px-2 py-1 rounded-lg shadow-md animate-in slide-in-from-bottom-2 ${diff > 0 ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                                {diff > 0 ? `+${diff}` : diff}
                            </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-7 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                            onClick={() => handleUpdate(p.id, -1)}
                            className="h-12 w-12 rounded-xl bg-gray-100 text-slate-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-90 shadow-sm"
                        >
                          <Minus size={22} strokeWidth={3}/>
                        </button>
                        
                        <input 
                            type="number"
                            className="w-20 h-12 border-2 border-gray-100 rounded-xl text-center font-black text-xl text-slate-700 focus:border-teal-500 outline-none transition-all bg-gray-50/50"
                            value={updates[p.id] || ''}
                            onChange={(e) => setUpdates({...updates, [p.id]: parseInt(e.target.value) || 0})}
                            placeholder="0"
                        />
                        
                        <button 
                            onClick={() => handleUpdate(p.id, 1)}
                            className="h-12 w-12 rounded-xl bg-gray-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-90 shadow-sm"
                        >
                          <Plus size={22} strokeWidth={3}/>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTÓN FLOTANTE RESPONSIVO */}
      {Object.keys(updates).some(k => updates[k] !== 0) && (
          <div className="fixed bottom-24 right-6 md:right-12 z-50 animate-in slide-in-from-bottom-20 duration-500">
              <button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="bg-slate-900 text-white px-10 md:px-14 py-6 rounded-full font-black text-xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center gap-5 hover:bg-black hover:scale-105 active:scale-95 transition-all border-[6px] border-white"
              >
                {isSaving ? <Plus className="animate-spin"/> : <Check size={32} strokeWidth={4} className="text-teal-400" />}
                {isSaving ? 'Sincronizando...' : 'Confirmar Cambios'}
              </button>
          </div>
      )}

      {/* ESTADÍSTICAS RÁPIDAS (PC SOLAMENTE) */}
      <div className="hidden lg:grid grid-cols-3 gap-8 pt-4">
          <div className="bg-orange-50 p-8 rounded-[2rem] border-2 border-orange-100 flex items-center gap-6 group hover:bg-orange-100/50 transition-colors">
              <div className="h-16 w-16 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-orange-500/30 group-hover:scale-110 transition-transform">
                  <AlertCircle size={32}/>
              </div>
              <div>
                  <p className="text-xs font-black text-orange-600 uppercase tracking-widest">Agotándose</p>
                  <p className="text-3xl font-black text-orange-950">{products.filter(p => p.stock <=105).length} Ítems</p>
              </div>
          </div>
          <div className="bg-emerald-50 p-8 rounded-[2rem] border-2 border-emerald-100 flex items-center gap-6 group hover:bg-emerald-100/50 transition-colors">
              <div className="h-16 w-16 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform">
                  <Check size={32}/>
              </div>
              <div>
                  <p className="text-xs font-black text-emerald-600 uppercase tracking-widest">Inventario Sano</p>
                  <p className="text-3xl font-black text-emerald-950">Normal</p>
              </div>
          </div>
          <div className="bg-blue-50 p-8 rounded-[2rem] border-2 border-blue-100 flex items-center gap-6 group hover:bg-blue-100/50 transition-colors">
              <div className="h-16 w-16 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-500/30 group-hover:scale-110 transition-transform">
                  <ShoppingCart size={32}/>
              </div>
              <div>
                  <p className="text-xs font-black text-blue-600 uppercase tracking-widest">Ventas Hoy</p>
                  <p className="text-3xl font-black text-blue-950">Activo</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminStockQuick;
