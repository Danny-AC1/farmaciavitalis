
import { useState, useEffect, useMemo } from 'react';
import { 
    Product, Order, Category, User, Supplier, SearchLog, Banner, 
    Expense, Subscription, Coupon, ServiceBooking, StockAlert, 
    CartItem
} from '../types';
import { 
    streamUsers, streamSuppliers, streamSearchLogs, streamBanners, 
    streamExpenses, streamCoupons, streamBookings, streamStockAlerts, 
    streamSubscriptions, addSupplierDB, deleteSupplierDB, addCouponDB, 
    deleteCouponDB, addExpenseDB, updateBookingStatusDB, saveUserDB, 
    deleteBannerDB, addOrderDB, updateStockDB, uploadImageToStorage,
    addBannerDB, addBlogPostDB, deleteSubscriptionDB, deleteStockAlertDB, deleteOrderDB,
    deleteBlogPostDB, deleteUserDB
} from '../services/db';
import { generateProductDescription, generateSocialPost } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";

export const useAdminPanelState = (
    products: Product[], 
    categories: Category[], 
    orders: Order[],
    onAddProduct: (p: Product) => Promise<void>,
    onEditProduct: (p: Product) => Promise<void>,
    onDeleteProduct: (id: string) => Promise<void>,
    onUpdateStock: (id: string, newStock: number) => Promise<void>,
    onAddCategory: (c: Category) => Promise<void>,
    onUpdateOrderStatus: (id: string, status: 'DELIVERED', order: Order) => Promise<void>
) => {
    // ESTADOS DE NAVEGACIÓN Y UI
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
    const [prodPublicBoxPrice, setProdPublicBoxPrice] = useState('');
    const [prodDesc, setProdDesc] = useState('');
    const [prodCat, setProdCat] = useState('');
    const [prodImage, setProdImage] = useState('');
    const [prodBarcode, setProdBarcode] = useState('');
    const [prodExpiry, setProdExpiry] = useState('');
    const [prodSupplier, setProdSupplier] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // ESTADOS DE MARKETING E IA
    const [blogTopic, setBlogTopic] = useState('');
    const [marketingProduct, setMarketingProduct] = useState('');
    const [postPlatform, setPostPlatform] = useState<'INSTAGRAM' | 'WHATSAPP'>('INSTAGRAM');
    const [generatedPost, setGeneratedPost] = useState('');
    const [bannerTitle, setBannerTitle] = useState('');
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    // ESTADO DEL POS (PUNTO DE VENTA)
    const [posCart, setPosCart] = useState<CartItem[]>([]);
    const [posSearch, setPosSearch] = useState('');
    const [posCashReceived, setPosCashReceived] = useState('');
    const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
    const [showPosScanner, setShowPosScanner] = useState(false);
    const [showCashClosure, setShowCashClosure] = useState(false);

    // ESTADOS DE DATOS EN TIEMPO REAL (FIREBASE)
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

    // --- CÁLCULOS FINANCIEROS ---
    const { chartData, profitableProducts, topCategory, totalRevenue, totalGrossProfit } = useMemo(() => {
        const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
        let totalRev = 0;
        let totalGP = 0;
        const profitsMap: Record<string, { name: string, profit: number, quantity: number }> = {};
        const categorySales: Record<string, number> = {};
        
        deliveredOrders.forEach(order => {
            totalRev += order.total;
            order.items.forEach(item => {
                const cost = item.costPrice || 0;
                const totalProfit = (item.price - cost) * item.quantity;
                totalGP += totalProfit;
                
                if (!profitsMap[item.id]) profitsMap[item.id] = { name: item.name, profit: 0, quantity: 0 };
                profitsMap[item.id].profit += totalProfit;
                profitsMap[item.id].quantity += item.quantity;

                if (item.category) categorySales[item.category] = (categorySales[item.category] || 0) + item.quantity;
            });
        });

        const sortedProfits = Object.values(profitsMap).sort((a, b) => b.profit - a.profit).slice(0, 5);
        const topCat = Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Variada';

        const historyMap: Record<string, { total: number, timestamp: number }> = {};
        orders.forEach(o => {
            const d = new Date(o.date);
            let key = reportPeriod === 'daily' ? d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }) :
                      reportPeriod === 'monthly' ? d.toLocaleDateString('es-ES', { month: 'long' }) :
                      d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });

            if (!historyMap[key]) historyMap[key] = { total: 0, timestamp: d.getTime() };
            historyMap[key].total += o.total;
        });

        const cData = Object.entries(historyMap)
            .map(([name, data]) => ({ name, ventas: data.total, timestamp: data.timestamp }))
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(({ name, ventas }) => ({ name, ventas }));

        return { chartData: cData.slice(-12), profitableProducts: sortedProfits, topCategory: topCat, totalRevenue: totalRev, totalGrossProfit: totalGP };
    }, [orders, reportPeriod]);

    const netProfit = totalGrossProfit - expenses.reduce((a, b) => a + b.amount, 0);
    const todayOrders = orders.filter(o => o.status === 'DELIVERED' && new Date(o.date).toDateString() === new Date().toDateString());
    const todayCash = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((a, b) => a + b.total, 0);
    const todayTrans = todayOrders.filter(o => o.paymentMethod === 'TRANSFER').reduce((a, b) => a + b.total, 0);

    // --- MANEJADORES QUE UTILIZAN LOS PARÁMETROS DEL HOOK ---
    const handleProductDelete = async (id: string) => {
        if (confirm("¿Seguro que deseas eliminar este producto?")) {
            await onDeleteProduct(id);
        }
    };

    const handleStockUpdate = async (id: string, newStock: number) => {
        await onUpdateStock(id, newStock);
    };

    const handleCategoryAdd = async (name: string) => {
        await onAddCategory({ id: '', name, image: '' });
    };

    const handleOrderStatusUpdate = async (id: string, status: 'DELIVERED', order: Order) => {
        await onUpdateOrderStatus(id, status, order);
    };

    // --- MANEJADORES DE DB DIRECTOS ---
    const handleDeleteOrder = async (id: string) => { if(confirm("¿Borrar pedido?")) await deleteOrderDB(id); };
    const handleDeleteBanner = async (id: string) => { if(confirm("¿Borrar banner?")) await deleteBannerDB(id); };
    const handleDeleteCoupon = async (id: string) => { if(confirm("¿Borrar cupón?")) await deleteCouponDB(id); };
    const handleDeleteSupplier = async (id: string) => { if(confirm("¿Borrar proveedor?")) await deleteSupplierDB(id); };
    const handleDeleteSubscription = async (id: string) => { if(confirm("¿Cancelar suscripción?")) await deleteSubscriptionDB(id); };
    const handleDeleteStockAlert = async (id: string) => { if(confirm("¿Borrar alerta?")) await deleteStockAlertDB(id); };
    const handleDeleteBlogPost = async (id: string) => { if(confirm("¿Borrar este consejo de salud?")) await deleteBlogPostDB(id); };
    const handleDeleteUser = async (uid: string) => { if(confirm("¿Borrar definitivamente a este cliente?")) await deleteUserDB(uid); };
    
    const handleAddBanner = async (file: File) => {
        setIsUploadingBanner(true);
        try {
            const url = await uploadImageToStorage(file, `banners/${Date.now()}`);
            await addBannerDB({ id: '', image: url, title: bannerTitle, active: true });
            setBannerTitle('');
        } finally { setIsUploadingBanner(false); }
    };

    const handleAddCoupon = async (code: string, value: number) => {
        await addCouponDB({ id: '', code: code.toUpperCase(), value, type: 'PERCENTAGE', active: true });
    };

    const handleAddSupplier = async (s: Supplier) => { await addSupplierDB(s); };
    const handleAddExpense = async (e: Expense) => { await addExpenseDB(e); };
    const handleUpdateUserRole = async (uid: string, role: User['role']) => {
        const u = users.find(x => x.uid === uid);
        if (u) await saveUserDB({ ...u, role });
    };
    const handleUpdateBookingStatus = async (id: string, status: ServiceBooking['status']) => {
        await updateBookingStatusDB(id, status);
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const initialStock = editingId ? (products.find(p => p.id === editingId)?.stock || 0) : (prodUnitsPerBox ? parseInt(prodUnitsPerBox) : 0);
        const productData: Product = {
            id: editingId || '',
            name: prodName, description: prodDesc, price: parseFloat(prodPrice),
            costPrice: prodCostPrice ? parseFloat(prodCostPrice) : undefined,
            unitsPerBox: prodUnitsPerBox ? parseInt(prodUnitsPerBox) : undefined,
            boxPrice: prodBoxPrice ? parseFloat(prodBoxPrice) : undefined,
            publicBoxPrice: prodPublicBoxPrice ? parseFloat(prodPublicBoxPrice) : undefined,
            category: prodCat || categories[0]?.name || 'Medicamentos',
            stock: initialStock, image: prodImage || "https://via.placeholder.com/300",
            barcode: prodBarcode, expiryDate: prodExpiry, supplierId: prodSupplier
        };
        try {
            if (editingId) await onEditProduct(productData);
            else await onAddProduct(productData);
            setEditingId(null); setProdName(''); setProdPrice(''); setProdCostPrice(''); setProdUnitsPerBox('');
            setProdBoxPrice(''); setProdPublicBoxPrice(''); setProdDesc(''); setProdImage(''); setProdBarcode('');
        } finally { setIsSubmitting(false); }
    };

    const handleGenerateDescription = async (tone: 'CLINICO' | 'PERSUASIVO' | 'CERCANO') => {
        if (!prodName) return alert("Escribe el nombre");
        setIsGenerating(true);
        try {
            const desc = await generateProductDescription(prodName, prodCat || 'Medicamentos', tone);
            setProdDesc(desc);
        } finally { setIsGenerating(false); }
    };

    const handleGenerateBlog = async (topic: string) => {
        setIsGenerating(true);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: `Articulo de salud sobre: "${topic}". Formato HTML.`
            });
            await addBlogPostDB({ id: '', title: topic.toUpperCase(), content: response.text || "", date: new Date().toISOString(), author: "Vitalis Admin" });
            setBlogTopic(''); alert("¡Publicado!");
        } finally { setIsGenerating(false); }
    };

    const handleGeneratePost = async () => {
        if (!marketingProduct) return alert("Selecciona un producto primero.");
        const p = products.find(x => x.id === marketingProduct);
        if (!p) return;
        setIsGenerating(true);
        try {
            const res = await generateSocialPost(p, postPlatform);
            setGeneratedPost(res);
        } finally { setIsGenerating(false); }
    };

    const handlePosCheckout = async (customer?: User) => {
        if (posCart.length === 0) return;

        // Calculamos el total exacto basándonos en la unidad seleccionada
        const total = posCart.reduce((sum, item) => {
            const isBox = item.selectedUnit === 'BOX';
            const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
            return sum + (price * item.quantity);
        }, 0);

        // Creamos el objeto de la orden limpiando valores undefined para evitar errores de Firebase
        const orderData: any = {
            id: `POS-${Date.now()}`,
            customerName: customer?.displayName || 'Venta Local',
            customerPhone: customer?.phone || 'N/A',
            customerAddress: customer?.cedula || 'Mostrador',
            items: posCart,
            subtotal: total,
            deliveryFee: 0,
            total: total,
            paymentMethod: posPaymentMethod,
            status: 'DELIVERED',
            source: 'POS',
            date: new Date().toISOString()
        };

        // Solo añadimos campos opcionales si existen
        if (customer?.uid) orderData.userId = customer.uid;
        if (posCashReceived && !isNaN(parseFloat(posCashReceived))) {
            orderData.cashGiven = parseFloat(posCashReceived);
        }

        try {
            await addOrderDB(orderData as Order);
            
            // Descontamos stock de forma precisa
            for (const item of posCart) {
                const orig = products.find(p => p.id === item.id);
                if (orig) {
                    const isBox = item.selectedUnit === 'BOX';
                    const unitsToSubtract = isBox ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
                    await updateStockDB(item.id, Math.max(0, orig.stock - unitsToSubtract));
                }
            }
            
            setPosCart([]);
            setPosCashReceived('');
            alert("¡Venta exitosa!");
        } catch (error: any) {
            console.error("Error en Checkout POS:", error);
            alert(`Error al procesar la venta: ${error.message || 'Error desconocido'}`);
        }
    };

    const addToPosCart = (product: Product) => {
        if (product.stock <= 0) return alert("Sin stock");
        setPosCart(prev => {
            const exists = prev.find(item => item.id === product.id);
            if (exists) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            return [...prev, { ...product, quantity: 1, selectedUnit: 'UNIT' }];
        });
    };

    return {
        activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, reportPeriod, setReportPeriod, showNotifications, setShowNotifications,
        editingId, setEditingId, prodName, setProdName, prodPrice, setProdPrice, prodCostPrice, setProdCostPrice, 
        prodUnitsPerBox, setProdUnitsPerBox, prodBoxPrice, setProdBoxPrice, prodPublicBoxPrice, setProdPublicBoxPrice,
        prodDesc, setProdDesc, prodCat, setProdCat, prodImage, setProdImage, prodBarcode, setProdBarcode, 
        prodExpiry, setProdExpiry, prodSupplier, setProdSupplier, isGenerating, isSubmitting, 
        blogTopic, setBlogTopic, marketingProduct, setMarketingProduct, postPlatform, setPostPlatform,
        generatedPost, bannerTitle, setBannerTitle, isUploadingBanner, posCart, setPosCart, 
        posSearch, setPosSearch, posCashReceived, setPosCashReceived, posPaymentMethod, setPosPaymentMethod, 
        showPosScanner, setShowPosScanner, showCashClosure, setShowCashClosure, 
        banners, expenses, coupons, suppliers, users, searchLogs, stockAlerts, subscriptions, bookings,
        chartData, profitableProducts, topCategory, totalRevenue, netProfit, todayCash, todayTrans,
        handleDeleteOrder, handleDeleteBanner, handleDeleteCoupon, handleDeleteSupplier, handleDeleteSubscription,
        handleDeleteStockAlert, handleDeleteBlogPost, handleDeleteUser, handleAddBanner, handleAddCoupon, handleAddSupplier, handleAddExpense, 
        handleUpdateUserRole, handleUpdateBookingStatus, handleProductSubmit, handleGenerateDescription,
        handleGenerateBlog, handleGeneratePost, handlePosCheckout, addToPosCart,
        handleProductDelete, handleStockUpdate, handleCategoryAdd, handleOrderStatusUpdate,
        handleEditClick: (p: Product) => {
            setEditingId(p.id); setProdName(p.name); setProdPrice(p.price.toString()); setProdCostPrice(p.costPrice?.toString() || '');
            setProdUnitsPerBox(p.unitsPerBox?.toString() || ''); setProdBoxPrice(p.boxPrice?.toString() || '');
            setProdPublicBoxPrice(p.publicBoxPrice?.toString() || ''); setProdDesc(p.description); setProdCat(p.category);
            setProdImage(p.image); setProdBarcode(p.barcode || ''); setProdExpiry(p.expiryDate || ''); setProdSupplier(p.supplierId || '');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };
};
