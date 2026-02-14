
import React, { useState, useMemo } from 'react';
import { Search, ScanBarcode, Calculator, Trash2, ShoppingBag, ShoppingCart, Banknote, Landmark, Printer, Package, X, Edit2, UserPlus, UserCheck, Star, Plus, Minus, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { Product, CartItem, User } from '../types';
import { saveUserDB } from '../services/db';

interface AdminPOSProps {
  products: Product[];
  users: User[];
  posCart: CartItem[];
  posSearch: string;
  setPosSearch: (s: string) => void;
  posCashReceived: string;
  setPosCashReceived: (s: string) => void;
  posPaymentMethod: 'CASH' | 'TRANSFER';
  setPosPaymentMethod: (m: 'CASH' | 'TRANSFER') => void;
  addToPosCart: (p: Product) => void;
  removeFromPosCart: (id: string) => void;
  handlePosCheckout: (customer?: User) => void;
  setShowScanner: (b: boolean) => void;
  setShowCashClosure: (b: boolean) => void;
  onDeleteUser?: (uid: string) => Promise<void>;
}

const AdminPOS: React.FC<AdminPOSProps> = ({
  products, users, posCart, posSearch, setPosSearch, posCashReceived, setPosCashReceived, 
  posPaymentMethod, setPosPaymentMethod, addToPosCart, removeFromPosCart, 
  handlePosCheckout, setShowScanner, setShowCashClosure, onDeleteUser
}) => {
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPaymentDetails, setShowPaymentDetails] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Formulario Usuario (Add/Edit)
  const [userId, setUserId] = useState('');
  const [regName, setRegName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const posTotal = useMemo(() => posCart.reduce((sum, item) => {
      const isBox = item.selectedUnit === 'BOX';
      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
  }, 0), [posCart]);

  const changeDue = posCashReceived ? parseFloat(posCashReceived) - posTotal : 0;

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

  const resetForm = () => {
    setUserId(''); setRegName(''); setRegCedula(''); setRegPhone('');
    setIsEditing(false); setShowUserForm(false);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const userToSave: User = {
        uid: isEditing ? userId : `CUST-${Date.now()}`,
        displayName: regName,
        cedula: regCedula,
        phone: regPhone,
        email: isEditing ? (users.find(u=>u.uid===userId)?.email || `${regCedula}@vitalis.pos`) : `${regCedula}@vitalis.pos`,
        role: 'USER',
        points: isEditing ? (users.find(u=>u.uid===userId)?.points || 0) : 0,
        createdAt: isEditing ? (users.find(u=>u.uid===userId)?.createdAt || new Date().toISOString()) : new Date().toISOString()
    };
    await saveUserDB(userToSave);
    setSelectedCustomer(userToSave);
    resetForm();
    setCustomerSearch('');
  };

  const onCheckoutClick = async () => {
      setIsProcessing(true);
      try {
          await handlePosCheckout(selectedCustomer || undefined);
      } finally {
          setIsProcessing(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 overflow-hidden relative">
      
      {/* 1. PANEL SUPERIOR */}
      <div className="bg-white border-b border-slate-200 p-2 md:p-4 shrink-0 shadow-sm z-20">
        <div className="max-w-[1600px] mx-auto space-y-2 md:space-y-3">
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3">
            <div className="flex-grow relative">
              {!selectedCustomer ? (
                <div className="flex gap-1 md:gap-2">
                  <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                      className="w-full bg-slate-100 border-none rounded-lg md:rounded-xl py-2 pl-9 pr-3 text-xs md:text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none" 
                      placeholder="Cliente (Cédula/Nombre)..." 
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  <button onClick={() => setShowUserForm(true)} className="bg-slate-900 text-white p-2 rounded-lg md:rounded-xl hover:bg-black transition"><UserPlus size={16}/></button>
                </div>
              ) : (
                <div className="bg-teal-50 border border-teal-200 p-1.5 rounded-lg md:rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="bg-teal-600 text-white p-1 rounded-md"><UserCheck size={14}/></div>
                    <div className="min-w-0">
                      <p className="text-[10px] md:text-xs font-black uppercase text-teal-800 leading-none truncate">{selectedCustomer.displayName}</p>
                      <p className="text-[8px] md:text-[9px] font-bold text-teal-600 mt-0.5 uppercase tracking-tighter">{selectedCustomer.cedula} • {selectedCustomer.points} PTS</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedCustomer(null)} className="text-teal-400 hover:text-red-500 p-1"><X size={14}/></button>
                </div>
              )}
              {customerSearchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden mt-1 max-h-60 overflow-y-auto">
                  {customerSearchResults.map(u => (
                    <div key={u.uid} onClick={() => { setSelectedCustomer(u); setCustomerSearch(''); }} className="p-2 border-b last:border-0 hover:bg-teal-50 cursor-pointer flex justify-between items-center">
                      <div className="min-w-0"><p className="text-[10px] font-bold uppercase truncate">{u.displayName}</p><p className="text-[8px] text-slate-400">{u.cedula}</p></div>
                      <span className="text-[7px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded shrink-0">SELECT</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-1 md:gap-2 shrink-0">
              <button onClick={() => setShowScanner(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] text-slate-600 hover:bg-slate-50 transition">
                <ScanBarcode size={14}/> <span className="hidden sm:inline">SCANNER</span>
              </button>
              <button onClick={() => setShowCashClosure(true)} className="flex-1 md:flex-none flex items-center justify-center gap-1.5 bg-white border border-slate-200 px-3 py-1.5 rounded-lg md:rounded-xl font-bold text-[10px] md:text-[11px] text-slate-600 hover:bg-slate-50 transition">
                <Calculator size={14}/> <span className="hidden sm:inline">CIERRE</span>
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-teal-600" size={18} />
            <input 
              autoFocus
              className="w-full bg-teal-50 border-2 border-teal-100 rounded-lg md:rounded-xl py-2.5 md:py-3 pl-10 md:pl-12 pr-4 md:pr-6 text-sm md:text-lg font-black text-teal-900 focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 outline-none transition-all placeholder:text-teal-200" 
              placeholder="BUSCAR PRODUCTO O SCAN..." 
              value={posSearch} 
              onChange={e => setPosSearch(e.target.value)} 
            />
            {filteredProducts.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-[90] bg-white border border-slate-200 shadow-2xl rounded-lg md:rounded-xl overflow-hidden mt-1 animate-in zoom-in-95 origin-top max-h-80 overflow-y-auto">
                {filteredProducts.map(p => (
                  <div key={p.id} onClick={() => { addToPosCart(p); setPosSearch(''); }} className="flex items-center justify-between p-2 md:p-3 hover:bg-teal-50 transition-colors cursor-pointer border-b last:border-0 group">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0">
                      <div className="w-8 h-8 bg-slate-50 rounded flex items-center justify-center p-1 shrink-0"><Package size={14} className="text-slate-400"/></div>
                      <div className="min-w-0"><p className="text-[10px] md:text-xs font-black text-slate-800 uppercase truncate">{p.name}</p><p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase truncate">{p.category} • STOCK: {p.stock}</p></div>
                    </div>
                    <div className="text-right shrink-0"><p className="text-xs md:text-sm font-black text-teal-600">${p.price.toFixed(2)}</p><p className="text-[7px] md:text-[8px] font-bold text-slate-300 uppercase">AGREGAR</p></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. PANEL CENTRAL */}
      <div className="flex-grow overflow-y-auto p-2 md:p-4 bg-white no-scrollbar">
        <div className="max-w-[1400px] mx-auto">
          {posCart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-10 md:py-20 opacity-20">
              <ShoppingBag size={80} strokeWidth={1} />
              <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.2em] mt-4">Esperando productos...</p>
            </div>
          ) : (
            <div className="space-y-0.5 md:space-y-1">
              <div className="hidden md:flex items-center justify-between py-2 border-b border-slate-100 mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Producto</span>
                <div className="flex gap-16 px-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-32 text-center">Cantidad</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-right">Subtotal</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-8"></span>
                </div>
              </div>
              {posCart.map(item => (
                <div key={item.id} className="flex flex-col md:flex-row items-stretch md:items-center justify-between py-2 md:py-3 px-2 md:px-4 rounded-lg md:rounded-xl border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group animate-in slide-in-from-bottom-1">
                  <div className="flex-grow min-w-0 flex items-center gap-2 md:gap-3 mb-2 md:mb-0">
                    <span className="text-[7px] md:text-[8px] font-black text-teal-600 bg-teal-50 px-1 md:px-1.5 py-0.5 rounded uppercase shrink-0">{item.category}</span>
                    <h4 className="text-[11px] md:text-sm font-black text-slate-800 uppercase truncate leading-none flex-grow">{item.name}</h4>
                    <span className="text-[9px] md:text-[10px] font-bold text-slate-400 shrink-0">(${item.price.toFixed(2)})</span>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-4 md:gap-12 shrink-0">
                    <div className="flex items-center bg-slate-50 md:bg-white rounded-lg border border-slate-200 p-0.5 shadow-sm">
                      <button onClick={() => removeFromPosCart(item.id)} className="p-1.5 md:p-1 text-slate-400 hover:text-red-500 transition-all"><Minus size={14} strokeWidth={3}/></button>
                      <span className="px-2 md:px-3 text-[12px] md:text-sm font-black text-slate-800 w-8 md:w-10 text-center">{item.quantity}</span>
                      <button onClick={() => addToPosCart(item)} className="p-1.5 md:p-1 text-slate-400 hover:text-teal-600 transition-all"><Plus size={14} strokeWidth={3}/></button>
                    </div>
                    
                    <div className="w-16 md:w-24 text-right">
                      <p className="text-[13px] md:text-base font-black text-slate-900 tabular-nums">${((item.selectedUnit === 'BOX' ? (item.publicBoxPrice || item.boxPrice || 0) : item.price) * item.quantity).toFixed(2)}</p>
                    </div>

                    <button onClick={() => removeFromPosCart(item.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 3. PANEL INFERIOR */}
      <div className="shrink-0 bg-slate-900 p-3 md:p-4 md:px-8 md:py-5 text-white border-t border-slate-800 shadow-2xl z-30">
        <div className="max-w-[1600px] mx-auto">
          
          <div className="flex items-center justify-between mb-3 md:hidden">
            <div>
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">TOTAL</span>
              <p className="text-2xl font-black text-teal-400 tracking-tighter leading-none flex items-start gap-0.5">
                <span className="text-xs opacity-50 mt-1">$</span>{posTotal.toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowPaymentDetails(!showPaymentDetails)}
                className="text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase p-2 bg-slate-800 rounded-lg"
              >
                {showPaymentDetails ? <ChevronDown size={14}/> : <ChevronUp size={14}/>} Pago
              </button>
              <button 
                onClick={onCheckoutClick} 
                disabled={posCart.length === 0 || isProcessing}
                className="bg-teal-600 text-white p-2 rounded-lg shadow-lg disabled:opacity-30"
                title="Finalizar Venta"
              >
                {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20}/>}
              </button>
            </div>
          </div>

          <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 ${showPaymentDetails ? 'flex' : 'hidden md:flex'}`}>
            
            <div className="flex items-center gap-4 md:gap-6 shrink-0 w-full lg:w-auto border-b lg:border-b-0 lg:border-r border-slate-800 pb-3 lg:pb-0 lg:pr-8">
              <div className="hidden md:block">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">TOTAL</span>
                <p className="text-4xl font-black text-teal-400 tracking-tighter leading-none flex items-start gap-0.5">
                  <span className="text-lg opacity-50 mt-1">$</span>{posTotal.toFixed(2)}
                </p>
              </div>

              <div className="flex gap-2 w-full md:w-auto justify-around sm:justify-start">
                <button 
                  onClick={() => setPosPaymentMethod('CASH')} 
                  className={`flex flex-col items-center justify-center flex-1 sm:flex-none w-14 h-14 rounded-xl border-2 transition-all gap-0.5 ${posPaymentMethod === 'CASH' ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                  <Banknote size={20}/><span className="text-[8px] font-black uppercase">Efect.</span>
                </button>
                <button 
                  onClick={() => setPosPaymentMethod('TRANSFER')} 
                  className={`flex flex-col items-center justify-center flex-1 sm:flex-none w-14 h-14 rounded-xl border-2 transition-all gap-0.5 ${posPaymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
                >
                  <Landmark size={20}/><span className="text-[8px] font-black uppercase">Trans.</span>
                </button>
              </div>
            </div>

            <div className="flex-grow w-full flex flex-col sm:flex-row items-center gap-4">
              {posPaymentMethod === 'CASH' && (
                <div className="grid grid-cols-2 gap-2 md:gap-3 w-full sm:w-auto flex-grow animate-in slide-in-from-right-2">
                  <div className="space-y-1">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase ml-1">Paga con</label>
                    <div className="relative">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">$</span>
                      <input 
                        type="number" inputMode="decimal" placeholder="0.00" 
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 md:py-1.5 pl-5 pr-2 text-sm md:text-base font-black text-white focus:border-teal-500 outline-none transition-all" 
                        value={posCashReceived} onChange={e => setPosCashReceived(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase ml-1">Cambio</label>
                    <div className={`h-[28px] md:h-[34px] rounded-lg flex items-center justify-center border border-dashed ${changeDue >= 0 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-red-500/50 text-red-400'}`}>
                      <span className="text-xs md:text-base font-black tabular-nums">${changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}</span>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={onCheckoutClick} 
                disabled={posCart.length === 0 || isProcessing}
                className="w-full sm:w-auto flex-grow bg-teal-600 hover:bg-teal-500 text-white py-3 md:py-3.5 px-4 md:px-6 rounded-lg md:rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-teal-500/10 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16}/>} 
                <span className="text-[10px] md:text-xs">
                    {isProcessing ? 'PROCESANDO...' : 'FINALIZAR VENTA'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL REGISTRO CLIENTE */}
      {showUserForm && (
          <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 md:p-4">
              <div className="bg-white rounded-2xl md:rounded-[2rem] w-full max-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                  <div className="bg-slate-900 p-4 md:p-5 text-white flex justify-between items-center">
                      <h3 className="font-black text-sm md:text-base uppercase tracking-tight flex items-center gap-2"><UserPlus size={18}/> Nuevo Cliente</h3>
                      <button onClick={resetForm} className="bg-white/10 p-1 rounded-full hover:bg-white/20 transition-colors"><X size={16}/></button>
                  </div>
                  <form onSubmit={handleSaveUser} className="p-4 md:p-6 space-y-3 md:space-y-4">
                      <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Número de Cédula</label><input required className="w-full bg-slate-100 border-none p-2 md:p-2.5 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-xs md:text-sm" value={regCedula} onChange={e => setRegCedula(e.target.value)} /></div>
                      <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Nombre Completo</label><input required className="w-full bg-slate-100 border-none p-2 md:p-2.5 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold uppercase text-xs md:text-sm" value={regName} onChange={e => setRegName(e.target.value)} /></div>
                      <div><label className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Teléfono</label><input required className="w-full bg-slate-100 border-none p-2 md:p-2.5 rounded-lg md:rounded-xl outline-none focus:ring-2 focus:ring-teal-500 font-bold text-xs md:text-sm" value={regPhone} onChange={e => setRegPhone(e.target.value)} /></div>
                      <button type="submit" className="w-full bg-teal-600 text-white py-3 md:py-3.5 rounded-lg md:rounded-xl font-black text-[10px] md:text-[11px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">REGISTRAR CLIENTE</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminPOS;
