
import React, { useState, useEffect, useRef } from 'react';
import { Product, Order, Category, User, Supplier, SearchLog, Banner, Expense, Subscription, Coupon, ServiceBooking, StockAlert, CartItem, BlogPost } from '../types';
import { Menu, Bell, Layout, X, Calculator, Printer } from 'lucide-react';
import { 
    streamUsers, streamSuppliers, streamSearchLogs, streamBanners, 
    streamExpenses, streamCoupons, streamBookings, streamStockAlerts, streamSubscriptions,
     addSupplierDB, deleteSupplierDB, addCouponDB, deleteCouponDB, addExpenseDB,
    updateBookingStatusDB, saveUserDB, deleteBannerDB, addOrderDB, updateStockDB, uploadImageToStorage,
    addBannerDB, addBlogPostDB, deleteSubscriptionDB, deleteStockAlertDB
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

  const pendingOrdersCount = orders.filter(o => o.status === 'PENDING').length;
  const lowStockCount = products.filter(p => p.stock <= 5).length;

  const todayStr = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'numeric', year: 'numeric' });
  const todayOrders = orders.filter(o => o.status === 'DELIVERED' && new Date(o.date).toDateString() === new Date().toDateString());
  const todayCash = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((a,b)=>a+b.total, 0);
  const todayTrans = todayOrders.filter(o => o.paymentMethod === 'TRANSFER').reduce((a,b)=>a+b.total, 0);
  const todayTotal = todayCash + todayTrans;

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
             <div className="flex items-center gap-3 md:gap-5">
                 <button className="relative p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all group">
                    <Bell size={22} />
                    {(pendingOrdersCount > 0 || lowStockCount > 0) && <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                 </button>
                 <button onClick={() => { if(window.confirm('¿Deseas cerrar sesión administrativa?')) onLogout(); }} className="group relative">
                    <div className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white group-hover:bg-teal-600 transition-colors">{currentUserRole?.charAt(0) || 'A'}</div>
                 </button>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className="max-w-[1500px] mx-auto p-4 md:p-8 lg:p-10 pb-32 md:pb-10 space-y-8 h-full">
                {activeTab === 'dashboard' && <AdminDashboard orders={orders} products={products} expenses={expenses} reportPeriod={reportPeriod} setReportPeriod={setReportPeriod} chartData={[]} netProfit={netProfit} totalRevenue={totalRevenue} profitableProducts={[]} />}
                {activeTab === 'pos' && <AdminPOS products={products} posCart={posCart} posSearch={posSearch} setPosSearch={setPosSearch} posCashReceived={posCashReceived} setPosCashReceived={setPosCashReceived} posPaymentMethod={posPaymentMethod} setPosPaymentMethod={setPosPaymentMethod} addToPosCart={addToPosCart} removeFromPosCart={removeFromPosCart} handlePosCheckout={handlePosCheckout} setShowScanner={setShowPosScanner} setShowCashClosure={setShowCashClosure} />}
                {activeTab === 'orders' && <AdminOrders orders={orders} onUpdateStatus={onUpdateOrderStatus} />}
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
                          <div className="flex justify-between items-center"><span className="text-sm font-bold text-gray-500">Pedidos:</span><span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded-lg text-xs font-black">{todayOrders.length}</span></div>
                          <div className="flex justify-between items-center text-sm font-bold"><span className="text-green-600">Ventas Efectivo:</span><span className="text-green-600">+ ${todayCash.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center text-sm font-bold"><span className="text-blue-600">Ventas Transf.:</span><span className="text-blue-600">+ ${todayTrans.toFixed(2)}</span></div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center"><span className="text-base font-black text-slate-900">TOTAL:</span><span className="text-xl font-black text-teal-600">${todayTotal.toFixed(2)}</span></div>
                      <button onClick={handlePrintClosure} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black hover:bg-black transition flex items-center justify-center gap-2 shadow-xl active:scale-95"><Printer size={18}/> Imprimir Reporte</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
