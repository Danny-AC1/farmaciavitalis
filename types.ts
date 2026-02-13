
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
  boxPrice?: number; // Este se usará como costo de caja para cálculos internos
  publicBoxPrice?: number; // Nuevo: Precio de venta al público por caja
  barcode?: string;
  expiryDate?: string;
  supplierId?: string;
  requiresPrescription?: boolean;
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
  pointsRedeemed?: number;
  total: number;
  paymentMethod: 'TRANSFER' | 'CASH';
  cashGiven?: number; 
  status: 'PENDING' | 'IN_TRANSIT' | 'DELIVERED';
  source?: 'ONLINE' | 'POS';
  date: string;
  userId?: string;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  phone?: string;
  address?: string;
  role: 'USER' | 'ADMIN' | 'CASHIER' | 'DRIVER';
  points: number;
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

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: 'SERVICES' | 'SALARY' | 'SUPPLIES' | 'OTHER';
  date: string;
}

export interface Subscription {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  frequencyDays: number;
  nextDelivery: string;
  active: boolean;
}

export interface ServiceBooking {
  id: string;
  userId: string;
  patientName: string;
  serviceName: string;
  date: string;
  time: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  phone: string;
  notes?: string;
}

export interface StockAlert {
  id: string;
  email: string;
  productId: string;
  createdAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
}

export interface FamilyMember {
  id: string;
  userId: string;
  name: string;
  relationship: 'PARENT' | 'CHILD' | 'PARTNER' | 'OTHER';
  color: string;
}

export interface MedicationSchedule {
  id: string;
  userId: string;
  familyMemberId: string;
  name: string;
  totalStock: number;
  currentStock: number;
  dose: string;
  frequencyLabel: string;
  productId?: string;
  lastTaken?: string;
  active: boolean;
}

export const AVAILABLE_SERVICES = [
  { id: 's1', name: 'Inyectología', price: 2.00, durationMin: 10, description: 'Aplicación de inyecciones con receta.' },
  { id: 's2', name: 'Control Presión', price: 1.00, durationMin: 5, description: 'Toma de presión arterial.' },
  { id: 's3', name: 'Glucosa', price: 3.00, durationMin: 5, description: 'Prueba rápida de azúcar en sangre.' }
];

export type ViewState = 'HOME' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'DRIVER_DASHBOARD' | 'CHECKOUT' | 'SUCCESS';

export const ADMIN_PASSWORD = "1996";
export const CASHIER_PASSWORD = "1234";
export const DRIVER_PASSWORD = "moto";
export const DELIVERY_FEE = 1.00;
export const DELIVERY_CITY = "Machalilla";
export const POINTS_THRESHOLD = 500;
export const POINTS_DISCOUNT_VALUE = 5.00;
