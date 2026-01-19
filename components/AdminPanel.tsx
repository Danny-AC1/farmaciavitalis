
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Product, Order, Category, User, Supplier, SearchLog, Banner, Expense, Subscription, Coupon, ServiceBooking, StockAlert, CartItem, BlogPost } from '../types';
import { Menu, Bell, Layout, X, Calculator, Printer, AlertTriangle, ShoppingBag, ArrowRight } from 'lucide-react';
import { 
    streamUsers, streamSuppliers, streamSearchLogs, streamBanners, 
    streamExpenses, streamCoupons, streamBookings, streamStockAlerts, streamSubscriptions,
    addSupplierDB, deleteSupplierDB, addCouponDB, deleteCouponDB, addExpenseDB,
    updateBookingStatusDB, saveUserDB, deleteBannerDB, addOrderDB, updateStockDB, uploadImageToStorage,
    addBannerDB, addBlogPostDB, deleteSubscriptionDB, deleteStockAlertDB, deleteOrderDB
} from '../services/db';
import { generateProductDescription, generateSocialPost } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";

import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import AdminPOS from './AdminPOS';
import AdminProductManagement from './AdminProductManagement';
import AdminMarketing from './AdminMarketing';
import AdminOrders from './AdminOrders';
import AdminSimpleTable from './AdminSimpleTable';
import AdminDemand from './AdminDemand';
import AdminUsers from './AdminUsers';
import AdminStockQuick from './AdminStockQuick';
import AdminExpenses from './AdminExpenses';
import AdminBookings from './AdminBookings';
import AdminSuppliers from './AdminSuppliers';
import AdminSubscriptions from './AdminSubscriptions';
import AdminStockAlerts from './AdminStockAlerts';
import BarcodeScanner from './BarcodeScanner';

interface AdminPanelProps {
  products: Product[];
  categories: Category[];
  orders: Order[];
  onAddProduct: (p: Product) => Promise<void>;
  onEditProduct: (p: Product) => Promise<void>;
  onDeleteProduct: (id: string) => Promise<void>;
  onUpdateStock: (id: string, newStock: number) => Promise<void>;
  onAddCategory: (c: Category) => Promise<void>;
  onDeleteCategory: (id: string) => Promise<void>;
  onAddOrder: (o: Order) => Promise<void>;
  onUpdateOrderStatus: (id: string, status: 'DELIVERED', order: Order) => Promise<void>;
  onLogout: () => void;
  currentUserRole?: 'ADMIN' | 'CASHIER' | 'DRIVER' | 'USER'; 
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, categories, orders, onAddProduct, onEditProduct, onDeleteProduct, onUpdateStock, 
  onAddCategory, onDeleteCategory, onUpdateOrderStatus, onLogout, currentUserRole = 'ADMIN'
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [showNotifications, setShowNotifications] = useState(false);

