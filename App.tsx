import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AdminPanel from './components/AdminPanel';
import Checkout from './components/Checkout';
import Assistant from './components/Assistant';
import ProductDetail from './components/ProductDetail';
import { Product, CartItem, ViewState, Order, Category, ADMIN_PASSWORD, DELIVERY_FEE, DELIVERY_CITY, CheckoutFormData } from './types';
import { 
  streamProducts, 
  streamCategories, 
  streamOrders, 
  seedInitialData, 
  addProductDB, 
  updateProductDB, 
  deleteProductDB, 
  updateStockDB, 
  addCategoryDB, 
  deleteCategoryDB, 
  addOrderDB, 
  updateOrderStatusDB 
} from './services/db';
import { Plus, Minus, Search, ShoppingBag, X, ChevronRight, ArrowLeft, Loader2, Package, MessageCircle } from 'lucide-react';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // Product Detail Modal State
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Navigation State
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Login State
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');

  // WhatsApp Link State for Success View
  const [lastOrderLink, setLastOrderLink] = useState('');

  // Initialization: Subscribe to Firestore
  useEffect(() => {
    seedInitialData().catch(console.error);

    const unsubProducts = streamProducts((data) => setProducts(data));
    const unsubCategories = streamCategories((data) => setCategories(data));
    const unsubOrders = streamOrders((data) => setOrders(data));
    
    // Fake loading delay just to smooth the UI transitions if data is fast
    setTimeout(() => setIsLoadingData(false), 1000);

    return () => {
      unsubProducts();
      unsubCategories();
      unsubOrders();
    };
  }, []);

  // --- Logic Helper: Calculate total reserved stock for a product in cart ---
  const getReservedStock = (productId: string, currentCart: CartItem[]) => {
    return currentCart.reduce((acc, item) => {
      if (item.id !== productId) return acc;
      const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
      return acc + (item.quantity * unitsPerItem);
    }, 0);
  };

  // Cart Logic
  const addToCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    const quantityToAdd = unitType === 'BOX' ? (product.unitsPerBox || 1) : 1;
    const currentReserved = getReservedStock(product.id, cart);
    
    if (currentReserved + quantityToAdd > product.stock) {
        return alert(`Stock insuficiente. Tienes ${currentReserved} unidades en carrito y solo quedan ${product.stock} disponibles.`);
    }

    setCart(prev => {
      // Find item with same ID AND same Unit Type
      const existingIndex = prev.findIndex(item => item.id === product.id && item.selectedUnit === unitType);
      
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 };
        return newCart;
      }
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
    setIsCartOpen(true);
    // If adding from modal, we might want to keep it open or close it. 
    // Usually closing it feels like "action completed", but let's keep it open for multiple adds unless requested.
    // For now, let's close the modal if it's open to show the cart opening
    if (selectedProduct) setSelectedProduct(null);
  };

  // Remove specific item variant
  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
        const item = prev[index];
        const product = products.find(p => p.id === item.id);
        if (!product) return prev;

        const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
        
        // Calculate what the NEW total reserved would be
        // We subtract the current quantity of THIS item, then add the new proposed quantity
        const otherItemsReserved = getReservedStock(item.id, prev) - (item.quantity * unitsPerItem);
        const newQty = item.quantity + delta;
        const newTotalReserved = otherItemsReserved + (newQty * unitsPerItem);

        if (newTotalReserved > product.stock) {
             alert("No puedes agregar más, supera el stock disponible.");
             return prev; 
        }
        if (newQty < 1) return prev;

        const newCart = [...prev];
        newCart[index] = { ...item, quantity: newQty };
        return newCart;
    });
  };

  const cartSubtotal = cart.reduce((sum, item) => {
      const price = item.selectedUnit === 'BOX' ? (item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
  }, 0);
  
  const cartTotal = cartSubtotal + DELIVERY_FEE;

  // Admin Logic
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setView('ADMIN_DASHBOARD');
      setPasswordInput('');
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  // --- Async DB Wrappers for AdminPanel ---
  const handleAddProduct = async (product: Product) => {
    await addProductDB(product);
  };

  const handleEditProduct = async (updatedProduct: Product) => {
    await updateProductDB(updatedProduct);
  };

  const handleDeleteProduct = async (id: string) => {
    await deleteProductDB(id);
  };
  
  const handleUpdateStock = async (id: string, newStock: number) => {
     await updateStockDB(id, newStock);
  };

  const handleAddCategory = async (category: Category) => {
    await addCategoryDB(category);
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategoryDB(id);
  };

  // Generic function to add an order
  const handleAddOrder = async (newOrder: Order) => {
    await addOrderDB(newOrder);
    
    // Deduct Stock for online orders AUTOMATICALLY
    if (newOrder.source === 'ONLINE') {
        newOrder.items.forEach(item => {
            const current = products.find(p => p.id === item.id);
            if (current) {
                // Determine deduction based on whether it's a BOX or UNIT
                const deduction = item.quantity * (item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1);
                updateStockDB(item.id, Math.max(0, current.stock - deduction));
            }
        });
    }
  };

  const handleUpdateOrderStatus = async (id: string, status: 'DELIVERED') => {
    await updateOrderStatusDB(id, status);
  };

  // Checkout Logic
  const handleConfirmOrder = (details: CheckoutFormData) => {
    const cashGivenValue = details.cashGiven ? parseFloat(details.cashGiven) : undefined;
    
    const newOrder: Order = {
      id: `ORD-${Date.now()}`,
      customerName: details.name,
      customerPhone: details.phone,
      customerAddress: `${details.address}, ${DELIVERY_CITY}`,
      items: cart,
      subtotal: cartSubtotal,
      deliveryFee: DELIVERY_FEE,
      total: cartTotal,
      paymentMethod: details.paymentMethod,
      cashGiven: cashGivenValue, // Guardamos el dato
      status: 'PENDING',
      source: 'ONLINE',
      date: new Date().toISOString()
    };

    // --- Generate WhatsApp Message ---
    const phoneNumber = "593998506160"; // Vitalis Number
    
    const itemsList = cart.map(item => {
        const isBox = item.selectedUnit === 'BOX';
        const price = isBox ? (item.boxPrice || 0) : item.price;
        const unitLabel = isBox ? `Caja x${item.unitsPerBox}` : 'Unid';
        return `- ${item.quantity} x ${item.name} (${unitLabel}): $${(price * item.quantity).toFixed(2)}`;
    }).join('\n');

    let paymentInfo = details.paymentMethod === 'CASH' ? 'Efectivo 💵' : 'Transferencia 🏦';
    if (details.paymentMethod === 'CASH' && cashGivenValue) {
        const change = cashGivenValue - cartTotal;
        paymentInfo += `\n*Paga con:* $${cashGivenValue.toFixed(2)}\n*Vuelto:* $${change.toFixed(2)}`;
    }

    const message = `*NUEVO PEDIDO WEB - VITALIS* 💊\n\n` +
        `*Cliente:* ${details.name}\n` +
        `*Tel:* ${details.phone}\n` +
        `*Dir:* ${details.address}, ${DELIVERY_CITY}\n` +
        `*Pago:* ${paymentInfo}\n\n` +
        `*PEDIDO:*\n${itemsList}\n\n` +
        `*Subtotal:* $${cartSubtotal.toFixed(2)}\n` +
        `*Envío:* $${DELIVERY_FEE.toFixed(2)}\n` +
        `*TOTAL:* $${cartTotal.toFixed(2)}` +
        `${details.paymentMethod === 'TRANSFER' ? '\n\n_(Adjunto comprobante de pago)_' : ''}`;

    const link = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    // Set link state for fallback button and try to open immediately
    setLastOrderLink(link);
    window.open(link, '_blank');
    
    handleAddOrder(newOrder);
    setCart([]);
    setView('SUCCESS');
  };

  // Helper to render product card
  const ProductCard = ({ product }: { product: Product }) => {
    const hasBox = product.unitsPerBox && product.unitsPerBox > 1;
    // Calculate stock available for UI (Real Stock - Reserved in Cart)
    const reserved = getReservedStock(product.id, cart);
    const available = Math.max(0, product.stock - reserved);
    const unitsPerBox = product.unitsPerBox || 9999;
    
    return (
        <div 
            onClick={() => setSelectedProduct(product)}
            className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full cursor-pointer group transform hover:-translate-y-1"
        >
            <div className="h-48 bg-gray-50 overflow-hidden relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 mix-blend-multiply" />
                {available <= 0 && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center backdrop-blur-[1px]">
                    <span className="bg-red-500 text-white px-3 py-1 font-bold rounded shadow-lg transform -rotate-6">AGOTADO</span>
                </div>
                )}
                {/* Overlay Hint */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1 rounded-full shadow-sm">Ver Detalles</span>
                </div>
            </div>
            <div className="p-5 flex flex-col flex-grow relative">
                <div className="flex-grow">
                    <h4 className="font-bold text-lg text-gray-900 mb-1 leading-tight group-hover:text-teal-600 transition-colors">{product.name}</h4>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{product.description}</p>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
                    {/* Unit Option */}
                    <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-teal-700">${product.price.toFixed(2)} <span className="text-xs text-gray-400 font-normal">/ unidad</span></span>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                addToCart(product, 'UNIT');
                            }}
                            disabled={available <= 0}
                            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors shadow-sm flex items-center gap-1 ${available > 0 ? 'bg-teal-100 text-teal-700 hover:bg-teal-200' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                        >
                            <Plus className="h-4 w-4" /> Agregar
                        </button>
                    </div>

                    {/* Box Option */}
                    {hasBox && product.boxPrice && (
                        <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-blue-800 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-blue-100 w-fit mb-0.5">
                                    <Package className="h-3 w-3"/> Caja x{product.unitsPerBox}
                                </span>
                                <span className="text-sm text-blue-600 font-bold ml-1">${product.boxPrice.toFixed(2)}</span>
                            </div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    addToCart(product, 'BOX');
                                }}
                                disabled={available < unitsPerBox}
                                className={`px-2 py-1.5 rounded text-xs font-bold transition-colors shadow-sm ${available >= unitsPerBox ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                            >
                                Agregar Caja
                            </button>
                        </div>
                    )}
                    <div className="text-[10px] text-gray-400 text-right">
                        Disp: {available} unid.
                    </div>
                </div>
            </div>
        </div>
    );
  };

  // Views
  const renderHome = () => {
    // Determine what to show: Category Grid or Product Grid
    if (activeCategory) {
      // Show Products in Category
      const categoryName = categories.find(c => c.id === activeCategory)?.name || activeCategory;
      const filteredProducts = products.filter(p => 
        p.category === categoryName &&
        (p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         p.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );

      return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
           <button 
             onClick={() => setActiveCategory(null)}
             className="flex items-center text-teal-600 font-bold mb-6 hover:text-teal-800 transition-colors"
           >
             <ArrowLeft className="h-5 w-5 mr-1" /> Volver a Categorías
           </button>
           
           <h3 className="text-3xl font-bold text-gray-900 mb-6 flex items-center">
             <span className="bg-teal-100 text-teal-800 px-3 py-1 rounded text-lg mr-3">
               {categoryName}
             </span>
             Productos
           </h3>

           <div className="relative mb-8">
              <input 
                type="text" 
                placeholder={`Buscar en ${categoryName}...`} 
                className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            </div>

           {filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-100">
              <ShoppingBag className="h-16 w-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No hay productos en esta categoría por ahora.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      );
    }

    // Show Categories Grid (Default Home)
    const filteredCategories = categories.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Global Product Search
    const filteredGlobalProducts = products.filter(p => 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="bg-teal-700 rounded-2xl p-8 mb-10 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-4">Bienvenido a Vitalis</h2>
            <p className="text-teal-100 text-lg mb-6 max-w-xl">
              Explora nuestras categorías y encuentra todo lo que necesitas para tu salud y bienestar en Machalilla.
            </p>
            <div className="relative max-w-md">
              <input 
                type="text" 
                placeholder="Buscar productos o categorías..." 
                className="w-full pl-10 pr-4 py-3 rounded-full text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-300"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5" />
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4">
             <ShoppingBag size={300} />
          </div>
        </div>

        {/* Categories Section */}
        {filteredCategories.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-teal-500 pl-4">
              {searchTerm ? 'Categorías Encontradas' : 'Nuestras Categorías'}
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-12">
              {filteredCategories.map(category => (
                <div 
                  key={category.id} 
                  onClick={() => {
                    setActiveCategory(category.id);
                    setSearchTerm(''); // Clear search when entering category
                  }}
                  className="group cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
                >
                  <div className="h-48 overflow-hidden relative">
                    <div className="absolute inset-0 bg-black opacity-20 group-hover:opacity-10 transition-opacity z-10"></div>
                    <img src={category.image} alt={category.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent z-20">
                      <h4 className="text-white text-xl font-bold flex justify-between items-center">
                        {category.name}
                        <ChevronRight className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h4>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Global Products Section (Only show when searching) */}
        {searchTerm && filteredGlobalProducts.length > 0 && (
          <>
            <h3 className="text-2xl font-bold text-gray-800 mb-6 border-l-4 border-teal-500 pl-4">Productos Encontrados</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredGlobalProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}

        {/* No Results States */}
        {searchTerm && filteredCategories.length === 0 && filteredGlobalProducts.length === 0 && (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
             <Search className="h-12 w-12 mx-auto text-gray-300 mb-3" />
             <p className="text-lg">No se encontraron resultados para "{searchTerm}".</p>
             <p className="text-sm text-gray-400">Intenta buscar por nombre de producto o categoría.</p>
          </div>
        )}
        
        {!searchTerm && filteredCategories.length === 0 && (
          <div className="text-center py-10 text-gray-500">
            No se encontraron categorías.
          </div>
        )}
      </div>
    );
  };

  if (isLoadingData) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
              <div className="text-center">
                  <Loader2 className="h-12 w-12 text-teal-600 animate-spin mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-700">Conectando con Vitalis...</h2>
                  <p className="text-gray-500 text-sm">Cargando catálogo y precios actualizados.</p>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      {view !== 'ADMIN_DASHBOARD' && (
        <Navbar 
          cartCount={cart.length} 
          onCartClick={() => setIsCartOpen(true)}
          onAdminClick={() => setView('ADMIN_LOGIN')}
          onLogoClick={() => {
            setView('HOME');
            setActiveCategory(null);
          }}
        />
      )}

      <main className="flex-grow">
        {view === 'HOME' && renderHome()}
        
        {view === 'ADMIN_LOGIN' && (
           <div className="min-h-[80vh] flex items-center justify-center px-4">
             <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md border-t-4 border-teal-600">
               <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Acceso Administrativo</h2>
               <form onSubmit={handleAdminLogin}>
                 <div className="mb-4">
                   <label className="block text-gray-700 text-sm font-bold mb-2">Contraseña</label>
                   <input 
                     type="password" 
                     className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                     value={passwordInput}
                     onChange={(e) => setPasswordInput(e.target.value)}
                     placeholder="••••"
                   />
                 </div>
                 {loginError && <p className="text-red-500 text-sm mb-4">Contraseña incorrecta.</p>}
                 <button className="w-full bg-teal-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-teal-700 transition">
                   Ingresar
                 </button>
                 <button 
                  type="button"
                  onClick={() => setView('HOME')}
                  className="w-full mt-3 text-gray-500 text-sm hover:text-gray-700"
                 >
                   Volver al Catálogo
                 </button>
               </form>
             </div>
           </div>
        )}

        {view === 'ADMIN_DASHBOARD' && (
          <AdminPanel 
            products={products}
            categories={categories}
            orders={orders}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
            onUpdateStock={handleUpdateStock}
            onAddCategory={handleAddCategory}
            onDeleteCategory={handleDeleteCategory}
            onAddOrder={handleAddOrder}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onLogout={() => {
              setView('HOME');
              setActiveCategory(null);
            }}
          />
        )}

        {view === 'CHECKOUT' && (
          <Checkout 
            cart={cart}
            subtotal={cartSubtotal}
            total={cartTotal}
            onConfirmOrder={handleConfirmOrder}
            onCancel={() => setView('HOME')}
          />
        )}

        {view === 'SUCCESS' && (
          <div className="min-h-[80vh] flex items-center justify-center px-4">
             <div className="text-center p-8 bg-white rounded-xl shadow-lg max-w-lg">
               <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
                 <ShoppingBag className="h-10 w-10 text-green-600" />
               </div>
               <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Pedido Recibido!</h2>
               <p className="text-gray-600 mb-6">
                 Gracias por comprar en Vitalis. Tu pedido ha sido registrado en nuestra base de datos.
                 <br/><br/>
                 Se debería haber abierto WhatsApp con los detalles. Si no fue así, usa el botón de abajo.
               </p>
               
               {lastOrderLink && (
                  <a 
                    href={lastOrderLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full bg-green-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-600 transition mb-4 flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="h-5 w-5" /> Enviar detalles por WhatsApp
                  </a>
               )}

               <button 
                 onClick={() => {
                   setView('HOME');
                   setActiveCategory(null);
                 }}
                 className="block w-full bg-teal-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-teal-700 transition"
               >
                 Volver a la Tienda
               </button>
             </div>
          </div>
        )}
      </main>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          cart={cart} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={addToCart} 
        />
      )}

      {/* Assistant Bot */}
      {view === 'HOME' && <Assistant products={products} />}

      {/* Cart Sidebar Modal */}
      {isCartOpen && view === 'HOME' && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsCartOpen(false)}></div>
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md">
              <div className="h-full flex flex-col bg-white shadow-xl">
                <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                  <div className="flex items-start justify-between">
                    <h2 className="text-lg font-medium text-gray-900">Carrito de Compras</h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-gray-500">
                      <X className="h-6 w-6" />
                    </button>
                  </div>

                  <div className="mt-8">
                    {cart.length === 0 ? (
                      <p className="text-center text-gray-500">Tu carrito está vacío.</p>
                    ) : (
                      <ul className="divide-y divide-gray-200">
                        {cart.map((item, idx) => {
                            const isBox = item.selectedUnit === 'BOX';
                            const price = isBox ? (item.boxPrice || 0) : item.price;
                            return (
                                <li key={`${item.id}-${idx}`} className="py-6 flex">
                                    <div className="flex-shrink-0 w-20 h-20 border border-gray-200 rounded-md overflow-hidden">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-center object-cover" />
                                    </div>
                                    <div className="ml-4 flex-1 flex flex-col">
                                    <div>
                                        <div className="flex justify-between text-base font-medium text-gray-900">
                                        <h3>
                                            {item.name}
                                            {isBox && <span className="ml-2 bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold uppercase">Caja x{item.unitsPerBox}</span>}
                                        </h3>
                                        <p className="ml-4">${(price * item.quantity).toFixed(2)}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">{item.category}</p>
                                    </div>
                                    <div className="flex-1 flex items-end justify-between text-sm">
                                        <div className="flex items-center border rounded-md">
                                        <button onClick={() => updateQuantity(idx, -1)} className="p-1 hover:bg-gray-100"><Minus className="h-4 w-4" /></button>
                                        <span className="px-2 font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(idx, 1)} className="p-1 hover:bg-gray-100"><Plus className="h-4 w-4" /></button>
                                        </div>
                                        <button type="button" onClick={() => removeFromCart(idx)} className="font-medium text-red-600 hover:text-red-500">Eliminar</button>
                                    </div>
                                    </div>
                                </li>
                            );
                        })}
                      </ul>
                    )}
                  </div>
                </div>

                {cart.length > 0 && (
                  <div className="border-t border-gray-200 py-6 px-4 sm:px-6">
                    <div className="flex justify-between text-base font-medium text-gray-900 mb-2">
                      <p>Subtotal</p>
                      <p>${cartSubtotal.toFixed(2)}</p>
                    </div>
                     <div className="flex justify-between text-sm text-gray-500 mb-4">
                      <p>Envío (Fijo)</p>
                      <p>${DELIVERY_FEE.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-teal-700 mb-6">
                      <p>Total</p>
                      <p>${cartTotal.toFixed(2)}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsCartOpen(false);
                        setView('CHECKOUT');
                      }}
                      className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-teal-600 hover:bg-teal-700"
                    >
                      Pagar Ahora
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;