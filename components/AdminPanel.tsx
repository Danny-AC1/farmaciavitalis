import React, { useState, useRef, useMemo } from 'react';
import { Product, Order, Category, CartItem } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Package, DollarSign, CheckCircle, Clock, Trash2, Plus, Sparkles, LogOut, Edit2, Upload, X, Grid, LayoutGrid, ClipboardList, AlertTriangle, Store, ShoppingCart, Minus, CreditCard, Banknote, Search, Calendar, TrendingUp } from 'lucide-react';
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

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
  const [prodPrice, setProdPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImage, setProdImage] = useState<string>(''); // Base64 string
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
  const [posCashReceived, setPosCashReceived] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<'CASH' | 'CARD' | 'TRANSFER'>('CASH');

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
        setter(reader.result as string);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProductForm = () => {
    setEditingId(null);
    setProdName('');
    setProdPrice('');
    setProdDesc('');
    setProdCat(categories[0]?.name || '');
    setProdImage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Fallback if no category selected
    const finalCat = prodCat || categories[0]?.name || 'General';

    const finalImage = prodImage || "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300' fill='%23f1f5f9'%3E%3Crect width='300' height='300' /%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='16' fill='%2394a3b8'%3ESin Imagen%3C/text%3E%3C/svg%3E";

    // If ID is editingId, reuse it. If new, let DB generate it (or use temp).
    // Our addProductDB can handle temp IDs or we can pass a new one.
    // For simplicity with existing code structure:
    const tempId = editingId || Date.now().toString();

    const productData: Product = {
      id: tempId,
      name: prodName,
      price: parseFloat(prodPrice),
      description: prodDesc,
      category: finalCat,
      image: finalImage,
      stock: 100 // Default stock if new, overwritten below if editing
    };

    try {
      if (editingId) {
        // Preserve stock when editing product details
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
    if (!catName) return;
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
      alert("Error al guardar categoría");
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- POS Logic ---
  const addToPosCart = (product: Product) => {
    if (product.stock <= 0) return alert("Sin stock disponible");
    setPosCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // Don't exceed stock
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromPosCart = (id: string) => {
    setPosCart(prev => prev.filter(item => item.id !== id));
  };

  const updatePosQuantity = (id: string, delta: number) => {
    setPosCart(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        const maxStock = product ? product.stock : 999;
        const newQty = item.quantity + delta;
        
        if (newQty > maxStock) return item;
        if (newQty < 1) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const handlePosCheckout = async () => {
    if (posCart.length === 0) return;
    setIsSubmitting(true);

    const subtotal = posCart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    
    // Deduct Stock immediately
    for (const item of posCart) {
       const currentProduct = products.find(p => p.id === item.id);
       if (currentProduct) {
         await onUpdateStock(item.id, Math.max(0, currentProduct.stock - item.quantity));
       }
    }

    const newOrder: Order = {
      id: `POS-${Date.now()}`,
      customerName: 'Cliente en Local',
      customerPhone: '-',
      customerAddress: 'Tienda Física',
      items: posCart,
      subtotal: subtotal,
      deliveryFee: 0,
      total: subtotal,
      paymentMethod: posPaymentMethod,
      status: 'DELIVERED',
      source: 'POS',
      date: new Date().toISOString()
    };

    await onAddOrder(newOrder);
    setPosCart([]);
    setPosCashReceived('');
    setIsSubmitting(false);
    alert("Venta registrada correctamente");
  };

  // --- Reports Logic ---
  const getSalesData = useMemo(() => {
    const now = new Date();
    // Only count delivered/paid orders for reports
    const salesOrders = orders.filter(o => o.status === 'DELIVERED');
    const data: { [key: string]: number } = {};
    let totalPeriodSales = 0;

    if (reportPeriod === 'daily') {
      // Last 7 days
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
      // Last 8 weeks approx
       // Initialize last 8 weeks labels is tricky, let's simplify to "Week N"
       salesOrders.forEach(o => {
          const d = new Date(o.date);
          // Check if in current year
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
      // Current Year Months
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
      // All years
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

  // --- Render Sections ---

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
        {/* Top KPI Cards */}
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

        {/* Sales Report Section */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-teal-600" /> Reporte de Ventas
              </h3>
              <p className="text-sm text-gray-500">Visualiza el rendimiento de ventas por periodo.</p>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg mt-4 md:mt-0">
              <button 
                onClick={() => setReportPeriod('daily')}
                className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'daily' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >Diario</button>
              <button 
                onClick={() => setReportPeriod('weekly')}
                className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'weekly' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >Semanal</button>
              <button 
                onClick={() => setReportPeriod('monthly')}
                className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'monthly' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >Mensual</button>
              <button 
                onClick={() => setReportPeriod('yearly')}
                className={`px-4 py-1 text-sm rounded-md transition-all ${reportPeriod === 'yearly' ? 'bg-white text-teal-700 shadow font-bold' : 'text-gray-500 hover:text-gray-700'}`}
              >Anual</button>
            </div>
          </div>

          <div className="mb-6 bg-teal-50 border border-teal-100 rounded-lg p-4 flex items-center justify-between">
            <span className="text-teal-800 font-medium">Total Ventas ({
              reportPeriod === 'daily' ? 'Últimos 7 días' : 
              reportPeriod === 'weekly' ? 'Este Año (por semana)' : 
              reportPeriod === 'monthly' ? 'Este Año' : 'Histórico'
            })</span>
            <span className="text-2xl font-bold text-teal-700">${totalPeriodSales.toFixed(2)}</span>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} />
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
        
        {/* Secondary Charts Area */}
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
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
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
         <p className="text-sm text-gray-500 mb-6">Administra el stock disponible de cada producto. Los cambios se guardan automáticamente.</p>
         
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoría</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map(product => {
                  const isLowStock = product.stock < 10;
                  return (
                    <tr key={product.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                               <img className="h-10 w-10 rounded-full object-cover" src={product.image} alt="" />
                            </div>
                            <div className="ml-4">
                               <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                         <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                           {product.category}
                         </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                         <input 
                           type="number"
                           min="0"
                           className="w-24 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                           value={product.stock}
                           onChange={(e) => onUpdateStock(product.id, parseInt(e.target.value) || 0)}
                         />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLowStock ? (
                          <span className="flex items-center text-orange-600 text-xs font-bold">
                            <AlertTriangle className="h-4 w-4 mr-1" /> Bajo Stock
                          </span>
                        ) : (
                          <span className="flex items-center text-green-600 text-xs font-bold">
                            <CheckCircle className="h-4 w-4 mr-1" /> Disponible
                          </span>
                        )}
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

  const renderCategories = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <LayoutGrid className="h-5 w-5" /> Agregar Categoría
        </h3>
        <form onSubmit={handleCategorySubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
          <div className="md:col-span-2 flex flex-col md:flex-row gap-4 items-start">
             <div className="h-24 w-24 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {catImage ? (
                <img src={catImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">Sin imagen</span>
              )}
            </div>
            <div className="flex-grow w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen de Categoría</label>
              <input 
                type="file" 
                accept="image/*"
                ref={catFileInputRef}
                onChange={(e) => handleImageUpload(e, setCatImage)}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-teal-50 file:text-teal-700
                  hover:file:bg-teal-100"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre de Categoría</label>
            <input 
              required
              type="text" 
              value={catName} 
              onChange={e => setCatName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 border p-2" 
            />
          </div>
          <div>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded hover:bg-teal-700 transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar Categoría'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
           <h3 className="font-bold text-gray-700">Categorías Existentes ({categories.length})</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
          {categories.map(cat => (
             <div key={cat.id} className="border border-gray-200 rounded-lg p-3 flex items-center gap-4 bg-white shadow-sm">
                <div className="h-16 w-16 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                  <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-grow">
                   <h4 className="font-bold text-gray-800">{cat.name}</h4>
                </div>
                <button 
                  onClick={() => onDeleteCategory(cat.id)}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                  title="Eliminar Categoría"
                >
                   <Trash2 className="h-5 w-5" />
                </button>
             </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProducts = () => (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            {editingId ? <Edit2 className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
            {editingId ? 'Editar Producto' : 'Agregar Nuevo Producto'}
          </span>
          {editingId && (
            <button onClick={resetProductForm} className="text-sm text-red-500 hover:text-red-700 flex items-center gap-1">
              <X className="h-4 w-4" /> Cancelar Edición
            </button>
          )}
        </h3>
        <form onSubmit={handleProductSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Upload Section */}
          <div className="md:col-span-2 flex flex-col md:flex-row gap-4 items-start mb-2">
            <div className="h-32 w-32 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
              {prodImage ? (
                <img src={prodImage} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs text-gray-400 text-center px-2">Sin imagen</span>
              )}
            </div>
            <div className="flex-grow w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Imagen del Producto</label>
              <div className="flex gap-2">
                <input 
                  type="file" 
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={(e) => handleImageUpload(e, setProdImage)}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-teal-50 file:text-teal-700
                    hover:file:bg-teal-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input 
              required
              type="text" 
              value={prodName} 
              onChange={e => setProdName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 border p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Precio</label>
            <input 
              required
              type="number" 
              step="0.01"
              value={prodPrice} 
              onChange={e => setProdPrice(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 border p-2" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Categoría</label>
            {categories.length > 0 ? (
              <select 
                value={prodCat} 
                onChange={e => setProdCat(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 border p-2"
              >
                <option value="" disabled>Seleccionar Categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            ) : (
              <div className="mt-1 p-2 bg-yellow-50 text-yellow-800 text-sm rounded border border-yellow-200">
                Crea categorías primero en la pestaña "Categorías".
              </div>
            )}
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 flex justify-between">
              Descripción
              <button 
                type="button"
                onClick={handleGenerateDesc}
                disabled={isGenerating}
                className="text-xs text-teal-600 hover:text-teal-800 flex items-center gap-1 font-semibold"
              >
                <Sparkles className="h-3 w-3" /> 
                {isGenerating ? 'Generando...' : 'Generar con AI'}
              </button>
            </label>
            <textarea 
              required
              value={prodDesc}
              onChange={e => setProdDesc(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 border p-2"
              rows={3}
            />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className={`md:col-span-2 text-white py-2 px-4 rounded transition flex items-center justify-center gap-2 ${editingId ? 'bg-orange-500 hover:bg-orange-600' : 'bg-teal-600 hover:bg-teal-700'}`}
          >
            {isSubmitting ? 'Procesando...' : (editingId ? 'Actualizar Producto' : 'Guardar Producto')}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Imagen</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cat.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Precio</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map(product => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                   <img src={product.image} alt="" className="h-10 w-10 rounded-full object-cover border" />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{product.category}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${product.price.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                  <button onClick={() => handleEditClick(product)} className="text-blue-600 hover:text-blue-900" title="Editar">
                    <Edit2 className="h-5 w-5" />
                  </button>
                  <button onClick={() => onDeleteProduct(product.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="space-y-6">
      {orders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">No hay pedidos registrados.</div>
      ) : (
        orders.map(order => (
          <div key={order.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 border-b pb-4">
              <div>
                <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  Pedido #{order.id.slice(-6)} 
                  {order.source === 'POS' && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-0.5 rounded-full">POS</span>}
                </h4>
                <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString()}</p>
                <p className="text-sm font-medium mt-1">
                  Cliente: {order.customerName} | {order.customerPhone}
                </p>
                <p className="text-xs text-gray-400 mt-1">Dirección: {order.customerAddress}</p>
              </div>
              <div className="mt-4 md:mt-0 text-right">
                <span className={`inline-flex px-3 py-1 rounded-full text-sm font-bold ${
                  order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                }`}>
                  {order.status === 'DELIVERED' ? 'ENTREGADO' : 'PENDIENTE'}
                </span>
                <p className="text-xl font-bold mt-2 text-teal-700">${order.total.toFixed(2)}</p>
                <p className="text-xs text-gray-500">
                  {order.paymentMethod === 'CARD' ? 'Tarjeta' : order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transferencia'}
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded mb-4">
              <h5 className="text-xs font-bold uppercase text-gray-500 mb-2">Detalle de Compra</h5>
              <ul className="text-sm space-y-1">
                {order.items.map((item, idx) => (
                  <li key={idx} className="flex justify-between">
                    <span>{item.quantity}x {item.name}</span>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </li>
                ))}
                {order.deliveryFee > 0 && (
                  <li className="flex justify-between pt-2 border-t border-gray-200 font-medium">
                    <span>Envío</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </li>
                )}
              </ul>
            </div>

            {order.status === 'PENDING' && (
              <button 
                onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')}
                className="w-full md:w-auto bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 transition flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" /> Marcar como Entregado
              </button>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderPOS = () => {
    const posSubtotal = posCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const filteredProducts = products.filter(p => 
      p.name.toLowerCase().includes(posSearch.toLowerCase()) || 
      p.category.toLowerCase().includes(posSearch.toLowerCase())
    );
    const change = posCashReceived ? (parseFloat(posCashReceived) - posSubtotal) : 0;

    return (
      <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-12rem)]">
        {/* Left Side: Product Grid */}
        <div className="w-full md:w-2/3 flex flex-col bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Search className="text-gray-400 h-5 w-5" />
            <input 
              type="text"
              placeholder="Buscar producto por nombre o categoría..."
              className="w-full bg-transparent outline-none text-gray-700"
              value={posSearch}
              onChange={(e) => setPosSearch(e.target.value)}
            />
          </div>
          <div className="flex-grow overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
              <div 
                key={p.id} 
                onClick={() => addToPosCart(p)}
                className={`cursor-pointer border rounded-lg p-3 flex flex-col items-center text-center transition hover:shadow-md ${p.stock <= 0 ? 'opacity-50 grayscale cursor-not-allowed' : 'hover:border-teal-400 bg-white'}`}
              >
                <img src={p.image} alt={p.name} className="h-20 w-20 object-cover rounded mb-2" />
                <h4 className="font-bold text-sm text-gray-800 line-clamp-2">{p.name}</h4>
                <p className="text-teal-600 font-bold">${p.price.toFixed(2)}</p>
                <p className={`text-xs mt-1 ${p.stock < 5 ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>Stock: {p.stock}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Cart & Checkout */}
        <div className="w-full md:w-1/3 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col h-full">
           <div className="p-4 bg-teal-600 text-white font-bold flex justify-between items-center rounded-t-lg">
             <span className="flex items-center gap-2"><Store className="h-5 w-5"/> Ticket Actual</span>
             <button onClick={() => setPosCart([])} className="text-xs bg-teal-700 px-2 py-1 rounded hover:bg-teal-800">Limpiar</button>
           </div>
           
           <div className="flex-grow overflow-y-auto p-4 space-y-3">
             {posCart.length === 0 ? (
               <div className="h-full flex flex-col items-center justify-center text-gray-400">
                 <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                 <p>Carrito vacío</p>
               </div>
             ) : (
               posCart.map(item => (
                 <div key={item.id} className="flex justify-between items-center border-b pb-2">
                   <div className="flex-grow">
                     <p className="font-medium text-gray-800">{item.name}</p>
                     <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                   </div>
                   <div className="flex items-center gap-2">
                     <button onClick={() => updatePosQuantity(item.id, -1)} className="p-1 text-gray-400 hover:text-red-500"><Minus className="h-4 w-4"/></button>
                     <span className="font-bold text-gray-700">{item.quantity}</span>
                     <button onClick={() => updatePosQuantity(item.id, 1)} className="p-1 text-gray-400 hover:text-green-500"><Plus className="h-4 w-4"/></button>
                   </div>
                   <div className="ml-3 font-bold text-gray-800 w-16 text-right">
                     ${(item.price * item.quantity).toFixed(2)}
                   </div>
                 </div>
               ))
             )}
           </div>

           <div className="p-4 bg-gray-50 border-t border-gray-200">
             <div className="flex justify-between text-xl font-bold text-gray-800 mb-4">
               <span>Total</span>
               <span>${posSubtotal.toFixed(2)}</span>
             </div>

             <div className="mb-4">
               <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">Método de Pago</label>
               <div className="grid grid-cols-3 gap-2">
                 <button 
                  onClick={() => setPosPaymentMethod('CASH')}
                  className={`flex flex-col items-center justify-center p-2 rounded border text-xs ${posPaymentMethod === 'CASH' ? 'bg-teal-100 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-600'}`}
                 >
                   <Banknote className="h-4 w-4 mb-1" /> Efectivo
                 </button>
                 <button 
                  onClick={() => setPosPaymentMethod('CARD')}
                  className={`flex flex-col items-center justify-center p-2 rounded border text-xs ${posPaymentMethod === 'CARD' ? 'bg-teal-100 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-600'}`}
                 >
                   <CreditCard className="h-4 w-4 mb-1" /> Tarjeta
                 </button>
                 <button 
                  onClick={() => setPosPaymentMethod('TRANSFER')}
                  className={`flex flex-col items-center justify-center p-2 rounded border text-xs ${posPaymentMethod === 'TRANSFER' ? 'bg-teal-100 border-teal-500 text-teal-800' : 'bg-white border-gray-200 text-gray-600'}`}
                 >
                   <Store className="h-4 w-4 mb-1" /> Transf.
                 </button>
               </div>
             </div>

             {posPaymentMethod === 'CASH' && (
               <div className="mb-4">
                 <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-gray-500 uppercase">Dinero Recibido</label>
                    <span className="text-xs font-bold text-gray-400">Vuelto: <span className={change < 0 ? 'text-red-500' : 'text-green-600'}>${Math.max(0, change).toFixed(2)}</span></span>
                 </div>
                 <input 
                   type="number" 
                   className="w-full border border-gray-300 rounded p-2 focus:ring-2 focus:ring-teal-500 outline-none"
                   placeholder="0.00"
                   value={posCashReceived}
                   onChange={(e) => setPosCashReceived(e.target.value)}
                 />
               </div>
             )}

             <button 
               onClick={handlePosCheckout}
               disabled={posCart.length === 0 || isSubmitting}
               className={`w-full py-3 rounded-lg font-bold text-white shadow-sm transition ${posCart.length === 0 || isSubmitting ? 'bg-gray-300 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'}`}
             >
               {isSubmitting ? 'Procesando...' : `COBRAR $${(posSubtotal).toFixed(2)}`}
             </button>
           </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center text-teal-700 font-bold text-xl">
                Panel Admin
              </div>
              <div className="hidden sm:-my-px sm:ml-6 sm:flex sm:space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`${activeTab === 'dashboard' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Finanzas
                </button>
                <button
                  onClick={() => setActiveTab('pos')}
                  className={`${activeTab === 'pos' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Punto de Venta
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`${activeTab === 'products' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Productos
                </button>
                 <button
                  onClick={() => setActiveTab('inventory')}
                  className={`${activeTab === 'inventory' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Inventario
                </button>
                <button
                  onClick={() => setActiveTab('categories')}
                  className={`${activeTab === 'categories' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Categorías
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`${activeTab === 'orders' ? 'border-teal-500 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  Pedidos
                </button>
              </div>
            </div>
            <div className="flex items-center">
              <button onClick={onLogout} className="text-gray-500 hover:text-red-600 flex items-center gap-2">
                <span className="text-sm">Salir</span>
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'pos' && renderPOS()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'categories' && renderCategories()}
        {activeTab === 'inventory' && renderInventory()}
        {activeTab === 'orders' && renderOrders()}
      </div>
    </div>
  );
};

export default AdminPanel;