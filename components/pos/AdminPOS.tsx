import React, { useState, useMemo, useEffect } from 'react';
import { Product, CartItem, User, Bundle, CreditTicket, TreasurySession } from '../../types';
import { saveUserDB } from '../../services/db';
import { getActiveDiscounts, getDiscountedPrice, subscribeToDiscounts, ActiveDiscount } from '../../utils/discounts';
import { subscribeOfflineSync, syncPendingOfflineSales, getPendingOfflineSales } from '../../services/posOfflineService';
import { streamCredits } from '../../services/db.credits';
import { streamTreasurySessions } from '../../services/db.treasury';
import { findCustomerCredits } from '../../utils/posCreditHelpers';
import { printPOSTicket } from '../../utils/posTicketPrinter';
import { ReceiptShareModal } from '../modals/ReceiptShareModal';
import { searchProductsIntelligent, normalizeText } from '../../utils/smartSearch';
import { Order } from '../../types';

// Sub-componentes del POS
import POSCustomerSelect from './POSCustomerSelect';
import POSProductSearch from './POSProductSearch';
import POSCartList from './POSCartList';
import POSFooter from './POSFooter';
import POSUserModal from './POSUserModal';
import POSToolbar from './POSToolbar';
import POSBundlesBanner from './POSBundlesBanner';
import POSUpgradeModal from './POSUpgradeModal';
import SmartSubstitutionPOS from './SmartSubstitutionPOS';
import POSCustomerDebtAlert from './POSCustomerDebtAlert';
import POSCreditDrawerModal from './POSCreditDrawerModal';
import POSCreditCheckoutModal from './POSCreditCheckoutModal';
import POSCreditQuickPaymentModal from './POSCreditQuickPaymentModal';
import POSTreasuryDrawerModal from './POSTreasuryDrawerModal';

interface AdminPOSProps {
  products: Product[];
  users: User[];
  currentUser?: User | null;
  bundles: Bundle[];
  posCart: CartItem[];
  setPosCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  posSearch: string;
  setPosSearch: (s: string) => void;
  posCashReceived: string;
  setPosCashReceived: (s: string) => void;
  posPaymentMethod: 'CASH' | 'TRANSFER';
  setPosPaymentMethod: (m: 'CASH' | 'TRANSFER') => void;
  addToPosCart: (p: Product, unitType?: 'UNIT' | 'BOX') => void;
  addBundleToPosCart: (b: Bundle) => void;
  removeFromPosCart: (id: string) => void;
  handlePosCheckout: (customer?: User, pointsRedeemed?: number) => Promise<any>;
  setShowScanner: (b: boolean) => void;
  setShowCashClosure?: (b: boolean) => void;
  onDeleteUser?: (uid: string) => Promise<void>;
  setActiveTab?: (tab: string) => void;
}

