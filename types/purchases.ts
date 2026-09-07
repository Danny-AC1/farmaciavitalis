export type PurchaseUnitType = 'BOX' | 'UNIT';

export type PurchaseOrderStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  productId: string;
  productName: string;
  category: string;
  unitsPerBox: number;
  unitType: PurchaseUnitType;
  quantity: number; // Número de cajas o número de unidades
  unitCost: number; // Costo por unidad o costo por caja según unitType
  salePrice: number; // Precio de venta al público equivalente (para proyectar ganancia)
  subtotal: number; // quantity * unitCost
  projectedRevenue: number; // quantity * salePrice
  supplierId?: string;
  supplierName?: string;
  currentStock: number;
}

export interface PurchaseOrder {
  id: string;
  code: string; // ej. "OC-2026-001"
  createdAt: string;
  updatedAt: string;
  supplierId: string | 'ALL';
  supplierName: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  totalCost: number;
  totalProjectedRevenue: number;
  projectedProfit: number;
  projectedMargin: number;
  totalUnitsCount: number; // Total de unidades físicas que ingresarán
  notes?: string;
  receivedAt?: string;
}
