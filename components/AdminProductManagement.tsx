
import React, { useState } from 'react';
import { Package, Plus, Trash2, Edit2, Sparkles, Loader2, ScanBarcode, X, Zap, ShieldCheck, Heart, Calendar, Minus } from 'lucide-react';
import { Product, Category, Supplier } from '../types';
import { generateProductDescription } from '../services/gemini';

interface AdminProductManagementProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  editingId: string | null;
  prodName: string; setProdName: (s: string) => void;
  prodPrice: string; setProdPrice: (s: string) => void;
  prodCostPrice: string; setProdCostPrice: (s: string) => void;
  prodUnitsPerBox: string; setProdUnitsPerBox: (s: string) => void;
  prodBoxPrice: string; setProdBoxPrice: (s: string) => void;
  prodDesc: string; setProdDesc: (s: string) => void;
  prodCat: string; setProdCat: (s: string) => void;
  prodImage: string; setProdImage: (s: string) => void;
  prodBarcode: string; setProdBarcode: (s: string) => void;
  prodExpiry: string; setProdExpiry: (s: string) => void;
  prodSupplier: string; setProdSupplier: (s: string) => void;
  handleProductSubmit: (e: React.FormEvent) => void;
  handleGenerateDescription: () => void; // Esta se ignora en favor de la interna
  handleImageUpload: (e: any, setter: any) => void;
  setShowProductScanner: (b: boolean) => void;
  handleEditClick: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, s: number) => void;
  resetProductForm: () => void;
  isGenerating: boolean;
  isSubmitting: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const AdminProductManagement: React.FC<AdminProductManagementProps> = ({
  products, categories, suppliers, editingId, prodName, setProdName, prodPrice, setProdPrice,
  prodCostPrice, setProdCostPrice, prodUnitsPerBox, setProdUnitsPerBox, prodBoxPrice, setProdBoxPrice,
  prodDesc, setProdDesc, prodCat, setProdCat, prodImage, setProdImage, prodBarcode, setProdBarcode,
  prodExpiry, setProdExpiry, prodSupplier, setProdSupplier, handleProductSubmit, 
  handleImageUpload, setShowProductScanner, handleEditClick, 
  onDeleteProduct, onUpdateStock, resetProductForm, isSubmitting, fileInputRef
}) => {
  
  const [descriptionTone, setDescriptionTone] = useState<'CLINICO' | 'PERSUASIVO' | 'CERCANO'>('PERSUASIVO');
  const [isLocalGenerating, setIsLocalGenerating] = useState(false);

  const onMagicGenerate = async () => {
    if (!prodName) return alert("Por favor, escribe el nombre del producto primero.");
    setIsLocalGenerating(true);
    try {
        const result = await generateProductDescription(prodName, prodCat, descriptionTone);
        setProdDesc(result);
    } catch (error) {
        alert("Error al conectar con la IA.");
    } finally {
        setIsLocalGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Package className="text-teal-600"/> {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Nombre del Producto</label>
                            <input required className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Ej: Apronax 550mg" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                            <select className="w-full border p-2.5 rounded-lg bg-gray-50" value={prodCat} onChange={e => setProdCat(e.target.value)}>
                                <option value="">Seleccionar...</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="bg-teal-50/50 p-4 rounded-xl border border-teal-100">
                        <div className="flex justify-between items-center mb-3">
                            <label className="text-xs font-black text-teal-800 uppercase flex items-center gap-2">
                                <Sparkles size={14}/> Redacción Inteligente (IA Gemini)
                            </label>
                            <div className="flex gap-1 bg-white p-1 rounded-lg border border-teal-100">
                                <button type="button" onClick={() => setDescriptionTone('CLINICO')} className={`p-1.5 rounded-md transition-all ${descriptionTone === 'CLINICO' ? 'bg-teal-600 text-white' : 'text-teal-400 hover:bg-teal-50'}`} title="Tono Clínico"><ShieldCheck size={14}/></button>
                                <button type="button" onClick={() => setDescriptionTone('PERSUASIVO')} className={`p-1.5 rounded-md transition-all ${descriptionTone === 'PERSUASIVO' ? 'bg-orange-500 text-white' : 'text-orange-300 hover:bg-orange-50'}`} title="Tono Persuasivo"><Zap size={14}/></button>
                                <button type="button" onClick={() => setDescriptionTone('CERCANO')} className={`p-1.5 rounded-md transition-all ${descriptionTone === 'CERCANO' ? 'bg-pink-500 text-white' : 'text-pink-300 hover:bg-pink-50'}`} title="Tono Cercano"><Heart size={14}/></button>
                            </div>
                        </div>
                        <textarea 
                            className="w-full border border-teal-200 p-3 rounded-lg h-28 resize-none focus:ring-2 focus:ring-teal-500 outline-none text-sm leading-relaxed" 
                            value={prodDesc} 
                            onChange={e => setProdDesc(e.target.value)}
                            placeholder="La descripción aparecerá aquí..."
                        ></textarea>
                        <button 
                            type="button" 
                            onClick={onMagicGenerate} 
                            disabled={isLocalGenerating}
                            className="mt-2 w-full bg-white border border-teal-200 text-teal-700 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-2 hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95 disabled:opacity-50"
                        >
                            {isLocalGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} 
                            {isLocalGenerating ? 'GENERANDO MÁGIA...' : `GENERAR DESCRIPCIÓN ${descriptionTone}`}
                        </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Precio Venta</label>
                            <input type="number" step="0.01" required className="w-full border p-2 rounded-lg" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Costo</label>
                            <input type="number" step="0.01" className="w-full border p-2 rounded-lg" value={prodCostPrice} onChange={e => setProdCostPrice(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Unid/Caja</label>
                            <input type="number" className="w-full border p-2 rounded-lg" value={prodUnitsPerBox} onChange={e => setProdUnitsPerBox(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Precio Caja</label>
                            <input type="number" step="0.01" className="w-full border p-2 rounded-lg" value={prodBoxPrice} onChange={e => setProdBoxPrice(e.target.value)} />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="relative">
                            <label className="text-xs font-bold text-gray-500 uppercase">Código de Barras</label>
                            <div className="flex gap-1">
                                <input className="flex-grow border p-2 rounded-lg text-sm" value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} />
                                <button type="button" onClick={() => setShowProductScanner(true)} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"><ScanBarcode size={18}/></button>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                                <Calendar size={12} className="text-teal-600"/> Fecha de Caducidad
                            </label>
                            <input type="date" className="w-full border p-2 rounded-lg text-sm bg-gray-50" value={prodExpiry} onChange={e => setProdExpiry(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Proveedor</label>
                            <select className="w-full border p-2 rounded-lg text-sm bg-gray-50" value={prodSupplier} onChange={e => setProdSupplier(e.target.value)}>
                                <option value="">Ninguno</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-500 uppercase block">Imagen del Producto</label>
                    <div className="w-full h-56 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50 relative group">
                        {prodImage ? (
                            <>
                                <img src={prodImage} className="w-full h-full object-contain mix-blend-multiply p-4" />
                                <button type="button" onClick={() => setProdImage('')} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition"><X size={14}/></button>
                            </>
                        ) : (
                            <div className="text-center text-gray-400">
                                <Plus size={32} className="mx-auto mb-2 opacity-20" />
                                <span className="text-xs font-bold">Subir Imagen</span>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} onChange={e => handleImageUpload(e, setProdImage)} className="absolute inset-0 opacity-0 cursor-pointer" />
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                        {editingId && <button type="button" onClick={resetProductForm} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold">Cancelar</button>}
                        <button type="submit" disabled={isSubmitting} className="flex-[2] bg-teal-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition disabled:opacity-50">
                            {isSubmitting ? <Loader2 className="animate-spin mx-auto"/> : (editingId ? 'Actualizar Producto' : 'Guardar Producto')}
                        </button>
                    </div>
                </div>
            </form>
        </div>

        {/* Tabla de Productos Simplificada para esta vista */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Categoría</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Precio</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={p.image} className="h-10 w-10 object-contain mix-blend-multiply" />
                                        <p className="font-bold text-gray-900 text-sm leading-tight">{p.name}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4"><span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded">{p.category}</span></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-2">
                                        <button 
                                            onClick={() => onUpdateStock(p.id, Math.max(0, p.stock - 1))}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span className={`text-xs font-black px-2 py-1 rounded min-w-[30px] text-center ${p.stock <= 5 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {p.stock}
                                        </span>
                                        <button 
                                            onClick={() => onUpdateStock(p.id, p.stock + 1)}
                                            className="p-1 text-emerald-500 hover:bg-emerald-50 rounded"
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-gray-800">${p.price.toFixed(2)}</td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEditClick(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Editar"><Edit2 size={16}/></button>
                                    <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg" title="Eliminar"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
             </div>
        </div>
    </div>
  );
};

export default AdminProductManagement;
