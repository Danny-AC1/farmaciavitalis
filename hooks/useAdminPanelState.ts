
import { useState, useMemo } from 'react';
import { 
    Product, Order, Category, User, Subscription, CashClosure 
} from '../types';
import { 
    updateBookingStatusDB, updateSubscriptionDB
} from '../services/db.health';
import { saveUserDB } from '../services/db.users';
import { addOrderDB } from '../services/db.orders';
import { updateStockDB } from '../services/db.products';
import { uploadImageToStorage } from '../services/db.utils';
import { 
    addSupplierDB, addExpenseDB, updateExpenseDB,
    saveCashClosureDB, saveMonthlyFinanceDB
} from '../services/db.admin';
import { addCouponDB, addBannerDB, addBlogPostDB } from '../services/db.marketing';
import { generateSocialPost } from '../services/gemini';
import { getAiClient } from '../services/gemini.client';

// Importación de los nuevos sub-hooks divididos
import { useAdminData } from './useAdminData';
import { useAdminProductForm } from './useAdminProductForm';
import { useAdminPOS } from './useAdminPOS';

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
    const { setIsGenerating } = productForm;
    const pos = useAdminPOS(products);

    // 3. Estados de Marketing (Mantenidos aquí por simplicidad)
    const [blogTopic, setBlogTopic] = useState('');
    const [marketingProduct, setMarketingProduct] = useState('');
    const [postPlatform, setPostPlatform] = useState<'INSTAGRAM' | 'WHATSAPP'>('INSTAGRAM');
    const [generatedPost, setGeneratedPost] = useState('');
    const [bannerTitle, setBannerTitle] = useState('');
    const [isUploadingBanner, setIsUploadingBanner] = useState(false);

    // 4. Cálculos Financieros (El "Cerebro" del Dashboard)
    const { chartData, profitableProducts, topCategory, totalRevenue, monthlyStats } = useMemo(() => {
        const now = new Date();
        const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');
        
        let totalRev = 0;
        let totalGP = 0;
        
        // Estadísticas del mes actual para el "Reset" solicitado
        let currentMonthRev = 0;
        let currentMonthGP = 0;
        let currentMonthOrdersCount = 0;

        const profitsMap: Record<string, { name: string, profit: number, quantity: number }> = {};
        const categorySales: Record<string, number> = {};
        
        deliveredOrders.forEach(order => {
            const orderDate = new Date(order.date);
            const orderMonthKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
            const isCurrentMonth = orderMonthKey === currentMonthKey;

            totalRev += order.total;
            if (isCurrentMonth) {
                currentMonthRev += order.total;
                currentMonthOrdersCount++;
            }

            order.items.forEach(item => {
                const cost = item.costPrice || 0;
                const totalProfit = (item.price - cost) * item.quantity;
                totalGP += totalProfit;
                
                if (isCurrentMonth) {
                    currentMonthGP += totalProfit;
                }

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

        return { 
            chartData: cData.slice(-12), 
            profitableProducts: sortedProfits, 
            topCategory: topCat, 
            totalRevenue: totalRev, 
            monthlyStats: {
                currentMonthRev,
                currentMonthGP,
                currentMonthOrdersCount,
                monthKey: currentMonthKey
            }
        };
    }, [orders, reportPeriod]);

    const currentMonthExpensesList = data.expenses.filter(e => {
        const d = new Date(e.date);
        const mKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        return mKey === monthlyStats.monthKey;
    });

    const currentMonthExpenses = currentMonthExpensesList.reduce((a, b) => a + b.amount, 0);

    const expenseBreakdown = currentMonthExpensesList.reduce((acc, e) => {
        acc[e.category] = (acc[e.category] || 0) + e.amount;
        return acc;
    }, {} as Record<string, number>);

    const netProfit = monthlyStats.currentMonthGP - currentMonthExpenses;
    const todayOrders = orders.filter(o => o.status === 'DELIVERED' && new Date(o.date).toDateString() === new Date().toDateString());
    const todayCash = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((a, b) => a + b.total, 0);
    const todayTrans = todayOrders.filter(o => o.paymentMethod === 'TRANSFER').reduce((a, b) => a + b.total, 0);

    // 5. Manejadores de Marketing e IA
    const handleRegisterMonthlyFinance = async () => {
        if (!confirm(`¿Registrar cierre financiero del mes ${monthlyStats.monthKey}?`)) return;
        try {
            await saveMonthlyFinanceDB({
                id: '',
                month: monthlyStats.monthKey,
                grossIncome: monthlyStats.currentMonthRev,
                netProfit: netProfit,
                totalOrders: monthlyStats.currentMonthOrdersCount,
                totalExpenses: currentMonthExpenses,
                recordedAt: new Date().toISOString()
            });
            alert("Finanzas mensuales registradas con éxito.");
        } catch (e) {
            alert("Error al registrar finanzas.");
        }
    };

    const handleGenerateBlog = async (topic: string) => {
        setIsGenerating(true); 
        try {
            const ai = getAiClient();
            const response = await ai.models.generateContent({ model: 'gemini-flash-latest', contents: `Articulo de salud: "${topic}". HTML.` });
            await addBlogPostDB({ id: '', title: topic.toUpperCase(), content: response.text || "", date: new Date().toISOString(), author: "Vitalis Admin" });
            setBlogTopic(''); alert("¡Publicado!");
        } catch (err: any) {
            alert(`Error al generar blog: ${err.message}`);
        } finally { setIsGenerating(false); }
    };

    const handleGeneratePost = async () => {
        if (!marketingProduct) return alert("Selecciona producto");
        const p = products.find(x => x.id === marketingProduct);
        if (!p) return;
        setIsGenerating(true);
        try {
            const res = await generateSocialPost(p, postPlatform);
            setGeneratedPost(res);
        } finally { setIsGenerating(false); }
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
        chartData, profitableProducts, topCategory, totalRevenue, netProfit, todayCash, todayTrans, expenseBreakdown,
        monthlyStats, currentMonthExpenses,
        // Handlers Directos y Redireccionamientos
        handleAddBanner, 
        handleAddCoupon: (c: string, v: number) => addCouponDB({ id: '', code: c.toUpperCase(), value: v, type: 'PERCENTAGE', active: true }),
        handleAddSupplier: addSupplierDB, 
        handleAddExpense: addExpenseDB,
        handleUpdateExpense: updateExpenseDB,
        handleUpdateUserRole: async (uid: string, role: User['role']) => { const u = data.users.find(x => x.uid === uid); if (u) await saveUserDB({ ...u, role }); },
        handleUpdateUser: saveUserDB, 
        handleUpdateBookingStatus: updateBookingStatusDB, 
        handleRegisterMonthlyFinance,
        handleSaveCashClosure: (closure: CashClosure) => saveCashClosureDB(closure),
        handleGenerateBlog, 
        handleGeneratePost, 
        handleProcessSubscription,
        handleProductDelete: (id: string) => confirm("¿Eliminar producto?") && onDeleteProduct(id),
        handleStockUpdate: onUpdateStock, 
        handleCategoryAdd: (n: string) => onAddCategory({ id: '', name: n, image: '' }),
        handleOrderStatusUpdate: onUpdateOrderStatus
    };
};
