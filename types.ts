
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
  driverLocation?: { lat: number, lng: number, lastUpdate: string }; // Nuevo: GPS
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

// --- NUEVAS INTERFACES PARA FAMILY CARE & PASTILLERO ---

export interface FamilyMember {
  id: string;
  userId: string; // Dueño de la cuenta principal
  name: string;
  relationship: 'ME' | 'PARENT' | 'CHILD' | 'PARTNER' | 'OTHER';
  color: string; // Código de color para UI
  avatar?: string;
}

export interface MedicationSchedule {
  id: string;
  userId: string;
  familyMemberId: string;
  name: string;
  productId?: string; // Link opcional al catálogo para reabastecer
  totalStock: number; // Cuántas pastillas hay en la caja
  currentStock: number; // Cuántas quedan
  dose: string; // Ej: "1 tableta"
  frequencyLabel: string; // Ej: "Cada 8 horas"
  lastTaken?: string;
  active: boolean;
}

// --- NUEVAS INTERFACES PARA SERVICIOS (OPCION 1) ---
export interface Service {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  description: string;
}

export interface ServiceBooking {
  id: string;
  userId?: string;
  patientName: string;
  serviceName: string;
  date: string; // ISO Date for day
  time: string; // "10:00"
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

export type ViewState = 'HOME' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'DRIVER_DASHBOARD' | 'CHECKOUT' | 'SUCCESS';

export const ADMIN_PASSWORD = "1996";
export const CASHIER_PASSWORD = "1234"; // Simple password for cashier
export const DRIVER_PASSWORD = "moto"; // Simple password for driver
export const DELIVERY_FEE = 1.00;
export const DELIVERY_CITY = "Machalilla";
export const POINTS_THRESHOLD = 500;
export const POINTS_DISCOUNT_VALUE = 5.00;

export const AVAILABLE_SERVICES: Service[] = [
  { id: 'srv_1', name: 'Inyectología', price: 3.50, durationMin: 15, description: 'Aplicación de inyecciones IM/IV Escartable incluido.' },
  { id: 'srv_2', name: 'Toma de Presión', price: 3.00, durationMin: 10, description: 'Control de presión arterial y registro.' },
  { id: 'srv_3', name: 'Prueba de Glucosa', price: 4.50, durationMin: 10, description: 'Medición rápida de glucosa en sangre.' },
  { id: 'srv_4', name: 'Suero', price: 10.00, durationMin: 30, description: 'Sesión de nebulización (incluye solución salina).' },
];
