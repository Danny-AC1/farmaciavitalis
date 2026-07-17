import React, { useState, useMemo, useEffect } from 'react';
import { Product } from '../../types';
import { notifyDiscountsUpdated } from '../../utils/discounts';
import { CheckCircle } from 'lucide-react';

// Subcomponents
import { DiscountBanner } from './discounts/DiscountBanner';
import { DiscountStats } from './discounts/DiscountStats';
import { BulkDiscountTools } from './discounts/BulkDiscountTools';
import { ProductDiscountList } from './discounts/ProductDiscountList';
import { DiscountForm } from './discounts/DiscountForm';

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
      notifyDiscountsUpdated();
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
      <DiscountBanner 
        hasDiscounts={discounts.length > 0}
        onClearAllDiscounts={handleClearAllDiscounts}
      />

      {/* Alerta de notificación sutil */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-xs font-extrabold flex items-center gap-2.5 animate-bounce">
          <CheckCircle size={16} className="text-emerald-600" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Indicadores Clave */}
      <DiscountStats stats={stats} />

      {/* Caja de Herramientas Masiva */}
      <BulkDiscountTools 
        categories={categories}
        onApplyBulkDiscount={handleApplyBulkDiscount}
      />

      {/* Panel Principal de Listado y Formulario */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Catálogo de Productos y Filtros */}
        <ProductDiscountList 
          processedProducts={processedProducts}
          discountsMap={discountsMap}
          filterMode={filterMode}
          setFilterMode={setFilterMode}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          categories={categories}
          onOpenDiscountForm={handleOpenDiscountForm}
          onRemoveDiscount={handleRemoveDiscount}
          getDiscountedPrice={getDiscountedPrice}
        />

        {/* Panel Formulario de Descuento (Visible al Elegir Producto) */}
        <DiscountForm 
          selectedProduct={selectedProduct}
          discountType={discountType}
          setDiscountType={setDiscountType}
          discountValue={discountValue}
          setDiscountValue={setDiscountValue}
          promoTag={promoTag}
          setPromoTag={setPromoTag}
          expiryDate={expiryDate}
          setExpiryDate={setExpiryDate}
          onSaveDiscount={handleSaveDiscount}
          onCancel={() => setSelectedProduct(null)}
        />
      </div>

    </div>
  );
};

export default AdminDiscounts;
