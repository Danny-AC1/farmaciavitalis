import React, { useState, useMemo } from 'react';
import { 
    Package, Plus, Trash2, CheckCircle, XCircle, 
    Search, Percent, Eye, ShoppingBag, Tag, ArrowRight, Sparkles, Filter
} from 'lucide-react';
import { Product, Bundle, Order } from '../../types';
import { addBundleDB, updateBundleDB } from '../../services/db';

interface AdminBundlesProps {
    products: Product[];
    bundles: Bundle[];
    orders: Order[];
    onDelete: (id: string) => void;
}

const AdminBundles: React.FC<AdminBundlesProps> = ({ products, bundles, onDelete }) => {
    const [showForm, setShowForm] = useState(false);
    
    // Estados para el Generador Manual de Primera Línea
    const [newBundle, setNewBundle] = useState<Partial<Bundle>>({
        name: '',
        description: '',
        productIds: [],
        price: 0,
        active: true,
        category: 'Sintomatología',
        isUpgrade: false,
        baseProductId: ''
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('ALL');
    const [discountPercentage, setDiscountPercentage] = useState(15); // Descuento inicial sugerido de 15%

    // Categorías de productos disponibles para filtrar en el buscador
    const productCategories = useMemo(() => {
        const cats = new Set(products.map(p => p.category));
        return Array.from(cats);
    }, [products]);

    // Filtrar productos para el buscador interno
    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.activeIngredient && p.activeIngredient.toLowerCase().includes(searchQuery.toLowerCase()));
            const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [products, searchQuery, filterCategory]);

    // Suma individual de productos agregados al combo
    const totalOriginalPrice = useMemo(() => {
        if (!newBundle.productIds) return 0;
        return newBundle.productIds.reduce((acc, id) => {
            const p = products.find(x => x.id === id);
            return acc + (p?.price || 0);
        }, 0);
    }, [newBundle.productIds, products]);

    // Manejar adición/remoción rápida de productos en el combo
    const handleToggleProduct = (productId: string) => {
        const currentIds = newBundle.productIds || [];
        let updatedIds: string[];

        if (currentIds.includes(productId)) {
            updatedIds = currentIds.filter(id => id !== productId);
        } else {
            updatedIds = [...currentIds, productId];
        }

        // Recalcular el precio del combo basado en el descuento actual
        const sum = updatedIds.reduce((acc, id) => {
            const p = products.find(x => x.id === id);
            return acc + (p?.price || 0);
        }, 0);
        const newPrice = Number((sum * (1 - discountPercentage / 100)).toFixed(2));

        setNewBundle(prev => ({
            ...prev,
            productIds: updatedIds,
            price: newPrice
        }));
    };

    // Manejar cambios en el descuento porcentual
    const handleDiscountChange = (percentage: number) => {
        setDiscountPercentage(percentage);
        const newPrice = Number((totalOriginalPrice * (1 - percentage / 100)).toFixed(2));
        setNewBundle(prev => ({
            ...prev,
            price: newPrice
        }));
    };

    // Manejar cambio manual del precio final
    const handlePriceChange = (val: number) => {
        setNewBundle(prev => ({ ...prev, price: val }));
        if (totalOriginalPrice > 0) {
            const calculatedDiscount = Math.round(((totalOriginalPrice - val) / totalOriginalPrice) * 100);
            setDiscountPercentage(Math.max(0, Math.min(100, calculatedDiscount)));
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBundle.productIds || newBundle.productIds.length < 2) {
            alert("Un combo de primera línea debe contener al menos 2 productos.");
            return;
        }
        if (!newBundle.name?.trim()) {
            alert("Por favor introduce un nombre para el combo.");
            return;
        }
        if (newBundle.price === undefined || newBundle.price <= 0) {
            alert("El precio del combo debe ser mayor a 0.");
            return;
        }

        try {
            await addBundleDB({
                name: newBundle.name,
                description: newBundle.description || '',
                productIds: newBundle.productIds,
                price: Number(newBundle.price),
                active: true,
                isUpgrade: newBundle.isUpgrade || false,
                baseProductId: newBundle.isUpgrade ? newBundle.baseProductId : '',
                category: newBundle.category || 'Sintomatología',
                image: products.find(p => p.id === newBundle.productIds?.[0])?.image || ''
            });

            setShowForm(false);
            // Resetear
            setNewBundle({
                name: '',
                description: '',
                productIds: [],
                price: 0,
                active: true,
                category: 'Sintomatología',
                isUpgrade: false,
                baseProductId: ''
            });
            setDiscountPercentage(15);
            setSearchQuery('');
        } catch (err) {
            console.error(err);
            alert("Error al guardar el combo.");
        }
    };

    const toggleActive = async (bundle: Bundle) => {
        await updateBundleDB(bundle.id, { active: !bundle.active });
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Encabezado Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-teal-50 to-white p-6 rounded-3xl border border-teal-100/50 shadow-sm">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-teal-600 rounded-xl text-white">
                            <Package size={20}/>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                            Generador de Combos Manual
                        </h2>
                    </div>
                    <p className="text-sm text-gray-500 font-medium">
                        Crea, ajusta y publica promociones de primera línea de forma directa y visual para la farmacia.
                    </p>
                </div>
                
                <button 
                    onClick={() => setShowForm(!showForm)}
                    className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all shadow-md duration-300 ${
                        showForm 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200' 
                        : 'bg-teal-600 text-white hover:bg-teal-700 hover:shadow-teal-100'
                    }`}
                >
                    {showForm ? 'Ocultar Creador' : 'Nuevo Combo de Primera Línea'}
                    {showForm ? <XCircle size={15}/> : <Plus size={15}/>}
                </button>
            </div>

            {/* FORMULARIO DE CREACIÓN DE PRIMERA LÍNEA (DISEÑO A DOS COLUMNAS CON LIVE PREVIEW) */}
            {showForm && (
                <form onSubmit={handleManualSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white p-6 md:p-8 rounded-3xl border border-teal-100 shadow-xl shadow-teal-500/5 animate-in slide-in-from-top duration-300">
                    
                    {/* COLUMNA IZQUIERDA: CONFIGURACIÓN E INVENTARIO (8 COLUMNAS) */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="border-b pb-4">
                            <span className="text-xs font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full">Paso 1: Información & Productos</span>
                            <h3 className="text-lg font-bold text-gray-800 mt-2">Detalles de la Promoción</h3>
                        </div>

                        {/* Campos de texto principales */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Nombre del Combo</label>
                                <input 
                                    required
                                    className="w-full border border-gray-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                                    placeholder="Ej: Kit Bienestar Familiar, Pack Resfriado Plus"
                                    value={newBundle.name}
                                    onChange={e => setNewBundle({...newBundle, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Categoría de Promoción</label>
                                <select 
                                    className="w-full border border-gray-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none bg-white transition"
                                    value={newBundle.category}
                                    onChange={e => setNewBundle({...newBundle, category: e.target.value})}
                                >
                                    <option value="Sintomatología">Sintomatología</option>
                                    <option value="Primeros Auxilios">Primeros Auxilios</option>
                                    <option value="Cuidado Personal">Cuidado Personal</option>
                                    <option value="Infantil">Infantil</option>
                                    <option value="Suplementos">Suplementos</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Descripción Comercial (Atractiva para el Cliente)</label>
                            <textarea 
                                required
                                className="w-full border border-gray-200 p-3 rounded-2xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none h-20 transition resize-none"
                                placeholder="Describe por qué este combo es ideal y qué problema resuelve de manera directa..."
                                value={newBundle.description}
                                onChange={e => setNewBundle({...newBundle, description: e.target.value})}
                            />
                        </div>

                        {/* Selector e inventario de productos */}
                        <div className="space-y-3 bg-gray-50/50 p-4 md:p-5 rounded-3xl border border-gray-100">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                                <label className="text-xs font-black text-gray-700 uppercase tracking-widest flex items-center gap-1.5">
                                    <ShoppingBag size={14} className="text-teal-600"/> 
                                    Selecciona los Productos que componen el Combo:
                                </label>
                                <span className="text-[10px] bg-teal-100 text-teal-800 px-2.5 py-1 rounded-full font-bold">
                                    {(newBundle.productIds || []).length} seleccionados
                                </span>
                            </div>

                            {/* Controles de Búsqueda y Filtrado */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                <div className="relative">
                                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text"
                                        placeholder="Buscar por nombre, ingrediente activo..."
                                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <div className="relative flex-grow">
                                        <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        <select 
                                            className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition appearance-none"
                                            value={filterCategory}
                                            onChange={e => setFilterCategory(e.target.value)}
                                        >
                                            <option value="ALL">Todas las Categorías</option>
                                            {productCategories.map(cat => (
                                                <option key={cat} value={cat}>{cat}</option>
                                            ))}
                                        </select>
                                    </div>
                                    {searchQuery || filterCategory !== 'ALL' ? (
                                        <button 
                                            type="button"
                                            onClick={() => { setSearchQuery(''); setFilterCategory('ALL'); }}
                                            className="px-3 py-2 text-xs font-semibold bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition"
                                        >
                                            Limpiar
                                        </button>
                                    ) : null}
                                </div>
                            </div>

                            {/* Listado dinámico de productos con scroll */}
                            <div className="border border-gray-100 bg-white rounded-2xl max-h-56 overflow-y-auto divide-y divide-gray-100 shadow-inner">
                                {filteredProducts.length === 0 ? (
                                    <div className="p-8 text-center text-gray-400 text-xs">
                                        No se encontraron productos con los criterios de búsqueda.
                                    </div>
                                ) : (
                                    filteredProducts.map(p => {
                                        const isSelected = newBundle.productIds?.includes(p.id);
                                        return (
                                            <div 
                                                key={p.id} 
                                                onClick={() => handleToggleProduct(p.id)}
                                                className={`flex items-center justify-between p-3 cursor-pointer hover:bg-teal-50/30 transition-all ${
                                                    isSelected ? 'bg-teal-50/50' : ''
                                                }`}
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                                                        isSelected ? 'bg-teal-600 border-teal-600 text-white' : 'border-gray-300 bg-white'
                                                    }`}>
                                                        {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                    </div>
                                                    {p.image && (
                                                        <img 
                                                            src={p.image} 
                                                            alt={p.name} 
                                                            className="w-8 h-8 rounded-lg object-cover border bg-gray-50"
                                                            referrerPolicy="no-referrer"
                                                        />
                                                    )}
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-800 truncate">{p.name}</p>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-teal-600 font-semibold bg-teal-50 px-1.5 py-0.5 rounded">
                                                                {p.category}
                                                            </span>
                                                            {p.stock <= 5 && (
                                                                <span className="text-[9px] text-red-600 font-bold bg-red-50 px-1 py-0.5 rounded">
                                                                    Stock Crítico: {p.stock} u
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right flex-shrink-0 pl-2">
                                                    <p className="text-xs font-black text-gray-900">${Number(p.price).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Upgrade Config */}
                        <div className="p-4 border border-gray-100 rounded-2xl bg-gray-50/30">
                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input 
                                    type="checkbox"
                                    checked={newBundle.isUpgrade}
                                    onChange={e => setNewBundle({...newBundle, isUpgrade: e.target.checked})}
                                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 w-4 h-4"
                                />
                                <span className="text-xs font-bold text-gray-700">
                                    ¿Vincular como Combo Upgrade (Sugerencia de actualización de producto)?
                                </span>
                            </label>
                            
                            {newBundle.isUpgrade && (
                                <div className="mt-3 animate-in fade-in duration-200">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Producto Base Vinculado</label>
                                    <select 
                                        className="w-full border border-gray-200 p-2.5 rounded-xl text-xs bg-white focus:ring-2 focus:ring-teal-500 outline-none"
                                        value={newBundle.baseProductId}
                                        onChange={e => setNewBundle({...newBundle, baseProductId: e.target.value})}
                                    >
                                        <option value="">-- Seleccionar Producto Base --</option>
                                        {products.map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} - (Precio normal: ${p.price})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-1 italic">
                                        Cuando el cliente agregue el producto base al carrito, se le sugerirá este combo premium como un upgrade de valor.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: LIVE PREVIEW & CALCULATOR (4 COLUMNAS) */}
                    <div className="lg:col-span-4 bg-gray-50 p-6 rounded-3xl border border-gray-200/60 flex flex-col justify-between space-y-6">
                        <div className="space-y-4">
                            <div className="border-b pb-3 flex justify-between items-center">
                                <h3 className="text-sm font-black text-gray-800 flex items-center gap-1">
                                    <Eye size={16} className="text-teal-600" />
                                    Previsualización en Vivo
                                </h3>
                                <span className="text-[9px] font-bold uppercase bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-md">Borrador</span>
                            </div>

                            {/* Tarjeta de simulación cliente */}
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-md p-5 relative overflow-hidden transition duration-300">
                                {/* Badge de Ahorro Flotante */}
                                {discountPercentage > 0 && (
                                    <div className="absolute top-3 right-3 bg-red-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full shadow-sm animate-pulse flex items-center gap-0.5">
                                        <Tag size={10}/>
                                        ¡Ahorras {discountPercentage}%!
                                    </div>
                                )}

                                <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded uppercase tracking-wider">
                                    {newBundle.category}
                                </span>

                                <h4 className="text-base font-black text-gray-900 mt-2 truncate">
                                    {newBundle.name || 'Nombre del Combo'}
                                </h4>
                                <p className="text-[11px] text-gray-400 mt-1 line-clamp-2 min-h-[32px]">
                                    {newBundle.description || 'Aquí se mostrará la descripción comercial redactada para incentivar la compra...'}
                                </p>

                                {/* Miniatura de productos conectados por un símbolo + */}
                                <div className="mt-4 flex items-center gap-2 overflow-x-auto py-1">
                                    {(!newBundle.productIds || newBundle.productIds.length === 0) ? (
                                        <div className="w-full py-4 text-center border-2 border-dashed border-gray-100 rounded-xl text-[11px] text-gray-300 font-bold">
                                            Agrega productos para verlos aquí
                                        </div>
                                    ) : (
                                        newBundle.productIds.map((pid, idx) => {
                                            const p = products.find(x => x.id === pid);
                                            return (
                                                <React.Fragment key={pid}>
                                                    {idx > 0 && <span className="text-gray-400 font-black text-xs flex-shrink-0">+</span>}
                                                    <div className="w-10 h-10 rounded-lg border bg-gray-50 flex-shrink-0 overflow-hidden relative group">
                                                        {p?.image ? (
                                                            <img 
                                                                src={p.image} 
                                                                alt={p.name} 
                                                                className="w-full h-full object-cover"
                                                                referrerPolicy="no-referrer"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full bg-teal-100 flex items-center justify-center text-teal-600 font-black text-xs">
                                                                {p?.name?.[0] || 'P'}
                                                            </div>
                                                        )}
                                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-[8px] text-white font-black text-center truncate px-0.5">
                                                            {p?.price}
                                                        </div>
                                                    </div>
                                                </React.Fragment>
                                            );
                                        })
                                    )}
                                </div>

                                <div className="mt-5 pt-3 border-t flex justify-between items-end">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-semibold line-through">
                                            Original: ${totalOriginalPrice.toFixed(2)}
                                        </p>
                                        <p className="text-xl font-black text-teal-600">
                                            ${(newBundle.price || 0).toFixed(2)}
                                        </p>
                                    </div>
                                    
                                    {discountPercentage > 0 && totalOriginalPrice > 0 && (
                                        <span className="text-[10px] text-teal-700 bg-teal-50 px-2 py-1 rounded font-bold">
                                            Ahorro Real: ${(totalOriginalPrice - (newBundle.price || 0)).toFixed(2)}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Controles dinámicos de descuento */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/60 space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-1">
                                        <Percent size={12} className="text-teal-600"/>
                                        Regulador de Descuento
                                    </label>
                                    <span className="text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded">{discountPercentage}%</span>
                                </div>

                                <input 
                                    type="range"
                                    min="0"
                                    max="60"
                                    step="1"
                                    value={discountPercentage}
                                    onChange={e => handleDiscountChange(parseInt(e.target.value))}
                                    className="w-full accent-teal-600 cursor-ew-resize"
                                    disabled={totalOriginalPrice === 0}
                                />

                                {/* Botones rápidos de descuento */}
                                <div className="grid grid-cols-5 gap-1 pt-1">
                                    {[0, 10, 15, 25, 35].map(pct => (
                                        <button
                                            key={pct}
                                            type="button"
                                            disabled={totalOriginalPrice === 0}
                                            onClick={() => handleDiscountChange(pct)}
                                            className={`py-1 text-[10px] font-black rounded-lg transition-all ${
                                                discountPercentage === pct 
                                                ? 'bg-teal-600 text-white shadow-sm' 
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                            }`}
                                        >
                                            {pct}%
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Ajuste manual exacto del precio final */}
                            <div className="bg-white p-4 rounded-2xl border border-gray-200/60 space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">
                                    Precio Final del Combo ($)
                                </label>
                                <input 
                                    type="number"
                                    step="0.01"
                                    min="0.01"
                                    placeholder="0.00"
                                    disabled={totalOriginalPrice === 0}
                                    className="w-full border border-gray-200 p-2.5 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 font-bold text-teal-700 bg-teal-50/20"
                                    value={newBundle.price || ''}
                                    onChange={e => handlePriceChange(parseFloat(e.target.value) || 0)}
                                />
                                <p className="text-[9px] text-gray-400 italic">
                                    Puedes escribir el precio final exacto; el regulador porcentual se recalculará automáticamente.
                                </p>
                            </div>
                        </div>

                        {/* Botones de acción del formulario */}
                        <div className="flex gap-2 pt-4 border-t mt-4">
                            <button 
                                type="button" 
                                onClick={() => setShowForm(false)} 
                                className="flex-1 py-3 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-2xl transition"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-2xl text-xs font-black shadow-lg shadow-teal-600/10 transition-all flex items-center justify-center gap-1.5"
                            >
                                Guardar Combo <ArrowRight size={14}/>
                            </button>
                        </div>
                    </div>
                </form>
            )}

            {/* LISTADO DE COMBOS EXISTENTES */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                        <Tag className="text-teal-600" size={18}/>
                        Combos Vigentes en Tienda
                    </h3>
                    <span className="text-xs text-gray-400 font-bold">
                        {bundles.length} {bundles.length === 1 ? 'combo activo' : 'combos activos'}
                    </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {bundles.map(bundle => {
                        // Calcular suma original
                        const basePriceSum = bundle.productIds.reduce((acc, id) => {
                            const p = products.find(x => x.id === id);
                            return acc + (p?.price || 0);
                        }, 0);
                        const discountPercent = basePriceSum > 0 ? Math.round((1 - bundle.price / basePriceSum) * 100) : 0;

                        return (
                            <div 
                                key={bundle.id} 
                                className={`bg-white rounded-3xl border transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                                    bundle.active ? 'border-gray-100' : 'border-red-100 opacity-75 bg-red-50/10'
                                }`}
                            >
                                <div className="p-5 flex-grow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col gap-1.5">
                                            <span className="bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider w-fit">
                                                {bundle.category || 'General'}
                                            </span>
                                            {bundle.isUpgrade && (
                                                <span className="bg-yellow-50 text-yellow-700 border border-yellow-200/50 px-2.5 py-0.5 rounded-full text-[9px] font-bold w-fit flex items-center gap-0.5">
                                                    <Sparkles size={10} className="text-yellow-600"/> Upgrade
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button 
                                                onClick={() => toggleActive(bundle)} 
                                                title={bundle.active ? 'Desactivar Combo' : 'Activar Combo'}
                                                className={`p-1.5 rounded-xl transition ${bundle.active ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-red-500 bg-red-50 hover:bg-red-100'}`}
                                            >
                                                {bundle.active ? <CheckCircle size={15}/> : <XCircle size={15}/>}
                                            </button>
                                            <button 
                                                onClick={() => onDelete(bundle.id)} 
                                                title="Eliminar Combo"
                                                className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                            >
                                                <Trash2 size={15}/>
                                            </button>
                                        </div>
                                    </div>

                                    <h4 className="text-base font-black text-gray-900 mb-1">{bundle.name}</h4>
                                    <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{bundle.description}</p>

                                    <div className="space-y-2 mb-4">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Incluye ({bundle.productIds.length} productos):</p>
                                        <div className="space-y-1 bg-gray-50 p-2.5 rounded-xl border border-gray-100/50">
                                            {bundle.productIds.map((pid, idx) => {
                                                const p = products.find(x => x.id === pid);
                                                return (
                                                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700">
                                                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full flex-shrink-0"></div>
                                                        <span className="truncate flex-grow font-medium">{p?.name || 'Producto descatalogado'}</span>
                                                        {p && <span className="text-gray-400 font-black text-[10px] flex-shrink-0">${p.price}</span>}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-50/50 p-4 border-t border-gray-100 flex justify-between items-center">
                                    <div>
                                        <p className="text-[10px] text-gray-400 font-bold line-through">
                                            Suma normal: ${basePriceSum.toFixed(2)}
                                        </p>
                                        <p className="text-lg font-black text-teal-700">${bundle.price.toFixed(2)}</p>
                                    </div>
                                    
                                    {discountPercent > 0 && (
                                        <div className="flex items-center gap-1 text-[10px] font-black text-red-600 bg-red-50 border border-red-100 px-2.5 py-1 rounded-xl">
                                            Ahorro {discountPercent}%
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {bundles.length === 0 && !showForm && (
                    <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
                        <Package size={48} className="mx-auto text-gray-200 mb-4" />
                        <p className="text-gray-400 font-black">No hay combos ni promociones vigentes.</p>
                        <p className="text-xs text-gray-300 mt-1">Pulsa en "Nuevo Combo de Primera Línea" en la cabecera para crear uno manualmente.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminBundles;
