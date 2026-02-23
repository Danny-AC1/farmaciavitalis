import { useState, useMemo } from 'react';
import { Product, CartItem, DELIVERY_FEE, Bundle } from '../../types';

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

  const addBundleToCart = (bundle: Bundle, allProducts: Product[]) => {
    const bundleProducts = bundle.productIds.map((id: string) => allProducts.find(p => p.id === id)).filter(Boolean) as Product[];
    
    if (bundleProducts.length === 0) return;

    const normalPrice = bundleProducts.reduce((sum, p) => sum + p.price, 0);
    const discountAmount = normalPrice - bundle.price;

    setCart(prev => {
      let newCart = [...prev];
      
      // Add products
      bundleProducts.forEach(product => {
        const existing = newCart.find(item => item.id === product.id && item.selectedUnit === 'UNIT');
        if (existing) {
          newCart = newCart.map(item => item.id === product.id && item.selectedUnit === 'UNIT' 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
          );
        } else {
          newCart.push({ ...product, quantity: 1, selectedUnit: 'UNIT' });
        }
      });

      // Add discount item if applicable
      if (discountAmount > 0) {
        const discountId = `discount-${bundle.id}`;
        const existingDiscount = newCart.find(item => item.id === discountId);
        if (existingDiscount) {
          newCart = newCart.map(item => item.id === discountId 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
          );
        } else {
          newCart.push({
            id: discountId,
            name: `Ahorro: ${bundle.name}`,
            description: 'Descuento aplicado por combo',
            price: -discountAmount,
            image: 'https://cdn-icons-png.flaticon.com/512/726/726476.png',
            category: 'Descuento',
            stock: 9999,
            quantity: 1,
            selectedUnit: 'UNIT'
          });
        }
      }
      
      return newCart;
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

  return { cart, setCart, isCartOpen, setIsCartOpen, subtotal, totalBase, addToCart, addBundleToCart, removeFromCart, updateQuantity };
};
