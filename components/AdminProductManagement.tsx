
import React from 'react';
import { Package, Plus, Trash2, Edit2, Sparkles, Loader2, ScanBarcode, X } from 'lucide-react';
import { Product, Category, Supplier } from '../types';

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
  handleGenerateDescription: () => void;
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
  handleGenerateDescription, handleImageUpload, setShowProductScanner, handleEditClick, 
  onDeleteProduct, onUpdateStock, resetProductForm, isGenerating, isSubmitting, fileInputRef
}) => {
  return (
    <div className="space-y-8 animate-in fade-in">
        {/* Formulario de Producto */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Package className="text-teal-600"/> {editingId ? 'Editar Producto' : 'Nuevo Producto'}
            </h3>
            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Nombre</label>
                            <input required className="w-full border p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Ej: Amoxicilina 500mg" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                            <select className="w-full border p-2.5 rounded-lg bg-gray-50" value={prodCat} onChange={e => setProdCat(e.target.value)}>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Precio Venta</label>
                            <input type="number" step="0.01" required className="w-full border p-2 rounded-lg" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase">Costo Unitario</label>
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

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                            <button type="button" onClick={handleGenerateDescription} disabled={isGenerating} className="text-[10px] font-bold text-teal-600 flex items-center gap-1 hover:text-teal-700">
                                {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />} IA: Sugerir
                            </button>
                        </div>
                        <textarea className="w-full border p-2 rounded-lg h-24 resize-none" value={prodDesc} onChange={e => setProdDesc(e.target.value)}></textarea>
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
                            <label className="text-xs font-bold text-gray-500 uppercase">Expiración</label>
                            <input type="date" className="w-full border p-2 rounded-lg text-sm" value={prodExpiry} onChange={e => setProdExpiry(e.target.value)} />
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
                    <div className="w-full h-48 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden bg-gray-50 relative group">
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

        {/* Tabla de Productos */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
             <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Cat / Prov</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Precio</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Stock</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {products.map(p => (
                            <tr key={p.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <img src={p.image} className="h-10 w-10 object-contain mix-blend-multiply" />
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm leading-tight">{p.name}</p>
                                            {p.barcode && <p className="text-[10px] text-gray-400 font-mono">{p.barcode}</p>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <p className="text-xs font-bold text-teal-600">{p.category}</p>
                                    <p className="text-[10px] text-gray-400">{suppliers.find(s => s.id === p.supplierId)?.name || 'Sin Prov.'}</p>
                                </td>
                                <td className="px-6 py-4 text-sm font-black text-gray-800">${p.price.toFixed(2)}</td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <input 
                                          type="number" 
                                          className={`w-16 border rounded p-1 text-center font-bold text-sm ${p.stock < 10 ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'}`} 
                                          value={p.stock} 
                                          onChange={e => onUpdateStock(p.id, parseInt(e.target.value))} 
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEditClick(p)} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                                    <button onClick={() => onDeleteProduct(p.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
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
