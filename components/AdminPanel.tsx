import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Product, Order, Category, CartItem, User, Supplier, SearchLog, Banner, Expense, Subscription, Coupon, ServiceBooking, StockAlert } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, Trash2, Sparkles, LogOut, Edit2, X, ShoppingCart, Minus, Plus, Search, TrendingUp, Loader2, FileDown, PenTool, ScanBarcode, Share2, Copy, MessageCircle, Image as ImageIcon, Instagram, LayoutDashboard, Store, Package, ClipboardList, Grid, Users, Megaphone, Menu, Truck, Printer, Calculator, History, AlertTriangle, DollarSign, Wallet, RefreshCw, Download, Ticket, CalendarCheck, BellRing } from 'lucide-react';
import { generateProductDescription, generateSocialPost } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";
import BarcodeScanner from './BarcodeScanner';
import { 
    streamUsers, streamSuppliers, addSupplierDB, deleteSupplierDB, streamSearchLogs, addBlogPostDB, streamBanners, addBannerDB, deleteBannerDB, 
    uploadImageToStorage, addExpenseDB, streamExpenses, deleteExpenseDB, streamSubscriptions,
    streamCoupons, addCouponDB, deleteCouponDB, streamBookings, updateBookingStatusDB, streamStockAlerts, deleteStockAlertDB
} from '../services/db';

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
  onUpdateOrderStatus: (id: string, status: 'DELIVERED') => Promise<void>;
  onLogout: () => void;
  currentUserRole?: 'ADMIN' | 'CASHIER' | 'DRIVER' | 'USER'; 
}

