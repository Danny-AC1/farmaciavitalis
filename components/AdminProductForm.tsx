
import React, { useState, useEffect } from 'react';
import { Package, Sparkles, Loader2, ScanBarcode, X, Zap, ShieldCheck, Heart, Plus, Calendar } from 'lucide-react';
import { Category, Supplier } from '../types';

interface AdminProductFormProps {
  editingId: string | null;
  prodName: string; setProdName: (s: string) => void;
  prodPrice: string; setProdPrice: (s: string) => void;
  prodCostPrice: string; setProdCostPrice: (s: string) => void;
  prodUnitsPerBox: string; setProdUnitsPerBox: (s: string) => void;
  prodBoxPrice: string; setProdBoxPrice: (s: string) => void;
  prodPublicBoxPrice: string; setProdPublicBoxPrice: (s: string) => void;
  prodDesc: string; setProdDesc: (s: string) => void;
  prodCat: string; setProdCat: (s: string) => void;
  prodImage: string; setProdImage: (s: string) => void;
  prodBarcode: string; setProdBarcode: (s: string) => void;
  prodExpiry: string; setProdExpiry: (s: string) => void;
  prodSupplier: string; setProdSupplier: (s: string) => void;
  handleProductSubmit: (e: React.FormEvent) => void | Promise<void>;
  handleGenerateDescription: (tone: 'CLINICO' | 'PERSUASIVO' | 'CERCANO') => Promise<void>;
  handleImageUpload: (e: any, setter: any) => void | Promise<void>;
  setShowProductScanner: (b: boolean) => void;
  resetProductForm: () => void;
  isGenerating: boolean;
  isSubmitting: boolean;
  isUploadingImage?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  categories: Category[];
  suppliers: Supplier[];
}

