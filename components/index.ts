// Re-exports de componentes organizados en subcarpetas

// 1. Modulo de Admin
export { default as AdminPanel } from './admin/AdminPanel';
export { default as AdminDashboard } from './admin/AdminDashboard';
export { default as AdminMainContent } from './admin/AdminMainContent';
export { default as AdminSidebar } from './admin/AdminSidebar';
export { default as AdminHeader } from './admin/AdminHeader';
export { default as AdminProductManagement } from './admin/AdminProductManagement';
export { default as AdminProductList } from './admin/AdminProductList';
export { default as AdminProductForm } from './admin/AdminProductForm';
export { default as AdminUsers } from './admin/AdminUsers';
export { default as AdminSuppliers } from './admin/AdminSuppliers';
export { default as AdminFinances } from './admin/AdminFinances';
export { default as AdminExpenses } from './admin/AdminExpenses';
export { default as AdminStockQuick } from './admin/AdminStockQuick';
export { default as AdminStockAlerts } from './admin/AdminStockAlerts';
export { default as AdminDiscounts } from './admin/AdminDiscounts';
export { default as AdminCiudadelas } from './admin/AdminCiudadelas';
export { default as AdminBundles } from './admin/AdminBundles';
export { default as AdminDemand } from './admin/AdminDemand';
export { default as AdminSubscriptions } from './admin/AdminSubscriptions';
export { default as AdminGeoStats } from './admin/AdminGeoStats';
export { default as AdminBookings } from './admin/AdminBookings';
export { default as AdminMarketing } from './admin/AdminMarketing';
export { default as AdminMarketingAI } from './admin/AdminMarketingAI';
export { default as AdminMarketingImageGen } from './admin/AdminMarketingImageGen';
export { default as AdminBlogManager } from './admin/AdminBlogManager';
export { default as AdminShoppingList } from './admin/AdminShoppingList';
export { default as AdminTreasury } from './admin/AdminTreasury';
export { default as IntelligenceHub } from './admin/IntelligenceHub';
export { default as AdminExtensionSuite } from './admin/AdminExtensionSuite';
export { default as AdminSimpleTable } from './admin/AdminSimpleTable';
export { default as AdminPrintableAd } from './admin/AdminPrintableAd';
export { default as AdminProductPriceList } from './admin/AdminProductPriceList';

// 2. Modulo POS
export { default as AdminPOS } from './pos/AdminPOS';
export { default as POSCartList } from './pos/POSCartList';
export { default as POSCustomerSelect } from './pos/POSCustomerSelect';
export { default as POSFooter } from './pos/POSFooter';
export { default as POSProductSearch } from './pos/POSProductSearch';
export { default as POSUserModal } from './pos/POSUserModal';
export { default as SmartSubstitutionPOS } from './pos/SmartSubstitutionPOS';

// 3. Modulo de Creditos
export { default as AdminCredits } from './credits/AdminCredits';
export { CreditCreateForm } from './credits/CreditCreateForm';
export { CreditList } from './credits/CreditList';
export { CreditPaymentModal } from './credits/CreditPaymentModal';
export { CreditStatsCards } from './credits/CreditStatsCards';

// 4. Modulo de Checkout
export { default as Checkout } from './checkout/Checkout';
export { default as CheckoutForm } from './checkout/CheckoutForm';
export { default as CheckoutPayment } from './checkout/CheckoutPayment';
export { default as DeliveryInfo } from './checkout/DeliveryInfo';

// 5. Modulo de Clientes/Usuario Publico
export { default as Navbar } from './user/Navbar';
export { default as HomeView } from './user/HomeView';
export { default as Footer } from './user/Footer';
export { default as SearchBar } from './user/SearchBar';
export { default as SearchResults } from './user/SearchResults';
export { default as BottomNav } from './user/BottomNav';
export { default as ProductCard } from './user/ProductCard';
export { default as ProductDetail } from './user/ProductDetail';
export { default as ProductSection } from './user/ProductSection';
export { default as PromotionsSection } from './user/PromotionsSection';
export { default as CategoryGrid } from './user/CategoryGrid';
export { default as CategoryPills } from './user/CategoryPills';
export { default as HeroCarousel } from './user/HeroCarousel';
export { default as BlogSection } from './user/BlogSection';
export { default as CartDrawer } from './user/CartDrawer';

// 6. Modulos de Modales y Utilidades
export { default as AuthModal } from './modals/AuthModal';
export { default as ProfileModal } from './modals/ProfileModal';
export { default as ForgotPasswordForm } from './modals/ForgotPasswordForm';
export { default as PrescriptionModal } from './modals/PrescriptionModal';
export { default as ServicesModal } from './modals/ServicesModal';
export { default as FirstAidGuide } from './modals/FirstAidGuide';
export { default as FamilyHealthModal } from './modals/FamilyHealthModal';
export { default as UserOrdersModal } from './modals/UserOrdersModal';
export { default as UserSubscriptionsModal } from './modals/UserSubscriptionsModal';
export { default as StaffAccessModal } from './modals/StaffAccessModal';
export { default as CashClosureModal } from './modals/CashClosureModal';
export { default as LocationPickerModal } from './modals/LocationPickerModal';
export { default as BarcodeScanner } from './modals/BarcodeScanner';

// 7. Modulo de Notificaciones
export { default as NotificationCenter } from './notifications/NotificationCenter';
export { default as NotificationItem } from './notifications/NotificationItem';

// 8. Modulo del Conductor (Driver)
export { default as DriverDashboard } from './driver/DriverDashboard';

// 9. Modulo de Soporte y Chat Privado
export { SupportAndDoseCalculator } from './support/SupportAndDoseCalculator';
export { AdminSupportChats } from './admin/AdminSupportChats';
