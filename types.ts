
export interface Product {
  id: string;
  name: string;
  description: string;
  price: number; 
  costPrice?: number;
  image: string;
  category: string;
  stock: number; 
  unitsPerBox?: number; 
  boxPrice?: number;
  barcode?: string;
  expiryDate?: string;
  supplierId?: string; // Nuevo: Relación con proveedor
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
  selectedUnit: 'UNIT' | 'BOX'; 
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  discount?: number;
  pointsRedeemed?: number; // Nuevo: Puntos usados
  total: number;
  paymentMethod: 'TRANSFER' | 'CASH';
  cashGiven?: number; 
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED'; // Nuevo estado
  source?: 'ONLINE' | 'POS';
  date: string;
  userId?: string;
  driverId?: string; // Nuevo: Asignación a repartidor
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  address?: string;
  role: 'USER' | 'ADMIN' | 'CASHIER' | 'DRIVER'; // Roles actualizados
  points: number; // Nuevo: Programa de lealtad
  createdAt: string;
}

export interface CheckoutFormData {
  name: string;
  phone: string;
  address: string;
  city: string;
  paymentMethod: 'TRANSFER' | 'CASH';
  cashGiven?: string; 
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
  active: boolean;
}

export interface Banner {
  id: string;
  image: string;
  title?: string;
  active: boolean;
}

export interface Supplier {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
}

export interface SearchLog {
  id: string;
  term: string;
  date: string;
  count: number;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string; // HTML or Markdown
  image?: string;
  date: string;
  author: string;
}

export interface Subscription {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  frequencyDays: number; // 30 dias usualmente
  nextDelivery: string;
  active: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'SERVICES' | 'SALARY' | 'SUPPLIES' | 'OTHER';
  date: string;
}

export type ViewState = 'HOME' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'DRIVER_DASHBOARD' | 'CHECKOUT' | 'SUCCESS';

export const ADMIN_PASSWORD = "1996";
export const CASHIER_PASSWORD = "1234"; // Simple password for cashier
export const DRIVER_PASSWORD = "moto"; // Simple password for driver
export const DELIVERY_FEE = 1.00;
export const DELIVERY_CITY = "Machalilla";
export const POINTS_THRESHOLD = 500;
export const POINTS_DISCOUNT_VALUE = 5.00;