const AdminProductForm: React.FC<AdminProductFormProps> = (props) => {
  const [descriptionTone, setDescriptionTone] = useState<'CLINICO' | 'PERSUASIVO' | 'CERCANO'>('PERSUASIVO');

  // Cálculo automático del costo unitario basado en el precio de caja
  useEffect(() => {
    const boxPrice = parseFloat(props.prodBoxPrice);
    const units = parseInt(props.prodUnitsPerBox);
    if (!isNaN(boxPrice) && !isNaN(units) && units > 0) {
      const calculatedCost = (boxPrice / units).toFixed(2);
      if (calculatedCost !== props.prodCostPrice) {
        props.setProdCostPrice(calculatedCost);
      }
    }
  }, [props.prodBoxPrice, props.prodUnitsPerBox, props.prodCostPrice]);

  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
      <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
        <Package className="text-teal-600" /> {props.editingId ? 'Editar Producto' : 'Nuevo Producto'}
      </h3>
      <form onSubmit={props.handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Producto</label>
              <input required className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" value={props.prodName} onChange={e => props.setProdName(e.target.value)} placeholder="Ej: Apronax 550mg" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
              <select className="w-full border p-2.5 rounded-lg bg-gray-50" value={props.prodCat} onChange={e => props.setProdCat(e.target.value)}>
                <option value="">Seleccionar...</option>
                {props.categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
            <div className="flex justify-between items-center mb-3">
              <label className="text-xs font-black text-teal-800 uppercase flex items-center gap-2">
                <span className="bg-white p-1 rounded shadow-sm">✨</span> Redacción Inteligente (IA Gemini)
              </label>
              <div className="flex gap-1 bg-white p-1 rounded-lg border border-teal-100">
                <button type="button" onClick={() => setDescriptionTone('CLINICO')} className={`p-1.5 rounded-md transition-all ${descriptionTone === 'CLINICO' ? 'bg-teal-600 text-white' : 'text-teal-400 hover:bg-teal-50'}`} title="Tono Clínico"><ShieldCheck size={14}/></button>
                <button type="button" onClick={() => setDescriptionTone('PERSUASIVO')} className={`p-1.5 rounded-md transition-all ${descriptionTone === 'PERSUASIVO' ? 'bg-orange-500 text-white' : 'text-orange-300 hover:bg-orange-50'}`} title="Tono Persuasivo"><Zap size={14}/></button>
                <button type="button" onClick={() => setDescriptionTone('CERCANO')} className={`p-1.5 rounded-md transition-all ${descriptionTone === 'CERCANO' ? 'bg-pink-500 text-white' : 'text-pink-300 hover:bg-pink-50'}`} title="Tono Cercano"><Heart size={14}/></button>
              </div>
            </div>
            <textarea 
              className="w-full border border-teal-200 p-3 rounded-lg h-28 resize-none focus:ring-2 focus:ring-teal-500 outline-none text-sm leading-relaxed" 
              value={props.prodDesc} 
              onChange={e => props.setProdDesc(e.target.value)}
              placeholder="La descripción aparecerá aquí..."
            ></textarea>
            <button 
              type="button" 
              onClick={() => props.handleGenerateDescription(descriptionTone)} 
              disabled={props.isGenerating || !props.prodName}
              className="mt-2 w-full bg-white border border-teal-200 text-teal-700 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
            >
              {props.isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
              {props.isGenerating ? 'GENERANDO MÁGIA...' : `GENERAR DESCRIPCIÓN ${descriptionTone}`}
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Precio Unitario Público</label>
              <input type="number" step="0.01" required className="w-full border p-2 rounded-lg font-bold" value={props.prodPrice} onChange={e => props.setProdPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-blue-600 uppercase">Precio Caja Público</label>
              <input type="number" step="0.01" className="w-full border border-blue-200 p-2 rounded-lg bg-blue-50/30 font-bold text-blue-800" value={props.prodPublicBoxPrice} onChange={e => props.setProdPublicBoxPrice(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Unid/Caja</label>
              <input type="number" className="w-full border p-2 rounded-lg" value={props.prodUnitsPerBox} onChange={e => props.setProdUnitsPerBox(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase">Precio Caja (Costo Proveedor)</label>
              <input type="number" step="0.01" className="w-full border p-2 rounded-lg bg-gray-50" value={props.prodBoxPrice} onChange={e => props.setProdBoxPrice(e.target.value)} />
            </div>
            <div className="relative">
              <label className="text-xs font-bold text-teal-600 uppercase flex items-center gap-1">
                Costo Unitario <span className="text-[8px] bg-teal-100 px-1 rounded">Calculado</span>
              </label>
              <input type="number" step="0.01" className="w-full border border-teal-200 bg-teal-50 p-2 rounded-lg font-bold text-teal-800" value={props.prodCostPrice} onChange={e => props.setProdCostPrice(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <label className="text-xs font-bold text-gray-500 uppercase">Código de Barras</label>
              <div className="flex gap-1">
                <input className="flex-grow border p-2 rounded-lg text-sm" value={props.prodBarcode} onChange={e => props.setProdBarcode(e.target.value)} />
                <button type="button" onClick={() => props.setShowProductScanner(true)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ScanBarcode size={18}/></button>
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                <Calendar size={12} className="text-teal-600"/> Fecha de Caducidad
              </label>
              <input type="date" className="w-full border p-2 rounded-lg text-sm bg-gray-50" value={props.prodExpiry} onChange={e => props.setProdExpiry(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase">Proveedor</label>
              <select className="w-full border p-2 rounded-lg text-sm bg-gray-50" value={props.prodSupplier} onChange={e => props.setProdSupplier(e.target.value)}>
                <option value="">Ninguno</option>
                {props.suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-xs font-bold text-gray-500 uppercase block">Imagen del Producto</label>
          <div className="w-full h-56 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50 relative group">
            {props.isUploadingImage ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <Loader2 className="animate-spin text-teal-600 h-10 w-10" strokeWidth={3} />
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Subiendo imagen...</span>
              </div>
            ) : props.prodImage ? (
              <>
                <img src={props.prodImage} className="w-full h-full object-contain mix-blend-multiply p-4" alt="Vista previa" />
                <button type="button" onClick={() => props.setProdImage('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"><X size={14}/></button>
              </>
            ) : (
              <div className="text-center text-gray-400">
                <Plus size={32} className="mx-auto mb-2 opacity-20" />
                <span className="text-xs font-bold uppercase tracking-tight">Clic o Arrastrar Imagen</span>
              </div>
            )}
            <input 
              type="file" 
              ref={props.fileInputRef} 
              onChange={e => props.handleImageUpload(e, props.setProdImage)} 
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
              disabled={props.isUploadingImage}
              accept="image/*"
            />
          </div>
          
          <div className="flex gap-2 pt-4">
            {props.editingId && (
              <button type="button" onClick={props.resetProductForm} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition">
                Cancelar
              </button>
            )}
            <button 
              type="submit" 
              disabled={props.isSubmitting || props.isUploadingImage || !props.prodName || !props.prodPrice} 
              className="flex-[2] bg-teal-600 text-white py-3 rounded-xl font-black uppercase text-xs tracking-widest shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {props.isSubmitting ? (
                <Loader2 className="animate-spin h-5 w-5" />
              ) : (
                props.editingId ? 'Actualizar Producto' : 'Guardar en Catálogo'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AdminProductForm;
