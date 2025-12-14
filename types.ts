export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export interface Category {
  id: string;
  name: string;
  image: string;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string; // Must contain "Machalilla" validation context visually
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  paymentMethod: 'TRANSFER' | 'CARD' | 'CASH';
  status: 'PENDING' | 'DELIVERED';
  source?: 'ONLINE' | 'POS'; // To distinguish physical sales
  date: string;
}

export type ViewState = 'HOME' | 'ADMIN_LOGIN' | 'ADMIN_DASHBOARD' | 'CHECKOUT' | 'SUCCESS';

export const ADMIN_PASSWORD = "1996";
export const DELIVERY_FEE = 1.00;
export const DELIVERY_CITY = "Machalilla";