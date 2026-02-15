
import React, { useState, useMemo } from 'react';
import { ScanBarcode, Calculator } from 'lucide-react';
import { Product, CartItem, User, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE } from '../types';
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
  posCart: CartItem[];
  setPosCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  posSearch: string;
  setPosSearch: (s: string) => void;
  posCashReceived: string;
  setPosCashReceived: (s: string) => void;
  posPaymentMethod: 'CASH' | 'TRANSFER';
  setPosPaymentMethod: (m: 'CASH' | 'TRANSFER') => void;
  addToPosCart: (p: Product, unitType?: 'UNIT' | 'BOX') => void;
  removeFromPosCart: (id: string) => void;
  handlePosCheckout: (customer?: User, pointsRedeemed?: number) => void;
  setShowScanner: (b: boolean) => void;
  setShowCashClosure: (b: boolean) => void;
  onDeleteUser?: (uid: string) => Promise<void>;
}

const AdminPOS: React.FC<AdminPOSProps> = ({
  products, users, posCart, setPosCart, posSearch, setPosSearch, posCashReceived, setPosCashReceived, 
  posPaymentMethod, setPosPaymentMethod, addToPosCart, removeFromPosCart, 
  handlePosCheckout, setShowScanner, setShowCashClosure
}) => {
  // ESTADOS LOCALES DE UI
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
            </div>
          </div>

          <POSProductSearch 
            posSearch={posSearch}
            setPosSearch={setPosSearch}
            filteredProducts={filteredProducts}
            addToPosCart={addToPosCart}
          />
        </div>
      </div>

      {/* 2. PANEL CENTRAL (Lista de Productos) */}
      <div className="flex-grow overflow-y-auto p-2 md:p-4 bg-white no-scrollbar">
        <POSCartList 
          posCart={posCart}
          removeFromPosCart={removeFromPosCart}
          addToPosCart={addToPosCart}
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
