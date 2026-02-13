
import { Product, Order, Category, CartItem } from '../types';

const PRODUCTS_KEY = 'vitales_products_v2';
const ORDERS_KEY = 'vitales_orders_v1';
const CATEGORIES_KEY = 'vitales_categories_v1';
const CART_KEY = 'vitalis_cart_v1'; // Nueva clave para el carrito

// Simple SVG Placeholder
const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='%23f1f5f9'%3E%3Crect width='300' height='300' /%3E%3Cpath d='M150 100v100M100 150h100' stroke='%23cbd5e1' stroke-width='20' stroke-linecap='round'/%3E%3Ctext x='50%25' y='85%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ESin Imagen%3C/text%3E%3C/svg%3E";

const INITIAL_CATEGORIES: Category[] = [
  { id: 'c1', name: 'Medicamentos', image: PLACEHOLDER_IMG },
  { id: 'c2', name: 'Vitaminas', image: PLACEHOLDER_IMG },
  { id: 'c3', name: 'Primeros Auxilios', image: PLACEHOLDER_IMG },
  { id: 'c4', name: 'Cuidado Personal', image: PLACEHOLDER_IMG }
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'Paracetamol 500mg',
    description: 'Alivio efectivo para el dolor y la fiebre. Caja de 20 tabletas.',
    price: 2.50,
    category: 'Medicamentos',
    stock: 100,
    image: PLACEHOLDER_IMG
  },
  {
    id: '2',
    name: 'Vitamina C + Zinc',
    description: 'Refuerza tu sistema inmunológico. Tubo de 10 tabletas efervescentes.',
    price: 5.00,
    category: 'Vitaminas',
    stock: 50,
    image: PLACEHOLDER_IMG
  },
  {
    id: '3',
    name: 'Alcohol Antiséptico',
    description: 'Alcohol al 70% para desinfección de heridas y superficies. 500ml.',
    price: 1.50,
    category: 'Primeros Auxilios',
    stock: 200,
    image: PLACEHOLDER_IMG
  },
  {
    id: '4',
    name: 'Protector Solar SPF 50',
    description: 'Protección alta contra rayos UV. Resistente al agua.',
    price: 15.00,
    category: 'Cuidado Personal',
    stock: 30,
    image: PLACEHOLDER_IMG
  }
];

export const getProducts = (): Product[] => {
  const stored = localStorage.getItem(PRODUCTS_KEY);
  if (!stored) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  return JSON.parse(stored);
};

export const saveProducts = (products: Product[]) => {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
};

export const getOrders = (): Order[] => {
  const stored = localStorage.getItem(ORDERS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const saveOrders = (orders: Order[]) => {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
};

export const getCategories = (): Category[] => {
  const stored = localStorage.getItem(CATEGORIES_KEY);
  if (!stored) {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  }
  return JSON.parse(stored);
};

export const saveCategories = (categories: Category[]) => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

// --- CARRITO PERSISTENTE ---
export const getCart = (): CartItem[] => {
    const stored = localStorage.getItem(CART_KEY);
    return stored ? JSON.parse(stored) : [];
};

export const saveCart = (cart: CartItem[]) => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
};
