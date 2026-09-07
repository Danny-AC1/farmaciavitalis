import React, { useState, useEffect, useMemo } from 'react';
import { Product, Supplier } from '../../types';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Share2, 
  Truck,
  RotateCcw,
  Image as ImageIcon
} from 'lucide-react';
import { PurchaseOrderItem, PurchaseUnitType, PurchaseOrder } from '../../types/purchases';
import { 
  getActivePurchaseCart, 
  saveActivePurchaseCart, 
  getPurchaseOrders, 
  createPurchaseOrderFromItems 
} from '../../services/db.purchases';
import { PurchaseMetricsBar } from './purchases/PurchaseMetricsBar';
import { PurchaseCartTable } from './purchases/PurchaseCartTable';
import { ProductPickerModal } from './purchases/ProductPickerModal';
import { PurchaseOrderHistoryModal } from './purchases/PurchaseOrderHistoryModal';
import { PurchaseShareModal } from './purchases/PurchaseShareModal';
import { PurchaseImageDownloadModal } from './purchases/PurchaseImageDownloadModal';

interface AdminShoppingListProps {
  products: Product[];
  suppliers: Supplier[];
}

const AdminShoppingList: React.FC<AdminShoppingListProps> = ({ products, suppliers }) => {
  // Carrito o lista activa de compras
  const [purchaseItems, setPurchaseItems] = useState<PurchaseOrderItem[]>(() => getActivePurchaseCart());
  
  // Filtro de distribuidora seleccionada en las pestañas
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('ALL');

  // Modales de acción
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDirectImageModalOpen, setIsDirectImageModalOpen] = useState(false);
  
  // Orden seleccionada para compartir o imprimir
  const [activeOrderToShare, setActiveOrderToShare] = useState<PurchaseOrder | null>(null);

  // Alerta temporal de acción exitosa
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  // Historial de órdenes de compra
  const [savedOrders, setSavedOrders] = useState<PurchaseOrder[]>(() => getPurchaseOrders());

  // Mapear proveedores para lookup rápido O(1)
  const suppliersMap = useMemo(() => {
    const map = new Map<string, Supplier>();
    suppliers.forEach(s => map.set(s.id, s));
    return map;
  }, [suppliers]);

  // Persistir en localStorage cada cambio de la lista de compras activa
  useEffect(() => {
    saveActivePurchaseCart(purchaseItems);
  }, [purchaseItems]);

  // Refrescar órdenes guardadas
  const refreshSavedOrders = () => {
    setSavedOrders(getPurchaseOrders());
  };

  // Mostrar mensaje de feedback
  const showFeedback = (msg: string) => {
    setFeedbackMessage(msg);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  // Productos con stock crítico (<= 1)
  const lowStockProducts = useMemo(() => {
    return products.filter(p => p.stock <= 1);
  }, [products]);

  // Distribuidoras únicas presentes en la orden actual con sus subtotales
  const uniqueSuppliersInCart = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number; totalCost: number }>();
    purchaseItems.forEach(it => {
      const suppId = it.supplierId || 'NONE';
      const suppName = it.supplierName || 'Sin Distribuidora';
      const current = map.get(suppId) || { id: suppId, name: suppName, count: 0, totalCost: 0 };
      current.count += 1;
      current.totalCost += it.subtotal;
      map.set(suppId, current);
    });
    return Array.from(map.values());
  }, [purchaseItems]);

  // 1. CARGAR SUGERIDO AUTOMÁTICO POR STOCK CRÍTICO
  const handleFillCriticalStock = () => {
    if (lowStockProducts.length === 0) {
      alert('¡Excelente! No hay productos con existencias críticas (stock 0 o 1) en este momento.');
      return;
    }

    const newItems: PurchaseOrderItem[] = lowStockProducts.map(p => {
      const unitsPerBox = p.unitsPerBox || 1;
      const hasBox = unitsPerBox > 1;
      const unitType: PurchaseUnitType = hasBox ? 'BOX' : 'UNIT';
      
      const unitCost = p.costPrice || (p.price > 0 ? p.price * 0.7 : 0);
      const boxCost = p.supplierBoxPrice || p.boxPrice || (unitCost * unitsPerBox);
      const appliedCost = unitType === 'BOX' ? boxCost : unitCost;
      
      const unitSale = p.price || 0;
      const boxSale = p.publicBoxPrice || p.boxPrice || (unitSale * unitsPerBox);
      const appliedSale = unitType === 'BOX' ? boxSale : unitSale;

      const quantity = 1; // 1 caja o 1 lote sugerido inicial

      const supplier = p.supplierId ? suppliersMap.get(p.supplierId) : undefined;

      return {
        productId: p.id,
        productName: p.name,
        category: p.category,
        unitsPerBox,
        unitType,
        quantity,
        unitCost: appliedCost,
        salePrice: appliedSale,
        subtotal: quantity * appliedCost,
        projectedRevenue: quantity * appliedSale,
        supplierId: p.supplierId,
        supplierName: supplier?.name,
        currentStock: p.stock
      };
    });

    setPurchaseItems(newItems);
    showFeedback(`Se cargaron ${newItems.length} medicamentos críticos a la orden de compra.`);
  };

  // 2. AGREGAR PRODUCTO MANUALMENTE
  const handleAddProduct = (product: Product, unitType: PurchaseUnitType, quantity: number = 1) => {
    const unitsPerBox = product.unitsPerBox || 1;
    const unitCost = product.costPrice || (product.price > 0 ? product.price * 0.7 : 0);
    const boxCost = product.supplierBoxPrice || product.boxPrice || (unitCost * unitsPerBox);
    const appliedCost = unitType === 'BOX' ? boxCost : unitCost;

    const unitSale = product.price || 0;
    const boxSale = product.publicBoxPrice || product.boxPrice || (unitSale * unitsPerBox);
    const appliedSale = unitType === 'BOX' ? boxSale : unitSale;

    const supplier = product.supplierId ? suppliersMap.get(product.supplierId) : undefined;

    setPurchaseItems(prev => {
      const existingIndex = prev.findIndex(it => it.productId === product.id);
      if (existingIndex >= 0) {
        // Actualizar existente
        const updated = [...prev];
        const current = updated[existingIndex];
        const newQty = current.quantity + quantity;
        updated[existingIndex] = {
          ...current,
          unitType,
          quantity: newQty,
          unitCost: appliedCost,
          salePrice: appliedSale,
          subtotal: newQty * appliedCost,
          projectedRevenue: newQty * appliedSale
        };
        return updated;
      } else {
        // Crear nuevo item
        const newItem: PurchaseOrderItem = {
          productId: product.id,
          productName: product.name,
          category: product.category,
          unitsPerBox,
          unitType,
          quantity,
          unitCost: appliedCost,
          salePrice: appliedSale,
          subtotal: quantity * appliedCost,
          projectedRevenue: quantity * appliedSale,
          supplierId: product.supplierId,
          supplierName: supplier?.name,
          currentStock: product.stock
        };
        return [newItem, ...prev];
      }
    });

    showFeedback(`"${product.name}" sumado a la orden de compra.`);
  };

  // 3. ACTUALIZAR CANTIDAD
  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    const safeQty = Math.max(1, newQuantity);
    setPurchaseItems(prev => prev.map(it => {
      if (it.productId === productId) {
        return {
          ...it,
          quantity: safeQty,
          subtotal: safeQty * it.unitCost,
          projectedRevenue: safeQty * it.salePrice
        };
      }
      return it;
    }));
  };

  // 4. CAMBIAR FORMATO ENTRE CAJA Y UNIDAD
  const handleToggleUnitType = (productId: string, newUnitType: PurchaseUnitType) => {
    setPurchaseItems(prev => prev.map(it => {
      if (it.productId === productId) {
        const prod = products.find(p => p.id === productId);
        const unitsPerBox = it.unitsPerBox || 1;
        const unitCost = prod?.costPrice || (prod?.price ? prod.price * 0.7 : 0);
        const boxCost = prod?.supplierBoxPrice || prod?.boxPrice || (unitCost * unitsPerBox);
        const appliedCost = newUnitType === 'BOX' ? boxCost : unitCost;

        const unitSale = prod?.price || 0;
        const boxSale = prod?.publicBoxPrice || prod?.boxPrice || (unitSale * unitsPerBox);
        const appliedSale = newUnitType === 'BOX' ? boxSale : unitSale;

        return {
          ...it,
          unitType: newUnitType,
          unitCost: appliedCost,
          salePrice: appliedSale,
          subtotal: it.quantity * appliedCost,
          projectedRevenue: it.quantity * appliedSale
        };
      }
      return it;
    }));
  };

  // 5. ELIMINAR ITEM
  const handleRemoveItem = (productId: string) => {
    setPurchaseItems(prev => prev.filter(it => it.productId !== productId));
  };

  // 6. LIMPIAR LISTA
  const handleClearCart = () => {
    if (purchaseItems.length === 0) return;
    const confirm = window.confirm('¿Deseas vaciar la orden de compra activa?');
    if (confirm) {
      setPurchaseItems([]);
      showFeedback('Mesa de trabajo de compras vaciada.');
    }
  };

  // 7. GUARDAR COMO ORDEN DE COMPRA FORMAL
  const handleCreateOrder = () => {
    if (purchaseItems.length === 0) {
      alert('Agrega al menos un medicamento a la orden para poder guardarla.');
      return;
    }

    const supplierName = selectedSupplierFilter === 'ALL'
      ? 'Todos los Proveedores'
      : uniqueSuppliersInCart.find(s => s.id === selectedSupplierFilter)?.name || 'Distribuidora General';

    const newOrder = createPurchaseOrderFromItems(
      purchaseItems,
      selectedSupplierFilter,
      supplierName
    );

    refreshSavedOrders();
    setActiveOrderToShare(newOrder);
    setIsShareOpen(true);
    showFeedback(`¡Orden ${newOrder.code} generada exitosamente!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Banner Superior Principal del Sistema de Compras */}
      <div className="bg-gradient-to-tr from-slate-900 to-teal-950 text-white rounded-3xl md:rounded-[2.5rem] p-6 md:p-8 shadow-xl border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 md:h-14 md:md-14 bg-teal-500/20 text-teal-300 border border-teal-500/30 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <ShoppingBag size={26} />
          </div>
          
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-black uppercase tracking-widest bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                Abastecimiento & Proveedores
              </span>
              {lowStockProducts.length > 0 && (
                <span className="text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle size={10} />
                  {lowStockProducts.length} medicamentos en falta crítica
                </span>
              )}
            </div>

            <h3 className="text-xl md:text-2xl font-black tracking-tight text-white">
              Sistema de Compras & Reabastecimiento
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed">
              Arma tus pedidos a distribuidoras (Difare, Leterago, etc.), simula la inversión requerida y 
              tu margen de ganancia futuro. Al llegar el pedido, ingresa el stock directamente a tu farmacia.
            </p>
          </div>
        </div>

        {/* Botonera de Acción Rápida */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          <button
            onClick={() => setIsPickerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-teal-600/20"
          >
            <Plus size={15} />
            <span>+ Agregar Producto</span>
          </button>

          <button
            onClick={handleFillCriticalStock}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
            title="Cargar automáticamente todos los medicamentos que tienen stock de 0 o 1 unidad"
          >
            <RotateCcw size={14} />
            <span>Sugerir por Stock Crítico</span>
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all relative"
            title="Ver órdenes de compra pasadas y confirmar recepción de mercadería"
          >
            <Clock size={14} />
            <span>Historial de Órdenes</span>
            {savedOrders.length > 0 && (
              <span className="bg-teal-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black font-mono">
                {savedOrders.length}
              </span>
            )}
          </button>

          {purchaseItems.length > 0 && (
            <button
              onClick={handleClearCart}
              className="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl transition-colors border border-rose-900/40"
              title="Vaciar orden de compra actual"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Alerta de Feedback Temporal */}
      {feedbackMessage && (
        <div className="bg-emerald-50 border border-emerald-200/80 rounded-2xl p-4 text-xs font-bold text-emerald-800 flex items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 text-xs font-black"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Métricas de Inversión y Ganancia Proyectada */}
      {purchaseItems.length > 0 && (
        <PurchaseMetricsBar items={purchaseItems} />
      )}

      {/* Barra de Emisión / Guardado si hay productos en la orden */}
      {purchaseItems.length > 0 && (
        <div className="bg-white border border-slate-200/80 rounded-2xl md:rounded-3xl p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
              <Truck size={18} />
            </div>
            <div>
              <div className="text-xs font-black text-slate-800">
                Orden en preparación ({purchaseItems.length} productos)
              </div>
              <div className="text-[11px] text-slate-500">
                Puedes guardarla como documento formal, enviarla a WhatsApp del distribuidor o imprimirla.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-end sm:self-center flex-wrap">
            <button
              onClick={() => setIsDirectImageModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/90 rounded-xl text-xs font-bold transition-colors shadow-2xs"
              title="Descargar imagen limpia con solo productos y cantidades (caja/unidad)"
            >
              <ImageIcon size={14} />
              <span>Descargar Imagen</span>
            </button>

            <button
              onClick={() => {
                setActiveOrderToShare(null);
                setIsShareOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              <Share2 size={14} />
              <span>Enviar por WhatsApp</span>
            </button>

            <button
              onClick={handleCreateOrder}
              className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors shadow-sm"
            >
              <FileText size={14} />
              <span>Guardar Orden de Compra</span>
            </button>
          </div>
        </div>
      )}

      {/* Tabla Interactiva de Compras */}
      <PurchaseCartTable
        items={purchaseItems}
        selectedSupplierFilter={selectedSupplierFilter}
        onSupplierFilterChange={setSelectedSupplierFilter}
        uniqueSuppliers={uniqueSuppliersInCart}
        onUpdateQuantity={handleUpdateQuantity}
        onToggleUnitType={handleToggleUnitType}
        onRemoveItem={handleRemoveItem}
        onOpenProductPicker={() => setIsPickerOpen(true)}
        onFillCriticalStock={handleFillCriticalStock}
      />

      {/* Modales */}
      <ProductPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        products={products}
        suppliers={suppliers}
        existingItems={purchaseItems}
        onAddProduct={handleAddProduct}
      />

      <PurchaseOrderHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        orders={savedOrders}
        products={products}
        onOrdersUpdated={refreshSavedOrders}
        onSelectOrderToShare={(order) => {
          setActiveOrderToShare(order);
          setIsShareOpen(true);
        }}
      />

      <PurchaseShareModal
        isOpen={isShareOpen}
        onClose={() => {
          setIsShareOpen(false);
          setActiveOrderToShare(null);
        }}
        items={activeOrderToShare ? activeOrderToShare.items : purchaseItems}
        supplierName={activeOrderToShare ? activeOrderToShare.supplierName : undefined}
        orderCode={activeOrderToShare ? activeOrderToShare.code : undefined}
      />

      {/* Modal directo para descargar la lista activa en imagen */}
      <PurchaseImageDownloadModal
        isOpen={isDirectImageModalOpen}
        onClose={() => setIsDirectImageModalOpen(false)}
        items={purchaseItems}
        supplierName={
          selectedSupplierFilter === 'ALL'
            ? undefined
            : uniqueSuppliersInCart.find((s) => s.id === selectedSupplierFilter)?.name
        }
      />

    </div>
  );
};

export default AdminShoppingList;
