import React, { useState, useMemo } from 'react';
import { Product } from '../../types';
import { 
  Search, MessageCircle, Minus, Plus, Check, AlertCircle, ShoppingCart, 
  Printer, Barcode, Volume2, VolumeX, ListFilter, 
  ArrowUpDown, Trash2, RefreshCw, Layers, ShieldCheck
} from 'lucide-react';
import AdminProductPriceList from './AdminProductPriceList';
import { useUSBScanner } from '../../hooks/useUSBScanner';

interface AdminStockQuickProps {
  products: Product[];
  onUpdateStock: (id: string, s: number) => void;
}

// --- SISTEMA DE AUDIO CIENTÍFICO CON SINTETIZADOR WEB AUDIO API ---
const playSound = (type: 'beep' | 'success' | 'click' | 'error' | 'sparkle') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(950, ctx.currentTime);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } else if (type === 'success') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (type === 'click') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'error') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'sparkle') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.setValueAtTime(1320, ctx.currentTime + 0.05);
      osc.frequency.setValueAtTime(1760, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn('Web Audio API not allowed or supported yet', e);
  }
};

const AdminStockQuick: React.FC<AdminStockQuickProps> = ({ products, onUpdateStock }) => {
  const [search, setSearch] = useState('');
  const [updates, setUpdates] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);

  // --- NUEVOS ESTADOS DE CONTROL PRO ---
  const [scannerEnabled, setScannerEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastScanned, setLastScanned] = useState<Product | null>(null);
  const [scannedFlashId, setScannedFlashId] = useState<string | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'outOfStock' | 'healthy'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'category'>('name');
  
  // Herramientas de Lote
  const [bulkAction, setBulkAction] = useState<'add' | 'set' | ''>('');
  const [bulkValue, setBulkValue] = useState<number>(0);
  const [simulatedCode, setSimulatedCode] = useState('');

  // --- LISTA DE CATEGORÍAS DINÁMICAS ---
  const categoriesList = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category)));
    return ['Todas', ...list];
  }, [products]);

  // --- FILTRADO Y ORDENACIÓN AVANZADA ---
  const filteredAndSorted = useMemo(() => {
    return products
      .filter(p => {
        // Filtro por Texto / Código barras
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode === search || p.id === search;
        
        // Filtro por Categoría
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        
        // Filtro por Estado Stock
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

  // --- ESCÁNER USB INTEGRADO ---
  useUSBScanner((code) => {
    if (!scannerEnabled) return;
    triggerScan(code);
  }, scannerEnabled);

  const triggerScan = (code: string) => {
    const cleanCode = code.trim();
    if (!cleanCode) return;

    const foundProduct = products.find(p => p.barcode === cleanCode || p.id === cleanCode || p.barcode?.toLowerCase() === cleanCode.toLowerCase());
    
    if (foundProduct) {
      setUpdates(prev => ({ ...prev, [foundProduct.id]: (prev[foundProduct.id] || 0) + 1 }));
      setLastScanned(foundProduct);
      if (soundEnabled) playSound('beep');
      setScannedFlashId(foundProduct.id);
      setScanError(null);
      
      // Enfocar y centrar en la lista
      setTimeout(() => {
        const element = document.getElementById(`product-row-${foundProduct.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);

      setTimeout(() => {
        setScannedFlashId(null);
      }, 2000);
    } else {
      if (soundEnabled) playSound('error');
      setScanError(`Código "${cleanCode}" no coincide con ningún producto registrado.`);
      setTimeout(() => setScanError(null), 5000);
    }
  };

  const handleUpdate = (id: string, delta: number) => {
    if (soundEnabled) playSound('click');
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
        if (soundEnabled) playSound('success');
        alert("¡Inventario sincronizado y guardado con éxito!");
    } catch (e) {
        if (soundEnabled) playSound('error');
        alert("Ocurrió un error durante la sincronización del inventario.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleApplyBulkAction = () => {
    if (!bulkAction) return;
    if (soundEnabled) playSound('success');
    
    const newUpdates = { ...updates };
    filteredAndSorted.forEach(p => {
      if (bulkAction === 'add') {
        newUpdates[p.id] = (newUpdates[p.id] || 0) + bulkValue;
      } else if (bulkAction === 'set') {
        newUpdates[p.id] = bulkValue - p.stock; // delta necesario para llegar a bulkValue
      }
    });
    setUpdates(newUpdates);
    setBulkAction('');
    setBulkValue(0);
  };

  const handleSendStockAlert = () => {
    const lowStockList = products.filter(p => p.stock <= 5);
    if (lowStockList.length === 0) {
        return alert("¡Excelente! Todos los productos están por encima de la zona de stock crítico.");
    }

    const itemsList = lowStockList.map(p => `• ${p.name}: Quedan ${p.stock} u. (Código: ${p.barcode || 'N/A'})`).join('\n');
    const message = `*ALERTA DE REABASTECIMIENTO CRÍTICO - FARMACIA VITALIS* ⚠️\n\nPor favor gestionar el ingreso de los siguientes fármacos urgentemente:\n\n${itemsList}\n\n_Reporte generado automáticamente por la central de stock de Vitalis._`;
    
    const waLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleGenerateShoppingList = () => {
    const lowStockList = products.filter(p => p.stock <= 5);
    if (lowStockList.length === 0) {
        return alert("No hay productos con bajo stock (≤ 5) para la lista de compras.");
    }

    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    const itemsHtml = lowStockList.map(p => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-weight: bold; font-size: 13px; color: #1e293b;">${p.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; color: #475569; font-size: 12px;">${p.category}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: center; font-weight: bold; color: #ef4444; background: #fef2f2; border-radius: 6px;">${p.stock}</td>
        <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; text-align: right; color: #cbd5e1; font-weight: normal;">[ &nbsp; &nbsp; &nbsp; ] unidades</td>
      </tr>
    `).join('');

    const content = `
      <html>
        <head>
          <title>Lista de Abastecimiento - Vitalis</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; padding: 30px; color: #1e293b; background: white; }
            .header-container { border-bottom: 3px double #0d9488; padding-bottom: 15px; margin-bottom: 25px; }
            h1 { color: #0d9488; font-size: 24px; margin: 0 0 5px 0; font-weight: 800; text-transform: uppercase; letter-spacing: -0.5px; }
            .meta { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th { text-align: left; background: #f8fafc; padding: 12px 10px; border-bottom: 2px solid #cbd5e1; font-size: 11px; font-weight: 800; text-transform: uppercase; color: #475569; letter-spacing: 0.5px; }
            .footer { margin-top: 40px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 15px; font-weight: bold; text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="header-container">
            <h1>Lista Oficial de Pedidos y Reposición</h1>
            <div class="meta">Farmacia Vitalis • Generado: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Fármaco / Insumo</th>
                <th>Categoría</th>
                <th style="text-align: center;">Stock Actual</th>
                <th style="text-align: right;">Cantidad Solicitada</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>
          <div class="footer">Documento Oficial de Control y Suministros Vitalis</div>
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
    if (soundEnabled) playSound('click');
    
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    let barsHtml = '';
    for (let i = 0; i < 46; i++) {
      const width = [1, 2, 3, 4][Math.floor(Math.random() * 4)];
      const spacing = [1, 2, 3][Math.floor(Math.random() * 3)];
      barsHtml += `<div style="width: ${width}px; background: black; height: 45px; margin-right: ${spacing}px; display: inline-block;"></div>`;
    }

    const content = `
      <html>
        <head>
          <title>Etiqueta de Código de Barras - ${product.name}</title>
          <style>
            @page { size: 80mm 50mm; margin: 0; }
            body {
              font-family: 'Courier New', Courier, monospace;
              padding: 12px;
              width: 76mm;
              height: 46mm;
              border: 1px dashed #64748b;
              box-sizing: border-box;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              background: white;
            }
            .header {
              font-size: 9px;
              font-weight: bold;
              border-bottom: 1.5px solid black;
              padding-bottom: 2px;
              display: flex;
              justify-content: space-between;
              color: black;
            }
            .title {
              font-size: 11px;
              font-weight: 900;
              text-transform: uppercase;
              margin: 4px 0 2px 0;
              line-height: 1.1;
              color: black;
            }
            .price-section {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 3px;
            }
            .price {
              font-size: 15px;
              font-weight: bold;
              background: #000;
              color: #fff;
              padding: 1px 5px;
              border-radius: 2px;
            }
            .category {
              font-size: 8px;
              text-transform: uppercase;
              color: #333;
              font-weight: bold;
            }
            .barcode-container {
              text-align: center;
              margin: 2px 0;
            }
            .barcode-visual {
              display: flex;
              justify-content: center;
              align-items: flex-end;
              height: 35px;
              overflow: hidden;
            }
            .barcode-text {
              font-size: 9px;
              letter-spacing: 2px;
              margin-top: 1px;
              font-weight: bold;
            }
            .footer {
              font-size: 7px;
              text-align: center;
              color: #444;
              border-top: 1px dotted #000;
              padding-top: 2px;
              font-weight: bold;
            }
          </style>
        </head>
        <body>
          <div>
            <div class="header">
              <span>FARMACIA VITALIS S.A.</span>
              <span>MED-GRADE PRODUCT</span>
            </div>
            <div class="title">${product.name}</div>
            <div class="price-section">
              <span class="category">SEC: ${product.category}</span>
              <span class="price">$${product.price.toFixed(2)}</span>
            </div>
          </div>
          
          <div class="barcode-container">
            <div class="barcode-visual">
              ${barsHtml}
            </div>
            <div class="barcode-text">*${product.barcode || 'V' + product.id.substring(0,8).toUpperCase()}*</div>
          </div>
          
          <div class="footer">
            Venta bajo receta médica si aplica. Conservar a t° ambiente. Lote: VTL-${Math.floor(Math.random() * 9000) + 1000}
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 max-w-full overflow-hidden pb-16">
      
      {/* 1. SECCIÓN DE BIENVENIDA Y ACCIONES RÁPIDAS */}
      <div className="bg-white p-6 md:p-8 lg:p-10 rounded-[2.5rem] shadow-sm border border-slate-200/60 relative overflow-hidden">
        {/* Adorno background */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-teal-50/40 rounded-full blur-3xl -z-10 translate-x-12 -translate-y-12"></div>
        
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-8 w-full lg:w-auto">
            <div className="space-y-2">
                <div className="flex items-center gap-2 bg-teal-50 border border-teal-100/80 px-3.5 py-1.5 rounded-full w-fit">
                  <ShieldCheck size={14} className="text-teal-600 animate-pulse" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">Stock Rápido Premium</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-[0.95] tracking-tighter">
                  Central de <br className="hidden md:block"/> Inventario
                </h2>
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Sincronización de Medicinas</p>
            </div>
            
            <div className="flex flex-wrap gap-3.5 w-full sm:w-auto">
                <button 
                    onClick={handleSendStockAlert}
                    className="flex-1 sm:flex-none bg-[#10B981] text-white p-4 px-5 rounded-2xl font-black flex flex-col items-center justify-center min-w-[110px] shadow-lg shadow-emerald-500/15 hover:scale-105 active:scale-95 hover:bg-emerald-600 transition-all"
                >
                    <MessageCircle size={22} className="mb-1" />
                    <span className="text-[10px] leading-tight uppercase tracking-widest text-center">Notificar<br/>WhatsApp</span>
                </button>
                
                <button 
                    onClick={handleGenerateShoppingList}
                    className="flex-1 sm:flex-none bg-indigo-600 text-white p-4 px-5 rounded-2xl font-black flex flex-col items-center justify-center min-w-[110px] shadow-lg shadow-indigo-600/15 hover:scale-105 active:scale-95 hover:bg-indigo-700 transition-all"
                >
                    <Printer size={22} className="mb-1" />
                    <span className="text-[10px] leading-tight uppercase tracking-widest text-center">Imprimir<br/>Lista</span>
                </button>

                <AdminProductPriceList products={products} />

                {/* Control de Sonido */}
                <button
                  onClick={() => {
                    setSoundEnabled(!soundEnabled);
                    playSound('click');
                  }}
                  className={`p-4 rounded-2xl flex items-center justify-center border transition-all ${
                    soundEnabled 
                      ? 'bg-amber-50 text-amber-600 border-amber-200' 
                      : 'bg-slate-100 text-slate-400 border-slate-200'
                  }`}
                  title={soundEnabled ? "Silenciar sonidos de acción" : "Activar retroalimentación acústica"}
                >
                  {soundEnabled ? <Volume2 size={20} className="animate-pulse" /> : <VolumeX size={20} />}
                </button>
            </div>
          </div>

          <div className="relative w-full lg:w-96 space-y-2">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
              <input 
                className="w-full bg-slate-50 border-2 border-slate-100 p-4 pl-14 rounded-2xl outline-none focus:bg-white focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 transition-all font-bold text-base shadow-inner" 
                placeholder="Escribe fármaco o escanea código..." 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
              {search && (
                <button 
                  onClick={() => setSearch('')} 
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 bg-slate-200/50 hover:bg-slate-200 px-2 py-1 rounded-lg"
                >
                  Limpiar
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider text-right px-1">
              Atajo: El cursor lee códigos de barra globales en segundo plano.
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE NOTIFICACIÓN DE ESCANEO DE CÓDIGO EN VIVO (WORLD CLASS RADAR) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Módulo de Escáner Laser */}
        <div className="lg:col-span-12 bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-xl relative overflow-hidden flex flex-col justify-between">
          {/* Laser beam effect */}
          {scannerEnabled && (
            <div className="absolute left-0 right-0 h-[2px] bg-red-500/80 shadow-[0_0_15px_rgba(239,68,68,1)] top-1/2 -translate-y-1/2 animate-bounce opacity-40"></div>
          )}
          
          <div className="space-y-4 z-10">
            <div className="flex items-center justify-between">
              <button 
                onClick={() => {
                  setScannerEnabled(!scannerEnabled);
                  if (soundEnabled) playSound('click');
                }}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity text-left outline-none"
                title="Haga clic para encender o apagar el lector global"
              >
                <Barcode className={`${scannerEnabled ? 'text-teal-400' : 'text-slate-400'} h-6 w-6`} />
                <h3 className="font-black uppercase tracking-wider text-xs">Escáner USB: {scannerEnabled ? 'ACTIVO' : 'PAUSADO'}</h3>
              </button>
              <button
                onClick={() => {
                  setScannerEnabled(!scannerEnabled);
                  if (soundEnabled) playSound('click');
                }}
                className={`w-12 h-6 rounded-full p-0.5 transition-colors duration-200 outline-none ${scannerEnabled ? 'bg-teal-500' : 'bg-slate-700'}`}
                title={scannerEnabled ? "Pausar lector" : "Activar lector"}
              >
                <div className={`bg-white w-5 h-5 rounded-full shadow-md transform duration-200 ${scannerEnabled ? 'translate-x-6' : 'translate-x-0'}`}></div>
              </button>
            </div>
            
            <p className="text-slate-400 font-bold text-[11px] uppercase tracking-wide leading-relaxed">
              La central captura cualquier lectura de barra automáticamente. Mantén la ventana activa y dispara tu lector.
            </p>

            {/* Simulador para testing fácil sin hardware */}
            <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 space-y-2">
              <label className="text-[9px] font-black uppercase text-teal-400 tracking-widest block">Simulador de Códigos (Para pruebas de escaneo)</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={simulatedCode}
                  onChange={e => setSimulatedCode(e.target.value)}
                  placeholder="Ej: 1234567890 o ID" 
                  className="bg-slate-900 border border-slate-700 p-2 rounded-lg text-xs font-mono font-bold w-full text-slate-100 outline-none focus:border-teal-400"
                />
                <button 
                  onClick={() => {
                    triggerScan(simulatedCode);
                    setSimulatedCode('');
                  }}
                  className="bg-teal-600 hover:bg-teal-500 text-white text-[10px] font-black px-3 py-2 rounded-lg uppercase tracking-wider shrink-0 transition-all"
                >
                  Gatillar
                </button>
              </div>
              {/* Botones de atajo rápido para simular */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {products.slice(0, 3).map(p => (
                  <button
                    key={p.id}
                    onClick={() => triggerScan(p.barcode || p.id)}
                    className="bg-slate-900/80 hover:bg-slate-700 text-[8px] font-bold text-slate-300 px-2 py-1 rounded border border-slate-700/40 truncate max-w-[100px]"
                    title={`Simular escaneo de ${p.name}`}
                  >
                    ⚡ {p.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800/80 space-y-3 z-10">
            {lastScanned ? (
              <div className="bg-teal-950/40 border border-teal-500/20 p-3.5 rounded-xl flex items-center gap-3.5 animate-in slide-in-from-bottom-2">
                <div className="h-10 w-10 bg-white/10 rounded-lg p-1.5 shrink-0 flex items-center justify-center">
                  <img src={lastScanned.image} className="max-h-full max-w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <p className="text-[8px] font-extrabold uppercase text-teal-400 tracking-widest">Escaneado Exitoso</p>
                  <p className="font-extrabold text-sm text-white truncate">{lastScanned.name}</p>
                  <p className="text-[10px] font-bold text-teal-200 mt-0.5">Suma +1 unidad al lote temporal</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 border border-dashed border-slate-800 rounded-xl text-slate-500">
                <p className="text-[10px] font-extrabold uppercase tracking-wider">Esperando primera lectura...</p>
              </div>
            )}

            {scanError && (
              <div className="bg-red-950/60 border border-red-500/20 p-3 rounded-xl flex items-center gap-2.5 text-red-200 text-[10px] font-bold uppercase tracking-wider animate-shake">
                <AlertCircle size={16} className="text-red-500 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. MATRIZ DE FILTROS AVANZADOS Y HERRAMIENTAS DE LOTE */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/50 space-y-5">
        
        {/* Cabecera Filtros */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800">
            <ListFilter size={18} className="text-teal-600" />
            <h4 className="font-black uppercase text-xs tracking-wider">Consola de Segmentación & Filtros</h4>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select 
                value={sortBy} 
                onChange={e => {
                  setSortBy(e.target.value as any);
                  if (soundEnabled) playSound('click');
                }}
                className="bg-transparent outline-none font-extrabold cursor-pointer text-slate-800"
              >
                <option value="name">Alfabético: A-Z</option>
                <option value="stockAsc">Stock: Menor a Mayor</option>
                <option value="stockDesc">Stock: Mayor a Menor</option>
                <option value="category">Por Categoría</option>
              </select>
            </div>

            {/* Stock Status Selector */}
            <div className="flex bg-white rounded-xl border border-slate-200 p-0.5">
              <button 
                onClick={() => { setStockStatusFilter('all'); if (soundEnabled) playSound('click'); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${stockStatusFilter === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
              >
                Todos
              </button>
              <button 
                onClick={() => { setStockStatusFilter('critical'); if (soundEnabled) playSound('click'); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${stockStatusFilter === 'critical' ? 'bg-rose-500 text-white shadow-xs' : 'text-rose-600 hover:bg-rose-50'}`}
              >
                Crítico (≤ 5)
              </button>
              <button 
                onClick={() => { setStockStatusFilter('outOfStock'); if (soundEnabled) playSound('click'); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${stockStatusFilter === 'outOfStock' ? 'bg-red-600 text-white shadow-xs' : 'text-red-600 hover:bg-red-50'}`}
              >
                Cero (0)
              </button>
              <button 
                onClick={() => { setStockStatusFilter('healthy'); if (soundEnabled) playSound('click'); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all ${stockStatusFilter === 'healthy' ? 'bg-emerald-600 text-white shadow-xs' : 'text-emerald-600 hover:bg-emerald-50'}`}
              >
                Estables
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Category Pill Rows */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-200/50">
          {categoriesList.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (soundEnabled) playSound('click');
              }}
              className={`px-4 py-2 rounded-xl text-[10px] font-extrabold uppercase tracking-wider border transition-all ${
                selectedCategory === cat 
                  ? 'bg-teal-600 text-white border-teal-600 shadow-md shadow-teal-600/10' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* HERRAMIENTAS POR LOTE (BULK ACTIONS PANEL) */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-500" />
              Ajuste Rápido por Lote ({filteredAndSorted.length} ítems filtrados)
            </p>
            <p className="text-[10px] text-slate-400 font-bold uppercase">Afecta simultáneamente a todos los medicamentos de abajo</p>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            <select 
              value={bulkAction} 
              onChange={e => {
                setBulkAction(e.target.value as any);
                if (soundEnabled) playSound('click');
              }}
              className="bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl text-xs font-extrabold text-slate-700 outline-none focus:border-indigo-500"
            >
              <option value="">-- Seleccionar Acción --</option>
              <option value="add">Sumar Unidades a todos (+)</option>
              <option value="set">Establecer Stock Fijo (=)</option>
            </select>

            {bulkAction && (
              <>
                <input 
                  type="number" 
                  value={bulkValue} 
                  onChange={e => setBulkValue(parseInt(e.target.value) || 0)}
                  placeholder="Cantidad..." 
                  className="bg-slate-50 border-2 border-slate-100 p-2.5 rounded-xl text-xs font-bold w-24 text-center outline-none focus:border-indigo-500"
                />
                <button 
                  onClick={handleApplyBulkAction}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black px-4 py-3 rounded-xl uppercase tracking-widest transition-all shadow-md shadow-indigo-600/10"
                >
                  Aplicar Lote
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4. TABLA DE CONTROL DE INVENTARIO PRINCIPAL */}
      <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200">
                <th className="px-6 py-5 text-left text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Fármaco / Medicina</th>
                <th className="px-6 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Categoría</th>
                <th className="px-6 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Inventario Físico</th>
                <th className="px-6 py-5 text-right text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Ajuste Rápido de Stock</th>
                <th className="px-6 py-5 text-center text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Etiqueta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSorted.map(p => {
                const diff = updates[p.id] || 0;
                const finalStock = p.stock + diff;
                const isFlashing = scannedFlashId === p.id;
                
                return (
                  <tr 
                    key={p.id} 
                    id={`product-row-${p.id}`}
                    className={`hover:bg-slate-50/50 transition-all duration-300 group ${
                      isFlashing 
                        ? 'bg-amber-50 ring-4 ring-amber-400/30' 
                        : diff !== 0 
                        ? 'bg-teal-50/20' 
                        : ''
                    }`}
                  >
                    {/* Producto */}
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-5">
                        <div className="h-16 w-16 bg-white rounded-2xl border border-slate-100 p-2.5 shrink-0 shadow-sm flex items-center justify-center group-hover:scale-105 group-hover:rotate-2 transition-all">
                            <img src={p.image} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-black text-slate-800 text-lg leading-tight truncate uppercase tracking-tight">{p.name}</p>
                              {p.stock === 0 && (
                                <span className="text-[8px] font-black text-red-700 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md uppercase tracking-wider">Agotado</span>
                              )}
                            </div>
                            <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">Cód: {p.barcode || 'V' + p.id.substring(0,8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>

                    {/* Categoría */}
                    <td className="px-6 py-6 text-center">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-xl">
                        {p.category}
                      </span>
                    </td>

                    {/* Stock Físico */}
                    <td className="px-6 py-6 text-center">
                      <div className="relative inline-block">
                        <span className={`px-5 py-2 rounded-full font-black text-base min-w-[85px] inline-block shadow-sm text-center ${
                          finalStock === 0 
                            ? 'bg-red-50 text-red-600 border border-red-200' 
                            : finalStock <= 5 
                            ? 'bg-amber-50 text-amber-600 border border-amber-200' 
                            : 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                        }`}>
                          {finalStock} u.
                        </span>
                        {diff !== 0 && (
                            <span className={`absolute -top-3.5 -right-5.5 text-[10px] font-black px-2.5 py-1 rounded-xl shadow-md border-2 border-white animate-in zoom-in-50 duration-200 ${diff > 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                                {diff > 0 ? `+${diff}` : diff}
                            </span>
                        )}
                      </div>
                    </td>

                    {/* Ajuste Rápido */}
                    <td className="px-6 py-6 text-right">
                      <div className="flex items-center justify-end gap-3.5">
                        <button 
                            onClick={() => handleUpdate(p.id, -1)}
                            className="h-11 w-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all active:scale-90 shadow-xs"
                            title="Restar 1 unidad"
                        >
                          <Minus size={18} strokeWidth={3}/>
                        </button>
                        
                        <input 
                            type="number"
                            className="w-18 h-11 border-2 border-slate-100 rounded-xl text-center font-black text-lg text-slate-700 focus:border-teal-500 focus:bg-white outline-none transition-all bg-slate-50/50"
                            value={updates[p.id] || ''}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              setUpdates({...updates, [p.id]: isNaN(v) ? 0 : v});
                            }}
                            placeholder="0"
                        />
                        
                        <button 
                            onClick={() => handleUpdate(p.id, 1)}
                            className="h-11 w-11 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-all active:scale-90 shadow-xs"
                            title="Sumar 1 unidad"
                        >
                          <Plus size={18} strokeWidth={3}/>
                        </button>

                        {diff !== 0 && (
                          <button
                            onClick={() => {
                              if (soundEnabled) playSound('click');
                              setUpdates(prev => {
                                const copy = { ...prev };
                                delete copy[p.id];
                                return copy;
                              });
                            }}
                            className="h-11 w-11 rounded-xl bg-slate-50 text-slate-400 hover:bg-slate-200 hover:text-slate-700 flex items-center justify-center transition-all"
                            title="Limpiar ajuste"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Impresora de Código de Barras */}
                    <td className="px-6 py-6 text-center">
                      <button
                        onClick={() => handlePrintBarcodeLabel(p)}
                        className="p-3.5 rounded-xl bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-600 transition-all active:scale-95 inline-flex items-center justify-center shadow-xs"
                        title="Imprimir Etiqueta de Código de Barras Médica"
                      >
                        <Barcode size={18} />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAndSorted.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-24 bg-slate-50/50">
                    <Search className="h-12 w-12 text-slate-300 mx-auto mb-3 animate-pulse" />
                    <p className="text-slate-500 font-black uppercase text-xs tracking-wider">No se encontraron medicamentos</p>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wide mt-1">Prueba redefiniendo tus criterios de segmentación o filtros.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTÓN FLOTANTE DE GUARDADO MASIVO (CONFIRMAR CAMBIOS) */}
      {Object.keys(updates).some(k => updates[k] !== 0) && (
          <div className="fixed bottom-24 right-6 md:right-12 z-50 animate-in slide-in-from-bottom-20 duration-500">
              <button 
                onClick={handleSaveAll}
                disabled={isSaving}
                className="bg-slate-950 text-white px-10 md:px-14 py-6 rounded-full font-extrabold text-lg shadow-[0_25px_60px_rgba(0,0,0,0.45)] flex items-center gap-5 hover:bg-black hover:scale-105 active:scale-95 transition-all border-[6px] border-white ring-4 ring-teal-500/10"
              >
                {isSaving ? (
                  <RefreshCw className="animate-spin text-teal-400" size={26} />
                ) : (
                  <Check size={28} strokeWidth={4} className="text-teal-400 animate-pulse" />
                )}
                {isSaving ? 'Sincronizando Sistema...' : 'Sincronizar Lote'}
              </button>
          </div>
      )}

      {/* 6. ESTADÍSTICAS RÁPIDAS RESPONSIVAS (DISEÑO BENTO GRID DE PRIMERA LÍNEA) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div className="bg-rose-50/50 p-6 rounded-[2rem] border border-rose-100 flex items-center gap-5 group hover:bg-rose-100/50 transition-all shadow-sm">
              <div className="h-14 w-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform">
                  <AlertCircle size={26}/>
              </div>
              <div>
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Stock Crítico o Agotado</p>
                  <p className="text-2xl font-black text-rose-950">{products.filter(p => p.stock <= 5).length} Ítems</p>
              </div>
          </div>
          
          <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 flex items-center gap-5 group hover:bg-emerald-100/50 transition-all shadow-sm">
              <div className="h-14 w-14 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform">
                  <Check size={26}/>
              </div>
              <div>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Estado Sanitario Central</p>
                  <p className="text-2xl font-black text-emerald-950">Normalizado</p>
              </div>
          </div>
          
          <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex items-center gap-5 group hover:bg-blue-100/50 transition-all shadow-sm">
              <div className="h-14 w-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                  <ShoppingCart size={26}/>
              </div>
              <div>
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Catálogo Disponible</p>
                  <p className="text-2xl font-black text-blue-950">{products.length} Productos</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminStockQuick;
