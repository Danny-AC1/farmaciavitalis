
import React, { useState, useMemo, useEffect } from 'react';
import { ScanBarcode, Calculator, Package, Sparkles, X, Plus } from 'lucide-react';
import { Product, CartItem, User, Order, POINTS_THRESHOLD, POINTS_DISCOUNT_VALUE, Bundle } from '../../types';
import { saveUserDB } from '../../services/db';
import { getActiveDiscounts, getDiscountedPrice, subscribeToDiscounts, ActiveDiscount } from '../../utils/discounts';

// Sub-componentes
import POSCustomerSelect from './POSCustomerSelect';
import POSProductSearch from './POSProductSearch';
import POSCartList from './POSCartList';
import POSFooter from './POSFooter';
import POSUserModal from './POSUserModal';
import SmartSubstitutionPOS from './SmartSubstitutionPOS';

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
  handlePosCheckout: (customer?: User, pointsRedeemed?: number) => Promise<any>;
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
  const [substitutionTerm, setSubstitutionTerm] = useState('');
  const [showSubstitution, setShowSubstitution] = useState(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // EFECTO PARA LIMPIAR EL FEEDBACK DEL SCANNER
  React.useEffect(() => {
    if (lastScanned) {
        const timer = setTimeout(() => setLastScanned(null), 3000);
        return () => clearTimeout(timer);
    }
  }, [lastScanned]);

  // DESCUENTOS ACTIVOS (Suite Gerencial)
  const [activeDiscounts, setActiveDiscounts] = useState<ActiveDiscount[]>([]);

  useEffect(() => {
    setActiveDiscounts(getActiveDiscounts());
    return subscribeToDiscounts(() => {
      setActiveDiscounts(getActiveDiscounts());
    });
  }, []);

  // ESTADOS DEL FORMULARIO DE REGISTRO
  const [regName, setRegName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // CALCULOS MATEMÁTICOS (Cerebro del POS)
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

  const canUsePoints = projectedPoints >= POINTS_THRESHOLD;
  const discount = usePoints ? POINTS_DISCOUNT_VALUE : 0;
  const posTotal = Math.max(0, subtotal - discount);
  const changeDue = posCashReceived ? parseFloat(posCashReceived) - posTotal : 0;

  const handleAddToCartWithUpgradeCheck = (p: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    if (p.stock <= 0) {
      setSubstitutionTerm(p.name);
      setShowSubstitution(true);
      return;
    }
    addToPosCart(p, unitType);
    setLastScanned(p.name);
    
    // Buscar si hay un combo de upgrade para este producto
    const upgrade = bundles.find(b => b.active && b.isUpgrade && b.baseProductId === p.id);
    if (upgrade) {
      setUpgradeSuggestion(upgrade);
    }
  };

  // FILTROS DE BÚSQUEDA
  const filteredProducts = useMemo(() => {
    if (!posSearch) return [];
    const searchLower = posSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(searchLower) || 
      (p.barcode && p.barcode === posSearch) ||
      p.category.toLowerCase().includes(searchLower) ||
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(searchLower)) ||
      (p.keywords && p.keywords.toLowerCase().includes(searchLower))
    ).slice(0, 8); // Aumentado un poco el límite para mostrar alternativas
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
        accumulatedSpend: 0,
        createdAt: new Date().toISOString()
    };
    await saveUserDB(userToSave);
    setSelectedCustomer(userToSave);
    resetUserForm();
    setCustomerSearch('');
  };

  const handlePrintOrder = (order: Order) => {
    const itemsHtml = order.items.map(item => {
      const isBox = item.selectedUnit === 'BOX';
      const priceToUse = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      const unitLabel = isBox ? `[CJ x${item.unitsPerBox}]` : '[UN]';
      
      return `
        <div class="item-row">
          <div class="item-name bold">${item.name.toUpperCase()}</div>
          <div class="item-details">
            <span>${item.quantity} x $${priceToUse.toFixed(2)} ${unitLabel}</span>
            <span>$${(priceToUse * item.quantity).toFixed(2)}</span>
          </div>
        </div>
      `;
    }).join('');

    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);

    const content = `
      <html>
        <head>
          <title>TICKET - ${order.id.slice(-6)}</title>
          <style>
            @page { margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 48mm; 
              padding: 2mm; 
              margin: 0; 
              font-size: 11px;
              color: #000;
              line-height: 1.1;
              font-weight: 700;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: 900; }
            .divider { border-top: 2px dashed #000; margin: 6px 0; }
            .header-main { font-size: 16px; margin-bottom: 2px; font-weight: 900; }
            .item-row { margin-bottom: 8px; }
            .item-details { display: flex; justify-content: space-between; font-size: 10px; font-weight: 700; }
            .totals-row { display: flex; justify-content: space-between; margin: 2px 0; font-weight: 700; }
            .total-final { font-size: 14px; border-top: 3px solid #000; padding-top: 4px; margin-top: 5px; font-weight: 900; }
            .mt-1 { margin-top: 6px; }
            .mt-2 { margin-top: 12px; }
            .footer { margin-top: 20px; font-size: 9px; font-style: italic; font-weight: 700; }
            .uppercase { text-transform: uppercase; }
          </style>
        </head>
        <body>
          <div class="text-center bold header-main">FARMACIA VITALIS</div>
          <div class="text-center uppercase" style="font-size: 8px;">Tu Salud Al Día</div>
          <div class="text-center" style="font-size: 8px;">Machalilla, Ecuador</div>
          <div class="text-center" style="font-size: 8px;">TEL: 0998506160</div>
          
          <div class="divider"></div>
          
          <div class="bold">ORDEN: #${order.id.slice(-8)}</div>
          <div>FECHA: ${new Date(order.date).toLocaleString()}</div>
          <div>MODO: ${order.source || 'VENTA'}</div>
          
          <div class="divider"></div>
          
          <div class="bold">CLIENTE:</div>
          <div class="uppercase">${order.customerName}</div>
          <div style="font-size: 9px;">DIR: ${order.customerAddress.substring(0, 30)}</div>
          
          <div class="divider"></div>
          
          <div class="bold">DETALLE PRODUCTOS:</div>
          <div class="mt-1">${itemsHtml}</div>
          
          <div class="divider"></div>
          
          <div class="totals-row">
            <span>SUBTOTAL:</span>
            <span>$${order.subtotal.toFixed(2)}</span>
          </div>
          <div class="totals-row">
            <span>ENVIO:</span>
            <span>$${(order.deliveryFee || 0).toFixed(2)}</span>
          </div>
          ${order.discount ? `
          <div class="totals-row">
            <span>DESCUENTO:</span>
            <span>-$${order.discount.toFixed(2)}</span>
          </div>` : ''}
          
          <div class="totals-row bold total-final">
            <span>TOTAL:</span>
            <span>$${order.total.toFixed(2)}</span>
          </div>
          
          <div class="divider"></div>
          
          <div class="bold">METODO PAGO: ${order.paymentMethod === 'CASH' ? 'EFECTIVO' : 'TRANSFERENCIA'}</div>
          ${order.paymentMethod === 'CASH' && order.cashGiven ? `
            <div class="totals-row">
              <span>RECIBIDO:</span>
              <span>$${order.cashGiven.toFixed(2)}</span>
            </div>
            <div class="totals-row bold">
              <span>CAMBIO:</span>
              <span>$${(order.cashGiven - order.total).toFixed(2)}</span>
            </div>
          ` : ''}

          ${order.userId ? `
            <div class="mt-2 text-center bold" style="font-size: 8px;">
              ¡PUNTOS VITALIS SUMADOS!
            </div>
          ` : ''}
          
          <div class="divider"></div>
          
          <div class="text-center footer">
            DOCUMENTO NO VALIDO COMO FACTURA.<br>
            ¡GRACIAS POR SU PREFERENCIA!<br>
            vitalis.ec
          </div>
          <div style="height: 10mm;"></div>
        </body>
      </html>
    `;

    const frameDoc = printFrame.contentWindow?.document;
    if (frameDoc) {
      frameDoc.open();
      frameDoc.write(content);
      frameDoc.close();
      setTimeout(() => {
        printFrame.contentWindow?.focus();
        printFrame.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(printFrame);
        }, 1000);
      }, 500);
    }
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

  const onCheckoutAndPrintClick = async () => {
      if (posCart.length === 0) return;
      setIsProcessing(true);
      try {
          const order = await handlePosCheckout(selectedCustomer || undefined, usePoints ? POINTS_THRESHOLD : 0);
          if (order) {
              handlePrintOrder(order);
          }
          setUsePoints(false);
          setSelectedCustomer(null);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative font-sans">
      
      {/* 1. PANEL SUPERIOR (Buscadores) */}
      {lastScanned && (
          <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] animate-in fade-in slide-in-from-top-4">
              <div className="bg-teal-600 text-white px-6 py-2 rounded-full shadow-2xl flex items-center gap-2 font-bold text-xs ring-4 ring-teal-600/20">
                  <ScanBarcode size={16} className="animate-pulse" />
                  <span>AGREGADO: <span className="uppercase">{lastScanned}</span></span>
              </div>
          </div>
      )}

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
              projectedAccumulated={projectedAccumulated}
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
            onSearchAlternatives={(term) => {
              setSubstitutionTerm(term);
              setShowSubstitution(true);
            }}
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
        onCheckoutAndPrintClick={onCheckoutAndPrintClick}
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

      {/* MODAL SUSTITUCIÓN INTELIGENTE */}
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
    </div>
  );
};

export default AdminPOS;
