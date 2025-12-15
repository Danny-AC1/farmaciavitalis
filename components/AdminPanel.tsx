import React, { useState, useRef, useMemo } from 'react';
import { Product, Order, Category, CartItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, CheckCircle, Clock, Trash2, Plus, Sparkles, LogOut, Edit2, X, ClipboardList, AlertTriangle, Store, ShoppingCart, Minus, Banknote, Search, TrendingUp, Loader2, Package, Phone, MapPin } from 'lucide-react';
import { generateProductDescription } from '../services/gemini';

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
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'products' | 'categories' | 'inventory' | 'orders'>('dashboard');
  
  // Dashboard / Reports State
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Product Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState(''); // Precio Unidad
  const [prodUnitsPerBox, setProdUnitsPerBox] = useState(''); // Unidades por Caja
  const [prodBoxPrice, setProdBoxPrice] = useState(''); // Precio Caja
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImage, setProdImage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Category Form State
  const [catName, setCatName] = useState('');
  const [catImage, setCatImage] = useState('');
  const catFileInputRef = useRef<HTMLInputElement>(null);

  // POS State
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [posSearch, setPosSearch] = useState('');
  const [posCategoryFilter, setPosCategoryFilter] = useState<string>('ALL'); // Nuevo estado para filtro
  const [posCashReceived, setPosCashReceived] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');

  // Stats
  const totalRevenue = orders
    .filter(o => o.status === 'DELIVERED')
    .reduce((acc, curr) => acc + curr.total, 0);
  
  const pendingOrders = orders.filter(o => o.status === 'PENDING');
  const deliveredOrders = orders.filter(o => o.status === 'DELIVERED');

  // --- Handlers ---
  const handleGenerateDesc = async () => {
    if (!prodName) return alert("Ingresa el nombre del producto primero.");
    setIsGenerating(true);
    const desc = await generateProductDescription(prodName);
    setProdDesc(desc);
    setIsGenerating(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
            setter(reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setProdName(product.name);
    setProdPrice(product.price.toString());
    setProdDesc(product.description);
    setProdCat(product.category);
    setProdImage(product.image);
    // Cargar datos de caja si existen
    setProdUnitsPerBox(product.unitsPerBox ? product.unitsPerBox.toString() : '');
    setProdBoxPrice(product.boxPrice ? product.boxPrice.toString() : '');
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProductForm = () => {
    setEditingId(null);
    setProdName('');
    setProdPrice('');
    setProdUnitsPerBox('');
    setProdBoxPrice('');
    setProdDesc('');
    setProdCat(categories[0]?.name || '');
    setProdImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const finalCat = prodCat || categories[0]?.name || 'General';
    const finalImage = prodImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='%23f1f5f9'%3E%3Crect width='300' height='300' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ESin Imagen%3C/text%3E%3C/svg%3E";
    const tempId = editingId || Date.now().toString();

    // Logic for optional box fields
    const uPerBox = parseInt(prodUnitsPerBox);
    const bPrice = parseFloat(prodBoxPrice);
    
    const productData: Product = {
      id: tempId,
      name: prodName,
      price: parseFloat(prodPrice),
      description: prodDesc,
      category: finalCat,
      image: finalImage,
      stock: 100, // Default stock for new items, will be overwritten on edit
      unitsPerBox: (!isNaN(uPerBox) && uPerBox > 1) ? uPerBox : undefined,
      boxPrice: (!isNaN(bPrice) && bPrice > 0) ? bPrice : undefined
    };

    try {
      if (editingId) {
        const existing = products.find(p => p.id === editingId);
        await onEditProduct({ ...productData, stock: existing ? existing.stock : 100 });
      } else {
        await onAddProduct(productData);
      }
      resetProductForm();
    } catch (e) {
      alert("Error al guardar producto");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    setIsSubmitting(true);

    const finalImage = catImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='%23f1f5f9'%3E%3Crect width='300' height='300' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ECategoría%3C/text%3E%3C/svg%3E";

    const newCat: Category = {
      id: `c_${Date.now()}`,
      name: catName,
      image: finalImage
    };

    try {
      await onAddCategory(newCat);
      setCatName('');
      setCatImage('');
      if (catFileInputRef.current) catFileInputRef.current.value = '';
    } catch (e) {
      console.error(e);
      alert("Error al guardar categoría");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getReservedStock = (productId: string, currentCart: CartItem[]) => {
    return currentCart.reduce((acc, item) => {
      if (item.id !== productId) return acc;
      const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
      return acc + (item.quantity * unitsPerItem);
    }, 0);
  };

  const addToPosCart = (product: Product, unitType: 'UNIT' | 'BOX') => {
    const quantityToAdd = unitType === 'BOX' ? (product.unitsPerBox || 1) : 1;
    const currentReserved = getReservedStock(product.id, posCart);
    
    if (currentReserved + quantityToAdd > product.stock) {
        return alert(`Stock insuficiente. Quedan ${product.stock} disponibles.`);
    }

    setPosCart(prev => {
      // Find existing item with SAME id AND SAME unitType
      const existingIndex = prev.findIndex(item => item.id === product.id && item.selectedUnit === unitType);
      
      if (existingIndex > -1) {
        const newCart = [...prev];
        newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + 1 };
        return newCart;
      }
      
      // Add new line item
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
  };

  const updatePosQuantity = (index: number, delta: number) => {
    setPosCart(prev => {
      const item = prev[index];
      const product = products.find(p => p.id === item.id);
      
      if (!product) return prev;

      const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
      
      // Calculate what the NEW total reserved would be
      const otherItemsReserved = getReservedStock(item.id, prev) - (item.quantity * unitsPerItem);
      const newQty = item.quantity + delta;
      const newTotalReserved = otherItemsReserved + (newQty * unitsPerItem);

      if (newTotalReserved > product.stock) {
          alert("Stock máximo alcanzado");
          return prev;
      }
      if (newQty < 1) return prev;
      
      const newCart = [...prev];
      newCart[index] = { ...item, quantity: newQty };
      return newCart;
    });
  };
  
  const removePosItem = (index: number) => {
      setPosCart(prev => prev.filter((_, i) => i !== index));
  }

  const handlePosCheckout = async () => {
    if (posCart.length === 0) return;
    setIsSubmitting(true);
    
    let currentTotal = 0;
    // Map to aggregate deductions per product ID
    const stockDeductions = new Map<string, number>();

    // 1. Calculate totals and stock deductions required
    for (const item of posCart) {
       const isBox = item.selectedUnit === 'BOX';
       const unitPrice = isBox ? (item.boxPrice || 0) : item.price;
       const unitsPerItem = isBox ? (item.unitsPerBox || 1) : 1;
       
       currentTotal += unitPrice * item.quantity;
       
       const unitsToDeduct = item.quantity * unitsPerItem;
       const currentDeduction = stockDeductions.get(item.id) || 0;
       stockDeductions.set(item.id, currentDeduction + unitsToDeduct);
    }

    try {
        // 2. Perform Stock Updates in parallel
        const stockUpdatePromises = [];
        for (const [prodId, totalDeduction] of stockDeductions.entries()) {
             const currentProduct = products.find(p => p.id === prodId);
             if (currentProduct) {
                 const newStock = Math.max(0, currentProduct.stock - totalDeduction);
                 stockUpdatePromises.push(onUpdateStock(prodId, newStock));
             }
        }
        await Promise.all(stockUpdatePromises);

        // 3. Create Order
        const newOrder: Order = {
            id: `POS-${Date.now()}`,
            customerName: 'Cliente en Local',
            customerPhone: '-',
            customerAddress: 'Tienda Física',
            items: posCart,
            subtotal: currentTotal,
            deliveryFee: 0,
            total: currentTotal,
            paymentMethod: posPaymentMethod,
            cashGiven: posPaymentMethod === 'CASH' && posCashReceived ? parseFloat(posCashReceived) : undefined,
            status: 'DELIVERED',
            source: 'POS',
            date: new Date().toISOString()
        };

        await onAddOrder(newOrder);

        // 4. Reset UI
        setPosCart([]);
        setPosCashReceived('');
        alert("Venta registrada correctamente");
    } catch (error) {
        console.error("Error al procesar venta:", error);
        alert("Hubo un error al procesar la venta. Verifique la conexión.");
    } finally {
        setIsSubmitting(false);
    }
  };

  // Helper for POS quick cash
  const getQuickCashOptions = (total: number) => {
    const options = [total];
    if (total <= 5) options.push(5);
    if (total <= 10) options.push(10);
    if (total <= 20) options.push(20);
    if (total <= 50) options.push(50);
    if (total <= 100) options.push(100);
    // Remove duplicates and sort
    return Array.from(new Set(options)).sort((a, b) => a - b);
  };
  
  const calculateCartTotal = (cart: CartItem[]) => {
      return cart.reduce((acc, item) => {
          const price = item.selectedUnit === 'BOX' ? (item.boxPrice || 0) : item.price;
          return acc + (price * item.quantity);
      }, 0);
  };

  const getSalesData = useMemo(() => {
    const now = new Date();
    const salesOrders = orders.filter(o => o.status === 'DELIVERED');
    const data: { [key: string]: number } = {};
    let totalPeriodSales = 0;

    if (reportPeriod === 'daily') {
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
        data[key] = 0;
      }
      salesOrders.forEach(o => {
        const d = new Date(o.date);
        const diffTime = Math.abs(now.getTime() - d.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        if (diffDays <= 7) {
          const key = d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' });
          if (data[key] !== undefined) {
            data[key] += o.total;
            totalPeriodSales += o.total;
          }
        }
      });
    } else if (reportPeriod === 'weekly') {
       salesOrders.forEach(o => {
          const d = new Date(o.date);
          if (d.getFullYear() === now.getFullYear()) {
             const oneJan = new Date(d.getFullYear(), 0, 1);
             const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000));
             const week = Math.ceil((d.getDay() + 1 + numberOfDays) / 7);
             const key = `Semana ${week}`;
             data[key] = (data[key] || 0) + o.total;
             totalPeriodSales += o.total;
          }
       });
    } else if (reportPeriod === 'monthly') {
      const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      monthNames.forEach(m => data[m] = 0);
      salesOrders.forEach(o => {
        const d = new Date(o.date);
        if (d.getFullYear() === now.getFullYear()) {
          const key = monthNames[d.getMonth()];
          data[key] += o.total;
          totalPeriodSales += o.total;
        }
      });
    } else if (reportPeriod === 'yearly') {
      salesOrders.forEach(o => {
        const d = new Date(o.date);
        const key = d.getFullYear().toString();
        data[key] = (data[key] || 0) + o.total;
        totalPeriodSales += o.total;
      });
    }

    const chartData = Object.keys(data).map(key => ({
      name: key,
      ventas: data[key]
    }));

    return { chartData, totalPeriodSales };
  }, [orders, reportPeriod]);

  const renderDashboard = () => {
    const pieData = [
      { name: 'Entregados', value: deliveredOrders.length },
      { name: 'Pendientes', value: pendingOrders.length },
    ];
    
    const posOrders = orders.filter(o => o.source === 'POS');
    const onlineOrders = orders.filter(o => o.source !== 'POS');
    const { chartData, totalPeriodSales } = getSalesData;

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
             <div>
                <p className="text-sm text-gray-500">Ingresos Totales (Histórico)</p>
                <p className="text-2xl font-bold text-teal-600">${totalRevenue.toFixed(2)}</p>
             </div>
             <div className="bg-teal-50 p-3 rounded-full">
               <DollarSign className="text-teal-600 h-6 w-6" />
             </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
             <div>
                <p className="text-sm text-gray-500">Ventas Online</p>
                <p className="text-2xl font-bold text-purple-600">{onlineOrders.length}</p>
             </div>
             <div className="bg-purple-50 p-3 rounded-full">
               <ShoppingCart className="text-purple-600 h-6 w-6" />
             </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
             <div>
                <p className="text-sm text-gray-500">Ventas en Local</p>
                <p className="text-2xl font-bold text-blue-600">{posOrders.length}</p>
             </div>
             <div className="bg-blue-50 p-3 rounded-full">
               <Store className="text-blue-600 h-6 w-6" />
             </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 flex items-center justify-between">
             <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-orange-500">{pendingOrders.length}</p>
             </div>
             <div className="bg-orange-50 p-3 rounded-full">
               <Clock className="text-orange-500 h-6 w-6" />
             </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-teal-600" /> Reporte de Ventas
              </h3>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0">
              <button onClick={() => setReportPeriod('daily')} className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'daily' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}>Diario</button>
              <button onClick={() => setReportPeriod('weekly')} className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'weekly' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}>Semanal</button>
              <button onClick={() => setReportPeriod('monthly')} className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'monthly' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}>Mensual</button>
              <button onClick={() => setReportPeriod('yearly')} className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'yearly' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}>Anual</button>
            </div>
          </div>

          <div className="mb-6 bg-teal-50 border border-teal-100 rounded-lg p-4 flex items-center justify-between">
            <span className="text-teal-800 font-medium">Total Ventas</span>
            <span className="text-2xl font-bold text-teal-700">${totalPeriodSales.toFixed(2)}</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val: number) => `$${val}`} />
                <Tooltip 
                  cursor={{ fill: '#f0fdfa' }}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, 'Ventas']}
                />
                <Bar dataKey="ventas" fill="#0d9488" radius={[4, 4, 0, 0]} barSize={reportPeriod === 'yearly' ? 60 : 30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row for PieChart and Inventory Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-80">
            <h3 className="text-lg font-bold mb-4 text-gray-700">Estado de Pedidos</h3>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#0d9488' : '#f97316'} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
           <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 h-80 flex flex-col">
             <h3 className="text-lg font-bold mb-4 text-gray-700">Resumen de Inventario</h3>
             <div className="flex-grow flex flex-col justify-center space-y-4">
                <div className="flex justify-between items-center border-b pb-2">
                   <span className="text-gray-600">Total Productos</span>
                   <span className="font-bold text-xl">{products.length}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                   <span className="text-gray-600">Categorías</span>
                   <span className="font-bold text-xl">{categories.length}</span>
                </div>
                <div className="flex justify-between items-center border-b pb-2">
                   <span className="text-gray-600 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500"/> Stock Bajo (&lt;10)</span>
                   <span className="font-bold text-xl text-orange-600">{products.filter(p => p.stock < 10).length}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-gray-600 flex items-center gap-2"><X className="h-4 w-4 text-red-500"/> Sin Stock</span>
                   <span className="font-bold text-xl text-red-600">{products.filter(p => p.stock === 0).length}</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  };

  const renderInventory = () => (
    <div className="space-y-6">
       <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
         <h3 className="text-lg font-bold mb-4 text-gray-800 flex items-center gap-2">
           <ClipboardList className="h-5 w-5 text-teal-600" /> Inventario de Productos
         </h3>
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cat.</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Config. Caja</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock (Unidades)</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => {
                  const isLowStock = product.stock < 10;
                  const hasBox = product.unitsPerBox && product.unitsPerBox > 1;
                  const estimatedBoxes = hasBox ? Math.floor(product.stock / (product.unitsPerBox || 1)) : 0;
                  
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap flex items-center">
                         <img className="h-10 w-10 rounded-full object-cover mr-4" src={product.image} alt="" />
                         <div>
                            <span className="text-sm font-medium text-gray-900 block">{product.name}</span>
                            <span className="text-xs text-gray-500">${product.price} (Unid)</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         {hasBox ? (
                             <div className="flex flex-col">
                                 <span className="font-bold flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full w-fit">
                                   <Package className="h-3 w-3"/> x{product.unitsPerBox}
                                 </span>
                                 <span className="text-xs text-teal-600 mt-1 pl-1">${product.boxPrice}</span>
                             </div>
                         ) : (
                             <span className="text-gray-400 text-xs">-</span>
                         )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center gap-2">
                            <input 
                                type="number"
                                min="0"
                                className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
                                value={product.stock}
                                onChange={(e) => onUpdateStock(product.id, parseInt(e.target.value) || 0)}
                            />
                            {hasBox && (
                                <span className="text-xs text-gray-400 whitespace-nowrap">
                                    (~ {estimatedBoxes} cajas)
                                </span>
                            )}
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLowStock ? <span className="text-orange-600 text-xs font-bold flex items-center"><AlertTriangle className="h-4 w-4 mr-1"/> Bajo</span> : <span className="text-green-600 text-xs font-bold flex items-center"><CheckCircle className="h-4 w-4 mr-1"/> Ok</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
         </div>
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-shrink-0 flex items-center text-teal-700 font-bold text-xl mr-4">Panel Admin</div>
              {/* Scrollable Navigation for Mobile */}
              <div className="flex -my-px space-x-4 overflow-x-auto pb-1 sm:ml-6 sm:space-x-8 no-scrollbar items-center">
                {['dashboard', 'pos', 'products', 'categories', 'inventory', 'orders'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab as any)}
                      className={`${activeTab === tab ? 'border-teal-500 text-gray-900 bg-teal-50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'} whitespace-nowrap inline-flex items-center px-3 py-2 border-b-2 text-sm font-medium capitalize rounded-t-md transition-colors`}
                    >
                      {tab === 'pos' ? 'Punto de Venta' : tab === 'products' ? 'Productos' : tab === 'categories' ? 'Categorías' : tab === 'inventory' ? 'Inventario' : tab === 'orders' ? 'Pedidos' : 'Dashboard'}
                    </button>
                ))}
              </div>
            </div>
            <div className="flex items-center pl-4 bg-white shadow-[-10px_0_10px_-5px_rgba(255,255,255,1)]">
              <button onClick={onLogout} className="text-gray-500 hover:text-red-600 flex items-center gap-2">
                <span className="hidden sm:inline text-sm">Salir</span>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-4 px-2 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && renderDashboard()}
        
        {/* POS Tab Optimized */}
        {activeTab === 'pos' && (
            <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-9rem)]">
                {/* Left Column: Products */}
                <div className="w-full md:w-3/4 flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 bg-gray-50 space-y-3 shrink-0">
                        {/* Search */}
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded px-3 py-2">
                            <Search className="text-gray-400 h-4 w-4" />
                            <input 
                                type="text"
                                placeholder="Buscar producto (nombre, código)..."
                                className="w-full bg-transparent outline-none text-sm text-gray-700"
                                value={posSearch}
                                onChange={(e) => setPosSearch(e.target.value)}
                            />
                            {posSearch && <button onClick={() => setPosSearch('')}><X className="h-4 w-4 text-gray-400"/></button>}
                        </div>
                        {/* Categories Chips */}
                        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
                            <button 
                                onClick={() => setPosCategoryFilter('ALL')}
                                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${posCategoryFilter === 'ALL' ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Todos
                            </button>
                            {categories.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setPosCategoryFilter(c.name)}
                                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-colors flex items-center gap-1 ${posCategoryFilter === c.name ? 'bg-teal-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-grow overflow-y-auto p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 content-start">
                        {products
                            .filter(p => {
                                const matchesSearch = p.name.toLowerCase().includes(posSearch.toLowerCase());
                                const matchesCategory = posCategoryFilter === 'ALL' || p.category === posCategoryFilter;
                                return matchesSearch && matchesCategory;
                            })
                            .map(p => {
                                const hasBox = p.unitsPerBox && p.unitsPerBox > 1;
                                // Calculate stock availability for UI
                                const reserved = getReservedStock(p.id, posCart);
                                const available = Math.max(0, p.stock - reserved);
                                const unitsPerBox = p.unitsPerBox || 9999;

                                return (
                                    <div 
                                        key={p.id} 
                                        className={`border rounded-lg p-2 flex flex-col items-start relative transition-all duration-200 hover:shadow-md bg-white ${available <= 0 ? 'opacity-60 bg-gray-50' : 'hover:border-teal-400'}`}
                                    >
                                        <div 
                                            className="w-full h-24 mb-2 overflow-hidden rounded bg-gray-100 relative cursor-pointer"
                                            onClick={() => available > 0 && addToPosCart(p, 'UNIT')}
                                        >
                                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                            {available <= 0 && <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-[10px] font-bold uppercase tracking-wide">Agotado</div>}
                                        </div>
                                        
                                        <h4 
                                            className="font-bold text-xs text-gray-800 line-clamp-2 mb-1 leading-tight h-8 w-full cursor-pointer"
                                            onClick={() => available > 0 && addToPosCart(p, 'UNIT')}
                                        >
                                            {p.name}
                                        </h4>
                                        
                                        <div className="flex justify-between items-end w-full mt-auto">
                                            <div className="flex flex-col">
                                                <p className="text-teal-700 font-extrabold text-sm">${p.price.toFixed(2)}</p>
                                                {hasBox && <span className="text-[10px] text-gray-500">Unid.</span>}
                                            </div>
                                            
                                            <div className="flex items-center gap-1">
                                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${available < 5 ? 'bg-orange-100 text-orange-700 font-bold' : 'bg-gray-100 text-gray-500'}`}>
                                                    {available}
                                                </span>
                                                
                                                {/* Botón para agregar CAJA si existe */}
                                                {hasBox && available >= unitsPerBox && (
                                                    <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            addToPosCart(p, 'BOX');
                                                        }}
                                                        className="bg-blue-100 hover:bg-blue-200 text-blue-800 p-1 rounded transition-colors flex items-center gap-0.5 px-1.5"
                                                        title={`Agregar Caja ($${p.boxPrice})`}
                                                    >
                                                        <Package className="h-3 w-3" />
                                                        <span className="text-[10px] font-bold">x{p.unitsPerBox}</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </div>

                {/* Right Column: Ticket / Cart */}
                <div className="w-full md:w-1/4 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-[50vh] md:h-full">
                    {/* Ticket Header */}
                    <div className="p-3 bg-teal-600 text-white flex justify-between items-center rounded-t-lg shrink-0">
                        <span className="flex items-center gap-2 font-bold text-sm"><Store className="h-4 w-4"/> Ticket de Venta</span>
                        <button 
                            onClick={() => setPosCart([])} 
                            disabled={posCart.length === 0}
                            className="text-[10px] bg-teal-700 px-2 py-1 rounded hover:bg-teal-800 disabled:opacity-50"
                        >
                            Limpiar
                        </button>
                    </div>
                    
                    {/* Cart Items List */}
                    <div className="flex-grow overflow-y-auto p-2 space-y-1">
                        {posCart.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                                <ShoppingCart className="h-10 w-10 mb-2"/>
                                <span className="text-xs">Ticket vacío</span>
                            </div>
                        ) : (
                            posCart.map((item, index) => {
                                const isBox = item.selectedUnit === 'BOX';
                                const price = isBox ? (item.boxPrice || 0) : item.price;
                                return (
                                    <div key={`${item.id}-${item.selectedUnit}`} className="flex justify-between items-center border-b border-gray-100 pb-2 last:border-0 hover:bg-gray-50 p-1 rounded">
                                        <div className="flex-grow min-w-0 pr-2">
                                            <p className="font-medium text-gray-800 text-xs truncate flex items-center gap-1">
                                                {item.name}
                                                {isBox && <span className="bg-blue-100 text-blue-800 text-[9px] px-1 rounded font-bold whitespace-nowrap">CAJA x{item.unitsPerBox}</span>}
                                            </p>
                                            <p className="text-[10px] text-gray-500">${price.toFixed(2)} x {item.quantity}</p>
                                        </div>
                                        <div className="flex items-center gap-1 bg-gray-100 rounded px-1">
                                            <button onClick={() => updatePosQuantity(index, -1)} className="p-0.5 text-gray-500 hover:text-red-500"><Minus className="h-3 w-3"/></button>
                                            <span className="font-bold text-gray-700 text-xs w-4 text-center">{item.quantity}</span>
                                            <button onClick={() => updatePosQuantity(index, 1)} className="p-0.5 text-gray-500 hover:text-green-500"><Plus className="h-3 w-3"/></button>
                                        </div>
                                        <div className="flex flex-col items-end ml-2">
                                             <span className="font-bold text-gray-800 text-xs">${(price * item.quantity).toFixed(2)}</span>
                                             <button onClick={() => removePosItem(index)} className="text-[10px] text-red-400 hover:text-red-600"><Trash2 className="h-3 w-3"/></button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Totals & Payment Actions */}
                    <div className="p-3 bg-gray-50 border-t border-gray-200 shrink-0">
                        {/* Total Display */}
                        <div className="flex justify-between items-baseline mb-3">
                            <span className="text-gray-500 text-xs font-bold uppercase">Total a Pagar</span>
                            <span className="text-2xl font-black text-gray-800">${calculateCartTotal(posCart).toFixed(2)}</span>
                        </div>
                        
                        {/* Payment Method Toggle */}
                        <div className="flex bg-gray-200 rounded p-0.5 mb-3">
                            <button 
                                onClick={() => setPosPaymentMethod('CASH')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition-all ${posPaymentMethod === 'CASH' ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500'}`}
                            >
                                <Banknote className="h-3 w-3" /> Efectivo
                            </button>
                            <button 
                                onClick={() => setPosPaymentMethod('TRANSFER')}
                                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-bold transition-all ${posPaymentMethod === 'TRANSFER' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
                            >
                                <Store className="h-3 w-3" /> Transf.
                            </button>
                        </div>

                        {/* Cash Input */}
                        {posPaymentMethod === 'CASH' && (
                            <div className="mb-3 animate-in fade-in zoom-in duration-200">
                                <div className="flex gap-2 mb-2">
                                     <input 
                                        type="number" 
                                        className="w-1/2 border border-gray-300 rounded p-1.5 text-sm outline-none focus:border-teal-500 font-bold"
                                        placeholder="Recibido..."
                                        value={posCashReceived}
                                        onChange={(e) => setPosCashReceived(e.target.value)}
                                     />
                                     <div className="w-1/2 bg-white border border-gray-200 rounded p-1.5 flex flex-col justify-center px-2">
                                         <span className="text-[10px] text-gray-400 leading-none">Vuelto</span>
                                         <span className={`text-sm font-bold leading-tight ${
                                             (parseFloat(posCashReceived || '0') - calculateCartTotal(posCart)) < 0 
                                             ? 'text-red-500' 
                                             : 'text-green-600'
                                         }`}>
                                             ${Math.max(0, parseFloat(posCashReceived || '0') - calculateCartTotal(posCart)).toFixed(2)}
                                         </span>
                                     </div>
                                </div>
                                {/* Quick Cash Buttons */}
                                <div className="flex gap-1 overflow-x-auto no-scrollbar">
                                    <button onClick={() => setPosCashReceived(calculateCartTotal(posCart).toString())} className="px-2 py-1 bg-teal-100 text-teal-800 rounded text-[10px] font-bold hover:bg-teal-200 whitespace-nowrap">Exacto</button>
                                    {getQuickCashOptions(calculateCartTotal(posCart)).map(val => (
                                        <button key={val} onClick={() => setPosCashReceived(val.toString())} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] font-bold hover:bg-gray-300 whitespace-nowrap">${val}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <button 
                            onClick={handlePosCheckout}
                            disabled={posCart.length === 0 || isSubmitting}
                            className="w-full py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold shadow-lg shadow-teal-600/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5"/> : 'COBRAR'}
                        </button>
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'products' && (
             <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4">{editingId ? 'Editar' : 'Agregar'} Producto</h3>
                    <form onSubmit={handleProductSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input className="border p-2 rounded" placeholder="Nombre" value={prodName} onChange={e => setProdName(e.target.value)} required />
                            <select className="border p-2 rounded" value={prodCat} onChange={e => setProdCat(e.target.value)}>
                                <option value="">Categoría...</option>
                                {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        
                        {/* Precios y Cajas */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded border border-gray-200">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Precio Unitario ($)</label>
                                <input className="border p-2 rounded w-full" placeholder="0.00" type="number" step="0.01" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Unidades por Caja (Opcional)</label>
                                <input className="border p-2 rounded w-full" placeholder="Ej. 10, 30, 100" type="number" value={prodUnitsPerBox} onChange={e => setProdUnitsPerBox(e.target.value)} />
                            </div>
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Precio Caja ($) (Opcional)</label>
                                <input className="border p-2 rounded w-full" placeholder="0.00" type="number" step="0.01" value={prodBoxPrice} onChange={e => setProdBoxPrice(e.target.value)} />
                            </div>
                        </div>

                        <div className="flex gap-2 items-center">
                            <input type="file" ref={fileInputRef} onChange={(e) => handleImageUpload(e, setProdImage)} />
                            {prodImage && <img src={prodImage} className="h-10 w-10 object-cover" />}
                        </div>
                        <textarea className="border p-2 rounded w-full" placeholder="Descripción" value={prodDesc} onChange={e => setProdDesc(e.target.value)} required />
                        
                        <div className="flex justify-between items-center">
                            <button type="button" onClick={handleGenerateDesc} className="text-teal-600 text-sm text-left flex items-center gap-1">
                            {isGenerating ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
                            Generar Descripción con IA
                            </button>
                            <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded font-bold hover:bg-teal-700">Guardar</button>
                        </div>
                    </form>
                </div>
                <div className="bg-white rounded-lg shadow border border-gray-100">
                    {products.map(p => (
                        <div key={p.id} className="p-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex items-center gap-4">
                                <img src={p.image} className="h-12 w-12 rounded object-cover" />
                                <div>
                                    <p className="font-bold">{p.name}</p>
                                    <p className="text-sm text-gray-500">
                                        Unit: ${p.price} | Stock: {p.stock}
                                        {p.unitsPerBox && p.unitsPerBox > 1 && (
                                            <span className="ml-2 text-teal-600 font-medium">
                                                (Caja x{p.unitsPerBox}: ${p.boxPrice})
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto justify-end">
                                <button onClick={() => handleEditClick(p)} className="text-blue-500 p-2"><Edit2 className="h-5 w-5"/></button>
                                <button onClick={() => onDeleteProduct(p.id)} className="text-red-500 p-2"><Trash2 className="h-5 w-5"/></button>
                            </div>
                        </div>
                    ))}
                </div>
             </div>
        )}
        {activeTab === 'categories' && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold mb-4">Agregar Categoría</h3>
                    <form onSubmit={handleCategorySubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input 
                                className="border p-2 rounded w-full" 
                                placeholder="Nombre de la Categoría" 
                                value={catName} 
                                onChange={e => setCatName(e.target.value)} 
                                required 
                            />
                            <div className="flex gap-2 items-center">
                                <input 
                                    type="file" 
                                    ref={catFileInputRef} 
                                    onChange={(e) => handleImageUpload(e, setCatImage)} 
                                    className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                                />
                                {catImage && <img src={catImage} className="h-10 w-10 object-cover rounded shadow-sm" alt="Preview" />}
                            </div>
                        </div>
                        <button type="submit" disabled={isSubmitting} className="bg-teal-600 text-white px-6 py-2 rounded font-bold hover:bg-teal-700 disabled:opacity-50 flex items-center gap-2">
                            {isSubmitting ? <Loader2 className="animate-spin h-5 w-5"/> : <><Plus className="h-5 w-5" /> Guardar Categoría</>}
                        </button>
                    </form>
                </div>

                <div className="bg-white rounded-lg shadow border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-700">Categorías Existentes</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                    {categories.map(c => (
                            <div key={c.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <img src={c.image} className="h-12 w-12 rounded-lg object-cover shadow-sm" alt={c.name} />
                                    <span className="font-bold text-gray-800 text-lg">{c.name}</span>
                                </div>
                                <button 
                                    onClick={() => {
                                        if(window.confirm('¿Eliminar categoría? Los productos asociados podrían quedar sin categoría.')) {
                                            onDeleteCategory(c.id);
                                        }
                                    }} 
                                    className="text-red-500 p-2 hover:bg-red-50 rounded-full transition-colors"
                                    title="Eliminar Categoría"
                                >
                                    <Trash2 className="h-5 w-5"/>
                                </button>
                            </div>
                    ))}
                    {categories.length === 0 && (
                        <div className="p-8 text-center text-gray-400 italic">No hay categorías registradas.</div>
                    )}
                    </div>
                </div>
            </div>
        )}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'orders' && (
            <div className="space-y-4">
                {orders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                        {/* Header Row */}
                        <div className="flex justify-between items-start">
                            <div>
                                <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-600 mb-1">
                                    #{order.id.slice(-6)}
                                </span>
                                <h4 className="font-bold text-gray-900">{order.customerName}</h4>
                                <div className="text-sm text-gray-500 space-y-0.5 mt-1">
                                    <p className="flex items-center gap-1"><Phone size={14} className="text-gray-400"/> {order.customerPhone}</p>
                                    <p className="flex items-center gap-1"><MapPin size={14} className="text-gray-400"/> {order.customerAddress}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-black text-xl text-teal-700">${order.total.toFixed(2)}</p>
                                <div className={`text-xs font-bold px-2 py-1 rounded inline-flex items-center gap-1 mt-1 ${order.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                    {order.status === 'PENDING' ? <Clock size={12}/> : <CheckCircle size={12}/>}
                                    {order.status === 'PENDING' ? 'Pendiente' : 'Entregado'}
                                </div>
                                {/* Payment Method Badge */}
                                <div className="text-xs text-gray-500 mt-1 flex flex-col items-end gap-1">
                                    {order.paymentMethod === 'CASH' ? 
                                        <>
                                            <span className="flex items-center gap-1"><Banknote size={12}/> Efectivo</span>
                                            {order.cashGiven && (
                                                <span className="text-gray-400 text-[10px]">
                                                    Paga con: ${order.cashGiven} (Vuelto: ${(order.cashGiven - order.total).toFixed(2)})
                                                </span>
                                            )}
                                        </> 
                                        : 
                                        <span className="flex items-center gap-1"><Store size={12}/> Transf.</span>
                                    }
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <hr className="border-gray-100" />

                        {/* Items List */}
                        <div>
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Detalle del Pedido</p>
                            <ul className="space-y-2 bg-gray-50 p-3 rounded-md">
                                {order.items.map((item, idx) => {
                                    const isBox = item.selectedUnit === 'BOX';
                                    const price = isBox ? (item.boxPrice || 0) : item.price;
                                    return (
                                        <li key={idx} className="flex justify-between text-sm items-center border-b border-gray-100 last:border-0 pb-2 last:pb-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-gray-700 w-6">{item.quantity}x</span>
                                                <span className="text-gray-800">{item.name}</span>
                                                {isBox && <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">CAJA x{item.unitsPerBox}</span>}
                                            </div>
                                            <span className="text-gray-600 font-medium">${(price * item.quantity).toFixed(2)}</span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>

                        {/* Actions */}
                        {order.status === 'PENDING' && (
                            <div className="mt-2 flex justify-end">
                                <button onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')} className="bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold px-4 py-2 rounded-lg transition-colors flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" /> Marcar como Entregado
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default AdminPanel;