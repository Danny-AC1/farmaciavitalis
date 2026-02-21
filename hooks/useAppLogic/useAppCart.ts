import { useState, useMemo } from 'react';
import { Product, CartItem, DELIVERY_FEE } from '../../types';

export const useAppCart = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const subtotal = useMemo(() => cart.reduce((acc, item) => {
    const price = item.selectedUnit === 'BOX' ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    return acc + (price * item.quantity);
  }, 0), [cart]);

  const totalBase = subtotal + DELIVERY_FEE;

  const addToCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id && item.selectedUnit === unitType);
      if (existing) {
        return prev.map(item => item.id === product.id && item.selectedUnit === unitType 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (index: number) => setCart(prev => prev.filter((_, i) => i !== index));
  
  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => prev.map((item, i) => {
      if (i === index) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  return { cart, setCart, isCartOpen, setIsCartOpen, subtotal, totalBase, addToCart, removeFromCart, updateQuantity };
};
