
import React, { useState, useMemo } from 'react';
import { ScanBarcode, Calculator, Package, Sparkles, X, Plus } from 'lucide-react';
import { Product, CartItem, User, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE, Bundle } from '../types';
import { saveUserDB } from '../services/db';

// Sub-componentes
import POSCustomerSelect from './POSCustomerSelect';
import POSProductSearch from './POSProductSearch';
import POSCartList from './POSCartList';
import POSFooter from './POSFooter';
import POSUserModal from './POSUserModal';

interface AdminPOSProps {
  products: Product[];
  users: User[];
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
  handlePosCheckout: (customer?: User, pointsRedeemed?: number) => void;
  setShowScanner: (b: boolean) => void;
  setShowCashClosure: (b: boolean) => void;
  onDeleteUser?: (uid: string) => Promise<void>;
}

const AdminPOS: React.FC<AdminPOSProps> = ({
  products, users, bundles, posCart, setPosCart, posSearch, setPosSearch, posCashReceived, setPosCashReceived, 
  posPaymentMethod, setPosPaymentMethod, addToPosCart, addBundleToPosCart, removeFromPosCart, 
  handlePosCheckout, setShowScanner, setShowCashClosure
}) => {
  // ESTADOS LOCALES DE UI
  const [showBundles, setShowBundles] = useState(false);
  const [upgradeSuggestion, setUpgradeSuggestion] = useState<Bundle | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [usePoints, setUsePoints] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // ESTADOS DEL FORMULARIO DE REGISTRO
  const [regName, setRegName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // CALCULOS MATEMÁTICOS (Cerebro del POS)
  const subtotal = useMemo(() => posCart.reduce((sum, item) => {
      const isBox = item.selectedUnit === 'BOX';
      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
  }, 0), [posCart]);

  const projectedPoints = selectedCustomer ? (selectedCustomer.points + Math.floor(subtotal)) : 0;
  const canUsePoints = projectedPoints >= POINTS_THRESHOLD;
  const discount = usePoints ? POINTS_DISCOUNT_VALUE : 0;
  const posTotal = Math.max(0, subtotal - discount);
  const changeDue = posCashReceived ? parseFloat(posCashReceived) - posTotal : 0;

  const handleAddToCartWithUpgradeCheck = (p: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    addToPosCart(p, unitType);
    
    // Buscar si hay un combo de upgrade para este producto
    const upgrade = bundles.find(b => b.active && b.isUpgrade && b.baseProductId === p.id);
    if (upgrade) {
      setUpgradeSuggestion(upgrade);
    }
  };

  // FILTROS DE BÚSQUEDA
  const filteredProducts = useMemo(() => {
    if (!posSearch) return [];
    return products.filter(p => 
      p.name.toLowerCase().includes(posSearch.toLowerCase()) || 
      (p.barcode && p.barcode === posSearch) ||
      p.category.toLowerCase().includes(posSearch.toLowerCase())
    ).slice(0, 6);
  }, [products, posSearch]);

  const customerSearchResults = useMemo(() => {
    if (customerSearch.length < 3) return [];
    return users.filter(u => 
      u.cedula?.includes(customerSearch) || 
      u.phone?.includes(customerSearch) || 
      u.displayName?.toLowerCase().includes(customerSearch.toLowerCase())
    ).slice(0, 5);
  }, [customerSearch, users]);

  // MANEJADORES DE ACCIÓN
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
        createdAt: new Date().toISOString()
    };
    await saveUserDB(userToSave);
    setSelectedCustomer(userToSave);
    resetUserForm();
    setCustomerSearch('');
  };

  const onCheckoutClick = async () => {
      if (posCart.length === 0) return;
      setIsProcessing(true);
      try {
          await handlePosCheckout(selectedCustomer || undefined, usePoints ? POINTS_THRESHOLD : 0);
          setUsePoints(false);
          setSelectedCustomer(null);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      
      {/* 1. PANEL SUPERIOR (Buscadores) */}
      <div className="bg-white border-b border-slate-200 p-2 md:p-4 shrink-0 shadow-sm z-20">
        <div className="max-w-[1600px] mx-auto space-y-2 md:space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
            
            <POSCustomerSelect 
              selectedCustomer={selectedCustomer}
              customerSearch={customerSearch}
              setCustomerSearch={setCustomerSearch}
              customerSearchResults={customerSearchResults}
              setSelectedCustomer={setSelectedCustomer}
              setShowUserForm={setShowUserForm}
              setUsePoints={setUsePoints}
              subtotal={subtotal}
              projectedPoints={projectedPoints}
            />

            <div className="flex gap-1 md:gap-2 shrink-0">
              <button onClick={() => setShowScanner(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] text-slate-600 hover:bg-slate-50 transition">
                <ScanBarcode size={14}/> <span className="hidden sm:inline">SCANNER</span>
              </button>
              <button onClick={() => setShowCashClosure(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] text-slate-600 hover:bg-slate-50 transition">
                <Calculator size={14}/> <span className="hidden sm:inline">CIERRE</span>
              </button>
              <button 
                onClick={() => setShowBundles(!showBundles)} 
                className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 border px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] transition ${showBundles ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-purple-600 border-purple-200 hover:bg-purple-50'}`}
              >
                <Package size={14}/> <span className="hidden sm:inline">COMBOS</span>
              </button>
            </div>
          </div>

          {showBundles && (
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-100 animate-in slide-in-from-top">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-purple-600" />
                <span className="text-[10px] font-black text-purple-700 uppercase tracking-widest">Promociones Activas</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {bundles.filter(b => b.active).map(bundle => (
                  <button 
                    key={bundle.id}
                    onClick={() => addBundleToPosCart(bundle)}
                    className="bg-white p-2 rounded-lg border border-purple-200 text-left hover:shadow-md transition group"
                  >
                    <p className="text-[10px] font-bold text-gray-900 truncate">{bundle.name}</p>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-[10px] font-black text-purple-600">${bundle.price.toFixed(2)}</span>
                      <Plus size={10} className="text-purple-400 group-hover:text-purple-600" />
                    </div>
                  </button>
                ))}
                {bundles.filter(b => b.active).length === 0 && (
                  <p className="text-[10px] text-purple-400 italic col-span-full">No hay combos activos.</p>
                )}
              </div>
            </div>
          )}

          <POSProductSearch 
            posSearch={posSearch}
            setPosSearch={setPosSearch}
            filteredProducts={filteredProducts}
            addToPosCart={handleAddToCartWithUpgradeCheck}
          />
        </div>
      </div>

      {/* 2. PANEL CENTRAL (Lista de Productos) */}
      <div className="flex-grow overflow-y-auto p-2 md:p-4 bg-white no-scrollbar">
        <POSCartList 
          posCart={posCart}
          removeFromPosCart={removeFromPosCart}
          addToPosCart={handleAddToCartWithUpgradeCheck}
          setPosCart={setPosCart}
        />
      </div>

      {/* 3. PANEL INFERIOR (Cobro y Totales) */}
      <POSFooter 
        selectedCustomer={selectedCustomer}
        canUsePoints={canUsePoints}
        usePoints={usePoints}
        setUsePoints={setUsePoints}
        posTotal={posTotal}
        discount={discount}
        showPaymentDetails={showPaymentDetails}
        setShowPaymentDetails={setShowPaymentDetails}
        onCheckoutClick={onCheckoutClick}
        isProcessing={isProcessing}
        posCartEmpty={posCart.length === 0}
        posPaymentMethod={posPaymentMethod}
        setPosPaymentMethod={setPosPaymentMethod}
        posCashReceived={posCashReceived}
        setPosCashReceived={setPosCashReceived}
        changeDue={changeDue}
      />

      {/* MODAL UPGRADE SUGGESTION */}
      {upgradeSuggestion && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
            <div className="bg-purple-600 p-4 text-white flex justify-between items-center">
              <h3 className="text-sm font-bold flex items-center gap-2"><Sparkles size={18}/> ¡Sugerencia de Combo Upgrade!</h3>
              <button onClick={() => setUpgradeSuggestion(null)} className="hover:bg-white/10 p-1 rounded-full transition-colors"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <p className="text-xs text-gray-500 mb-1">Por solo un poco más, lleva el:</p>
                <h4 className="text-xl font-black text-purple-700">{upgradeSuggestion.name}</h4>
                <p className="text-sm text-gray-600 mt-2">{upgradeSuggestion.description}</p>
              </div>

              <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-gray-600">Precio Combo:</span>
                  <span className="text-lg font-black text-purple-700">${upgradeSuggestion.price.toFixed(2)}</span>
                </div>
                <p className="text-[10px] text-purple-400 italic text-center">Ahorras un {Math.round((1 - upgradeSuggestion.price / upgradeSuggestion.productIds.reduce((acc, id) => {
                    const p = products.find(x => x.id === id);
                    return acc + (p?.price || 0);
                }, 0)) * 100)}% comparado con compra individual.</p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setUpgradeSuggestion(null)}
                  className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition"
                >
                  No, gracias
                </button>
                <button 
                  onClick={() => {
                    addBundleToPosCart(upgradeSuggestion);
                    setUpgradeSuggestion(null);
                  }}
                  className="flex-[2] bg-purple-600 text-white py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-lg active:scale-95"
                >
                  ¡Aceptar Combo!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO CLIENTE */}
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
    </div>
  );
};

export default AdminPOS;
