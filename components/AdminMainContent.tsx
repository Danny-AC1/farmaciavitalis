
import React from 'react';
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
import AdminCiudadelas from './AdminCiudadelas';

interface AdminMainContentProps {
    activeTab: string;
    props: any; // Props del componente padre AdminPanel
    state: any; // Estado extendido del hook useAdminPanelState
    productInputRef: React.RefObject<HTMLInputElement>;
    bannerInputRef: React.RefObject<HTMLInputElement>;
}

const AdminMainContent: React.FC<AdminMainContentProps> = ({ activeTab, props, state, productInputRef, bannerInputRef }) => {
    switch (activeTab) {
        case 'dashboard':
            return (
                <AdminDashboard 
                    orders={props.orders} 
                    products={props.products} 
                    expenses={state.expenses} 
                    reportPeriod={state.reportPeriod} 
                    setReportPeriod={state.setReportPeriod} 
                    chartData={state.chartData} 
                    netProfit={state.netProfit} 
                    totalRevenue={state.totalRevenue} 
                    profitableProducts={state.profitableProducts} 
                    topCategory={state.topCategory} 
                    currentUserRole={props.currentUserRole} 
                />
            );
        
        case 'pos':
            return (
                <AdminPOS 
                    products={props.products} 
                    users={state.users} 
                    posCart={state.posCart} 
                    setPosCart={state.setPosCart} 
                    posSearch={state.posSearch} 
                    setPosSearch={state.setPosSearch} 
                    posCashReceived={state.posCashReceived} 
                    setPosCashReceived={state.setPosCashReceived} 
                    posPaymentMethod={state.posPaymentMethod} 
                    setPosPaymentMethod={state.setPosPaymentMethod} 
                    addToPosCart={state.addToPosCart} 
                    removeFromPosCart={(id: string) => state.setPosCart((prev: any[]) => prev.filter(i => i.id !== id))} 
                    handlePosCheckout={state.handlePosCheckout} 
                    setShowScanner={state.setShowPosScanner} 
                    setShowCashClosure={state.setShowCashClosure} 
                    onDeleteUser={state.handleDeleteUser} 
                />
            );
        
        case 'orders':
            return <AdminOrders orders={props.orders} onUpdateStatus={state.handleOrderStatusUpdate} onDeleteOrder={state.handleDeleteOrder} />;
        
        case 'products':
            return (
                <AdminProductManagement 
                    products={props.products} 
                    categories={props.categories} 
                    suppliers={state.suppliers} 
                    editingId={state.editingId} 
                    prodName={state.prodName} 
                    setProdName={state.setProdName} 
                    prodPrice={state.prodPrice} 
                    setProdPrice={state.setProdPrice} 
                    prodCostPrice={state.prodCostPrice} 
                    setProdCostPrice={state.setProdCostPrice} 
                    prodUnitsPerBox={state.prodUnitsPerBox} 
                    setProdUnitsPerBox={state.setProdUnitsPerBox} 
                    prodBoxPrice={state.prodBoxPrice} 
                    setProdBoxPrice={state.setProdBoxPrice} 
                    prodPublicBoxPrice={state.prodPublicBoxPrice} 
                    setProdPublicBoxPrice={state.setProdPublicBoxPrice} 
                    prodDesc={state.prodDesc} 
                    setProdDesc={state.setProdDesc} 
                    prodCat={state.prodCat} 
                    setProdCat={state.setProdCat} 
                    prodImage={state.prodImage} 
                    setProdImage={state.setProdImage} 
                    prodBarcode={state.prodBarcode} 
                    setProdBarcode={state.setProdBarcode} 
                    prodExpiry={state.prodExpiry} 
                    setProdExpiry={state.setProdExpiry} 
                    prodSupplier={state.prodSupplier} 
                    setProdSupplier={state.setProdSupplier} 
                    handleProductSubmit={state.handleProductSubmit} 
                    handleGenerateDescription={state.handleGenerateDescription} 
                    handleImageUpload={state.handleImageUpload} 
                    setShowProductScanner={state.setShowPosScanner} 
                    handleEditClick={state.handleEditClick} 
                    onDeleteProduct={state.handleProductDelete} 
                    onUpdateStock={state.handleStockUpdate} 
                    resetProductForm={() => state.setEditingId(null)} 
                    isGenerating={state.isGenerating} 
                    isSubmitting={state.isSubmitting} 
                    isUploadingImage={state.isUploadingImage} 
                    fileInputRef={productInputRef} 
                />
            );

        case 'stock_quick': return <AdminStockQuick products={props.products} onUpdateStock={state.handleStockUpdate} />;
        
        case 'marketing':
            return (
                <AdminMarketing 
                    products={props.products} 
                    banners={state.banners} 
                    coupons={state.coupons} 
                    blogTopic={state.blogTopic} 
                    setBlogTopic={state.setBlogTopic} 
                    handleGenerateBlog={() => state.handleGenerateBlog(state.blogTopic)} 
                    isGenerating={state.isGenerating} 
                    marketingProduct={state.marketingProduct} 
                    setMarketingProduct={state.setMarketingProduct} 
                    postPlatform={state.postPlatform} 
                    setPostPlatform={state.setPostPlatform} 
                    generatedPost={state.generatedPost} 
                    handleGeneratePost={state.handleGeneratePost} 
                    bannerTitle={state.bannerTitle} 
                    setBannerTitle={state.setBannerTitle} 
                    bannerInputRef={bannerInputRef} 
                    handleAddBanner={state.handleAddBanner} 
                    onDeleteBanner={state.handleDeleteBanner} 
                    isUploadingBanner={state.isUploadingBanner} 
                    onAddCoupon={state.onAddCoupon} 
                    onDeleteCoupon={state.handleDeleteCoupon} 
                />
            );

        case 'categories': return <AdminSimpleTable title="Categorías" data={props.categories} onAdd={state.handleCategoryAdd} onDelete={props.onDeleteCategory} />;
        case 'suppliers': return <AdminSuppliers suppliers={state.suppliers} onAdd={state.handleAddSupplier} onDelete={state.handleDeleteSupplier} />;
        case 'ciudadelas': return <AdminCiudadelas />;
        case 'demand': return <AdminDemand logs={state.searchLogs} onDeleteLog={state.handleDeleteSearchLog} />;
        case 'geostats': return <AdminGeoStats orders={props.orders} />;
        case 'users': return <AdminUsers users={state.users} onUpdateRole={state.handleUpdateUserRole} onUpdateUser={state.handleUpdateUser} onDeleteUser={state.handleDeleteUser} />;
        case 'expenses': return <AdminExpenses expenses={state.expenses} onAdd={state.handleAddExpense} />;
        case 'subscriptions': return <AdminSubscriptions subscriptions={state.subscriptions} onProcess={state.handleProcessSubscription} onDelete={state.handleDeleteSubscription} />;
        case 'bookings': return <AdminBookings bookings={state.bookings} onUpdateStatus={state.handleUpdateBookingStatus} onDelete={state.handleDeleteBooking} />;
        case 'stock_alerts': return <AdminStockAlerts alerts={state.stockAlerts} products={props.products} onDelete={state.handleDeleteStockAlert} />;
        
        default: return null;
    }
};

export default AdminMainContent;
