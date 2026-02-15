
import { useState, useEffect, useMemo } from 'react';
import { 
  Product, Category, Order, User, CartItem, ViewState, 
  CheckoutFormData, DELIVERY_FEE
} from '../types';
import { 
  streamProducts, streamCategories, streamOrders, addOrderDB, 
  updateStockDB, streamBanners, streamUser, logSearchDB
} from '../services/db';
import { auth } from '../services/firebase';
import { searchProductsBySymptoms, checkInteractions } from '../services/gemini';

export const useAppLogic = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [banners, setBanners] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [tempStaffRole, setTempStaffRole] = useState<User['role'] | null>(null);

  const [view, setView] = useState<ViewState>('HOME');
  const [activeTab, setActiveTab] = useState<'home' | 'orders' | 'assistant' | 'health' | 'services'>('home');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showStaffAccess, setShowStaffAccess] = useState(false);

  const [isSymptomMode, setIsSymptomMode] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);

  const [cart, setCart] = useState<CartItem[]>([]);

  // 1. Streams de Firebase
  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        if (unsubUser) unsubUser();
        unsubUser = streamUser(user.uid, (userData) => setCurrentUser(userData));
      } else {
        if (unsubUser) unsubUser();
        unsubUser = null;
        setCurrentUser(null);
      }
    });

    const unsubProducts = streamProducts(setProducts);
    const unsubCategories = streamCategories(setCategories);
    const unsubOrders = streamOrders(setOrders);
    const unsubBanners = streamBanners(setBanners);

    return () => {
      unsubAuth(); unsubProducts(); unsubCategories(); unsubOrders(); unsubBanners();
      if (unsubUser) unsubUser();
    };
  }, []);

  // 2. IA: Búsqueda por síntomas
  useEffect(() => {
    if (isSymptomMode && searchTerm.length > 3) {
      const timer = setTimeout(async () => {
        setIsSearchingAI(true);
        const ids = await searchProductsBySymptoms(searchTerm, products);
        setAiResults(ids);
        setIsSearchingAI(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setAiResults([]);
    }
  }, [searchTerm, isSymptomMode, products]);

  // 3. IA: Interacciones medicamentosas
  useEffect(() => {
    if (cart.length >= 2) {
      const check = async () => {
        setCheckingInteractions(true);
        const names = cart.map(i => i.name);
        const result = await checkInteractions(names);
        setInteractionWarning(result.safe ? null : result.message);
        setCheckingInteractions(false);
      };
      check();
    } else {
      setInteractionWarning(null);
    }
  }, [cart]);

  // 4. Cálculos y Filtros
  const subtotal = useMemo(() => cart.reduce((acc, item) => {
    const price = item.selectedUnit === 'BOX' ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    return acc + (price * item.quantity);
  }, 0), [cart]);

  const totalBase = subtotal + DELIVERY_FEE;

  const displayedProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory) {
      const catName = categories.find(c => c.id === activeCategory)?.name;
      filtered = products.filter(p => p.category === catName);
    }
    if (searchTerm) {
      if (isSymptomMode) {
        filtered = filtered.filter(p => aiResults.includes(p.id));
      } else {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }
    return filtered;
  }, [products, searchTerm, activeCategory, categories, isSymptomMode, aiResults]);

  // 5. Registro de Demanda (Búsquedas sin resultado)
  useEffect(() => {
    if (searchTerm.length > 3 && displayedProducts.length === 0 && !isSearchingAI) {
      const timer = setTimeout(async () => {
        // Logueamos solo si el término de búsqueda sigue sin resultados tras 2 segundos
        try {
          await logSearchDB(searchTerm);
        } catch (error) {
          console.error("Error al registrar demanda:", error);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, displayedProducts.length, isSearchingAI]);

  // 6. Handlers del Carrito
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

  // 7. Procesar Pedido
  const handleConfirmOrder = async (details: CheckoutFormData, discount: number, pointsRedeemed: number) => {
    if (!currentUser) {
      setShowAuthModal(true);
      return;
    }

    const orderId = `WEB-${Date.now()}`;
    const finalTotal = subtotal + details.deliveryFee - discount;
    const order: Order = {
      id: orderId,
      customerName: details.name,
      customerPhone: details.phone,
      customerAddress: `${details.deliveryZone}: ${details.address}`,
      items: cart,
      subtotal,
      deliveryFee: details.deliveryFee,
      discount,
      pointsRedeemed,
      total: finalTotal,
      paymentMethod: details.paymentMethod,
      cashGiven: details.cashGiven ? parseFloat(details.cashGiven) : undefined,
      status: 'PENDING',
      source: 'ONLINE',
      date: new Date().toISOString(),
      userId: currentUser.uid
    };

    try {
      await addOrderDB(order);
      for (const item of cart) {
        const orig = products.find(p => p.id === item.id);
        if (orig) {
          const unitsToSubtract = item.selectedUnit === 'BOX' ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
          await updateStockDB(item.id, Math.max(0, orig.stock - unitsToSubtract));
        }
      }

      const itemsText = cart.map(i => `- ${i.quantity}x ${i.name} (${i.selectedUnit === 'BOX' ? 'Caja' : 'Unid'})`).join('\n');
      const waMessage = `*NUEVO PEDIDO VITALIS* 💊\n\n` +
        `*Orden:* #${orderId.slice(-8)}\n` +
        `*Cliente:* ${order.customerName}\n` +
        `*Zona:* ${details.deliveryZone}\n` +
        `*Dirección:* ${details.address}\n\n` +
        `*PRODUCTOS:*\n${itemsText}\n\n` +
        `*Subtotal:* $${order.subtotal.toFixed(2)}\n` +
        `*Envío:* $${order.deliveryFee.toFixed(2)}\n` +
        (order.discount ? `*Descuento:* -$${order.discount.toFixed(2)}\n` : '') +
        `*TOTAL A PAGAR: $${order.total.toFixed(2)}*\n\n` +
        `*Método de Pago:* ${order.paymentMethod === 'CASH' ? 'Efectivo 💵' : 'Transferencia 🏦'}\n` +
        (order.paymentMethod === 'CASH' && order.cashGiven ? `*Paga con:* $${order.cashGiven.toFixed(2)}\n*Cambio:* $${(order.cashGiven - order.total).toFixed(2)}` : '');

      const waNumber = "593998506160";
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`, '_blank');
      setCart([]);
      setView('SUCCESS');
    } catch (e) {
      alert("Error al procesar el pedido");
    }
  };

  const handleTabChange = (tab: any) => {
    if ((tab === 'orders' || tab === 'health' || tab === 'services') && !currentUser) {
      setShowAuthModal(true);
      return;
    }
    setActiveTab(tab);
  };

  return {
    products, categories, orders, banners, currentUser, tempStaffRole, setTempStaffRole,
    view, setView, activeTab, setActiveTab, isCartOpen, setIsCartOpen,
    selectedProduct, setSelectedProduct, searchTerm, setSearchTerm, activeCategory, setActiveCategory,
    showAuthModal, setShowAuthModal, showProfileModal, setShowProfileModal,
    showPrescriptionModal, setShowPrescriptionModal, showStaffAccess, setShowStaffAccess,
    isSymptomMode, setIsSymptomMode, isSearchingAI, checkingInteractions, interactionWarning,
    cart, subtotal, totalBase, displayedProducts,
    addToCart, removeFromCart, updateQuantity, handleConfirmOrder, handleTabChange
  };
};