const AdminPOS: React.FC<AdminPOSProps> = ({
  products,
  users,
  currentUser,
  bundles,
  posCart,
  setPosCart,
  posSearch,
  setPosSearch,
  posCashReceived,
  setPosCashReceived,
  posPaymentMethod,
  setPosPaymentMethod,
  addToPosCart,
  addBundleToPosCart,
  removeFromPosCart,
  handlePosCheckout,
  setShowScanner,
  setShowCashClosure,
  setActiveTab
}) => {
  // 1. ESTADOS LOCALES DE INTERFAZ
  const [showBundles, setShowBundles] = useState(false);
  const [upgradeSuggestion, setUpgradeSuggestion] = useState<Bundle | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [substitutionTerm, setSubstitutionTerm] = useState('');
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [showTreasuryDrawer, setShowTreasuryDrawer] = useState(false);
  const [orderToShare, setOrderToShare] = useState<Order | null>(null);

  // 1.1 ESTADO DE SESIÓN DE TESORERÍA ACTIVA
  const [treasurySessions, setTreasurySessions] = useState<TreasurySession[]>([]);
  useEffect(() => {
    const unsub = streamTreasurySessions((sessionsList) => {
      setTreasurySessions(sessionsList);
    });
    return () => {
      if (typeof unsub === 'function') unsub();
    };
  }, []);

  const activeTreasurySession = useMemo(() => {
    return treasurySessions.find(s => s.status === 'OPEN') || null;
  }, [treasurySessions]);

  // 2. CRÉDITOS Y MEDICAMENTOS FIADOS
  const [credits, setCredits] = useState<CreditTicket[]>([]);
  const [showCreditDrawer, setShowCreditDrawer] = useState(false);
  const [showCreditCheckout, setShowCreditCheckout] = useState(false);
  const [selectedCreditForPayment, setSelectedCreditForPayment] = useState<CreditTicket | null>(null);

  // Stream en tiempo real de créditos
  useEffect(() => {
    const unsub = streamCredits((data) => {
      setCredits(data);
    });
    return () => unsub();
  }, []);

  // Preseleccionar cliente si proviene de la Suite de Créditos
  useEffect(() => {
    try {
      const stored = localStorage.getItem('vitalis_pos_preselected_customer');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.displayName || parsed.name)) {
          const existing = users.find(u => 
            (parsed.phone && u.phone === parsed.phone) || 
            (parsed.displayName && u.displayName?.toLowerCase() === parsed.displayName.toLowerCase()) ||
            (parsed.name && u.displayName?.toLowerCase() === parsed.name.toLowerCase())
          );
          if (existing) {
            setSelectedCustomer(existing);
          } else {
            setSelectedCustomer({
              uid: parsed.id || `CUST-${Date.now()}`,
              displayName: parsed.displayName || parsed.name || 'Cliente',
              phone: parsed.phone || parsed.customerPhone || '',
              cedula: parsed.cedula || parsed.customerAddress || '',
              email: '',
              role: 'USER',
              points: 0,
              createdAt: new Date().toISOString()
            });
          }
          localStorage.removeItem('vitalis_pos_preselected_customer');
        }
      }
    } catch (e) {
      console.warn("Error loading preselected customer for POS:", e);
    }
  }, [users]);

  const pendingCreditsCount = useMemo(() => credits.filter(c => c.status === 'PENDIENTE').length, [credits]);
  
  const customerDebts = useMemo(() => {
    return findCustomerCredits(selectedCustomer, credits);
  }, [selectedCustomer, credits]);

  // 3. ESTADO DE RED Y MODO OFFLINE
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeOfflineSync((onlineStatus, pendingCount) => {
      setIsOnline(onlineStatus);
      setPendingSyncCount(pendingCount);
    });
    setPendingSyncCount(getPendingOfflineSales().length);
    return () => unsubscribe();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncPendingOfflineSales();
      setPendingSyncCount(getPendingOfflineSales().length);
      if (res.syncedCount > 0) {
        alert(`✅ ¡Sincronizadas ${res.syncedCount} ventas pendientes con la nube!`);
      } else if (res.errors > 0) {
        alert(`⚠️ Se detectaron ${res.errors} errores al sincronizar.`);
      } else {
        alert('ℹ️ No hay ventas pendientes por sincronizar.');
      }
    } catch {
      alert('Error al intentar sincronizar con la nube.');
    } finally {
      setIsSyncing(false);
    }
  };

  // 4. DESCUENTOS ACTIVOS (Suite Gerencial)
  const [activeDiscounts, setActiveDiscounts] = useState<ActiveDiscount[]>([]);

  useEffect(() => {
    setActiveDiscounts(getActiveDiscounts());
    return subscribeToDiscounts(() => {
      setActiveDiscounts(getActiveDiscounts());
    });
  }, []);

  // 5. REGISTRO RÁPIDO DE CLIENTE
  const [regName, setRegName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const resetUserForm = () => {
    setRegName(''); setRegCedula(''); setRegPhone('');
    setShowUserForm(false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToSave: User = {
      uid: `CUST-${Date.now()}`,
      displayName: regName,
      cedula: regCedula,
      phone: regPhone,
      email: `${regCedula}@vitalis.pos`,
      role: 'USER',
      points: 0,
      accumulatedSpend: 0,
      createdAt: new Date().toISOString()
    };
    await saveUserDB(userToSave);
    setSelectedCustomer(userToSave);
    resetUserForm();
    setCustomerSearch('');
  };

  // 6. CÁLCULOS MATEMÁTICOS DE VENTA
  const subtotal = useMemo(() => posCart.reduce((sum, item) => {
    const isBox = item.selectedUnit === 'BOX';
    let price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
    
    if (!isBox && item.price >= 0) {
      const discount = activeDiscounts.find(d => d.productId === item.id);
      if (discount) {
        price = getDiscountedPrice(item.price, discount);
      }
    }
    
    return sum + (price * item.quantity);
  }, 0), [posCart, activeDiscounts]);

  const { projectedPoints, projectedAccumulated } = useMemo(() => {
    if (!selectedCustomer) return { projectedPoints: 0, projectedAccumulated: 0 };
    const totalSpend = (selectedCustomer.accumulatedSpend || 0) + subtotal;
    const newPoints = Math.floor(totalSpend);
    const remaining = totalSpend - newPoints;
    return { 
      projectedPoints: selectedCustomer.points + newPoints,
      projectedAccumulated: remaining
    };
  }, [selectedCustomer, subtotal]);

  const posTotal = subtotal;
  const changeDue = posCashReceived ? parseFloat(posCashReceived) - posTotal : 0;

  // 7. AGREGAR CON SUGERENCIA DE COMBO UPGRADE
  const handleAddToCartWithUpgradeCheck = (p: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    if (p.stock <= 0) {
      setSubstitutionTerm(p.name);
      setShowSubstitution(true);
      return;
    }
    
    addToPosCart(p, unitType);
    
    const upgrade = bundles.find(b => b.active && b.isUpgrade && b.baseProductId === p.id);
    if (upgrade) {
      setUpgradeSuggestion(upgrade);
    }
  };

  // 8. FILTROS DE BÚSQUEDA INTELIGENTES (Tolerante a errores, tildes, fonética y códigos de barras)
  const filteredProducts = useMemo(() => {
    if (!posSearch || !posSearch.trim()) return [];
    return searchProductsIntelligent(products, posSearch, 10);
  }, [products, posSearch]);

  const customerSearchResults = useMemo(() => {
    if (customerSearch.trim().length < 2) return [];
    const termNorm = normalizeText(customerSearch);
    return users.filter(u => 
      (u.cedula && normalizeText(u.cedula).includes(termNorm)) || 
      (u.phone && normalizeText(u.phone).includes(termNorm)) || 
      (u.displayName && normalizeText(u.displayName).includes(termNorm))
    ).slice(0, 5);
  }, [customerSearch, users]);

  // 9. PROCESAMIENTO DE CHECKOUT
  const onCheckoutClick = async () => {
    if (posCart.length === 0) return;
    setIsProcessing(true);
    try {
      await handlePosCheckout(selectedCustomer || undefined, 0);
      setSelectedCustomer(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const onCheckoutAndPrintClick = async () => {
    if (posCart.length === 0) return;
    setIsProcessing(true);
    try {
      const order = await handlePosCheckout(selectedCustomer || undefined, 0);
      if (order) {
        printPOSTicket(order);
      }
      setSelectedCustomer(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const onCheckoutAndShareClick = async () => {
    if (posCart.length === 0) return;
    setIsProcessing(true);
    try {
      const order = await handlePosCheckout(selectedCustomer || undefined, 0);
      if (order) {
        setOrderToShare(order);
      }
      setSelectedCustomer(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      
      {/* 1. PANEL SUPERIOR (Buscador de Clientes, Toolbar y Buscador de Productos) */}
      <div className="bg-white border-b border-slate-200 p-2 md:p-4 shrink-0 shadow-sm z-20">
        <div className="max-w-[1600px] mx-auto space-y-2 md:space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
            
            {/* Selector de Clientes y Fidelización */}
            <POSCustomerSelect 
              selectedCustomer={selectedCustomer}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              customerSearchResults={customerSearchResults}
              setSelectedCustomer={setSelectedCustomer}
              setShowUserForm={setShowUserForm}
              subtotal={subtotal}
              projectedPoints={projectedPoints}
              projectedAccumulated={projectedAccumulated}
            />

            {/* Barra de Herramientas POS (Fiados, Sync, Scanner, Tesorería Avanzada, Combos) */}
            <POSToolbar 
              pendingCreditsCount={pendingCreditsCount}
              onOpenCreditDrawer={() => setShowCreditDrawer(true)}
              isOnline={isOnline}
              pendingSyncCount={pendingSyncCount}
              isSyncing={isSyncing}
              onManualSync={handleManualSync}
              onOpenScanner={() => setShowScanner(true)}
              onOpenTreasury={() => setShowTreasuryDrawer(true)}
              onOpenCashClosure={setShowCashClosure ? () => setShowCashClosure(true) : undefined}
              isSessionOpen={!!activeTreasurySession}
              activeCashier={activeTreasurySession?.openedBy}
              showBundles={showBundles}
              setShowBundles={setShowBundles}
            />
          </div>

          {/* Alerta de Deuda Pendiente del Cliente */}
          {selectedCustomer && customerDebts.length > 0 && (
            <POSCustomerDebtAlert 
              customer={selectedCustomer}
              matchingCredits={customerDebts}
              onOpenCreditDrawer={() => setShowCreditDrawer(true)}
              onOpenQuickPayment={(credit) => setSelectedCreditForPayment(credit)}
              hasCartItems={posCart.length > 0}
            />
          )}

          {/* Banner Desplegable de Combos y Promociones */}
          <POSBundlesBanner 
            showBundles={showBundles}
            bundles={bundles}
            onAddBundleToCart={addBundleToPosCart}
          />

          {/* Buscador de Medicamentos y Productos */}
          <POSProductSearch 
            posSearch={posSearch}
            setPosSearch={setPosSearch}
            filteredProducts={filteredProducts}
            addToPosCart={handleAddToCartWithUpgradeCheck}
            onSearchAlternatives={(term) => {
              setSubstitutionTerm(term);
              setShowSubstitution(true);
            }}
          />
        </div>
      </div>

      {/* 2. PANEL CENTRAL (Tabla y Lista de Productos en Carrito) */}
      <div className="flex-grow overflow-y-auto p-2 md:p-4 bg-white no-scrollbar">
        <POSCartList 
          posCart={posCart}
          removeFromPosCart={removeFromPosCart}
          addToPosCart={handleAddToCartWithUpgradeCheck}
          setPosCart={setPosCart}
        />
      </div>

      {/* 3. PANEL INFERIOR (Opciones de Pago, Fiar, Totales y Facturación) */}
      <POSFooter 
        posTotal={posTotal}
        showPaymentDetails={showPaymentDetails}
        setShowPaymentDetails={setShowPaymentDetails}
        onCheckoutClick={onCheckoutClick}
        onCheckoutAndPrintClick={onCheckoutAndPrintClick}
        onCheckoutAndShareClick={onCheckoutAndShareClick}
        onCreditCheckoutClick={() => setShowCreditCheckout(true)}
        isProcessing={isProcessing}
        posCartEmpty={posCart.length === 0}
        posPaymentMethod={posPaymentMethod}
        setPosPaymentMethod={setPosPaymentMethod}
        posCashReceived={posCashReceived}
        setPosCashReceived={setPosCashReceived}
        changeDue={changeDue}
      />

      {/* 4. MODAL: Sugerencia de Combo Upgrade */}
      <POSUpgradeModal 
        upgradeSuggestion={upgradeSuggestion}
        products={products}
        onClose={() => setUpgradeSuggestion(null)}
        onAcceptUpgrade={addBundleToPosCart}
      />

      {/* 5. MODAL: Registro Rápido de Nuevo Cliente */}
      <POSUserModal 
        showUserForm={showUserForm}
        resetForm={resetUserForm}
        handleSaveUser={handleSaveUser}
        regCedula={regCedula}
        setRegCedula={setRegCedula}
        regName={regName}
        setRegName={setRegName}
        regPhone={regPhone}
        setRegPhone={setRegPhone}
      />

      {/* 6. MODAL: Sustitución Inteligente de Medicamentos Sin Stock */}
      {showSubstitution && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-2xl">
            <SmartSubstitutionPOS 
              missingTerm={substitutionTerm}
              allProducts={products}
              onSelectAlternative={(p) => {
                addToPosCart(p, 'UNIT');
                setShowSubstitution(false);
                setPosSearch('');
              }}
              onClose={() => setShowSubstitution(false)}
            />
          </div>
        </div>
      )}

      {/* 7. DRAWER: Medicamentos Fiados y Libreta de Créditos */}
      <POSCreditDrawerModal 
        isOpen={showCreditDrawer}
        onClose={() => setShowCreditDrawer(false)}
        credits={credits}
        products={products}
        posCart={posCart}
        selectedCustomer={selectedCustomer}
        onSelectCustomerInPOS={(name, phone) => {
          const matched = users.find(u => 
            (phone && u.phone === phone) || 
            u.displayName.toLowerCase() === name.toLowerCase()
          );
          if (matched) {
            setSelectedCustomer(matched);
          } else {
            setSelectedCustomer({
              uid: `CUST-${Date.now()}`,
              displayName: name,
              email: '',
              phone: phone || '',
              role: 'USER',
              points: 0,
              createdAt: new Date().toISOString()
            });
          }
        }}
        onOpenQuickPayment={(credit) => {
          setSelectedCreditForPayment(credit);
        }}
        onGoToFullCreditsSuite={() => {
          if (setActiveTab) {
            setActiveTab('extension-suite');
          }
        }}
        onOpenNewCreditModal={() => {
          setShowCreditCheckout(true);
        }}
      />

      {/* 8. MODAL: Despacho a Crédito / Fiar Carrito Actual */}
      <POSCreditCheckoutModal 
        isOpen={showCreditCheckout}
        onClose={() => setShowCreditCheckout(false)}
        posCart={posCart}
        products={products}
        selectedCustomer={selectedCustomer}
        onSuccess={() => {
          setPosCart([]);
          setSelectedCustomer(null);
        }}
      />

      {/* 9. MODAL: Cobro Rápido de Abono en POS */}
      <POSCreditQuickPaymentModal 
        isOpen={!!selectedCreditForPayment}
        credit={selectedCreditForPayment}
        onClose={() => setSelectedCreditForPayment(null)}
        onPaymentSuccess={() => {
          setSelectedCreditForPayment(null);
        }}
      />

      {/* 10. MODAL / DRAWER: Tesorería Avanzada & Caja del POS */}
      <POSTreasuryDrawerModal 
        isOpen={showTreasuryDrawer}
        onClose={() => setShowTreasuryDrawer(false)}
        currentUser={currentUser}
        users={users}
        onGoToExtensionSuite={() => {
          if (setActiveTab) {
            setActiveTab('extension-suite');
          }
        }}
      />

      {/* 11. MODAL: Compartir Comprobante Digital Multicanal */}
      {orderToShare && (
        <ReceiptShareModal
          isOpen={!!orderToShare}
          order={orderToShare}
          onClose={() => setOrderToShare(null)}
        />
      )}
    </div>
  );
};

export default AdminPOS;