  // ESTADO DEL FORMULARIO DE PRODUCTOS
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCostPrice, setProdCostPrice] = useState('');
  const [prodUnitsPerBox, setProdUnitsPerBox] = useState('');
  const [prodBoxPrice, setProdBoxPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodExpiry, setProdExpiry] = useState('');
  const [prodSupplier, setProdSupplier] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ESTADOS DE MARKETING IA
  const [blogTopic, setBlogTopic] = useState('');
  const [marketingProduct, setMarketingProduct] = useState('');
  const [postPlatform, setPostPlatform] = useState<'INSTAGRAM' | 'WHATSAPP'>('INSTAGRAM');
  const [generatedPost, setGeneratedPost] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

  // Referencias para inputs
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  // ESTADO DEL POS
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCashReceived, setPosCashReceived] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [showPosScanner, setShowPosScanner] = useState(false);
  const [showCashClosure, setShowCashClosure] = useState(false);

  // Estados de datos en tiempo real
  const [banners, setBanners] = useState<Banner[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);

  useEffect(() => {
      const unsubs = [
          streamBanners(setBanners),
          streamExpenses(setExpenses),
          streamCoupons(setCoupons),
          streamSuppliers(setSuppliers),
          streamUsers(setUsers),
          streamSearchLogs(setSearchLogs),
          streamStockAlerts(setStockAlerts),
          streamSubscriptions(setSubscriptions),
          streamBookings(setBookings)
      ];
      return () => unsubs.forEach(unsub => unsub());
  }, []);

  // Cerrar notificaciones al hacer clic fuera
  useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
          if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
              setShowNotifications(false);
          }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- LÓGICA DE CÁLCULO DASHBOARD ---
  const { chartData, profitableProducts, topCategory } = useMemo(() => {
    // Para rentabilidad y utilidad neta, seguimos usando solo DELIVERED
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
    const profitsMap: Record<string, { name: string, profit: number, quantity: number }> = {};
    const categorySales: Record<string, number> = {};
    
    deliveredOrders.forEach(order => {
        order.items.forEach(item => {
            const cost = item.costPrice || 0;
            const profitPerUnit = item.price - cost;
            const totalProfit = profitPerUnit * item.quantity;
            
            if (!profitsMap[item.id]) {
                profitsMap[item.id] = { name: item.name, profit: 0, quantity: 0 };
            }
            profitsMap[item.id].profit += totalProfit;
            profitsMap[item.id].quantity += item.quantity;

            if (item.category) {
                categorySales[item.category] = (categorySales[item.category] || 0) + item.quantity;
            }
        });
    });

    const sortedProfits = Object.values(profitsMap)
        .sort((a, b) => b.profit - a.profit)
        .slice(0, 5);

    const topCat = Object.entries(categorySales)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'Variada';

    // Chart Data logic: Ahora incluimos TODOS los pedidos para que el usuario vea actividad inmediata
    const historyMap: Record<string, { total: number, timestamp: number }> = {};

    orders.forEach(o => {
        const d = new Date(o.date);
        let key = '';
        let sortKey = d.getTime();

        if (reportPeriod === 'daily') {
            key = d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        } else if (reportPeriod === 'monthly') {
            key = d.toLocaleDateString('es-ES', { month: 'long' });
        } else {
            key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        }

        if (!historyMap[key]) {
            historyMap[key] = { total: 0, timestamp: sortKey };
        }
        historyMap[key].total += o.total;
    });

    // Convertimos a array y ordenamos por timestamp para que el gráfico sea cronológico
    const cData = Object.entries(historyMap)
        .map(([name, data]) => ({ name, ventas: data.total, timestamp: data.timestamp }))
        .sort((a, b) => a.timestamp - b.timestamp)
        .map(({ name, ventas }) => ({ name, ventas }));

    return { 
        chartData: cData.slice(-12), // Mostramos los últimos 12 periodos
        profitableProducts: sortedProfits,
        topCategory: topCat
    };
  }, [orders, reportPeriod]);

  // --- LÓGICA PRODUCTOS ---
  const resetProductForm = () => {
    setEditingId(null);
    setProdName('');
    setProdPrice('');
    setProdCostPrice('');
    setProdUnitsPerBox('');
    setProdBoxPrice('');
    setProdDesc('');
    setProdCat(categories[0]?.name || '');
    setProdImage('');
    setProdBarcode('');
    setProdExpiry('');
    setProdSupplier('');
  };

  const handleEditClick = (p: Product) => {
    setEditingId(p.id);
    setProdName(p.name);
    setProdPrice(p.price.toString());
    setProdCostPrice(p.costPrice?.toString() || '');
    setProdUnitsPerBox(p.unitsPerBox?.toString() || '');
    setProdBoxPrice(p.boxPrice?.toString() || '');
    setProdDesc(p.description);
    setProdCat(p.category);
    setProdImage(p.image);
    setProdBarcode(p.barcode || '');
    setProdExpiry(p.expiryDate || '');
    setProdSupplier(p.supplierId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const productData: Product = {
        id: editingId || `prod_${Date.now()}`,
        name: prodName,
        description: prodDesc,
        price: parseFloat(prodPrice),
        costPrice: prodCostPrice ? parseFloat(prodCostPrice) : undefined,
        unitsPerBox: prodUnitsPerBox ? parseInt(prodUnitsPerBox) : undefined,
        boxPrice: prodBoxPrice ? parseFloat(prodBoxPrice) : undefined,
        category: prodCat || categories[0]?.name || 'Medicamentos',
        stock: editingId ? products.find(p => p.id === editingId)?.stock || 0 : 0,
        image: prodImage || "https://via.placeholder.com/300",
        barcode: prodBarcode,
        expiryDate: prodExpiry,
        supplierId: prodSupplier
    };

    try {
        if (editingId) {
            await onEditProduct(productData);
        } else {
            await onAddProduct(productData);
        }
        resetProductForm();
    } catch (err) {
        alert("Error al guardar producto");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleGenerateDescription = async () => {
    if (!prodName) return alert("Ingresa el nombre del producto primero.");
    setIsGenerating(true);
    const desc = await generateProductDescription(prodName);
    setProdDesc(desc);
    setIsGenerating(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (url: string) => void) => {
    if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        try {
            const url = await uploadImageToStorage(file, `products/${Date.now()}_${file.name}`);
            setter(url);
        } catch (err) {
            alert("Error subiendo imagen");
        }
    }
  };

  // --- LÓGICA MARKETING IA ---
  const handleGenerateBlog = async (topic: string) => {
    if (!topic) return;
    setIsGenerating(true);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Escribe un artículo de blog educativo de salud sobre: "${topic}". 
            Usa formato HTML (solo p, strong, ul, li). Máximo 300 palabras. Tono profesional pero amable.`
        });
        
        const content = response.text || "No se pudo generar el contenido.";
        
        const newPost: BlogPost = {
            id: `blog_${Date.now()}`,
            title: topic.toUpperCase(),
            content: content,
            date: new Date().toISOString(),
            author: "Vitalis Admin"
        };
        
        await addBlogPostDB(newPost);
        setBlogTopic('');
        alert("¡Artículo de salud publicado con éxito!");
    } catch (e) {
        alert("Error generando blog.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleGeneratePost = async () => {
    if (!marketingProduct) return;
    const prod = products.find(p => p.id === marketingProduct);
    if (!prod) return;
    
    setIsGenerating(true);
    try {
        const post = await generateSocialPost(prod, postPlatform);
        setGeneratedPost(post);
    } catch (e) {
        alert("Error generando post.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleAddBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = bannerInputRef.current?.files?.[0];
    if (!file) return alert("Selecciona una imagen");
    
    setIsUploadingBanner(true);
    try {
        const url = await uploadImageToStorage(file, `banners/${Date.now()}_${file.name}`);
        await addBannerDB({
            id: `banner_${Date.now()}`,
            image: url,
            title: bannerTitle,
            active: true
        });
        setBannerTitle('');
        if (bannerInputRef.current) bannerInputRef.current.value = '';
        alert("Banner subido correctamente");
    } catch (e) {
        alert("Error subiendo banner");
    } finally {
        setIsUploadingBanner(false);
    }
  };

  const handleAddCoupon = async () => {
    const code = window.prompt("Ingresa el código del cupón (Ej: VITALIS20):");
    if (!code) return;
    const value = window.prompt("Ingresa el valor del descuento (número):");
    if (!value) return;
    const type = window.confirm("¿Es descuento por porcentaje? (Aceptar = %, Cancelar = Monto fijo $)") ? 'PERCENTAGE' : 'FIXED';

    await addCouponDB({
        id: `cp_${Date.now()}`,
        code: code.toUpperCase(),
        value: parseFloat(value),
        type,
        active: true
    });
    alert("Cupón creado");
  };

  // --- LÓGICA USUARIOS ---
  const handleUpdateUserRole = async (uid: string, newRole: User['role']) => {
    const userToUpdate = users.find(u => u.uid === uid);
    if (userToUpdate) {
        try {
            await saveUserDB({ ...userToUpdate, role: newRole });
            alert(`Rol de ${userToUpdate.displayName} actualizado a ${newRole}`);
        } catch (e) {
            alert("Error al actualizar rol de usuario");
        }
    }
  };

  // --- LÓGICA ÓRDENES ---
  const handleDeleteOrder = async (id: string) => {
    if (window.confirm('¿Seguro que deseas eliminar permanentemente este pedido? Esta acción no se puede deshacer.')) {
        try {
            await deleteOrderDB(id);
            alert("Pedido eliminado correctamente.");
        } catch (e) {
            alert("Error al eliminar el pedido.");
        }
    }
  };

  // --- LÓGICA POS ---
  const addToPosCart = (product: Product) => {
    if (product.stock <= 0) return alert("Producto sin stock");
    setPosCart(prev => {
        const exists = prev.find(item => item.id === product.id);
        if (exists) {
            if (exists.quantity >= product.stock) {
                alert("No hay más stock disponible");
                return prev;
            }
            return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
        }
        return [...prev, { ...product, quantity: 1, selectedUnit: 'UNIT' }];
    });
  };

  const removeFromPosCart = (id: string) => {
    setPosCart(prev => prev.filter(item => item.id !== id));
  };

  const handlePosCheckout = async () => {
    if (posCart.length === 0) return;
    const total = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const newOrder: Order = {
        id: `POS-${Date.now()}`,
        customerName: 'Venta Local (POS)',
        customerPhone: 'N/A',
        customerAddress: 'Venta en mostrador',
        items: posCart,
        subtotal: total,
        deliveryFee: 0,
        total: total,
        paymentMethod: posPaymentMethod,
        status: 'DELIVERED',
        source: 'POS',
        date: new Date().toISOString()
    };

    try {
        await addOrderDB(newOrder);
        for (const item of posCart) {
            const original = products.find(p => p.id === item.id);
            if (original) {
                await updateStockDB(item.id, original.stock - item.quantity);
            }
        }
        setPosCart([]);
        setPosCashReceived('');
        alert("¡Venta procesada con éxito!");
    } catch (e) {
        alert("Error al procesar venta");
    }
  };

  const handleBarcodeScan = (code: string) => {
      if (activeTab === 'products') {
          setProdBarcode(code);
          setShowPosScanner(false);
          return;
      }
      const found = products.find(p => p.barcode === code);
      if (found) {
          addToPosCart(found);
          setPosSearch('');
          setShowPosScanner(false);
      } else {
          alert(`Producto con código ${code} no encontrado.`);
      }
  };

  const handlePrintClosure = () => {
    const today = new Date();
    const todayOrders = orders.filter(o => o.status === 'DELIVERED' && new Date(o.date).toDateString() === today.toDateString());
    const cashTotal = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((a, b) => a + b.total, 0);
    const transTotal = todayOrders.filter(o => o.paymentMethod === 'TRANSFER').reduce((a, b) => a + b.total, 0);
    const total = cashTotal + transTotal;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Corte de Caja</title>
          <style>
            @page { margin: 0; }
            body { font-family: 'Courier New', Courier, monospace; width: 58mm; padding: 5mm; margin: 0; font-size: 12px; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 5px 0; }
            .row { display: flex; justify-content: space-between; margin: 2px 0; }
            .header { font-size: 14px; margin-bottom: 5px; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="text-center header bold">FARMACIA VITALIS</div>
          <div class="text-center bold">CORTE DE CAJA</div>
          <div class="text-center">${today.toLocaleDateString()} ${today.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
          <div class="divider"></div>
          <div class="row"><span>Pedidos:</span><span>${todayOrders.length}</span></div>
          <div class="divider"></div>
          <div class="row"><span>EFECTIVO:</span><span>$${cashTotal.toFixed(2)}</span></div>
          <div class="row"><span>TRANSFER:</span><span>$${transTotal.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row bold"><span>TOTAL VENTAS:</span><span>$${total.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="text-center" style="margin-top: 20px;">Fin de reporte</div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((acc, curr) => acc + curr.total, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalRevenue - totalExpenses;

  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const pendingOrdersCount = pendingOrders.length;
  
  const lowStockProducts = products.filter(p => p.stock <= 5);
  const lowStockCount = lowStockProducts.length;

  const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const todayOrders_closure = orders.filter(o => o.status === 'DELIVERED' && new Date(o.date).toDateString() === new Date().toDateString());
  const todayCash_closure = todayOrders_closure.filter(o => o.paymentMethod === 'CASH').reduce((a,b)=>a+b.total, 0);
  const todayTrans_closure = todayOrders_closure.filter(o => o.paymentMethod === 'TRANSFER').reduce((a,b)=>a+b.total, 0);
  const todayTotal_closure = todayCash_closure + todayTrans_closure;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} onLogout={onLogout} isAdmin={currentUserRole === 'ADMIN'} isMobileOpen={isSidebarOpen} setIsMobileOpen={setIsSidebarOpen} />
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0 z-30 shadow-sm">
             <div className="flex items-center gap-4">
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"><Menu size={24}/></button>
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-xl hidden sm:block"><Layout className="text-white" size={20}/></div>
                    <div>
                        <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">Vitalis <span className="text-teal-600">Admin</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Panel de Control v2.5</p>
                    </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3 md:gap-5 relative" ref={notificationRef}>
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-xl transition-all group ${showNotifications ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}
                 >
                    <Bell size={22} />
                    {(pendingOrdersCount > 0 || lowStockCount > 0) && (
                        <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                 </button>

                 {/* DROPDOWN DE NOTIFICACIONES */}
                 {showNotifications && (
                     <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                         <div className="p-4 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
                             <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Notificaciones</h3>
                             <span className="bg-teal-600 text-white text-[9px] px-1.5 py-0.5 rounded-full font-black">
                                 {pendingOrdersCount + lowStockCount}
                             </span>
                         </div>
                         <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                             {pendingOrdersCount === 0 && lowStockCount === 0 ? (
                                 <div className="p-10 text-center text-slate-300">
                                     <Bell size={32} className="mx-auto mb-2 opacity-20" />
                                     <p className="text-[10px] font-bold uppercase">Sin alertas nuevas</p>
                                 </div>
                             ) : (
                                 <div className="divide-y divide-slate-50">
                                     {/* Sección Pedidos */}
                                     {pendingOrders.map(order => (
                                         <div 
                                            key={order.id} 
                                            onClick={() => { setActiveTab('orders'); setShowNotifications(false); }}
                                            className="p-4 hover:bg-teal-50/30 cursor-pointer transition-colors flex gap-3"
                                         >
                                             <div className="h-8 w-8 bg-orange-100 rounded-lg flex items-center justify-center text-orange-600 shrink-0">
                                                 <ShoppingBag size={16}/>
                                             </div>
                                             <div className="min-w-0">
                                                 <p className="text-[11px] font-black text-slate-800 leading-tight">Nuevo pedido de {order.customerName}</p>
                                                 <p className="text-[10px] text-slate-400 font-bold mt-0.5">Monto: ${order.total.toFixed(2)}</p>
                                             </div>
                                         </div>
                                     ))}
                                     {/* Sección Stock */}
                                     {lowStockProducts.map(p => (
                                         <div 
                                            key={p.id} 
                                            onClick={() => { setActiveTab('stock_quick'); setShowNotifications(false); }}
                                            className="p-4 hover:bg-red-50/30 cursor-pointer transition-colors flex gap-3"
                                         >
                                             <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center text-red-600 shrink-0">
                                                 <AlertTriangle size={16}/>
                                             </div>
                                             <div className="min-w-0">
                                                 <p className="text-[11px] font-black text-slate-800 leading-tight uppercase truncate">{p.name}</p>
                                                 <p className="text-[10px] text-red-500 font-black mt-0.5">Stock crítico: {p.stock} unid.</p>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                         {(pendingOrdersCount > 0 || lowStockCount > 0) && (
                             <div className="p-2 border-t border-slate-50">
                                 <button 
                                    onClick={() => { setActiveTab('dashboard'); setShowNotifications(false); }}
                                    className="w-full py-2 text-[10px] font-black text-teal-600 hover:bg-teal-50 rounded-lg transition flex items-center justify-center gap-1 uppercase"
                                 >
                                     Ver detalles en Dashboard <ArrowRight size={12}/>
                                 </button>
                             </div>
                         )}
                     </div>
                 )}

                 <button onClick={() => { if(window.confirm('¿Deseas cerrar sesión administrativa?')) onLogout(); }} className="group relative">
                    <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white group-hover:bg-teal-600 transition-colors">{currentUserRole?.charAt(0) || 'A'}</div>
                 </button>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className="max-w-[1500px] mx-auto p-4 md:p-8 lg:p-10 pb-32 md:pb-10 space-y-8 h-full">
                {activeTab === 'dashboard' && <AdminDashboard 
                    orders={orders} 
                    products={products} 
                    expenses={expenses} 
                    reportPeriod={reportPeriod} 
                    setReportPeriod={setReportPeriod} 
                    chartData={chartData} 
                    netProfit={netProfit} 
                    totalRevenue={totalRevenue} 
                    profitableProducts={profitableProducts} 
                    topCategory={topCategory}
                />}
                {activeTab === 'pos' && <AdminPOS products={products} posCart={posCart} posSearch={posSearch} setPosSearch={setPosSearch} posCashReceived={posCashReceived} setPosCashReceived={setPosCashReceived} posPaymentMethod={posPaymentMethod} setPosPaymentMethod={setPosPaymentMethod} addToPosCart={addToPosCart} removeFromPosCart={removeFromPosCart} handlePosCheckout={handlePosCheckout} setShowScanner={setShowPosScanner} setShowCashClosure={setShowCashClosure} />}
                {activeTab === 'orders' && <AdminOrders orders={orders} onUpdateStatus={onUpdateOrderStatus} onDeleteOrder={handleDeleteOrder} />}
                {activeTab === 'products' && <AdminProductManagement products={products} categories={categories} suppliers={suppliers} editingId={editingId} prodName={prodName} setProdName={setProdName} prodPrice={prodPrice} setProdPrice={setProdPrice} prodCostPrice={prodCostPrice} setProdCostPrice={setProdCostPrice} prodUnitsPerBox={prodUnitsPerBox} setProdUnitsPerBox={setProdUnitsPerBox} prodBoxPrice={prodBoxPrice} setProdBoxPrice={setProdBoxPrice} prodDesc={prodDesc} setProdDesc={setProdDesc} prodCat={prodCat} setProdCat={setProdCat} prodImage={prodImage} setProdImage={setProdImage} prodBarcode={prodBarcode} setProdBarcode={setProdBarcode} prodExpiry={prodExpiry} setProdExpiry={setProdExpiry} prodSupplier={prodSupplier} setProdSupplier={setProdSupplier} handleProductSubmit={handleProductSubmit} handleGenerateDescription={handleGenerateDescription} handleImageUpload={(e) => handleImageUpload(e, setProdImage)} setShowProductScanner={setShowPosScanner} handleEditClick={handleEditClick} onDeleteProduct={onDeleteProduct} onUpdateStock={onUpdateStock} resetProductForm={resetProductForm} isGenerating={isGenerating} isSubmitting={isSubmitting} fileInputRef={productInputRef} />}
                {activeTab === 'stock_quick' && <AdminStockQuick products={products} onUpdateStock={onUpdateStock} />}
                {activeTab === 'marketing' && <AdminMarketing products={products} banners={banners} coupons={coupons} blogTopic={blogTopic} setBlogTopic={setBlogTopic} handleGenerateBlog={() => handleGenerateBlog(blogTopic)} isGenerating={isGenerating} marketingProduct={marketingProduct} setMarketingProduct={setMarketingProduct} postPlatform={postPlatform} setPostPlatform={setPostPlatform} generatedPost={generatedPost} handleGeneratePost={handleGeneratePost} bannerTitle={bannerTitle} setBannerTitle={setBannerTitle} bannerInputRef={bannerInputRef} handleAddBanner={handleAddBanner} onDeleteBanner={deleteBannerDB} isUploadingBanner={isUploadingBanner} onAddCoupon={handleAddCoupon} onDeleteCoupon={deleteCouponDB} />}
                {activeTab === 'categories' && <AdminSimpleTable title="Categorías" data={categories} onAdd={(name) => onAddCategory({id: '', name, image: ''})} onDelete={onDeleteCategory} />}
                {activeTab === 'suppliers' && <AdminSuppliers suppliers={suppliers} onAdd={addSupplierDB} onDelete={deleteSupplierDB} />}
                {activeTab === 'demand' && <AdminDemand logs={searchLogs} />}
                {activeTab === 'users' && <AdminUsers users={users} onUpdateRole={handleUpdateUserRole} />}
                {activeTab === 'expenses' && <AdminExpenses expenses={expenses} onAdd={addExpenseDB} />}
                {activeTab === 'subscriptions' && <AdminSubscriptions subscriptions={subscriptions} onDelete={deleteSubscriptionDB} />}
                {activeTab === 'bookings' && <AdminBookings bookings={bookings} onUpdateStatus={updateBookingStatusDB} />}
                {activeTab === 'stock_alerts' && <AdminStockAlerts alerts={stockAlerts} products={products} onDelete={deleteStockAlertDB} />}
              </div>
          </div>
      </main>
      {showPosScanner && <BarcodeScanner onScan={handleBarcodeScan} onClose={() => setShowPosScanner(false)} />}
      {showCashClosure && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                  <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                      <h3 className="text-sm font-bold flex items-center gap-2"><Calculator size={18}/> Corte de Caja</h3>
                      <button onClick={() => setShowCashClosure(false)} className="hover:bg-white/10 p-1.5 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="text-center">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Fecha</p>
                          <p className="text-xl font-black text-slate-800">{todayStr}</p>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                          <div className="flex justify-between items-center"><span className="text-sm font-bold text-gray-500">Pedidos:</span><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-xs font-black">{todayOrders_closure.length}</span></div>
                          <div className="flex justify-between items-center text-sm font-bold"><span className="text-green-600">Ventas Efectivo:</span><span className="text-green-600">+ ${todayCash_closure.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center text-sm font-bold"><span className="text-blue-600">Ventas Transf.:</span><span className="text-blue-600">+ ${todayTrans_closure.toFixed(2)}</span></div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center"><span className="text-base font-black text-slate-900">TOTAL:</span><span className="text-xl font-black text-teal-600">${todayTotal_closure.toFixed(2)}</span></div>
                      <button onClick={handlePrintClosure} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition flex items-center justify-center gap-2 shadow-xl active:scale-95"><Printer size={18}/> Imprimir Reporte</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