const AdminPanel: React.FC<AdminPanelProps> = ({ 
  products, 
  categories,
  orders, 
  onAddProduct, 
  onEditProduct,
  onDeleteProduct, 
  onUpdateStock, 
  onAddCategory,
  onDeleteCategory,
  onAddOrder,
  onUpdateOrderStatus,
  onLogout,
  currentUserRole = 'ADMIN'
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'products' | 'categories' | 'inventory' | 'orders' | 'users' | 'marketing' | 'suppliers' | 'demand' | 'expenses' | 'subscriptions' | 'coupons' | 'bookings' | 'alerts'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar toggle

  // Dashboard / Reports State
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Extended Data State
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  // Forms State
  const [supplierForm, setSupplierForm] = useState({ name: '', contactName: '', phone: '', email: '' });
  const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'OTHER' });
  const [couponForm, setCouponForm] = useState({ code: '', type: 'PERCENTAGE', value: '' });
  
  // Marketing State
  const [blogTopic, setBlogTopic] = useState('');
  const [marketingProduct, setMarketingProduct] = useState('');
  const [generatedPost, setGeneratedPost] = useState('');
  const [postPlatform, setPostPlatform] = useState<'INSTAGRAM'|'WHATSAPP'>('INSTAGRAM');
  const [bannerTitle, setBannerTitle] = useState('');
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  
  // Inventory Search State
  const [inventorySearch, setInventorySearch] = useState('');

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCostPrice, setProdCostPrice] = useState(''); 
  const [prodUnitsPerBox, setProdUnitsPerBox] = useState('');
  const [prodBoxPrice, setProdBoxPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImage, setProdImage] = useState<string>('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodExpiry, setProdExpiry] = useState('');
  const [prodSupplier, setProdSupplier] = useState('');

  // Scanner State for Product Form
  const [showProductScanner, setShowProductScanner] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');

  // POS State
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCashReceived, setPosCashReceived] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [showScanner, setShowScanner] = useState(false);
  const [showCashClosure, setShowCashClosure] = useState(false);
  
  // CRM / Customer History State
  const [showCRM, setShowCRM] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [crmCustomerHistory, setCrmCustomerHistory] = useState<Order[]>([]);

  // Load Data Streams
  useEffect(() => {
      const unsubUsers = streamUsers((data) => setUsers(data));
      const unsubSuppliers = streamSuppliers((data) => setSuppliers(data));
      const unsubLogs = streamSearchLogs((data) => setSearchLogs(data));
      const unsubBanners = streamBanners((data) => setBanners(data));
      const unsubExpenses = streamExpenses((data) => setExpenses(data));
      const unsubSubs = streamSubscriptions((data) => setSubscriptions(data));
      const unsubCoupons = streamCoupons((data) => setCoupons(data));
      const unsubBookings = streamBookings((data) => setBookings(data));
      const unsubAlerts = streamStockAlerts((data) => setStockAlerts(data));

      return () => { 
          unsubUsers(); unsubSuppliers(); unsubLogs(); unsubBanners(); unsubExpenses(); unsubSubs();
          unsubCoupons(); unsubBookings(); unsubAlerts();
      };
  }, []);

  // Stats logic
  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((acc, curr) => acc + curr.total, 0);
  const totalExpenses = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  
  // Profit Calculation (Enhanced for Option 4 & 3)
  const grossProfit = orders.filter(o => o.status === 'DELIVERED').reduce((acc, order) => {
      let cost = 0;
      order.items.forEach(item => {
          const product = products.find(p => p.id === item.id);
          const unitCost = product?.costPrice || 0; 
          const units = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
          cost += unitCost * (item.quantity * units);
      });
      return acc + (order.total - cost);
  }, 0);

  // Net Profit = Gross Profit - Operating Expenses
  const netProfit = grossProfit - totalExpenses;

  // Profit per Product Analysis (Option 4)
  const profitableProducts = useMemo(() => {
      const profitMap: Record<string, {name: string, profit: number, quantity: number}> = {};
      
      orders.filter(o => o.status === 'DELIVERED').forEach(order => {
          order.items.forEach(item => {
             const product = products.find(p => p.id === item.id);
             if (product && product.costPrice) {
                 const isBox = item.selectedUnit === 'BOX';
                 const sellPrice = isBox ? (item.boxPrice || 0) : item.price;
                 const unitCost = product.costPrice;
                 const unitsSold = item.quantity * (isBox ? (item.unitsPerBox || 1) : 1);
                 
                 // Cost for this specific sale line item (simplified to unit basis)
                 const totalCost = unitCost * unitsSold;
                 const totalSale = sellPrice * item.quantity;
                 const margin = totalSale - totalCost;

                 if (!profitMap[product.id]) profitMap[product.id] = { name: product.name, profit: 0, quantity: 0 };
                 profitMap[product.id].profit += margin;
                 profitMap[product.id].quantity += item.quantity;
             }
          });
      });

      return Object.values(profitMap).sort((a,b) => b.profit - a.profit).slice(0, 5);
  }, [orders, products]);


  // Expiry Logic (Option 2)
  const expiringProducts = useMemo(() => {
      const today = new Date();
      const threeMonthsAway = new Date();
      threeMonthsAway.setMonth(today.getMonth() + 3);

      return products.filter(p => {
          if (!p.expiryDate) return false;
          const expDate = new Date(p.expiryDate);
          return expDate <= threeMonthsAway; // Already expired or expiring soon
      }).sort((a,b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());
  }, [products]);


  // Chart Data Preparation
  const chartData = useMemo(() => {
      const data: any[] = [];
      const grouped: {[key: string]: number} = {};

      orders.filter(o => o.status === 'DELIVERED').forEach(order => {
          const date = new Date(order.date);
          let key = '';
          if (reportPeriod === 'daily') key = date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
          else if (reportPeriod === 'weekly') key = date.toLocaleDateString();
          else if (reportPeriod === 'monthly') key = `Día ${date.getDate()}`;
          else key = date.toLocaleString('default', { month: 'short' });

          grouped[key] = (grouped[key] || 0) + order.total;
      });

      Object.keys(grouped).forEach(key => data.push({ name: key, ventas: grouped[key] }));
      return data;
  }, [orders, reportPeriod]);

  // DAILY CLOSURE LOGIC (Option 1 - Already Implemented)
  const getDailyStats = () => {
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today && o.status === 'DELIVERED');
    
    const cashSales = todayOrders.filter(o => o.paymentMethod === 'CASH').reduce((sum, o) => sum + o.total, 0);
    const transferSales = todayOrders.filter(o => o.paymentMethod === 'TRANSFER').reduce((sum, o) => sum + o.total, 0);
    const totalSales = cashSales + transferSales;
    const orderCount = todayOrders.length;

    return { cashSales, transferSales, totalSales, orderCount, date: new Date().toLocaleDateString() };
  };

  const printClosureReport = () => {
    const stats = getDailyStats();
    const printWindow = window.open('', '', 'width=350,height=600');
    if (!printWindow) return alert("Habilita ventanas emergentes.");

    printWindow.document.write(`
      <html>
        <head>
          <title>Cierre Caja - ${stats.date}</title>
          <style>
            body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; color: #000; }
            .header { text-align: center; border-bottom: 2px dashed #000; padding: 10px 0; margin-bottom: 10px; }
            .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
            .footer { margin-top: 20px; text-align: center; font-size: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>CORTE DE CAJA</h3>
            <p>Farmacia Vitalis</p>
            <p>Fecha: ${stats.date}</p>
          </div>
          <div class="row"><span>Pedidos Hoy:</span><span>${stats.orderCount}</span></div>
          <br/>
          <div class="row"><span>Ventas Efectivo:</span><span>$${stats.cashSales.toFixed(2)}</span></div>
          <div class="row"><span>Ventas Transf.:</span><span>$${stats.transferSales.toFixed(2)}</span></div>
          <div class="row total"><span>TOTAL INGRESO:</span><span>$${stats.totalSales.toFixed(2)}</span></div>
          <br/>
          <div class="row"><span>Efectivo en Caja:</span><span>$${stats.cashSales.toFixed(2)}</span></div>
          <div class="footer">
            <p>_______________________</p>
            <p>Firma Responsable</p>
            <p>Generado: ${new Date().toLocaleTimeString()}</p>
          </div>
          <script>window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 500); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // CRM Search Logic (Option 3)
  useEffect(() => {
      if (!crmSearch.trim()) {
          setCrmCustomerHistory([]);
          return;
      }
      const term = crmSearch.toLowerCase();
      // Filter orders by name matches
      const matches = orders.filter(o => 
          o.customerName.toLowerCase().includes(term) || 
          o.customerPhone.includes(term)
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Limit to last 5 orders for performance
      setCrmCustomerHistory(matches.slice(0, 5));
  }, [crmSearch, orders]);


  // WhatsApp Stock Alert (Option 5)
  const handleSendStockAlert = () => {
      const lowStock = products.filter(p => p.stock < 10);
      if (lowStock.length === 0) return alert("No hay productos con stock bajo.");

      const message = `🚨 *ALERTA DE STOCK - VITALIS* 🚨\n\n` +
          `Se requiere reponer los siguientes productos urgentemente:\n\n` +
          lowStock.map(p => `- ${p.name} (Quedan: ${p.stock})`).join('\n') + 
          `\n\nFecha: ${new Date().toLocaleString()}`;
      
      // Send to owner/manager (Example number)
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  // Expense Handler
  const handleExpenseSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!expenseForm.description || !expenseForm.amount) return;
      await addExpenseDB({
          id: `exp_${Date.now()}`,
          description: expenseForm.description,
          amount: parseFloat(expenseForm.amount),
          category: expenseForm.category as any,
          date: new Date().toISOString()
      });
      setExpenseForm({ description: '', amount: '', category: 'OTHER' });
  };

  const handleCouponSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!couponForm.code || !couponForm.value) return;
      await addCouponDB({
          id: `cpn_${Date.now()}`,
          code: couponForm.code.toUpperCase(),
          type: couponForm.type as any,
          value: parseFloat(couponForm.value),
          active: true
      });
      setCouponForm({ code: '', type: 'PERCENTAGE', value: '' });
  };

  const handleBookingStatus = async (id: string, status: ServiceBooking['status']) => {
      await updateBookingStatusDB(id, status);
  };


  // TICKET PRINTING LOGIC
  const printOrderTicket = (order: Order) => {
    const printWindow = window.open('', '', 'width=350,height=600');
    if (!printWindow) return alert("Habilita las ventanas emergentes para imprimir.");

    const styles = `
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 300px; margin: 0 auto; padding: 10px; color: #000; }
        .header { text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        .header h2 { margin: 0; font-size: 16px; font-weight: bold; }
        .info { font-size: 10px; margin-bottom: 5px; }
        .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
        .item-name { width: 60%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .divider { border-top: 1px dashed #000; margin: 10px 0; }
        .totals { text-align: right; }
        .total-row { display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; margin-top: 5px; }
        .footer { text-align: center; margin-top: 20px; font-size: 10px; }
      </style>
    `;

    const itemsHtml = order.items.map(item => {
        const unitLabel = item.selectedUnit === 'BOX' ? `(Caja x${item.unitsPerBox})` : '';
        const price = item.selectedUnit === 'BOX' ? item.boxPrice : item.price;
        return `
          <div class="item">
            <span class="item-name">${item.quantity} x ${item.name} ${unitLabel}</span>
            <span>$${((price || 0) * item.quantity).toFixed(2)}</span>
          </div>
        `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head><title>Ticket ${order.id}</title>${styles}</head>
        <body>
          <div class="header">
            <h2>FARMACIA VITALIS</h2>
            <p class="info">Machalilla, Manabí, Ecuador</p>
            <p class="info">Tel: 099 850 6160</p>
            <p class="info">Fecha: ${new Date(order.date).toLocaleString()}</p>
            <p class="info">Ticket: #${order.id.slice(-6)}</p>
          </div>
          <div>${itemsHtml}</div>
          <div class="divider"></div>
          <div class="totals">
            <div class="item"><span>Subtotal:</span><span>$${order.subtotal.toFixed(2)}</span></div>
            ${order.deliveryFee > 0 ? `<div class="item"><span>Envío:</span><span>$${order.deliveryFee.toFixed(2)}</span></div>` : ''}
            <div class="total-row"><span>TOTAL:</span><span>$${order.total.toFixed(2)}</span></div>
            <div style="margin-top:5px; font-size:11px;">Pago: ${order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}</div>
            ${order.cashGiven ? `<div class="item"><span>Recibido:</span><span>$${order.cashGiven.toFixed(2)}</span></div>` : ''}
            ${order.cashGiven ? `<div class="item"><span>Cambio:</span><span>$${(order.cashGiven - order.total).toFixed(2)}</span></div>` : ''}
          </div>
          <div class="footer">
            <p>¡Gracias por su compra!</p>
            <p>Tu Salud Al Día</p>
          </div>
          <script>
            window.onload = function() { window.print(); setTimeout(function(){ window.close(); }, 500); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // POS Logic
  const addToPosCart = (product: Product) => {
      setPosCart(prev => {
          const exists = prev.find(item => item.id === product.id);
          if (exists) {
              return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
          }
          return [...prev, { ...product, quantity: 1, selectedUnit: 'UNIT' }];
      });
  };
  const removeFromPosCart = (id: string) => setPosCart(prev => prev.filter(i => i.id !== id));
  const posTotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const handlePosCheckout = async () => {
      if (posCart.length === 0) return alert("Carrito vacío");
      const newOrder: Order = {
          id: `POS-${Date.now()}`,
          customerName: "Cliente Mostrador",
          customerPhone: "",
          customerAddress: "Tienda Física",
          items: posCart,
          subtotal: posTotal,
          deliveryFee: 0,
          total: posTotal,
          paymentMethod: posPaymentMethod,
          cashGiven: posCashReceived ? parseFloat(posCashReceived) : undefined,
          status: 'DELIVERED',
          source: 'POS',
          date: new Date().toISOString()
      };

      await onAddOrder(newOrder);
      
      // Update Stock
      for (const item of posCart) {
          const product = products.find(p => p.id === item.id);
          if (product) {
              await onUpdateStock(item.id, Math.max(0, product.stock - item.quantity));
          }
      }

      // Print Ticket Automatically
      printOrderTicket(newOrder);

      setPosCart([]);
      setPosCashReceived('');
      // alert("Venta registrada correctamente"); // Removed alert to not block printing flow
  };

  const downloadCSV = (content: string, fileName: string) => {
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', fileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      await addSupplierDB({ id: `sup_${Date.now()}`, ...supplierForm });
      setSupplierForm({ name: '', contactName: '', phone: '', email: '' });
  };

  const handleGenerateBlog = async () => {
      setIsGenerating(true);
      try {
        // @ts-ignore
        const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Escribe un artículo de blog corto, informativo y optimista para la farmacia "Vitalis" sobre: "${blogTopic}". 
            Incluye un título atractivo. Usa formato HTML simple (<p>, <strong>, <ul>). Máximo 200 palabras.`,
        });
        const text = response.text || "";
        const cleanContent = text.replace(/```html/g, '').replace(/```/g, '');
        // Simple extraction logic
        const title = blogTopic; 

        await addBlogPostDB({
            id: `blog_${Date.now()}`,
            title: title,
            content: cleanContent,
            date: new Date().toISOString(),
            author: 'Vitalis AI'
        });
        setBlogTopic('');
        alert("Artículo generado y publicado!");
      } catch (e) {
          console.error(e);
          alert("Error generando blog.");
      } finally {
          setIsGenerating(false);
      }
  };

  const handleGeneratePost = async () => {
      if (!marketingProduct) return alert("Selecciona un producto");
      const p = products.find(x => x.id === marketingProduct);
      if (!p) return;
      setIsGenerating(true);
      const text = await generateSocialPost(p, postPlatform);
      setGeneratedPost(text);
      setIsGenerating(false);
  };

  const handleAddBanner = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!bannerInputRef.current?.files?.[0]) return alert("Selecciona una imagen");
      setIsUploadingBanner(true);
      try {
          const file = bannerInputRef.current.files[0];
          const url = await uploadImageToStorage(file, `banners/${Date.now()}_${file.name}`);
          await addBannerDB({
              id: `ban_${Date.now()}`,
              image: url,
              title: bannerTitle,
              active: true
          });
          setBannerTitle('');
          if (bannerInputRef.current) bannerInputRef.current.value = '';
      } catch (error) {
          console.error(error);
          alert("Error subiendo banner");
      } finally {
          setIsUploadingBanner(false);
      }
  };
  
  const handleGenerateDescription = async () => {
    if (!prodName) return alert("Escribe el nombre del producto primero.");
    setIsGenerating(true);
    const desc = await generateProductDescription(prodName);
    setProdDesc(desc);
    setIsGenerating(false);
  };

  const handleGeneratePurchaseList = () => {
      const lowStock = products.filter(p => p.stock < 10);
      const bySupplier: {[key: string]: Product[]} = {};
      
      lowStock.forEach(p => {
          const supName = suppliers.find(s => s.id === p.supplierId)?.name || 'Sin Proveedor';
          if (!bySupplier[supName]) bySupplier[supName] = [];
          bySupplier[supName].push(p);
      });

      let content = "LISTA DE COMPRA - VITALIS\n\n";
      Object.keys(bySupplier).forEach(sup => {
          content += `PROVEEDOR: ${sup}\n`;
          bySupplier[sup].forEach(p => {
              content += `- ${p.name} (Stock: ${p.stock}). Sugerido: +${50 - p.stock}\n`;
          });
          content += "\n";
      });

      downloadCSV(content, `compra_${new Date().toISOString().split('T')[0]}.txt`);
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalCat = prodCat || categories[0]?.name || 'General';
    const finalImage = prodImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='%23f1f5f9'%3E%3Crect width='300' height='300' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ESin Imagen%3C/text%3E%3C/svg%3E";
    const tempId = editingId || Date.now().toString();

    // Sanitización de números para evitar NaN
    const safeParseFloat = (val: string) => { const n = parseFloat(val); return isNaN(n) ? undefined : n; };
    const safeParseInt = (val: string) => { const n = parseInt(val); return isNaN(n) ? undefined : n; };

    // Limpieza de objeto para evitar undefined (Firebase no acepta undefined)
    const productData: any = {
      id: tempId,
      name: prodName,
      price: safeParseFloat(prodPrice) || 0,
      costPrice: safeParseFloat(prodCostPrice),
      description: prodDesc,
      category: finalCat,
      image: finalImage,
      stock: 100, // Stock se maneja separado en update real, aquí reinicia visualmente si es nuevo
      unitsPerBox: safeParseInt(prodUnitsPerBox),
      boxPrice: safeParseFloat(prodBoxPrice),
      barcode: prodBarcode || null,
      expiryDate: prodExpiry || null,
      supplierId: prodSupplier || null
    };

    // Remove keys with undefined values
    Object.keys(productData).forEach(key => productData[key] === undefined && delete productData[key]);

    try {
      if (editingId) {
        const existing = products.find(p => p.id === editingId);
        // Preserve stock on edit
        await onEditProduct({ ...productData, stock: existing ? existing.stock : 100 });
      } else {
        await onAddProduct(productData);
      }
      resetProductForm();
      alert("Producto guardado exitosamente");
    } catch (e: any) {
      console.error(e);
      let errorMsg = "Error al guardar producto.";
      if (e.message?.includes("document is larger")) errorMsg = "La imagen es demasiado pesada. Usa una imagen más pequeña.";
      alert(`${errorMsg} Revisa la consola.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setEditingId(null);
    setProdName(''); setProdPrice(''); setProdCostPrice(''); setProdUnitsPerBox(''); setProdBoxPrice('');
    setProdDesc(''); setProdCat(categories[0]?.name || ''); setProdImage(''); setProdBarcode(''); setProdExpiry(''); setProdSupplier('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setProdName(product.name);
    setProdPrice(product.price.toString());
    setProdCostPrice(product.costPrice ? product.costPrice.toString() : '');
    setProdDesc(product.description);
    setProdCat(product.category);
    setProdImage(product.image);
    setProdUnitsPerBox(product.unitsPerBox ? product.unitsPerBox.toString() : '');
    setProdBoxPrice(product.boxPrice ? product.boxPrice.toString() : '');
    setProdBarcode(product.barcode || '');
    setProdExpiry(product.expiryDate || '');
    setProdSupplier(product.supplierId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 800 * 1024) { // 800KB check
          alert("La imagen es muy pesada. Intenta usar una imagen de menos de 1MB.");
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => { if (typeof reader.result === 'string') setter(reader.result); };
      reader.readAsDataURL(file);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const finalImage = catImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='%23f1f5f9'%3E%3Crect width='300' height='300' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ECategoría%3C/text%3E%3C/svg%3E";
      await onAddCategory({ id: `cat_${Date.now()}`, name: catName, image: finalImage });
      setCatName(''); setCatImage('');
  };

  const isAdmin = currentUserRole === 'ADMIN';

  // --- MENU CONFIGURATION ---
  const menuGroups = [
      {
          title: 'GESTIÓN DE VENTAS',
          items: [
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'pos', label: 'Punto de Venta', icon: Store },
              { id: 'orders', label: 'Pedidos', icon: ShoppingCart },
          ]
      },
      ...(isAdmin ? [{
          title: 'INVENTARIO Y CATÁLOGO',
          items: [
              { id: 'products', label: 'Productos', icon: Package },
              { id: 'inventory', label: 'Stock Rápido', icon: ClipboardList },
              { id: 'categories', label: 'Categorías', icon: Grid },
              { id: 'suppliers', label: 'Proveedores', icon: Truck },
              { id: 'demand', label: 'Demanda', icon: TrendingUp },
          ]
      }] : []),
      ...(isAdmin ? [{
          title: 'MARKETING Y ADMIN',
          items: [
              { id: 'marketing', label: 'Marketing IA', icon: Megaphone },
              { id: 'users', label: 'Usuarios', icon: Users },
              { id: 'expenses', label: 'Gastos (Caja)', icon: Wallet },
              { id: 'subscriptions', label: 'Suscripciones', icon: RefreshCw },
          ]
      }, {
          title: 'GESTIÓN EXTRA',
          items: [
              { id: 'coupons', label: 'Cupones', icon: Ticket },
              { id: 'bookings', label: 'Citas Médicas', icon: CalendarCheck },
              { id: 'alerts', label: 'Alertas Stock', icon: BellRing }
          ]
      }] : [])
  ];

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white shadow-xl">
          <div className="p-6 border-b border-slate-700 flex items-center gap-2">
              <div className="h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center font-bold">V</div>
              <h1 className="text-xl font-bold tracking-tight">Vitalis Admin</h1>
          </div>
          
          <div className="flex-grow overflow-y-auto py-6 px-3 space-y-8">
              {menuGroups.map((group, idx) => (
                  <div key={idx}>
                      <h3 className="px-3 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{group.title}</h3>
                      <div className="space-y-1">
                          {group.items.map((item) => (
                              <button
                                  key={item.id}
                                  onClick={() => setActiveTab(item.id as any)}
                                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${activeTab === item.id ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
                              >
                                  <item.icon size={18} />
                                  {item.label}
                              </button>
                          ))}
                      </div>
                  </div>
              ))}
          </div>

          <div className="p-4 border-t border-slate-700">
              <button onClick={onLogout} className="flex items-center gap-2 text-slate-400 hover:text-red-400 text-sm font-medium transition-colors w-full px-2 py-2">
                  <LogOut size={18} /> Cerrar Sesión
              </button>
          </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 text-white flex items-center justify-between px-4 z-50 shadow-md">
          <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 -ml-2 text-slate-300 hover:text-white">
                  <Menu size={24} />
              </button>
              <span className="font-bold text-lg">Vitalis Panel</span>
          </div>
          <button onClick={onLogout}><LogOut size={20} className="text-slate-300"/></button>
      </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isSidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
              <div className="relative w-64 bg-slate-900 text-white h-full shadow-2xl overflow-y-auto flex flex-col animate-in slide-in-from-left">
                   <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                        <h2 className="font-bold text-lg">Menú</h2>
                        <button onClick={() => setIsSidebarOpen(false)}><X size={20}/></button>
                   </div>
                   <div className="p-4 space-y-6">
                        {menuGroups.map((group, idx) => (
                            <div key={idx}>
                                <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">{group.title}</h3>
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => { setActiveTab(item.id as any); setIsSidebarOpen(false); }}
                                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium mb-1 ${activeTab === item.id ? 'bg-teal-600 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                                    >
                                        <item.icon size={18} /> {item.label}
                                    </button>
                                ))}
                            </div>
                        ))}
                   </div>
              </div>
          </div>
      )}

      {/* MODALS */}
      {showCashClosure && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in duration-200">
                <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><Calculator size={18}/> Corte de Caja</h3>
                    <button onClick={() => setShowCashClosure(false)}><X size={20}/></button>
                </div>
                <div className="p-6">
                    {(() => {
                        const stats = getDailyStats();
                        return (
                            <div className="space-y-4">
                                <div className="text-center pb-4 border-b border-gray-100">
                                    <p className="text-gray-500 text-sm">Fecha</p>
                                    <p className="text-xl font-bold text-gray-800">{stats.date}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">Pedidos:</span>
                                    <span className="font-bold bg-gray-100 px-2 rounded">{stats.orderCount}</span>
                                </div>
                                <div className="flex justify-between items-center text-green-700">
                                    <span className="font-medium">Ventas Efectivo:</span>
                                    <span className="font-bold">+ ${stats.cashSales.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-blue-700">
                                    <span className="font-medium">Ventas Transf.:</span>
                                    <span className="font-bold">+ ${stats.transferSales.toFixed(2)}</span>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-lg">
                                    <span className="font-black text-gray-800">TOTAL:</span>
                                    <span className="font-black text-teal-700">${stats.totalSales.toFixed(2)}</span>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200 mt-2">
                                    <p className="text-xs text-yellow-800 font-bold uppercase mb-1">Efectivo en Caja:</p>
                                    <p className="text-xl font-black text-gray-800">${stats.cashSales.toFixed(2)}</p>
                                    <p className="text-[10px] text-gray-500 leading-tight mt-1">Este es el monto que deberías tener físicamente en el cajón.</p>
                                </div>
                                <button onClick={printClosureReport} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition shadow-lg mt-4">
                                    <Printer size={18}/> Imprimir Reporte
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>
        </div>
      )}

      {showCRM && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-200">
                 <div className="bg-teal-700 text-white p-4 flex justify-between items-center">
                    <h3 className="font-bold flex items-center gap-2"><History size={18}/> Historial Cliente (CRM)</h3>
                    <button onClick={() => setShowCRM(false)}><X size={20}/></button>
                </div>
                <div className="p-6">
                    <div className="relative mb-6">
                        <input className="w-full border border-gray-300 p-3 pl-10 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Buscar por nombre o teléfono..." value={crmSearch} onChange={e => setCrmSearch(e.target.value)} autoFocus />
                        <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5"/>
                    </div>
                    <div className="space-y-4 max-h-[300px] overflow-y-auto">
                        {crmCustomerHistory.length === 0 ? (
                            <p className="text-center text-gray-400 py-4">{crmSearch ? "No se encontraron pedidos." : "Escribe para buscar..."}</p>
                        ) : (
                            crmCustomerHistory.map(order => (
                                <div key={order.id} className="border border-gray-200 rounded-lg p-3 text-sm hover:bg-gray-50 transition">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-gray-800">{new Date(order.date).toLocaleDateString()}</span>
                                        <span className="font-bold text-teal-700">${order.total.toFixed(2)}</span>
                                    </div>
                                    <div className="text-gray-600 mb-1 font-medium">{order.customerName}</div>
                                    <ul className="text-xs text-gray-500 list-disc list-inside">
                                        {order.items.slice(0,3).map((i, idx) => (<li key={idx}>{i.quantity}x {i.name}</li>))}
                                        {order.items.length > 3 && <li>... y más</li>}
                                    </ul>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
      )}

      {showProductScanner && (
        <BarcodeScanner onScan={(code) => { setProdBarcode(code); setShowProductScanner(false); }} onClose={() => setShowProductScanner(false)} />
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative pt-16 md:pt-0">
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
              <div className="max-w-6xl mx-auto">
                {/* --- DASHBOARD TAB --- */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                        <h2 className="text-2xl font-bold text-gray-800 mb-6">Panel de Control</h2>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            {/* ... (Existing Dashboard content) ... */}
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-gray-700">Resumen de Rendimiento</h3>
                                <select className="border rounded-lg text-sm p-2 bg-gray-50 outline-none focus:ring-2 focus:ring-teal-500" value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value as any)}>
                                    <option value="daily">Hoy</option>
                                    <option value="weekly">Esta Semana</option>
                                    <option value="monthly">Este Mes</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="bg-teal-50 p-5 rounded-2xl border border-teal-100 flex flex-col">
                                    <span className="text-teal-600 text-xs font-bold uppercase tracking-wider mb-1">Ingresos Totales</span>
                                    <span className="text-3xl font-black text-teal-800">${totalRevenue.toFixed(2)}</span>
                                </div>
                                {isAdmin && (
                                    <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 flex flex-col relative overflow-hidden">
                                        <div className="relative z-10">
                                            <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">Utilidad Neta Real</span>
                                            <span className="text-3xl font-black text-emerald-800">${netProfit.toFixed(2)}</span>
                                            <p className="text-[10px] text-emerald-600 mt-1">Después de gastos operativos</p>
                                        </div>
                                        <div className="absolute right-0 bottom-0 opacity-10 transform translate-y-1/4 translate-x-1/4">
                                            <Wallet size={100} className="text-emerald-900"/>
                                        </div>
                                    </div>
                                )}
                                <div className="bg-blue-50 p-5 rounded-2xl border border-blue-100 flex flex-col">
                                    <span className="text-blue-600 text-xs font-bold uppercase tracking-wider mb-1">Pedidos Pendientes</span>
                                    <span className="text-3xl font-black text-blue-800">{orders.filter(o => o.status === 'PENDING').length}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 h-80 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                                            <Tooltip cursor={{fill: '#f3f4f6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                                            <Bar dataKey="ventas" fill="#0d9488" radius={[4, 4, 0, 0]} name="Ventas ($)" barSize={40} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="bg-emerald-50/50 rounded-xl p-4 border border-emerald-100">
                                    <h4 className="font-bold text-gray-700 mb-4 flex items-center gap-2"><DollarSign size={16}/> Top Productos Rentables</h4>
                                    <div className="space-y-3">
                                        {profitableProducts.length === 0 ? <p className="text-sm text-gray-400">Sin datos suficientes.</p> : profitableProducts.map((p, idx) => (
                                            <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-100 last:border-0 pb-2">
                                                <div className="flex-1 truncate pr-2">
                                                    <p className="font-bold text-gray-800 truncate">{p.name}</p>
                                                    <p className="text-xs text-gray-500">{p.quantity} vendidos</p>
                                                </div>
                                                <div className="text-right">
                                                     <p className="font-bold text-emerald-700">+${p.profit.toFixed(2)}</p>
                                                     <p className="text-[10px] text-emerald-500 uppercase font-bold">Ganancia</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- COUPONS TAB (New) --- */}
                {activeTab === 'coupons' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Ticket/> Gestión de Cupones</h3>
                        <form onSubmit={handleCouponSubmit} className="flex gap-4 items-end bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                            <div className="w-1/3">
                                <label className="text-xs font-bold text-gray-500 uppercase">Código</label>
                                <input className="w-full border p-2 rounded uppercase" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} placeholder="EJ: DESC10" required/>
                            </div>
                            <div className="w-1/4">
                                <label className="text-xs font-bold text-gray-500 uppercase">Tipo</label>
                                <select className="w-full border p-2 rounded" value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value as any})}>
                                    <option value="PERCENTAGE">Porcentaje (%)</option>
                                    <option value="FIXED">Monto Fijo ($)</option>
                                </select>
                            </div>
                            <div className="w-1/4">
                                <label className="text-xs font-bold text-gray-500 uppercase">Valor</label>
                                <input type="number" className="w-full border p-2 rounded" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: e.target.value})} placeholder="10" required/>
                            </div>
                            <button className="bg-teal-600 text-white px-4 py-2 rounded font-bold h-10">Crear</button>
                        </form>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {coupons.map(c => (
                                <div key={c.id} className="border border-dashed border-teal-300 bg-teal-50 p-4 rounded-lg flex justify-between items-center relative group">
                                    <div>
                                        <p className="font-bold text-teal-800 text-lg">{c.code}</p>
                                        <p className="text-sm text-teal-600">{c.type === 'PERCENTAGE' ? `${c.value}% OFF` : `$${c.value} Descuento`}</p>
                                    </div>
                                    <button onClick={() => deleteCouponDB(c.id)} className="bg-white p-2 rounded-full text-red-500 hover:bg-red-50 shadow-sm"><Trash2 size={16}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- BOOKINGS TAB (New) --- */}
                {activeTab === 'bookings' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><CalendarCheck/> Citas y Servicios</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha/Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Paciente</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Servicio</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Estado</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Acción</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {bookings.map(bk => (
                                        <tr key={bk.id}>
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-gray-800">{bk.date}</p>
                                                <p className="text-xs text-gray-500">{bk.time}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-gray-900">{bk.patientName}</p>
                                                <p className="text-xs text-gray-500">{bk.phone}</p>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{bk.serviceName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${bk.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : bk.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                                    {bk.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 flex gap-2">
                                                {bk.status === 'PENDING' && <button onClick={() => handleBookingStatus(bk.id, 'CONFIRMED')} className="text-blue-600 hover:underline text-xs font-bold">Confirmar</button>}
                                                {bk.status === 'CONFIRMED' && <button onClick={() => handleBookingStatus(bk.id, 'COMPLETED')} className="text-green-600 hover:underline text-xs font-bold">Completar</button>}
                                                <button onClick={() => handleBookingStatus(bk.id, 'CANCELLED')} className="text-red-600 hover:underline text-xs font-bold">Cancelar</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- ALERTS TAB (New) --- */}
                {activeTab === 'alerts' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><BellRing/> Alertas de Stock (Interesados)</h3>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Producto</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Correo Interesado</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha Solicitud</th>
                                        <th className="px-6 py-3"></th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {stockAlerts.map(alert => {
                                        const prod = products.find(p => p.id === alert.productId);
                                        return (
                                            <tr key={alert.id}>
                                                <td className="px-6 py-4 font-bold text-gray-800">{prod ? prod.name : 'Producto Eliminado'}</td>
                                                <td className="px-6 py-4 text-sm text-blue-600 underline">{alert.email}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(alert.createdAt).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => deleteStockAlertDB(alert.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* --- EXISTING TABS (Expenses, Subscriptions, POS, etc.) --- */}
                {activeTab === 'expenses' && isAdmin && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Wallet/> Caja Chica y Gastos Operativos</h3>
                            <form onSubmit={handleExpenseSubmit} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                                <div className="flex-grow">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Descripción</label>
                                    <input className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ej: Pago de Luz, Agua..." value={expenseForm.description} onChange={e => setExpenseForm({...expenseForm, description: e.target.value})} required />
                                </div>
                                <div className="w-full md:w-32">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Monto ($)</label>
                                    <input type="number" step="0.01" className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
                                </div>
                                <div className="w-full md:w-48">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Categoría</label>
                                    <select className="w-full border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500 bg-white" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                                        <option value="SERVICES">Servicios Básicos</option>
                                        <option value="SALARY">Sueldos</option>
                                        <option value="SUPPLIES">Insumos (Fundas, etc)</option>
                                        <option value="OTHER">Otros</option>
                                    </select>
                                </div>
                                <button className="bg-red-500 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-red-600 transition">Registrar Gasto</button>
                            </form>

                            <div className="overflow-x-auto rounded-lg border border-gray-200">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Descripción</th>
                                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Categoría</th>
                                            <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Monto</th>
                                            <th className="px-6 py-3"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {expenses.map(ex => (
                                            <tr key={ex.id}>
                                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(ex.date).toLocaleDateString()}</td>
                                                <td className="px-6 py-4 text-sm font-bold text-gray-800">{ex.description}</td>
                                                <td className="px-6 py-4"><span className="text-xs bg-gray-100 px-2 py-1 rounded border">{ex.category}</span></td>
                                                <td className="px-6 py-4 text-right text-sm font-bold text-red-600">-${ex.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4 text-right"><button onClick={() => deleteExpenseDB(ex.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={16}/></button></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'subscriptions' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><RefreshCw/> Suscripciones Activas (Plan Salud)</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subscriptions.map(sub => (
                                <div key={sub.id} className="border border-teal-100 bg-teal-50/30 rounded-xl p-4 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-teal-800 text-lg">{sub.productName}</p>
                                        <p className="text-sm text-gray-600">Cliente: {sub.userId}</p>
                                        <p className="text-xs text-gray-500 mt-1">Frecuencia: Cada {sub.frequencyDays} días</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Próximo Envío</p>
                                        <p className="font-bold text-gray-800 text-lg">{new Date(sub.nextDelivery).toLocaleDateString()}</p>
                                        <span className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-bold mt-1">ACTIVO</span>
                                    </div>
                                </div>
                            ))}
                            {subscriptions.length === 0 && <p className="text-gray-400 col-span-2 text-center py-10">No hay suscripciones activas aún.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'pos' && (
                    <div className="bg-white p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in flex flex-col md:flex-row gap-6 h-[calc(100vh-140px)]">
                        {showScanner && <BarcodeScanner onScan={(code) => { 
                            const p = products.find(prod => prod.barcode === code);
                            if(p) { addToPosCart(p); setShowScanner(false); } else { alert("Producto no encontrado"); setShowScanner(false); }
                        }} onClose={() => setShowScanner(false)} />}
                        
                        <div className="w-full md:w-2/3 flex flex-col">
                            <div className="flex gap-2 mb-4">
                                <div className="relative flex-grow">
                                    <input className="w-full border border-gray-200 p-3 pl-10 rounded-xl focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Buscar producto o código..." value={posSearch} onChange={e => setPosSearch(e.target.value)} autoFocus />
                                    <Search className="absolute left-3 top-3.5 text-gray-400 h-5 w-5"/>
                                </div>
                                <button onClick={() => setShowScanner(true)} className="bg-slate-800 text-white p-3 rounded-xl hover:bg-slate-700 transition" title="Escanear Código"><ScanBarcode/></button>
                                <button onClick={() => setShowCashClosure(true)} className="bg-white border border-gray-300 text-gray-700 p-3 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 font-bold whitespace-nowrap" title="Cierre de Caja"><Calculator size={20}/> <span className="hidden sm:inline">Corte de Caja</span></button>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-2 flex-1 content-start">
                                {products.filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase()) || p.barcode === posSearch).map(p => (
                                    <div key={p.id} onClick={() => addToPosCart(p)} className="border border-gray-100 bg-white p-4 rounded-xl cursor-pointer hover:border-teal-500 hover:shadow-md transition group">
                                        <p className="font-bold text-sm truncate text-gray-800 group-hover:text-teal-700">{p.name}</p>
                                        <p className="text-teal-600 font-bold mt-1">${p.price.toFixed(2)}</p>
                                        <p className="text-xs text-gray-400 mt-1">Stock: {p.stock}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full md:w-1/3 bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col shadow-inner">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold flex items-center gap-2 text-gray-700"><ShoppingCart size={18}/> Orden Actual</h3>
                                {/* CRM Button (Option 3) */}
                                <button onClick={() => setShowCRM(true)} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded font-bold hover:bg-teal-200 flex items-center gap-1">
                                    <History size={12}/> Historial Cliente
                                </button>
                            </div>

                            <div className="flex-grow overflow-y-auto space-y-2 mb-4 custom-scrollbar">
                                {posCart.map(item => (
                                    <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                                        <div className="flex-grow">
                                            <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                            <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <p className="font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                                            <button onClick={() => removeFromPosCart(item.id)} className="text-red-400 hover:text-red-600 bg-red-50 p-1 rounded"><X size={14}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex justify-between text-2xl font-black text-gray-800"><span>Total</span><span>${posTotal.toFixed(2)}</span></div>
                                <div className="flex gap-2">
                                    <button onClick={() => setPosPaymentMethod('CASH')} className={`flex-1 py-2 rounded-lg border font-medium text-sm transition ${posPaymentMethod === 'CASH' ? 'bg-teal-100 border-teal-500 text-teal-800 ring-1 ring-teal-500' : 'bg-white border-gray-200 text-gray-600'}`}>Efectivo</button>
                                    <button onClick={() => setPosPaymentMethod('TRANSFER')} className={`flex-1 py-2 rounded-lg border font-medium text-sm transition ${posPaymentMethod === 'TRANSFER' ? 'bg-blue-100 border-blue-500 text-blue-800 ring-1 ring-blue-500' : 'bg-white border-gray-200 text-gray-600'}`}>Transf.</button>
                                </div>
                                {posPaymentMethod === 'CASH' && (
                                    <div className="animate-in fade-in space-y-2">
                                        <input type="number" placeholder="Dinero recibido" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-teal-500 font-bold text-lg" value={posCashReceived} onChange={e => setPosCashReceived(e.target.value)} />
                                        {posCashReceived && !isNaN(parseFloat(posCashReceived)) && (
                                            <div className={`flex justify-between items-center px-3 py-2 rounded-lg ${parseFloat(posCashReceived) >= posTotal ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                                <span className="text-xs font-bold uppercase">Cambio:</span>
                                                <span className="font-black text-lg">${(parseFloat(posCashReceived) - posTotal).toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <button onClick={handlePosCheckout} className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all">COBRAR</button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'inventory' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-bold text-xl text-gray-800">Control de Inventario</h3>
                            <div className="flex gap-2">
                                <button onClick={handleSendStockAlert} className="bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-green-600 flex items-center gap-2 shadow-sm">
                                    <MessageCircle size={16}/> Enviar Alerta Stock
                                </button>
                                <button onClick={handleGeneratePurchaseList} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 flex items-center gap-2 shadow-sm">
                                    <Download size={16}/> Lista Compra
                                </button>
                                <div className="relative">
                                    <input className="border border-gray-200 p-2 pl-9 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none" placeholder="Buscar..." value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} />
                                    <Search className="absolute left-2.5 top-2.5 text-gray-400 h-4 w-4"/>
                                </div>
                            </div>
                        </div>
                        {expiringProducts.length > 0 && (
                             <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4">
                                <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2"><AlertTriangle size={18}/> Alertas de Caducidad (Próximos 3 meses)</h4>
                                <div className="flex gap-3 overflow-x-auto pb-2">
                                    {expiringProducts.map(p => {
                                        const daysLeft = Math.ceil((new Date(p.expiryDate!).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
                                        const isExpired = daysLeft < 0;
                                        return (
                                            <div key={p.id} className={`flex-shrink-0 p-3 rounded-lg border ${isExpired ? 'bg-red-100 border-red-200' : 'bg-white border-orange-100'} w-48`}>
                                                <p className="font-bold text-sm truncate text-gray-800">{p.name}</p>
                                                <p className={`text-xs font-bold ${isExpired ? 'text-red-600' : 'text-orange-600'}`}>
                                                    {isExpired ? `Venció hace ${Math.abs(daysLeft)} días` : `Vence en ${daysLeft} días`}
                                                </p>
                                                <p className="text-[10px] text-gray-500">{new Date(p.expiryDate!).toLocaleDateString()}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                             </div>
                        )}
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-l-lg">Producto</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider rounded-r-lg">Acción Rápida</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {products.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase())).map(p => (
                                        <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-700">{p.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${p.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                                    {p.stock}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                                                <button onClick={() => onUpdateStock(p.id, p.stock - 1)} className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-600"><Minus size={14}/></button>
                                                <input type="number" className="w-16 border border-gray-200 rounded-md p-1 text-center text-sm font-medium mx-1 focus:ring-1 focus:ring-teal-500 outline-none" defaultValue={p.stock} onBlur={(e) => onUpdateStock(p.id, parseInt(e.target.value))} />
                                                <button onClick={() => onUpdateStock(p.id, p.stock + 1)} className="p-1.5 bg-gray-100 rounded-md hover:bg-gray-200 text-gray-600"><Plus size={14}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'categories' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="font-bold text-xl text-gray-800 mb-6">Categorías</h3>
                        <form onSubmit={handleCategorySubmit} className="flex gap-4 mb-8 bg-gray-50 p-5 rounded-xl border border-gray-100 items-end">
                            <div className="flex-grow">
                                <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Nombre de Categoría</label>
                                <input className="w-full border border-gray-200 p-2.5 rounded-lg focus:ring-2 focus:ring-teal-500 outline-none" value={catName} onChange={e => setCatName(e.target.value)} required />
                            </div>
                            <button className="bg-teal-600 text-white px-6 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition">Crear</button>
                        </form>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {categories.map(c => (
                                <div key={c.id} className="border border-gray-100 rounded-xl p-4 relative group hover:shadow-lg transition-all bg-white">
                                    <div className="h-20 w-full flex items-center justify-center bg-gray-50 rounded-lg mb-3">
                                        <img src={c.image} className="h-16 w-16 object-contain mix-blend-multiply" />
                                    </div>
                                    <p className="font-bold text-center text-gray-800">{c.name}</p>
                                    <button onClick={() => onDeleteCategory(c.id)} className="absolute top-2 right-2 bg-red-100 text-red-500 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition hover:bg-red-200"><Trash2 size={14}/></button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="font-bold text-xl text-gray-800 mb-6">Historial de Pedidos</h3>
                        <div className="space-y-4">
                            {orders.map(order => (
                                <div key={order.id} className="border border-gray-200 rounded-xl p-5 hover:shadow-md transition-shadow bg-white">
                                    <div className="flex flex-col md:flex-row justify-between md:items-start mb-4 gap-4">
                                        <div>
                                            <div className="flex items-center gap-3 mb-1">
                                                <p className="font-bold text-lg text-gray-900">{order.customerName}</p>
                                                <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : order.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                                    {order.status === 'IN_TRANSIT' ? 'En Camino' : order.status === 'DELIVERED' ? 'Entregado' : 'Pendiente'}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString()} • {order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}</p>
                                        </div>
                                        <div className="text-left md:text-right flex flex-col items-end">
                                            <p className="font-black text-2xl text-teal-700">${order.total.toFixed(2)}</p>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => printOrderTicket(order)} className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-600 transition" title="Imprimir Ticket"><Printer size={16}/></button>
                                                <p className="text-xs text-gray-400">ID: {order.id}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-600 mb-4 border border-gray-100">
                                        {order.items.map((i, idx) => (
                                            <div key={idx} className="flex justify-between py-1 border-b border-gray-200 last:border-0">
                                                <span>{i.quantity} x {i.name}</span>
                                                <span className="font-medium">${(i.price * i.quantity).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {order.status !== 'DELIVERED' && (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')} className="bg-green-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-green-700 transition shadow-sm">
                                                <CheckCircle size={16}/> Marcar como Entregado
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'users' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="font-bold text-xl text-gray-800 mb-6">Usuarios Registrados</h3>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Usuario</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contacto</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rol</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Fidelidad</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {users.map(u => (
                                        <tr key={u.uid} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.displayName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="bg-gray-100 border border-gray-200 px-2 py-1 rounded text-xs font-medium">{u.role}</span></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-bold">{u.points} pts</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'suppliers' && isAdmin && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-800">Proveedores</h3>
                                <button onClick={handleGeneratePurchaseList} className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 flex items-center gap-2 border border-blue-100"><FileDown size={16}/> Descargar Lista Compra</button>
                            </div>
                            <form onSubmit={handleSupplierSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end bg-gray-50 p-5 rounded-xl border border-gray-100 mb-6">
                                <input className="border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nombre Empresa" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required />
                                <input className="border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nombre Contacto" value={supplierForm.contactName} onChange={e => setSupplierForm({...supplierForm, contactName: e.target.value})} />
                                <input className="border border-gray-200 p-2.5 rounded-lg outline-none focus:ring-2 focus:ring-teal-500" placeholder="Teléfono" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                                <button className="bg-teal-600 text-white px-4 py-2.5 rounded-lg font-bold hover:bg-teal-700 transition">Agregar</button>
                            </form>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {suppliers.map(s => (
                                    <div key={s.id} className="p-4 border border-gray-200 rounded-xl shadow-sm relative hover:border-teal-400 transition bg-white">
                                        <h4 className="font-bold text-gray-800">{s.name}</h4>
                                        <p className="text-sm text-gray-500 mt-1">{s.contactName}</p>
                                        <p className="text-sm text-gray-400">{s.phone}</p>
                                        <button onClick={() => deleteSupplierDB(s.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'demand' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-gray-800"><TrendingUp className="text-red-500"/> Demanda Insatisfecha</h3>
                        <p className="text-sm text-gray-500 mb-6 bg-red-50 p-3 rounded-lg border border-red-100 inline-block">
                            Estos son términos que los usuarios buscaron pero no obtuvieron resultados. Úsalo para surtir tu inventario.
                        </p>
                        <div className="overflow-hidden rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50"><tr><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Término Buscado</th><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Última Fecha</th><th className="text-left py-3 px-4 text-xs font-bold text-gray-500 uppercase">Intentos</th></tr></thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {searchLogs.map(log => (
                                        <tr key={log.id}>
                                            <td className="py-3 px-4 font-bold text-gray-800">{log.term}</td>
                                            <td className="py-3 px-4 text-gray-500 text-sm">{log.date}</td>
                                            <td className="py-3 px-4"><span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-bold">{log.count}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'marketing' && isAdmin && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-blue-100 rounded-lg"><Share2 className="h-5 w-5 text-blue-600"/></div>
                                <h3 className="text-lg font-bold text-gray-800">Creador de Contenido IA</h3>
                            </div>
                            <div className="space-y-4">
                                <select className="w-full border border-gray-200 p-2.5 rounded-lg text-sm bg-gray-50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500" value={marketingProduct} onChange={e => setMarketingProduct(e.target.value)}>
                                    <option value="">-- Seleccionar Producto a Promocionar --</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                                </select>
                                <div className="flex gap-2">
                                    <button onClick={() => setPostPlatform('INSTAGRAM')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${postPlatform === 'INSTAGRAM' ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        <Instagram size={16}/> Instagram
                                    </button>
                                    <button onClick={() => setPostPlatform('WHATSAPP')} className={`flex-1 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${postPlatform === 'WHATSAPP' ? 'bg-green-500 text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                                        <MessageCircle size={16}/> WhatsApp
                                    </button>
                                </div>
                                <button onClick={handleGeneratePost} disabled={isGenerating || !marketingProduct} className="w-full bg-slate-800 text-white py-2.5 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition">
                                    {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={16} className="text-yellow-400"/>} Generar Copy
                                </button>
                                {generatedPost && (
                                    <div className="mt-4 animate-in fade-in">
                                        <textarea className="w-full border border-gray-200 p-3 rounded-lg text-sm h-32 bg-gray-50 focus:bg-white transition-colors" value={generatedPost} onChange={(e) => setGeneratedPost(e.target.value)}></textarea>
                                        <div className="flex gap-2 mt-2">
                                            <button onClick={() => navigator.clipboard.writeText(generatedPost)} className="flex-1 bg-white border border-gray-200 text-gray-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-gray-50"><Copy size={14}/> Copiar Texto</button>
                                            {postPlatform === 'WHATSAPP' && (
                                                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generatedPost)}`)} className="flex-1 bg-green-100 text-green-700 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-green-200"><MessageCircle size={14}/> Abrir WhatsApp</button>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                             <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-yellow-100 rounded-lg"><ImageIcon className="h-5 w-5 text-yellow-600"/></div>
                                <h3 className="text-lg font-bold text-gray-800">Banners de Inicio</h3>
                            </div>
                            <div className="mb-6 space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                <input className="w-full border border-gray-200 p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Título del Banner (Opcional)" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)}/>
                                <input type="file" accept="image/*" ref={bannerInputRef} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-yellow-100 file:text-yellow-700 hover:file:bg-yellow-200"/>
                                <button onClick={handleAddBanner} disabled={isUploadingBanner} className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold w-full text-sm hover:bg-yellow-600 transition disabled:opacity-50">
                                    {isUploadingBanner ? 'Subiendo...' : 'Publicar Banner'}
                                </button>
                            </div>
                            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                {banners.map(b => (
                                    <div key={b.id} className="flex items-center gap-3 p-2 border border-gray-200 rounded-lg bg-white relative group">
                                        <img src={b.image} className="h-10 w-16 object-cover rounded-md"/>
                                        <p className="text-xs font-medium truncate flex-grow text-gray-700">{b.title || 'Sin Título'}</p>
                                        <button onClick={() => deleteBannerDB(b.id)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
                            <div className="flex items-center gap-2 mb-4">
                                <div className="p-2 bg-purple-100 rounded-lg"><PenTool className="h-5 w-5 text-purple-600"/></div>
                                <h3 className="text-lg font-bold text-gray-800">Redactor de Blog IA</h3>
                            </div>
                            <div className="flex flex-col md:flex-row gap-4 bg-purple-50 p-5 rounded-xl border border-purple-100">
                                <input className="flex-grow border border-white p-3 rounded-lg outline-none focus:ring-2 focus:ring-purple-500" placeholder="¿Sobre qué quieres escribir hoy? (Ej: Beneficios del Zinc)" value={blogTopic} onChange={e => setBlogTopic(e.target.value)} />
                                <button onClick={handleGenerateBlog} disabled={isGenerating || !blogTopic} className="bg-purple-600 text-white px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-purple-700 transition shadow-lg shadow-purple-600/20 whitespace-nowrap">
                                    {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={18}/>} Generar Artículo
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'products' && isAdmin && (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-in fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-6">Gestión de Productos</h3>
                        <form onSubmit={handleProductSubmit} className="space-y-6 mb-10 bg-gray-50 p-6 rounded-xl border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre del Producto</label>
                                    <input className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all bg-white" placeholder="Ej: Paracetamol 500mg" value={prodName} onChange={e => setProdName(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Código de Barras</label>
                                    <div className="flex gap-2">
                                        <input className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" placeholder="Escanea o escribe..." value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} />
                                        <button type="button" onClick={() => setShowProductScanner(true)} className="bg-gray-200 text-gray-700 p-2.5 rounded-lg hover:bg-gray-300 transition" title="Escanear Código">
                                            <ScanBarcode size={20} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Venta ($)</label>
                                    <input className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Costo Compra ($)</label>
                                    <input className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" type="number" step="0.01" value={prodCostPrice} onChange={e => setProdCostPrice(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Unid. x Caja</label>
                                    <input className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" type="number" value={prodUnitsPerBox} onChange={e => setProdUnitsPerBox(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Precio Caja ($)</label>
                                    <input className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" type="number" step="0.01" value={prodBoxPrice} onChange={e => setProdBoxPrice(e.target.value)} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descripción</label>
                                <div className="flex gap-2">
                                    <textarea className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white h-20" placeholder="Detalles del producto..." value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
                                    <button type="button" onClick={handleGenerateDescription} className="bg-purple-100 text-purple-600 px-4 rounded-lg hover:bg-purple-200 border border-purple-200 flex flex-col items-center justify-center gap-1" title="Generar con IA">
                                        <Sparkles size={20}/> <span className="text-[10px] font-bold">IA</span>
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoría</label>
                                    <select className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" value={prodCat} onChange={e => setProdCat(e.target.value)}>
                                        <option value="">Seleccionar...</option>
                                        {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Proveedor</label>
                                    <select className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" value={prodSupplier} onChange={e => setProdSupplier(e.target.value)}>
                                        <option value="">Seleccionar...</option>
                                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Imagen</label>
                                    <input type="file" accept="image/*" ref={fileInputRef} className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100" onChange={(e) => handleImageUpload(e, setProdImage)} />
                                </div>
                                <div>
                                   <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha de Caducidad</label>
                                   <input type="date" className="border border-gray-300 p-2.5 rounded-lg w-full outline-none focus:border-teal-500 bg-white" value={prodExpiry} onChange={e => setProdExpiry(e.target.value)} />
                                </div>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button className="flex-1 bg-teal-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition disabled:opacity-70">
                                    {isSubmitting ? 'Guardando...' : (editingId ? 'Actualizar Producto' : 'Guardar Nuevo Producto')}
                                </button>
                                {editingId && <button type="button" onClick={resetProductForm} className="bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-bold hover:bg-gray-300">Cancelar</button>}
                            </div>
                        </form>
                        <div className="space-y-2">
                            {products.map(p => (
                                <div key={p.id} className="border border-gray-200 rounded-lg p-3 flex justify-between items-center hover:bg-gray-50 transition bg-white group">
                                    <div className="flex items-center gap-4">
                                        <img src={p.image} className="h-12 w-12 object-contain rounded bg-gray-50 border border-gray-100" />
                                        <div>
                                            <p className="font-bold text-gray-800">{p.name}</p>
                                            <div className="flex gap-3 text-xs text-gray-500">
                                                <span>${p.price.toFixed(2)}</span>
                                                <span className="text-gray-300">|</span>
                                                <span>Stock: {p.stock}</span>
                                                <span className="text-gray-300">|</span>
                                                <span>{p.category}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEditClick(p)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100"><Edit2 size={16}/></button>
                                        <button onClick={() => onDeleteProduct(p.id)} className="p-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100"><Trash2 size={16}/></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
              </div>
          </div>
      </main>
    </div>
  );
};

export default AdminPanel;