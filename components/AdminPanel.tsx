
import React, { useRef, useEffect } from 'react';
import { Product, Order, Category } from '../types';
import { Menu, Bell, Layout, X, Calculator, Printer } from 'lucide-react';
import { useAdminPanelState } from '../hooks/useAdminPanelState';
import { uploadImageToStorage } from '../services/db';

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
import AdminGeoStats from './AdminGeoStats';
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

const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  const state = useAdminPanelState(
    props.products, props.categories, props.orders, props.onAddProduct, 
    props.onEditProduct, props.onDeleteProduct, props.onUpdateStock, 
    props.onAddCategory, props.onUpdateOrderStatus
  );

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
            state.setShowNotifications(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state]);

  const pendingCount = props.orders.filter(o => o.status === 'PENDING').length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <AdminSidebar activeTab={state.activeTab} setActiveTab={state.setActiveTab} onLogout={props.onLogout} isAdmin={props.currentUserRole === 'ADMIN'} isMobileOpen={state.isSidebarOpen} setIsMobileOpen={state.setIsSidebarOpen} />
      
      <main className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
          <header className="h-16 md:h-20 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-10 shrink-0 z-30 shadow-sm">
             <div className="flex items-center gap-4">
                <button onClick={() => state.setIsSidebarOpen(true)} className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"><Menu size={24}/></button>
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-xl hidden sm:block"><Layout className="text-white" size={20}/></div>
                    <div>
                        <h1 className="text-base md:text-lg font-black text-slate-800 leading-tight">Vitalis <span className="text-teal-600">Admin</span></h1>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Panel de Control v2.5</p>
                    </div>
                </div>
             </div>
             
             <div className="flex items-center gap-3 md:gap-5 relative" ref={notificationRef}>
                 <button onClick={() => state.setShowNotifications(!state.showNotifications)} className={`relative p-2 rounded-xl transition-all group ${state.showNotifications ? 'bg-teal-50 text-teal-600' : 'text-slate-400 hover:text-teal-600 hover:bg-teal-50'}`}>
                    <Bell size={22} />
                    {pendingCount > 0 && <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>}
                 </button>
                 <button onClick={props.onLogout} className="h-10 w-10 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-sm shadow-lg border-2 border-white">{props.currentUserRole?.charAt(0) || 'A'}</button>
             </div>
          </header>

          <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
              <div className="max-w-[1500px] mx-auto p-4 md:p-8 lg:p-10 pb-32 md:pb-10 space-y-8 h-full">
                {state.activeTab === 'dashboard' && <AdminDashboard orders={props.orders} products={props.products} expenses={state.expenses} reportPeriod={state.reportPeriod} setReportPeriod={state.setReportPeriod} chartData={state.chartData} netProfit={state.netProfit} totalRevenue={state.totalRevenue} profitableProducts={state.profitableProducts} topCategory={state.topCategory} />}
                
                {state.activeTab === 'pos' && <AdminPOS products={props.products} users={state.users} posCart={state.posCart} posSearch={state.posSearch} setPosSearch={state.setPosSearch} posCashReceived={state.posCashReceived} setPosCashReceived={state.setPosCashReceived} posPaymentMethod={state.posPaymentMethod} setPosPaymentMethod={state.setPosPaymentMethod} addToPosCart={state.addToPosCart} removeFromPosCart={(id)=>state.setPosCart(prev=>prev.filter(i=>i.id!==id))} handlePosCheckout={state.handlePosCheckout} setShowScanner={state.setShowPosScanner} setShowCashClosure={state.setShowCashClosure} />}
                
                {state.activeTab === 'orders' && <AdminOrders orders={props.orders} onUpdateStatus={state.handleOrderStatusUpdate} onDeleteOrder={state.handleDeleteOrder} />}
                
                {state.activeTab === 'products' && <AdminProductManagement 
                    products={props.products} categories={props.categories} suppliers={state.suppliers} 
                    editingId={state.editingId} prodName={state.prodName} setProdName={state.setProdName} 
                    prodPrice={state.prodPrice} setProdPrice={state.setProdPrice} 
                    prodCostPrice={state.prodCostPrice} setProdCostPrice={state.setProdCostPrice} 
                    prodUnitsPerBox={state.prodUnitsPerBox} setProdUnitsPerBox={state.setProdUnitsPerBox} 
                    prodBoxPrice={state.prodBoxPrice} setProdBoxPrice={state.setProdBoxPrice} 
                    prodPublicBoxPrice={state.prodPublicBoxPrice} setProdPublicBoxPrice={state.setProdPublicBoxPrice} 
                    prodDesc={state.prodDesc} setProdDesc={state.setProdDesc} prodCat={state.prodCat} setProdCat={state.setProdCat} 
                    prodImage={state.prodImage} setProdImage={state.setProdImage} prodBarcode={state.prodBarcode} setProdBarcode={state.setProdBarcode} 
                    prodExpiry={state.prodExpiry} setProdExpiry={state.setProdExpiry} prodSupplier={state.prodSupplier} setProdSupplier={state.setProdSupplier} 
                    handleProductSubmit={state.handleProductSubmit} handleGenerateDescription={state.handleGenerateDescription} 
                    handleImageUpload={async (e) => {
                        if (e.target.files?.[0]) {
                            const url = await uploadImageToStorage(e.target.files[0], `products/${Date.now()}`);
                            state.setProdImage(url);
                        }
                    }} 
                    setShowProductScanner={state.setShowPosScanner} handleEditClick={state.handleEditClick} 
                    onDeleteProduct={state.handleProductDelete} onUpdateStock={state.handleStockUpdate} 
                    resetProductForm={() => state.setEditingId(null)} isGenerating={state.isGenerating} isSubmitting={state.isSubmitting} fileInputRef={productInputRef} 
                />}

                {state.activeTab === 'stock_quick' && <AdminStockQuick products={props.products} onUpdateStock={state.handleStockUpdate} />}
                
                {state.activeTab === 'marketing' && <AdminMarketing 
                    products={props.products} banners={state.banners} coupons={state.coupons} 
                    blogTopic={state.blogTopic} setBlogTopic={state.setBlogTopic} handleGenerateBlog={() => state.handleGenerateBlog(state.blogTopic)} 
                    isGenerating={state.isGenerating} marketingProduct={state.marketingProduct} setMarketingProduct={state.setMarketingProduct} 
                    postPlatform={state.postPlatform} setPostPlatform={state.setPostPlatform} generatedPost={state.generatedPost} 
                    handleGeneratePost={state.handleGeneratePost} bannerTitle={state.bannerTitle} setBannerTitle={state.setBannerTitle} 
                    bannerInputRef={bannerInputRef} 
                    handleAddBanner={async (e) => {
                        e.preventDefault();
                        if (bannerInputRef.current?.files?.[0]) await state.handleAddBanner(bannerInputRef.current.files[0]);
                    }} 
                    onDeleteBanner={state.handleDeleteBanner} isUploadingBanner={state.isUploadingBanner} 
                    onAddCoupon={async () => {
                        const code = prompt("Código:");
                        const val = prompt("Valor %:");
                        if (code && val) await state.handleAddCoupon(code, parseFloat(val));
                    }} 
                    onDeleteCoupon={state.handleDeleteCoupon} 
                />}

                {state.activeTab === 'categories' && <AdminSimpleTable title="Categorías" data={props.categories} onAdd={state.handleCategoryAdd} onDelete={props.onDeleteCategory} />}
                {state.activeTab === 'suppliers' && <AdminSuppliers suppliers={state.suppliers} onAdd={state.handleAddSupplier} onDelete={state.handleDeleteSupplier} />}
                {state.activeTab === 'demand' && <AdminDemand logs={state.searchLogs} />}
                {state.activeTab === 'geostats' && <AdminGeoStats orders={props.orders} />}
                {state.activeTab === 'users' && <AdminUsers users={state.users} onUpdateRole={state.handleUpdateUserRole} />}
                {state.activeTab === 'expenses' && <AdminExpenses expenses={state.expenses} onAdd={state.handleAddExpense} />}
                {state.activeTab === 'subscriptions' && <AdminSubscriptions subscriptions={state.subscriptions} onDelete={state.handleDeleteSubscription} />}
                {state.activeTab === 'bookings' && <AdminBookings bookings={state.bookings} onUpdateStatus={state.handleUpdateBookingStatus} />}
                {state.activeTab === 'stock_alerts' && <AdminStockAlerts alerts={state.stockAlerts} products={props.products} onDelete={state.handleDeleteStockAlert} />}
              </div>
          </div>
      </main>

      {state.showPosScanner && <BarcodeScanner onScan={(code) => {
          if (state.activeTab === 'products') state.setProdBarcode(code);
          else {
              const p = props.products.find(x => x.barcode === code);
              if (p) state.addToPosCart(p);
          }
          state.setShowPosScanner(false);
      }} onClose={() => state.setShowPosScanner(false)} />}

      {state.showCashClosure && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in">
                  <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                      <h3 className="text-sm font-bold flex items-center gap-2"><Calculator size={18}/> Corte de Caja</h3>
                      <button onClick={() => state.setShowCashClosure(false)} className="hover:bg-white/10 p-1.5 rounded-full"><X size={20}/></button>
                  </div>
                  <div className="p-8 space-y-6">
                      <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                          <div className="flex justify-between items-center text-sm font-bold"><span className="text-green-600">Ventas Efectivo:</span><span className="text-green-600">+ ${state.todayCash.toFixed(2)}</span></div>
                          <div className="flex justify-between items-center text-sm font-bold"><span className="text-blue-600">Ventas Transf.:</span><span className="text-blue-600">+ ${state.todayTrans.toFixed(2)}</span></div>
                      </div>
                      <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center"><span className="text-base font-black text-slate-900">TOTAL:</span><span className="text-xl font-black text-teal-600">${(state.todayCash + state.todayTrans).toFixed(2)}</span></div>
                      <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"><Printer size={18}/> Imprimir Cierre</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPanel;
