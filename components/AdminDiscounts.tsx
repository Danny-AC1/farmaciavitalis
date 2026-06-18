import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../types';
import { 
  Search, 
  Percent, 
  Trash2, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Sparkles,
  Tag,
  Filter,
  DollarSign
} from 'lucide-react';

interface AdminDiscountsProps {
  products: Product[];
}

export interface ActiveDiscount {
  productId: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  promoTag: string;
  expiryDate?: string;
  createdAt: string;
}

const AdminDiscounts: React.FC<AdminDiscountsProps> = ({ products }) => {
  // Estado de los descuentos cargados de localStorage
  const [discounts, setDiscounts] = useState<ActiveDiscount[]>([]);
  
  // Controles de filtrado y búsqueda (para todos los productos)
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [filterMode, setFilterMode] = useState<'all' | 'discounted' | 'not_discounted'>('all');
  
  // Estado para la creación/edición de descuento
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [promoTag, setPromoTag] = useState<string>('Oferta Especial');
  const [expiryDate, setExpiryDate] = useState<string>('');
  
  // Notificaciones y alertas
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar descuentos iniciales de localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vitalis_product_discounts');
      if (stored) {
        setDiscounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error loading discounts from localStorage", e);
    }
  }, []);

  // Guardar descuentos en localStorage
  const saveDiscounts = (updatedDiscounts: ActiveDiscount[]) => {
    try {
      localStorage.setItem('vitalis_product_discounts', JSON.stringify(updatedDiscounts));
      setDiscounts(updatedDiscounts);
    } catch (e) {
      console.error("Error saving discounts to localStorage", e);
    }
  };

  // Mapear descuentos activos por ID de producto
  const discountsMap = useMemo(() => {
    const map: Record<string, ActiveDiscount> = {};
    discounts.forEach(d => {
      map[d.productId] = d;
    });
    return map;
  }, [discounts]);

  // Obtener categorías únicas presentes en el catálogo
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  // Filtrar y procesar productos según búsquedas, categorías y estados de descuento
  const processedProducts = useMemo(() => {
    let result = [...products];

    // Buscar
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(term) ||
        (p.activeIngredient && p.activeIngredient.toLowerCase().includes(term)) ||
        p.category.toLowerCase().includes(term)
      );
    }

    // Filtrar por Categoría
    if (selectedCategory !== 'all') {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Filtrar por Estado de Descuento
    if (filterMode === 'discounted') {
      result = result.filter(p => !!discountsMap[p.id]);
    } else if (filterMode === 'not_discounted') {
      result = result.filter(p => !discountsMap[p.id]);
    }

    return result;
  }, [products, searchTerm, selectedCategory, filterMode, discountsMap]);

  // Estadísticas globales de descuentos
  const stats = useMemo(() => {
    const totalPromos = discounts.length;
    
    // Contar categorías afectadas
    const affectedCats = new Set<string>();
    discounts.forEach(d => {
      const prod = products.find(p => p.id === d.productId);
      if (prod) affectedCats.add(prod.category);
    });

    // Encontrar promedio de descuento (normalizado a % equivalente aproximado)
    let totalPct = 0;
    let counted = 0;
    discounts.forEach(d => {
      const prod = products.find(p => p.id === d.productId);
      if (prod) {
        let pct = 0;
        if (d.type === 'PERCENTAGE') {
          pct = d.value;
        } else {
          pct = (d.value / prod.price) * 100;
        }
        totalPct += pct;
        counted++;
      }
    });

    const averageDiscount = counted > 0 ? Math.round(totalPct / counted) : 0;

    return {
      totalPromos,
      categoriesCount: affectedCats.size,
      averageDiscount
    };
  }, [discounts, products]);

  // Función para calcular precio final con descuento
  const getDiscountedPrice = (product: Product, d: ActiveDiscount) => {
    if (d.type === 'PERCENTAGE') {
      const finalPrice = product.price * (1 - d.value / 100);
      return Math.max(0, parseFloat(finalPrice.toFixed(2)));
    } else {
      const finalPrice = product.price - d.value;
      return Math.max(0, parseFloat(finalPrice.toFixed(2)));
    }
  };

  // Función para abrir modal/formulario de creación de descuento
  const handleOpenDiscountForm = (product: Product) => {
    setSelectedProduct(product);
    const existing = discountsMap[product.id];
    if (existing) {
      setDiscountType(existing.type);
      setDiscountValue(existing.value);
      setPromoTag(existing.promoTag);
      setExpiryDate(existing.expiryDate || '');
    } else {
      setDiscountType('PERCENTAGE');
      setDiscountValue(10);
      setPromoTag('Oferta Especial');
      setExpiryDate('');
    }
  };

  // Guardar descuento individual
  const handleSaveDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    // Validar descuento no negativo o extravagante
    if (discountValue <= 0) {
      alert("El valor del descuento debe ser mayor a 0.");
      return;
    }
    if (discountType === 'PERCENTAGE' && discountValue > 100) {
      alert("Un porcentaje de descuento no puede ser superior al 100%.");
      return;
    }
    if (discountType === 'FIXED' && discountValue >= selectedProduct.price) {
      alert("El descuento fijo no puede ser mayor o igual al precio original del producto.");
      return;
    }

    const newDiscount: ActiveDiscount = {
      productId: selectedProduct.id,
      type: discountType,
      value: discountValue,
      promoTag: promoTag.trim() || 'Descuento',
      expiryDate: expiryDate || undefined,
      createdAt: new Date().toISOString()
    };

    // Agregar o actualizar
    const filtered = discounts.filter(d => d.productId !== selectedProduct.id);
    const updated = [...filtered, newDiscount];
    
    saveDiscounts(updated);
    setSelectedProduct(null);
    showNotice(`Descuento guardado para: ${selectedProduct.name}`);
  };

  // Quitar descuento individual
  const handleRemoveDiscount = (productId: string, productName: string) => {
    const updated = discounts.filter(d => d.productId !== productId);
    saveDiscounts(updated);
    showNotice(`Se retiró el descuento de: ${productName}`);
  };

  const showNotice = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Acciones Masivas
  const handleApplyBulkDiscount = (pct: number, category: string) => {
    if (category === 'all') {
      alert("Por favor selecciona una categoría específica para aplicar descuentos masivos.");
      return;
    }
    
    const confirmBulk = window.confirm(`¿Estás seguro de que deseas aplicar un ${pct}% de descuento a TODOS los productos de la categoría "${category}"? (Anulará descuentos previos en estos productos).`);
    if (!confirmBulk) return;

    const productsInCat = products.filter(p => p.category === category);
    if (productsInCat.length === 0) {
      alert("No hay productos en esta categoría.");
      return;
    }

    // Filtrar los que no están en esta categoría
    const otherDiscounts = discounts.filter(d => {
      const prod = products.find(p => p.id === d.productId);
      return !prod || prod.category !== category;
    });

    // Crear nuevos descuentos
    const newBulkDiscounts: ActiveDiscount[] = productsInCat.map(p => ({
      productId: p.id,
      type: 'PERCENTAGE',
      value: pct,
      promoTag: 'Oferta Especial',
      createdAt: new Date().toISOString()
    }));

    const updated = [...otherDiscounts, ...newBulkDiscounts];
    saveDiscounts(updated);
    showNotice(`¡Aplicado ${pct}% de descuento masivo a ${productsInCat.length} productos en ${category}!`);
  };

  // Vaciar todos los descuentos
  const handleClearAllDiscounts = () => {
    const confirmClear = window.confirm("¿Estás absolutamente seguro de retirar TODOS los descuentos activos de la tienda? Esta acción no se puede deshacer.");
    if (!confirmClear) return;

    saveDiscounts([]);
    showNotice("Se han retirado todos los descuentos de la tienda.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Superior */}
      <div className="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/10">
            <Percent size={22} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-800 tracking-tight">Sistema de Descuentos & Campañas</h3>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Administra porcentajes o valores de descuento fijos en tus productos de farmacia. 
              Visualiza en tiempo real de qué manera se ven impactados tus márgenes de ganancias frente a los costos del proveedor 
              para evitar pérdidas involuntarias.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex gap-2">
          {discounts.length > 0 && (
            <button 
              onClick={handleClearAllDiscounts}
              className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-black rounded-xl border border-rose-100"
            >
              Retirar Todos
            </button>
          )}
        </div>
      </div>

      {/* Alerta de notificación sutil */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 animate-bounce">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Indicadores Clave */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
            {stats.totalPromos}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Promociones Activas</span>
            <span className="text-lg font-black text-slate-800 block">Productos en Oferta</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            {stats.categoriesCount}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Categorías Afectadas</span>
            <span className="text-lg font-black text-slate-800 block">Diferentes Líneas</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold font-mono">
            {stats.averageDiscount}%
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Promedio de Ahorro</span>
            <span className="text-lg font-black text-slate-800 block">Ahorro Promedio</span>
          </div>
        </div>

      </div>

      {/* Caja de Herramientas Masiva */}
      <div className="bg-slate-50/50 p-5 rounded-3xl border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div className="space-y-1">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" /> Acciones Masivas por Categoría
          </h4>
          <p className="text-[11px] text-slate-500 leading-normal">
            Aplica un porcentaje de descuento unificado de manera inmediata a todos los productos de un grupo elegido.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 justify-start md:justify-end">
          <div className="bg-white border border-slate-200 px-3 py-1.5 rounded-xl">
            <select
              id="bulk-category-select"
              defaultValue="all"
              className="bg-transparent border-none text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="all">Elegir Categoría...</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-1.5">
            {[10, 15, 20, 25].map(pct => (
              <button
                key={pct}
                onClick={() => {
                  const selectEl = document.getElementById('bulk-category-select') as HTMLSelectElement;
                  const catVal = selectEl?.value || 'all';
                  handleApplyBulkDiscount(pct, catVal);
                }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-black rounded-lg shadow-sm transition-all"
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Principal de Listado y Formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Catálogo de Productos y Filtros */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Filtros y Buscador de Catálogo</h4>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 text-[11px] font-black rounded-xl border transition-all ${
                  filterMode === 'all'
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterMode('discounted')}
                className={`px-3 py-1 text-[11px] font-black rounded-xl border transition-all ${
                  filterMode === 'discounted'
                    ? 'bg-amber-500 border-amber-500 text-slate-900'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Con Descuento
              </button>
              <button
                onClick={() => setFilterMode('not_discounted')}
                className={`px-3 py-1 text-[11px] font-black rounded-xl border transition-all ${
                  filterMode === 'not_discounted'
                    ? 'bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Sin Descuento
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input 
                type="text"
                placeholder="Buscar por nombre o ingrediente activo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500 transition-all"
              />
            </div>

            <div className="bg-slate-50 border border-slate-200/80 px-3 py-2 rounded-xl flex items-center">
              <Filter size={14} className="text-slate-400 mr-2 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-transparent border-none text-xs font-bold text-slate-600 focus:outline-none cursor-pointer"
              >
                <option value="all">Todas las Categorías</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Listado de Productos */}
          {processedProducts.length === 0 ? (
            <div className="py-12 border border-dashed border-slate-200 rounded-3xl text-center text-slate-400">
              <p className="text-xs font-bold">No se encontraron productos que coincidan con la búsqueda.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-2">
              {processedProducts.map(p => {
                const discount = discountsMap[p.id];
                
                return (
                  <div key={p.id} className="py-4 flex items-center justify-between gap-4 group">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs text-slate-800 group-hover:text-amber-600 transition-colors">
                          {p.name}
                        </span>
                        {discount && (
                          <span className="px-2 py-0.5 bg-amber-500 text-slate-900 border border-amber-400/30 text-[9px] font-black rounded-full uppercase tracking-wide">
                            {discount.promoTag}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold text-slate-400">
                        <span>Categoría: <strong className="text-slate-600">{p.category}</strong></span>
                        <span>•</span>
                        <span>Precio Original: <strong className="text-slate-600">${p.price.toFixed(2)}</strong></span>
                        {p.costPrice && (
                          <>
                            <span>•</span>
                            <span>Costo Proovedor: <strong className="text-slate-400 font-mono">${p.costPrice.toFixed(2)}</strong></span>
                          </>
                        )}
                        <span>•</span>
                        <span>Stock: <strong className={p.stock <= 1 ? 'text-rose-500 font-black' : 'text-slate-600'}>{p.stock} uds.</strong></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {discount ? (
                        <div className="text-right space-y-0.5 mr-2">
                          <span className="line-through text-[10px] text-slate-300 block">${p.price.toFixed(2)}</span>
                          <span className="font-black text-xs text-teal-600 block">
                            ${getDiscountedPrice(p, discount).toFixed(2)} 
                            <span className="text-[10px] font-normal text-amber-500 ml-1">
                              (-{discount.type === 'PERCENTAGE' ? `${discount.value}%` : `$${discount.value}`})
                            </span>
                          </span>
                        </div>
                      ) : null}

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleOpenDiscountForm(p)}
                          className={`px-3 py-1.5 text-xs font-black rounded-xl transition-colors ${
                            discount 
                              ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                          }`}
                        >
                          {discount ? 'Editar' : 'Descontar'}
                        </button>

                        {discount && (
                          <button
                            onClick={() => handleRemoveDiscount(p.id, p.name)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-500 rounded-xl transition-colors border border-rose-100"
                            title="Quitar descuento"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Panel Formulario de Descuento (Visible al Elegir Producto) */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
            <Tag size={18} className="text-amber-500" />
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Configuración de Oferta</h4>
          </div>

          {!selectedProduct ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <div className="h-10 w-10 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto">
                <Tag size={18} />
              </div>
              <p className="text-xs font-bold leading-normal">
                Selecciona un producto del listado para asignar o editar un descuento.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveDiscount} className="space-y-5 animate-in fade-in duration-200">
              
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[9px] font-black tracking-widest text-slate-450 uppercase block">Producto Seleccionado</span>
                <span className="text-xs font-bold text-slate-800 block leading-tight">{selectedProduct.name}</span>
                <span className="text-[10px] text-slate-400 block">Precio Original: ${selectedProduct.price.toFixed(2)}</span>
              </div>

              {/* Tipo de Descuento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Método de Descuento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDiscountType('PERCENTAGE')}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all text-center ${
                      discountType === 'PERCENTAGE'
                        ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Porcentaje (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('FIXED')}
                    className={`py-2 text-xs font-extrabold rounded-xl border transition-all text-center ${
                      discountType === 'FIXED'
                        ? 'bg-amber-500 border-amber-500 text-slate-900 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Valor Fijo ($)
                  </button>
                </div>
              </div>

              {/* Valor numérico del Descuento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  {discountType === 'PERCENTAGE' ? 'Porcentaje de Descuento (%)' : 'Monto de Descuento Fijo ($)'}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    {discountType === 'PERCENTAGE' ? <Percent size={14} /> : <DollarSign size={14} />}
                  </div>
                  <input
                    type="number"
                    min="0.01"
                    step={discountType === 'PERCENTAGE' ? '1' : '0.01'}
                    max={discountType === 'PERCENTAGE' ? '100' : selectedProduct.price}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Etiqueta Promocional */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Etiqueta Promocional</label>
                <input
                  type="text"
                  placeholder="Ej: Oferta, 2x1, Flash, Liquidación"
                  value={promoTag}
                  onChange={(e) => setPromoTag(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/10 focus:border-amber-500"
                />
              </div>

              {/* Fecha de Expiración */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Fin de Promoción (Opcional)</label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    type="date"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                  />
                </div>
              </div>

              {/* Visualizador de Viabilidad Financiera y Nuevo Margen */}
              {(() => {
                const calculatedFinalPrice = discountType === 'PERCENTAGE' 
                  ? selectedProduct.price * (1 - discountValue / 100) 
                  : selectedProduct.price - discountValue;
                const finalPriceToDisplay = Math.max(0, calculatedFinalPrice);
                
                const costPrice = selectedProduct.costPrice || 0;
                const profitDiff = finalPriceToDisplay - costPrice;
                const marginPercent = finalPriceToDisplay > 0 ? (profitDiff / finalPriceToDisplay) * 100 : 0;
                const hasNegativeMargin = costPrice > 0 && profitDiff < 0;

                return (
                  <div className={`p-4 rounded-2xl border ${hasNegativeMargin ? 'bg-rose-50 border-rose-100 text-rose-800' : 'bg-slate-50 border-slate-100 text-slate-800'} space-y-2.5`}>
                    <span className="text-[9px] font-black tracking-widest uppercase block text-slate-500">Estimación de Rentabilidad</span>
                    
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Precio Oferta</span>
                        <span className="font-extrabold text-slate-800 block">${finalPriceToDisplay.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Margen Estimado</span>
                        <span className={`font-extrabold block ${hasNegativeMargin ? 'text-rose-600 animate-pulse' : 'text-emerald-600'}`}>
                          {costPrice > 0 ? `${marginPercent.toFixed(1)}%` : 'Sin Costo'}
                        </span>
                      </div>
                    </div>

                    {hasNegativeMargin && (
                      <div className="flex items-start gap-2 text-[10.5px] font-bold text-rose-600 leading-normal">
                        <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                        <span>¡Alerta! El precio promocional cae por debajo del costo de compra (${costPrice.toFixed(2)}). Generarás pérdidas en esta venta.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex gap-2.5">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl transition-all shadow-md"
                >
                  Confirmar Descuento
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProduct(null)}
                  className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-xs font-black rounded-xl transition-colors"
                >
                  Descartar
                </button>
              </div>

            </form>
          )}
        </div>

      </div>

    </div>
  );
};

export default AdminDiscounts;
