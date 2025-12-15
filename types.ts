export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; // Precio por unidad suelta
  image: string;
  category: string;
  stock: number; // Stock total en unidades
  // Nuevos campos para cajas
  unitsPerBox?: number; // Cuántas unidades trae la caja
  boxPrice?: number;    // Precio de la caja cerrada
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedUnit: 'UNIT' | 'BOX'; // Indica si el cliente eligió caja o unidad
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'TRANSFER' | 'CASH';
  cashGiven?: number; // Nuevo: Cuanto dinero entregó el cliente (si es efectivo)
  status: 'PENDING' | 'DELIVERED';
  source?: 'ONLINE' | 'POS';
  date: string;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: 'TRANSFER' | 'CASH';
  cashGiven?: string; // Captura del input
}

export type ViewState = 'HOME' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'CHECKOUT' | 'SUCCESS';

export const ADMIN_PASSWORD = "1996";
export const DELIVERY_FEE = 1.00;
export const DELIVERY_CITY = "Machalilla";