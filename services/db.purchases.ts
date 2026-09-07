import { PurchaseOrder, PurchaseOrderItem, PurchaseOrderStatus } from '../types/purchases';
import { updateStockDB } from './db.products';
import { Product } from '../types';

const STORAGE_PURCHASE_ORDERS = 'vitalis_purchase_orders';
const STORAGE_ACTIVE_PURCHASE_CART = 'vitalis_active_purchase_cart';

export const getPurchaseOrders = (): PurchaseOrder[] => {
  try {
    const raw = localStorage.getItem(STORAGE_PURCHASE_ORDERS);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo órdenes de compra:', e);
    return [];
  }
};

export const savePurchaseOrders = (orders: PurchaseOrder[]): void => {
  try {
    localStorage.setItem(STORAGE_PURCHASE_ORDERS, JSON.stringify(orders));
  } catch (e) {
    console.error('Error guardando órdenes de compra:', e);
  }
};

export const getActivePurchaseCart = (): PurchaseOrderItem[] => {
  try {
    const raw = localStorage.getItem(STORAGE_ACTIVE_PURCHASE_CART);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Error leyendo carrito de compras activo:', e);
    return [];
  }
};

export const saveActivePurchaseCart = (items: PurchaseOrderItem[]): void => {
  try {
    localStorage.setItem(STORAGE_ACTIVE_PURCHASE_CART, JSON.stringify(items));
  } catch (e) {
    console.error('Error guardando carrito de compras activo:', e);
  }
};

export const generateOrderCode = (existingCount: number = 0): string => {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const seq = String(existingCount + 1).padStart(3, '0');
  return `OC-${dateStr}-${seq}`;
};

export const createPurchaseOrderFromItems = (
  items: PurchaseOrderItem[],
  supplierId: string | 'ALL',
  supplierName: string,
  notes?: string
): PurchaseOrder => {
  const existingOrders = getPurchaseOrders();
  const code = generateOrderCode(existingOrders.length);
  const now = new Date().toISOString();

  let totalCost = 0;
  let totalProjectedRevenue = 0;
  let totalUnitsCount = 0;

  items.forEach((it) => {
    totalCost += it.subtotal;
    totalProjectedRevenue += it.projectedRevenue;
    const physicalUnits = it.unitType === 'BOX' ? it.quantity * (it.unitsPerBox || 1) : it.quantity;
    totalUnitsCount += physicalUnits;
  });

  const projectedProfit = Math.max(0, totalProjectedRevenue - totalCost);
  const projectedMargin = totalProjectedRevenue > 0 ? (projectedProfit / totalProjectedRevenue) * 100 : 0;

  const newOrder: PurchaseOrder = {
    id: `po_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    code,
    createdAt: now,
    updatedAt: now,
    supplierId,
    supplierName,
    status: 'DRAFT',
    items,
    totalCost,
    totalProjectedRevenue,
    projectedProfit,
    projectedMargin,
    totalUnitsCount,
    notes,
  };

  const updatedOrders = [newOrder, ...existingOrders];
  savePurchaseOrders(updatedOrders);
  return newOrder;
};

export const updateOrderStatus = (
  orderId: string,
  newStatus: PurchaseOrderStatus
): PurchaseOrder[] => {
  const orders = getPurchaseOrders();
  const updated = orders.map((o) => {
    if (o.id === orderId) {
      return {
        ...o,
        status: newStatus,
        updatedAt: new Date().toISOString(),
        receivedAt: newStatus === 'RECEIVED' ? new Date().toISOString() : o.receivedAt,
      };
    }
    return o;
  });
  savePurchaseOrders(updated);
  return updated;
};

export const receivePurchaseOrderAndRestock = async (
  order: PurchaseOrder,
  currentProducts: Product[]
): Promise<{ success: boolean; updatedCount: number; message: string }> => {
  try {
    let updatedCount = 0;
    const prodMap = new Map<string, Product>();
    currentProducts.forEach((p) => prodMap.set(p.id, p));

    for (const item of order.items) {
      const prod = prodMap.get(item.productId);
      const incomingUnits = item.unitType === 'BOX' 
        ? item.quantity * (item.unitsPerBox || 1) 
        : item.quantity;

      const currentStock = prod ? prod.stock : item.currentStock;
      const newStock = Math.max(0, currentStock + incomingUnits);

      await updateStockDB(item.productId, newStock);
      updatedCount++;
    }

    // Marcar la orden como recibida
    updateOrderStatus(order.id, 'RECEIVED');

    return {
      success: true,
      updatedCount,
      message: `¡Mercadería ingresada exitosamente! Se actualizaron ${updatedCount} productos y se cargaron sus existencias al inventario.`,
    };
  } catch (err) {
    console.error('Error al recibir mercadería:', err);
    return {
      success: false,
      updatedCount: 0,
      message: 'Ocurrió un inconveniente al actualizar el stock de algunos productos.',
    };
  }
};

export const generateWhatsAppOrderMessage = (
  items: PurchaseOrderItem[],
  supplierName?: string,
  code?: string
): string => {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  let text = `📦 *ORDEN DE COMPRA - FARMACIA VITALIS*\n`;
  if (code) {
    text += `🔖 Nro. de Pedido: *${code}*\n`;
  }
  text += `📅 Fecha: ${dateStr}\n`;
  if (supplierName && supplierName !== 'ALL' && supplierName !== 'Todos') {
    text += `🏢 Distribuidora / Proveedor: *${supplierName.toUpperCase()}*\n`;
  }
  text += `-----------------------------------------\n`;
  text += `*DETALLE DE MEDICAMENTOS REQUERIDOS:*\n\n`;

  let totalCost = 0;

  items.forEach((item, index) => {
    const unitLabel = item.unitType === 'BOX' 
      ? `Caja(s) x${item.unitsPerBox || 1}` 
      : `Unidad(es)`;

    text += `${index + 1}. *${item.productName}*\n`;
    text += `   • Cantidad: *${item.quantity} ${unitLabel}*\n`;
    if (item.unitCost > 0) {
      text += `   • Costo Ref.: $${item.unitCost.toFixed(2)} c/u | Subtotal: $${item.subtotal.toFixed(2)}\n`;
    }
    text += `\n`;
    totalCost += item.subtotal;
  });

  text += `-----------------------------------------\n`;
  text += `📊 Total de ítems solicitados: ${items.length}\n`;
  if (totalCost > 0) {
    text += `💰 *INVERSIÓN TOTAL ESTIMADA:* $${totalCost.toFixed(2)}\n`;
  }
  text += `-----------------------------------------\n`;
  text += `_Favor confirmar disponibilidad y fecha estimada de entrega. ¡Gracias!_`;

  return text;
};

export const exportOrderToCSV = (items: PurchaseOrderItem[], orderCode: string = 'Orden_Compra'): void => {
  const headers = ['Producto', 'Categoria', 'Proveedor', 'Tipo Unidad', 'Cantidad', 'Unidades/Caja', 'Costo Unitario ($)', 'Subtotal ($)', 'PVP Venta ($)', 'Ingreso Estimado ($)'];
  
  const rows = items.map(it => [
    `"${it.productName.replace(/"/g, '""')}"`,
    `"${it.category.replace(/"/g, '""')}"`,
    `"${(it.supplierName || 'Sin asignar').replace(/"/g, '""')}"`,
    it.unitType === 'BOX' ? 'Caja' : 'Unidad',
    it.quantity,
    it.unitsPerBox || 1,
    it.unitCost.toFixed(2),
    it.subtotal.toFixed(2),
    it.salePrice.toFixed(2),
    it.projectedRevenue.toFixed(2)
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${orderCode}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
