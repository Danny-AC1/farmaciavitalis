import { useState, useMemo } from 'react';
import { 
    Product, Order, Category, User, Subscription 
} from '../types';
import { 
    addSupplierDB, addCouponDB, addExpenseDB, updateBookingStatusDB, 
    saveUserDB, addOrderDB, updateStockDB, uploadImageToStorage,
    addBannerDB, addBlogPostDB, updateSubscriptionDB
} from '../services/db.ts';
import { generateSocialPost } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";

// Importación de los nuevos sub-hooks divididos
import { useAdminData } from './useAdminData.ts';
import { useAdminProductForm } from './useAdminProductForm.ts';
import { useAdminPOS } from './useAdminPOS.ts';

export const useAdminPanelState = (
    products: Product[], 
    categories: Category[], 
    orders: Order[],
    onAddProduct: (p: Product) => Promise<any>,
    onEditProduct: (p: Product) => Promise<void>,
    onDeleteProduct: (id: string) => Promise<void>,
    onUpdateStock: (id: string, newStock: number) => Promise<void>,
    onAddCategory: (c: Category) => Promise<any>,
    onUpdateOrderStatus: (id: string, status: 'DELIVERED', order: Order) => Promise<void>
) => {
    // 1. Estados de Navegación y UI General
    const [activeTab, setActiveTab] = useState<string>('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
    const [showNotifications, setShowNotifications] = useState(false);

    // 2. Cargar sub-hooks especializados (Aquí se inyecta la lógica dividida)
    const data = useAdminData();
    const productForm = useAdminProductForm(products, categories, onAddProduct, onEditProduct);
    const pos = useAdminPOS(products);

    // 3. Estados de Marketing (Mantenidos aquí por simplicidad)
    const [blogTopic, setBlogTopic] = useState('');
    const [marketingProduct, setMarketingProduct] = useState('');
    const [postPlatform, setPostPlatform] = useState<'INSTAGRAM' | 'WHATSAPP'>('INSTAGRAM');
    const [generatedPost, setGeneratedPost] = useState('');
    const [bannerTitle, setBannerTitle] = useState('');
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    // 4. Cálculos Financieros (El "Cerebro" del Dashboard)
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
            .map(([name, d]) => ({ name, ventas: d.total, timestamp: d.timestamp }))
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(({ name, ventas }) => ({ name, ventas }));

        return { chartData: cData.slice(-12), profitableProducts: sortedProfits, topCategory: topCat, totalRevenue: totalRev, totalGrossProfit: totalGP };
    }, [orders, reportPeriod]);

    const netProfit = totalGrossProfit - data.expenses.reduce((a, b) => a + b.amount, 0);
    const todayOrders = orders.filter(o => o.status === 'DELIVERED' && new Date(o.date).toDateString() === new Date().toDateString());
    const todayCash = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((a, b) => a + b.total, 0);
    const todayTrans = todayOrders.filter(o => o.paymentMethod === 'TRANSFER').reduce((a, b) => a + b.total, 0);

    // 5. Manejadores de Marketing e IA
    const handleGenerateBlog = async (topic: string) => {
        productForm.setIsUploadingImage(true); 
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: `Articulo de salud: "${topic}". HTML.` });
            await addBlogPostDB({ id: '', title: topic.toUpperCase(), content: response.text || "", date: new Date().toISOString(), author: "Vitalis Admin" });
            setBlogTopic(''); alert("¡Publicado!");
        } finally { productForm.setIsUploadingImage(false); }
    };

    const handleGeneratePost = async () => {
        if (!marketingProduct) return alert("Selecciona producto");
        const p = products.find(x => x.id === marketingProduct);
        if (!p) return;
        productForm.setIsUploadingImage(true);
        try {
            const res = await generateSocialPost(p, postPlatform);
            setGeneratedPost(res);
        } finally { productForm.setIsUploadingImage(false); }
    };

    const handleAddBanner = async (file: File) => {
        setIsUploadingBanner(true);
        try {
            const url = await uploadImageToStorage(file, `banners/${Date.now()}`);
            await addBannerDB({ id: '', image: url, title: bannerTitle, active: true });
            setBannerTitle('');
        } finally { setIsUploadingBanner(false); }
    };

    // 6. Integración de Servicios y Suscripciones
    const handleProcessSubscription = async (sub: Subscription) => {
        const product = products.find(p => p.id === sub.productId);
        if (!product || product.stock <= 0) return alert("Producto no disponible o sin stock.");
        if (!confirm(`¿Generar pedido de "${sub.productName}" para ${sub.userId}?`)) return;

        try {
            await addOrderDB({
                id: `SUB-${Date.now()}`, customerName: sub.userId, customerPhone: 'S/N', customerAddress: 'Machalilla (Sub)',
                items: [{ ...product, quantity: 1, selectedUnit: 'UNIT' }], subtotal: product.price, deliveryFee: 0,
                total: product.price, paymentMethod: 'CASH', status: 'PENDING', source: 'ONLINE', date: new Date().toISOString()
            });
            const nextDate = new Date(new Date(sub.nextDelivery).getTime() + sub.frequencyDays * 86400000);
            await updateSubscriptionDB(sub.id, { nextDelivery: nextDate.toISOString() });
            await updateStockDB(product.id, product.stock - 1);
            alert("Pedido generado.");
        } catch (e) { alert("Error al procesar."); }
    };

    return {
        // UI
        activeTab, setActiveTab, isSidebarOpen, setIsSidebarOpen, reportPeriod, setReportPeriod, showNotifications, setShowNotifications,
        // Datos Firebase & Eliminaciones (vienen de useAdminData)
        ...data,
        // Formulario de Productos (vienen de useAdminProductForm)
        ...productForm,
        // Terminal POS (vienen de useAdminPOS)
        ...pos,
        // Marketing & Banners
        blogTopic, setBlogTopic, marketingProduct, setMarketingProduct, postPlatform, setPostPlatform,
        generatedPost, bannerTitle, setBannerTitle, isUploadingBanner,
        // Finanzas
        chartData, profitableProducts, topCategory, totalRevenue, netProfit, todayCash, todayTrans,
        // Handlers Directos y Redireccionamientos
        handleAddBanner, 
        handleAddCoupon: (c: string, v: number) => addCouponDB({ id: '', code: c.toUpperCase(), value: v, type: 'PERCENTAGE', active: true }),
        handleAddSupplier: addSupplierDB, 
        handleAddExpense: addExpenseDB,
        handleUpdateUserRole: async (uid: string, role: User['role']) => { const u = data.users.find(x => x.uid === uid); if (u) await saveUserDB({ ...u, role }); },
        handleUpdateUser: saveUserDB, 
        handleUpdateBookingStatus: updateBookingStatusDB, 
        handleGenerateBlog, 
        handleGeneratePost, 
        handleProcessSubscription,
        handleProductDelete: (id: string) => confirm("¿Eliminar producto?") && onDeleteProduct(id),
        handleStockUpdate: onUpdateStock, 
        handleCategoryAdd: (n: string) => onAddCategory({ id: '', name: n, image: '' }),
        handleOrderStatusUpdate: onUpdateOrderStatus
    };
};