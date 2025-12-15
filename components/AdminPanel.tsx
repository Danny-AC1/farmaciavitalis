import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Product, Order, Category, CartItem, User, Supplier, SearchLog, Banner } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CheckCircle, Trash2, Sparkles, LogOut, Edit2, X, ShoppingCart, Minus, Plus, Search, TrendingUp, Loader2, FileDown, PenTool, ScanBarcode, Share2, Copy, MessageCircle, Image as ImageIcon, Instagram } from 'lucide-react';
import { generateProductDescription, generateSocialPost } from '../services/gemini';
import { GoogleGenAI } from "@google/genai";
import BarcodeScanner from './BarcodeScanner';
import { streamUsers, streamSuppliers, addSupplierDB, deleteSupplierDB, streamSearchLogs, addBlogPostDB, streamBanners, addBannerDB, deleteBannerDB, uploadImageToStorage } from '../services/db';

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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'products' | 'categories' | 'inventory' | 'orders' | 'users' | 'marketing' | 'suppliers' | 'demand'>('dashboard');
  
  // Dashboard / Reports State
  const [reportPeriod, setReportPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');

  // Extended Data State
  const [users, setUsers] = useState<User[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);

  // Forms State
  const [supplierForm, setSupplierForm] = useState({ name: '', contactName: '', phone: '', email: '' });
  
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
  
  // Load Data Streams
  useEffect(() => {
      const unsubUsers = streamUsers((data) => setUsers(data));
      const unsubSuppliers = streamSuppliers((data) => setSuppliers(data));
      const unsubLogs = streamSearchLogs((data) => setSearchLogs(data));
      const unsubBanners = streamBanners((data) => setBanners(data));

      return () => { unsubUsers(); unsubSuppliers(); unsubLogs(); unsubBanners(); };
  }, []);

  // Stats logic
  const totalRevenue = orders.filter(o => o.status === 'DELIVERED').reduce((acc, curr) => acc + curr.total, 0);
  const totalProfit = orders.filter(o => o.status === 'DELIVERED').reduce((acc, order) => {
      let cost = 0;
      order.items.forEach(item => {
          const product = products.find(p => p.id === item.id);
          const unitCost = product?.costPrice || 0; 
          const units = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
          cost += unitCost * (item.quantity * units);
      });
      return acc + (order.total - cost);
  }, 0);

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

      setPosCart([]);
      setPosCashReceived('');
      alert("Venta registrada correctamente");
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

    const productData: Product = {
      id: tempId,
      name: prodName,
      price: parseFloat(prodPrice),
      costPrice: parseFloat(prodCostPrice) || undefined,
      description: prodDesc,
      category: finalCat,
      image: finalImage,
      stock: 100,
      unitsPerBox: parseInt(prodUnitsPerBox) || undefined,
      boxPrice: parseFloat(prodBoxPrice) || undefined,
      barcode: prodBarcode || undefined,
      expiryDate: prodExpiry || undefined,
      supplierId: prodSupplier || undefined
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Admin */}
      <div className="bg-white shadow sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex flex-1 overflow-hidden">
              <div className="flex-shrink-0 flex items-center text-teal-700 font-bold text-xl mr-4">Panel {currentUserRole}</div>
              <div className="flex -my-px space-x-4 overflow-x-auto pb-1 sm:ml-6 sm:space-x-8 no-scrollbar items-center">
                <button onClick={() => setActiveTab('dashboard')} className={`${activeTab === 'dashboard' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Dashboard</button>
                <button onClick={() => setActiveTab('pos')} className={`${activeTab === 'pos' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>POS</button>
                <button onClick={() => setActiveTab('orders')} className={`${activeTab === 'orders' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Pedidos</button>
                
                {/* Restricted Tabs */}
                {isAdmin && (
                    <>
                        <button onClick={() => setActiveTab('products')} className={`${activeTab === 'products' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Productos</button>
                        <button onClick={() => setActiveTab('inventory')} className={`${activeTab === 'inventory' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Inventario</button>
                        <button onClick={() => setActiveTab('categories')} className={`${activeTab === 'categories' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Categorías</button>
                        <button onClick={() => setActiveTab('suppliers')} className={`${activeTab === 'suppliers' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Proveedores</button>
                        <button onClick={() => setActiveTab('marketing')} className={`${activeTab === 'marketing' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Marketing</button>
                        <button onClick={() => setActiveTab('demand')} className={`${activeTab === 'demand' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Demanda</button>
                        <button onClick={() => setActiveTab('users')} className={`${activeTab === 'users' ? 'border-teal-500 text-gray-900 bg-teal-50' : 'text-gray-500'} px-3 py-2 border-b-2 text-sm font-medium`}>Usuarios</button>
                    </>
                )}
              </div>
            </div>
            <div className="flex items-center pl-4 bg-white">
              <button onClick={onLogout} className="text-gray-500 hover:text-red-600 flex items-center gap-2">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-4 px-2 sm:px-6 lg:px-8">
        
        {/* Render Tabs */}
        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-in fade-in">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold">Resumen General</h2>
                        <select className="border rounded p-1" value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value as any)}>
                            <option value="daily">Hoy</option>
                            <option value="weekly">Semana</option>
                            <option value="monthly">Mes</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <div className="bg-teal-50 p-4 rounded-lg border border-teal-100">
                            <p className="text-gray-500 text-sm font-bold uppercase">Ventas Totales</p>
                            <p className="text-2xl font-black text-teal-700">${totalRevenue.toFixed(2)}</p>
                        </div>
                        {isAdmin && (
                            <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                <p className="text-gray-500 text-sm font-bold uppercase">Ganancia Neta</p>
                                <p className="text-2xl font-black text-green-700">${totalProfit.toFixed(2)}</p>
                            </div>
                        )}
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                            <p className="text-gray-500 text-sm font-bold uppercase">Pedidos Pendientes</p>
                            <p className="text-2xl font-black text-blue-700">{orders.filter(o => o.status === 'PENDING').length}</p>
                        </div>
                    </div>

                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="ventas" fill="#0d9488" name="Ventas ($)" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {/* --- POS Tab --- */}
        {activeTab === 'pos' && (
             <div className="bg-white p-4 md:p-6 rounded shadow animate-in fade-in flex flex-col md:flex-row gap-6 h-[85vh]">
                 {showScanner && <BarcodeScanner onScan={(code) => { 
                     const p = products.find(prod => prod.barcode === code);
                     if(p) { addToPosCart(p); setShowScanner(false); } else { alert("Producto no encontrado"); setShowScanner(false); }
                 }} onClose={() => setShowScanner(false)} />}
                 
                 <div className="w-full md:w-2/3 flex flex-col">
                     <div className="flex gap-2 mb-4">
                         <div className="relative flex-grow">
                             <input className="w-full border p-2 pl-8 rounded" placeholder="Buscar producto o código..." value={posSearch} onChange={e => setPosSearch(e.target.value)} autoFocus />
                             <Search className="absolute left-2 top-2.5 text-gray-400 h-4 w-4"/>
                         </div>
                         <button onClick={() => setShowScanner(true)} className="bg-gray-800 text-white p-2 rounded"><ScanBarcode/></button>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto pr-2">
                         {products.filter(p => p.name.toLowerCase().includes(posSearch.toLowerCase()) || p.barcode === posSearch).map(p => (
                             <div key={p.id} onClick={() => addToPosCart(p)} className="border rounded p-3 cursor-pointer hover:border-teal-500 hover:shadow-md transition">
                                 <p className="font-bold text-sm truncate">{p.name}</p>
                                 <p className="text-teal-600 font-bold">${p.price.toFixed(2)}</p>
                                 <p className="text-xs text-gray-400">Stock: {p.stock}</p>
                             </div>
                         ))}
                     </div>
                 </div>

                 <div className="w-full md:w-1/3 bg-gray-50 border-l p-4 flex flex-col">
                     <h3 className="font-bold mb-4 flex items-center gap-2"><ShoppingCart size={18}/> Carrito Actual</h3>
                     <div className="flex-grow overflow-y-auto space-y-2 mb-4">
                         {posCart.map(item => (
                             <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded border">
                                 <div className="flex-grow">
                                     <p className="text-sm font-medium">{item.name}</p>
                                     <p className="text-xs text-gray-500">${item.price.toFixed(2)} x {item.quantity}</p>
                                 </div>
                                 <div className="flex items-center gap-2">
                                     <p className="font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                                     <button onClick={() => removeFromPosCart(item.id)} className="text-red-500"><X size={14}/></button>
                                 </div>
                             </div>
                         ))}
                     </div>
                     <div className="border-t pt-4 space-y-3">
                         <div className="flex justify-between text-xl font-black"><span>Total</span><span>${posTotal.toFixed(2)}</span></div>
                         <div className="flex gap-2">
                             <button onClick={() => setPosPaymentMethod('CASH')} className={`flex-1 py-2 rounded border ${posPaymentMethod === 'CASH' ? 'bg-teal-100 border-teal-500 text-teal-800' : 'bg-white'}`}>Efectivo</button>
                             <button onClick={() => setPosPaymentMethod('TRANSFER')} className={`flex-1 py-2 rounded border ${posPaymentMethod === 'TRANSFER' ? 'bg-blue-100 border-blue-500 text-blue-800' : 'bg-white'}`}>Transf.</button>
                         </div>
                         {posPaymentMethod === 'CASH' && (
                             <input type="number" placeholder="Dinero recibido" className="w-full border p-2 rounded" value={posCashReceived} onChange={e => setPosCashReceived(e.target.value)} />
                         )}
                         <button onClick={handlePosCheckout} className="w-full bg-teal-600 text-white py-3 rounded font-bold hover:bg-teal-700">COBRAR</button>
                     </div>
                 </div>
             </div>
        )}

        {/* --- INVENTORY TAB --- */}
        {activeTab === 'inventory' && isAdmin && (
            <div className="bg-white p-6 rounded shadow animate-in fade-in">
                <div className="flex justify-between mb-4">
                    <h3 className="font-bold text-lg">Control de Inventario</h3>
                    <div className="relative">
                        <input className="border p-2 pl-8 rounded" placeholder="Buscar..." value={inventorySearch} onChange={e => setInventorySearch(e.target.value)} />
                        <Search className="absolute left-2 top-2.5 text-gray-400 h-4 w-4"/>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr className="bg-gray-50">
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock Actual</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {products.filter(p => p.name.toLowerCase().includes(inventorySearch.toLowerCase())).map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.stock < 10 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                            {p.stock}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center gap-2">
                                        <button onClick={() => onUpdateStock(p.id, p.stock - 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Minus size={16}/></button>
                                        <button onClick={() => onUpdateStock(p.id, p.stock + 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Plus size={16}/></button>
                                        <input 
                                            type="number" 
                                            className="w-20 border rounded p-1 ml-2 text-center" 
                                            defaultValue={p.stock}
                                            onBlur={(e) => onUpdateStock(p.id, parseInt(e.target.value))}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* --- CATEGORIES TAB --- */}
        {activeTab === 'categories' && isAdmin && (
            <div className="bg-white p-6 rounded shadow animate-in fade-in">
                <h3 className="font-bold text-lg mb-4">Gestión de Categorías</h3>
                <form onSubmit={handleCategorySubmit} className="flex gap-4 mb-8 bg-gray-50 p-4 rounded items-end">
                    <div className="flex-grow">
                        <label className="block text-xs font-bold text-gray-500 mb-1">Nombre</label>
                        <input className="w-full border p-2 rounded" value={catName} onChange={e => setCatName(e.target.value)} required />
                    </div>
                    {/* Simplified Image Input */}
                    <button className="bg-teal-600 text-white px-4 py-2 rounded font-bold h-10">Crear</button>
                </form>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {categories.map(c => (
                        <div key={c.id} className="border rounded p-4 relative group">
                            <img src={c.image} className="h-20 w-full object-contain mb-2 mix-blend-multiply" />
                            <p className="font-bold text-center">{c.name}</p>
                            <button onClick={() => onDeleteCategory(c.id)} className="absolute top-2 right-2 bg-red-100 text-red-500 p-1 rounded opacity-0 group-hover:opacity-100 transition"><Trash2 size={14}/></button>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- ORDERS TAB --- */}
        {activeTab === 'orders' && (
            <div className="bg-white p-6 rounded shadow animate-in fade-in">
                <h3 className="font-bold text-lg mb-4">Historial de Pedidos</h3>
                <div className="space-y-4">
                    {orders.map(order => (
                        <div key={order.id} className="border rounded-lg p-4 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-bold text-lg">{order.customerName}</p>
                                    <p className="text-sm text-gray-500">{new Date(order.date).toLocaleString()} • {order.paymentMethod}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-xl text-teal-700">${order.total.toFixed(2)}</p>
                                    <span className={`text-xs px-2 py-1 rounded font-bold ${order.status === 'DELIVERED' ? 'bg-green-100 text-green-700' : order.status === 'IN_TRANSIT' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-3 pl-2 border-l-2 border-gray-200">
                                {order.items.map(i => <p key={i.id}>{i.quantity}x {i.name}</p>)}
                            </div>
                            {order.status !== 'DELIVERED' && (
                                <div className="flex justify-end gap-2">
                                    <button onClick={() => onUpdateOrderStatus(order.id, 'DELIVERED')} className="bg-green-600 text-white px-4 py-2 rounded text-sm font-bold flex items-center gap-2">
                                        <CheckCircle size={16}/> Marcar Entregado
                                    </button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* --- USERS TAB --- */}
        {activeTab === 'users' && isAdmin && (
            <div className="bg-white p-6 rounded shadow animate-in fade-in">
                <h3 className="font-bold text-lg mb-4">Usuarios Registrados</h3>
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Puntos</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {users.map(u => (
                            <tr key={u.uid}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.displayName}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"><span className="bg-gray-100 px-2 py-1 rounded text-xs">{u.role}</span></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-600 font-bold">{u.points}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

        {/* --- SUPPLIERS TAB --- */}
        {activeTab === 'suppliers' && isAdmin && (
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                         <h3 className="text-lg font-bold">Gestión de Proveedores</h3>
                         <button onClick={handleGeneratePurchaseList} className="bg-blue-100 text-blue-700 px-3 py-2 rounded text-sm font-bold hover:bg-blue-200 flex items-center gap-2"><FileDown size={16}/> Lista de Compra</button>
                    </div>
                    <form onSubmit={handleSupplierSubmit} className="flex flex-wrap gap-4 items-end bg-gray-50 p-4 rounded">
                        <input className="border p-2 rounded" placeholder="Empresa" value={supplierForm.name} onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} required />
                        <input className="border p-2 rounded" placeholder="Contacto" value={supplierForm.contactName} onChange={e => setSupplierForm({...supplierForm, contactName: e.target.value})} />
                        <input className="border p-2 rounded" placeholder="Teléfono" value={supplierForm.phone} onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} />
                        <button className="bg-teal-600 text-white px-4 py-2 rounded font-bold">Agregar</button>
                    </form>
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {suppliers.map(s => (
                            <div key={s.id} className="p-4 border rounded shadow-sm relative">
                                <h4 className="font-bold">{s.name}</h4>
                                <p className="text-sm text-gray-500">{s.contactName} • {s.phone}</p>
                                <button onClick={() => deleteSupplierDB(s.id)} className="absolute top-2 right-2 text-red-400"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}

        {/* --- DEMAND REPORT TAB --- */}
        {activeTab === 'demand' && isAdmin && (
             <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><TrendingUp className="text-red-500"/> Demanda Insatisfecha</h3>
                 <p className="text-sm text-gray-500 mb-4">Productos que los clientes buscan pero no encuentran (0 resultados).</p>
                 <table className="min-w-full divide-y divide-gray-200">
                     <thead><tr><th className="text-left py-2">Término Buscado</th><th className="text-left py-2">Fecha</th><th className="text-left py-2">Intentos</th></tr></thead>
                     <tbody>
                         {searchLogs.map(log => (
                             <tr key={log.id}>
                                 <td className="py-2 font-bold text-gray-800">{log.term}</td>
                                 <td className="py-2 text-gray-500">{log.date}</td>
                                 <td className="py-2"><span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-bold">{log.count}</span></td>
                             </tr>
                         ))}
                     </tbody>
                 </table>
             </div>
        )}

        {/* --- MARKETING (Including Blog & Social) --- */}
        {activeTab === 'marketing' && isAdmin && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
                
                {/* 1. Generador de Redes Sociales */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-blue-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-blue-700"><Share2 className="h-5 w-5"/> Generador de Redes Sociales</h3>
                    <p className="text-sm text-gray-500 mb-4">Selecciona un producto y crea un post atractivo en segundos.</p>
                    
                    <div className="space-y-4">
                        <select className="w-full border p-2 rounded" value={marketingProduct} onChange={e => setMarketingProduct(e.target.value)}>
                            <option value="">-- Seleccionar Producto --</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name} (${p.price})</option>)}
                        </select>
                        
                        <div className="flex gap-2 bg-gray-50 p-2 rounded">
                             <button onClick={() => setPostPlatform('INSTAGRAM')} className={`flex-1 py-1 rounded text-sm font-bold flex items-center justify-center gap-2 ${postPlatform === 'INSTAGRAM' ? 'bg-pink-100 text-pink-700' : 'text-gray-500'}`}>
                                 <Instagram size={16}/> Instagram/FB
                             </button>
                             <button onClick={() => setPostPlatform('WHATSAPP')} className={`flex-1 py-1 rounded text-sm font-bold flex items-center justify-center gap-2 ${postPlatform === 'WHATSAPP' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}>
                                 <MessageCircle size={16}/> WhatsApp
                             </button>
                        </div>

                        <button onClick={handleGeneratePost} disabled={isGenerating || !marketingProduct} className="w-full bg-blue-600 text-white py-2 rounded font-bold flex items-center justify-center gap-2">
                             {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={16}/>} Generar Post
                        </button>

                        {generatedPost && (
                            <div className="mt-4">
                                <textarea className="w-full border p-2 rounded text-sm h-32" value={generatedPost} onChange={(e) => setGeneratedPost(e.target.value)}></textarea>
                                <div className="flex gap-2 mt-2">
                                    <button onClick={() => navigator.clipboard.writeText(generatedPost)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded text-xs font-bold flex items-center justify-center gap-2"><Copy size={14}/> Copiar</button>
                                    {postPlatform === 'WHATSAPP' && (
                                        <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(generatedPost)}`)} className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 py-2 rounded text-xs font-bold flex items-center justify-center gap-2"><MessageCircle size={14}/> Abrir WhatsApp</button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. Banners y Promociones */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-yellow-100">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-yellow-700"><ImageIcon className="h-5 w-5"/> Banners Promocionales</h3>
                    <div className="mb-6 space-y-3">
                         <div className="flex gap-2">
                            <input className="flex-grow border p-2 rounded" placeholder="Título del Banner (Opcional)" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)}/>
                         </div>
                         <input type="file" accept="image/*" ref={bannerInputRef} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-yellow-50 file:text-yellow-700 hover:file:bg-yellow-100"/>
                         <button onClick={handleAddBanner} disabled={isUploadingBanner} className="bg-yellow-600 text-white px-4 py-2 rounded font-bold w-full disabled:opacity-50">
                             {isUploadingBanner ? 'Subiendo...' : 'Publicar Banner'}
                         </button>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                        {banners.map(b => (
                            <div key={b.id} className="flex items-center gap-3 p-2 border rounded bg-gray-50 relative group">
                                <img src={b.image} className="h-10 w-20 object-cover rounded"/>
                                <p className="text-sm font-medium truncate flex-grow">{b.title || 'Sin Título'}</p>
                                <button onClick={() => deleteBannerDB(b.id)} className="text-red-500 opacity-0 group-hover:opacity-100 transition"><Trash2 size={16}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Generador de Blog (Full Width) */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-purple-100 border-l-4 border-l-purple-500 lg:col-span-2">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-purple-700"><PenTool className="h-5 w-5"/> Generador de Blog IA</h3>
                    <div className="flex gap-4">
                        <input className="flex-grow border p-2 rounded" placeholder="Tema del artículo (Ej: Beneficios de la Vitamina C)" value={blogTopic} onChange={e => setBlogTopic(e.target.value)} />
                        <button onClick={handleGenerateBlog} disabled={isGenerating || !blogTopic} className="bg-purple-600 text-white px-4 py-2 rounded font-bold flex items-center gap-2">
                            {isGenerating ? <Loader2 className="animate-spin"/> : <Sparkles size={16}/>} Generar
                        </button>
                    </div>
                </div>

            </div>
        )}

        {/* --- PRODUCTS TAB --- */}
        {activeTab === 'products' && isAdmin && (
             <div className="bg-white p-6 rounded shadow">
                 <h3 className="font-bold mb-4">Gestión de Productos</h3>
                 <form onSubmit={handleProductSubmit} className="space-y-4 mb-8">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input className="border p-2 rounded w-full" placeholder="Nombre del Producto" value={prodName} onChange={e => setProdName(e.target.value)} required />
                        <input className="border p-2 rounded w-full" placeholder="Código de Barras (Opcional)" value={prodBarcode} onChange={e => setProdBarcode(e.target.value)} />
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                         <input className="border p-2 rounded" type="number" placeholder="Precio Venta" value={prodPrice} onChange={e => setProdPrice(e.target.value)} required />
                         <input className="border p-2 rounded" type="number" placeholder="Costo" value={prodCostPrice} onChange={e => setProdCostPrice(e.target.value)} />
                         <input className="border p-2 rounded" type="number" placeholder="Unidades por Caja" value={prodUnitsPerBox} onChange={e => setProdUnitsPerBox(e.target.value)} />
                         <input className="border p-2 rounded" type="number" placeholder="Precio Caja" value={prodBoxPrice} onChange={e => setProdBoxPrice(e.target.value)} />
                     </div>
                     
                     <div className="flex gap-2">
                        <textarea className="border p-2 rounded w-full" placeholder="Descripción" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
                        <button type="button" onClick={handleGenerateDescription} className="bg-purple-100 text-purple-600 px-3 rounded hover:bg-purple-200" title="Generar con IA"><Sparkles size={20}/></button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <select className="border p-2 rounded" value={prodCat} onChange={e => setProdCat(e.target.value)}>
                            <option value="">Categoría...</option>
                            {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                        <select className="border p-2 rounded" value={prodSupplier} onChange={e => setProdSupplier(e.target.value)}>
                             <option value="">Seleccionar Proveedor...</option>
                             {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                         <div className="flex items-center gap-2">
                            <input 
                                type="file" 
                                accept="image/*" 
                                ref={fileInputRef}
                                className="text-sm"
                                onChange={(e) => handleImageUpload(e, setProdImage)}
                            />
                        </div>
                     </div>
                     
                     <button className="bg-teal-600 text-white px-4 py-2 rounded font-bold w-full md:w-auto">{isSubmitting ? 'Guardando...' : 'Guardar Producto'}</button>
                     {editingId && <button type="button" onClick={resetProductForm} className="ml-2 text-gray-500">Cancelar Edición</button>}
                 </form>

                 <div className="border-t pt-4">
                     {products.map(p => (
                         <div key={p.id} className="border-b p-2 flex justify-between items-center hover:bg-gray-50">
                             <div className="flex items-center gap-3">
                                 <img src={p.image} className="h-10 w-10 object-contain rounded" />
                                 <div>
                                     <p className="font-bold text-sm">{p.name}</p>
                                     <p className="text-xs text-gray-500">${p.price.toFixed(2)} | Stock: {p.stock}</p>
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <button onClick={() => handleEditClick(p)}><Edit2 size={16} className="text-blue-500"/></button>
                                 <button onClick={() => onDeleteProduct(p.id)}><Trash2 size={16} className="text-red-500"/></button>
                             </div>
                         </div>
                     ))}
                 </div>
             </div>
        )}

      </div>
    </div>
  );
};

export default AdminPanel;