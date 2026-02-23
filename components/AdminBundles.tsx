
import React, { useState } from 'react';
import { Package, Plus, Sparkles, Trash2, CheckCircle, XCircle, Calculator, Info } from 'lucide-react';
import { Product, Bundle, Order } from '../types';
import { addBundleDB, updateBundleDB } from '../services/db';
import { suggestSymptomBundles, analyzePredictiveBundles } from '../services/gemini';

interface AdminBundlesProps {
    products: Product[];
    bundles: Bundle[];
    orders: Order[];
    onDelete: (id: string) => void;
}

const AdminBundles: React.FC<AdminBundlesProps> = ({ products, bundles, orders, onDelete }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [newBundle, setNewBundle] = useState<Partial<Bundle>>({
        name: '',
        description: '',
        productIds: [],
        price: 0,
        active: true,
        category: 'Sintomatología'
    });

    const handleGenerateAI = async (type: 'SYMPTOM' | 'PREDICTIVE') => {
        setIsGenerating(true);
        try {
            const suggestions = type === 'SYMPTOM' 
                ? await suggestSymptomBundles(products)
                : await analyzePredictiveBundles(orders, products);
            
            if (suggestions.length > 0) {
                for (const suggestion of suggestions) {
                    await addBundleDB({
                        ...suggestion,
                        active: true
                    } as Bundle);
                }
                alert(`Se han generado ${suggestions.length} combos nuevos.`);
            }
        } catch (e) {
            alert("Error generando combos con IA.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newBundle.productIds!.length < 2) return alert("Un combo debe tener al menos 2 productos.");
        try {
            await addBundleDB(newBundle as Bundle);
            setShowForm(false);
            setNewBundle({ name: '', description: '', productIds: [], price: 0, active: true, category: 'Sintomatología' });
        } catch (e) {
            alert("Error al guardar el combo.");
        }
    };

    const toggleActive = async (bundle: Bundle) => {
        await updateBundleDB(bundle.id, { active: !bundle.active });
    };

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                        <Package className="text-teal-600"/> Combos y Promociones
                    </h2>
                    <p className="text-sm text-gray-500">Crea paquetes de productos con descuento para aumentar tus ventas.</p>
                </div>
                
                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => handleGenerateAI('SYMPTOM')}
                        disabled={isGenerating}
                        className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        <Sparkles size={14}/> {isGenerating ? 'Generando...' : 'IA: Combos por Síntomas'}
                    </button>
                    <button 
                        onClick={() => handleGenerateAI('PREDICTIVE')}
                        disabled={isGenerating}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                        <Calculator size={14}/> {isGenerating ? 'Analizando...' : 'IA: Combos Predictivos'}
                    </button>
                    <button 
                        onClick={() => setShowForm(!showForm)}
                        className="bg-teal-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-teal-700 transition"
                    >
                        <Plus size={14}/> Nuevo Combo Manual
                    </button>
                </div>
            </div>

            {showForm && (
                <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm space-y-4 animate-in slide-in-from-top">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Combo</label>
                            <input 
                                required
                                className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                placeholder="Ej: Kit Alivio Gripe"
                                value={newBundle.name}
                                onChange={e => setNewBundle({...newBundle, name: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría</label>
                            <select 
                                className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none"
                                value={newBundle.category}
                                onChange={e => setNewBundle({...newBundle, category: e.target.value})}
                            >
                                <option value="Sintomatología">Sintomatología</option>
                                <option value="Primeros Auxilios">Primeros Auxilios</option>
                                <option value="Cuidado Personal">Cuidado Personal</option>
                                <option value="Infantil">Infantil</option>
                                <option value="Predictivo">Predictivo</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción</label>
                        <textarea 
                            required
                            className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none h-20"
                            placeholder="Describe los beneficios del combo..."
                            value={newBundle.description}
                            onChange={e => setNewBundle({...newBundle, description: e.target.value})}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Seleccionar Productos (Mínimo 2)</label>
                            <div className="border rounded-xl p-2 max-h-40 overflow-y-auto space-y-1 bg-gray-50">
                                {products.map(p => (
                                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition">
                                        <input 
                                            type="checkbox"
                                            checked={newBundle.productIds?.includes(p.id)}
                                            onChange={e => {
                                                const ids = e.target.checked 
                                                    ? [...newBundle.productIds!, p.id]
                                                    : newBundle.productIds!.filter(id => id !== p.id);
                                                setNewBundle({...newBundle, productIds: ids});
                                            }}
                                            className="rounded text-teal-600"
                                        />
                                        <span className="text-xs font-medium">{p.name} (${p.price})</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Precio del Combo ($)</label>
                            <input 
                                type="number"
                                step="0.01"
                                required
                                className="w-full border p-3 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 outline-none font-bold text-teal-700"
                                value={newBundle.price}
                                onChange={e => setNewBundle({...newBundle, price: parseFloat(e.target.value)})}
                            />
                            <p className="text-[10px] text-gray-400 italic">
                                Suma individual: ${newBundle.productIds?.reduce((acc, id) => {
                                    const p = products.find(x => x.id === id);
                                    return acc + (p?.price || 0);
                                }, 0).toFixed(2)}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-4 p-3 border rounded-xl bg-gray-50">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={newBundle.isUpgrade}
                                    onChange={e => setNewBundle({...newBundle, isUpgrade: e.target.checked})}
                                    className="rounded text-teal-600"
                                />
                                <span className="text-xs font-bold text-gray-700">¿Es un Combo Upgrade?</span>
                            </label>
                            {newBundle.isUpgrade && (
                                <select 
                                    className="flex-grow border p-2 rounded-lg text-xs focus:ring-2 focus:ring-teal-500 outline-none"
                                    value={newBundle.baseProductId}
                                    onChange={e => setNewBundle({...newBundle, baseProductId: e.target.value})}
                                >
                                    <option value="">Seleccionar Producto Base</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <button type="button" onClick={() => setShowForm(false)} className="px-6 py-2 text-sm font-bold text-gray-500">Cancelar</button>
                        <button type="submit" className="bg-teal-600 text-white px-8 py-2 rounded-xl text-sm font-bold hover:bg-teal-700 transition shadow-lg">Guardar Combo</button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bundles.map(bundle => (
                    <div key={bundle.id} className={`bg-white rounded-2xl border ${bundle.active ? 'border-gray-100' : 'border-red-100 opacity-75'} shadow-sm overflow-hidden flex flex-col group transition-all hover:shadow-md`}>
                        <div className="p-5 flex-grow">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-teal-50 text-teal-700 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                    {bundle.category || 'General'}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => toggleActive(bundle)} className={`p-1.5 rounded-lg transition ${bundle.active ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'}`}>
                                        {bundle.active ? <CheckCircle size={16}/> : <XCircle size={16}/>}
                                    </button>
                                    <button onClick={() => onDelete(bundle.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition">
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            </div>

                            <h4 className="text-lg font-bold text-gray-900 mb-1">{bundle.name}</h4>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4">{bundle.description}</p>

                            <div className="space-y-2 mb-4">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Incluye:</p>
                                {bundle.productIds.map(pid => {
                                    const p = products.find(x => x.id === pid);
                                    return (
                                        <div key={pid} className="flex items-center gap-2 text-xs text-gray-600">
                                            <div className="w-1 h-1 bg-teal-400 rounded-full"></div>
                                            <span>{p?.name || 'Producto no encontrado'}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="bg-slate-50 p-4 border-t border-gray-100 flex justify-between items-center">
                            <div>
                                <p className="text-[10px] text-gray-400 line-through">
                                    ${bundle.productIds.reduce((acc, id) => {
                                        const p = products.find(x => x.id === id);
                                        return acc + (p?.price || 0);
                                    }, 0).toFixed(2)}
                                </p>
                                <p className="text-xl font-black text-teal-700">${bundle.price.toFixed(2)}</p>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-1 rounded-lg">
                                <Info size={10}/>
                                Ahorro: {Math.round((1 - bundle.price / bundle.productIds.reduce((acc, id) => {
                                    const p = products.find(x => x.id === id);
                                    return acc + (p?.price || 0);
                                }, 0)) * 100)}%
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {bundles.length === 0 && !showForm && (
                <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                    <Package size={48} className="mx-auto text-gray-200 mb-4" />
                    <p className="text-gray-400 font-bold">No hay combos creados aún.</p>
                    <p className="text-xs text-gray-300">Usa la IA para generar sugerencias inteligentes.</p>
                </div>
            )}
        </div>
    );
};

export default AdminBundles;
