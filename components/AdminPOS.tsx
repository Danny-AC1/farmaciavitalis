
import React, { useState, useMemo } from 'react';
/* Added ShoppingCart to the imports */
import { Search, ScanBarcode, Calculator, Trash2, ShoppingBag, ShoppingCart, Banknote, Landmark, Printer, ChevronRight, ArrowLeft, UserPlus, Star, UserCheck, X, Edit2 } from 'lucide-react';
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
  const [mobileView, setMobileView] = useState<'products' | 'cart'>('products');
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Formulario Usuario (Add/Edit)
  const [userId, setUserId] = useState('');
  const [regName, setRegName] = useState('');
  const [regCedula, setRegCedula] = useState('');
  const [regPhone, setRegPhone] = useState('');

  // Cálculo de total considerando unidades o cajas
  const posTotal = useMemo(() => posCart.reduce((sum, item) => {
      const isBox = item.selectedUnit === 'BOX';
      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
  }, 0), [posCart]);

  const changeDue = posCashReceived ? parseFloat(posCashReceived) - posTotal : 0;

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(posSearch.toLowerCase()) || 
    (p.barcode && p.barcode === posSearch) ||
    p.category.toLowerCase().includes(posSearch.toLowerCase())
  );

  // Resultados de búsqueda de clientes
  const searchResults = useMemo(() => {
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

  const startEdit = (user: User) => {
      setUserId(user.uid);
      setRegName(user.displayName);
      setRegCedula(user.cedula || '');
      setRegPhone(user.phone || '');
      setIsEditing(true);
      setShowUserForm(true);
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-64px)] lg:h-full lg:grid lg:grid-cols-3 gap-0 lg:gap-6 animate-in fade-in overflow-hidden">
        
        {/* SELECTOR DE VISTA MÓVIL */}
        <div className="lg:hidden flex bg-slate-900 p-1 shrink-0">
            <button 
                onClick={() => setMobileView('products')}
                className={`flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all ${mobileView === 'products' ? 'bg-teal-600 text-white shadow-lg' : 'text-slate-500'}`}
            >
                Catálogo ({filteredProducts.length})
            </button>
            <button 
                onClick={() => setMobileView('cart')}
                className={`flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest transition-all relative ${mobileView === 'cart' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500'}`}
            >
                Resumen de Venta
                {posCart.length > 0 && (
                    <span className="ml-1.5 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-[9px]">
                        {posCart.length}
                    </span>
                )}
            </button>
        </div>

        {/* COLUMNA PRODUCTOS */}
        <div className={`lg:col-span-2 flex flex-col bg-white overflow-hidden ${mobileView !== 'products' ? 'hidden lg:flex' : 'flex'}`}>
            <div className="p-2 lg:p-4 bg-slate-100 flex justify-between items-center shrink-0 gap-2 border-b">
                <div className="relative flex-grow">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-3.5 w-3.5" />
                    <input 
                      className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-4 text-xs font-bold focus:ring-2 focus:ring-teal-500 outline-none transition-all" 
                      placeholder="Buscar producto o escanear..." 
                      value={posSearch} 
                      onChange={e => setPosSearch(e.target.value)} 
                    />
                </div>
                <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => setShowScanner(true)} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition" title="Escanear"><ScanBarcode size={18}/></button>
                    <button onClick={() => setShowCashClosure(true)} className="p-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition" title="Cierre de Caja"><Calculator size={18}/></button>
                </div>
            </div>
            
            <div className="p-2 lg:p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 lg:gap-4 overflow-y-auto flex-grow bg-slate-50/50 content-start pb-28 lg:pb-6">
                {filteredProducts.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => addToPosCart(p)}
                      className="bg-white p-2 rounded-xl border border-slate-100 shadow-sm cursor-pointer hover:border-teal-500 transition-all flex flex-col h-40 lg:h-56 group active:scale-95"
                    >
                        <div className="h-16 lg:h-28 flex items-center justify-center mb-1">
                            <img src={p.image} className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                        </div>
                        <h4 className="text-[9px] lg:text-xs font-black text-slate-800 line-clamp-2 mb-0.5 leading-tight uppercase tracking-tight">{p.name}</h4>
                        <div className="mt-auto flex justify-between items-center">
                            <span className="text-teal-700 font-black text-xs lg:text-base">${p.price.toFixed(2)}</span>
                            <div className={`px-1 py-0.5 rounded text-[8px] font-black uppercase ${p.stock < 10 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                {p.stock}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {mobileView === 'products' && posCart.length > 0 && (
                <div className="lg:hidden fixed bottom-4 left-4 right-4 z-[50]">
                    <button onClick={() => setMobileView('cart')} className="w-full bg-teal-600 text-white p-3.5 rounded-2xl shadow-2xl flex justify-between items-center border-2 border-white active:scale-95 transition-transform">
                        <div className="flex items-center gap-2">
                            <ShoppingCart size={18}/>
                            <div className="text-left">
                                <p className="text-[8px] font-black text-white/70 uppercase">Total en carrito</p>
                                <p className="text-lg font-black">${posTotal.toFixed(2)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-bold bg-white/20 px-2 py-1 rounded-lg">COBRAR <ChevronRight size={14} /></div>
                    </button>
                </div>
            )}
        </div>

        {/* COLUMNA CARRITO / PAGO */}
        <div className={`bg-white flex flex-col h-full lg:rounded-3xl lg:shadow-xl lg:border lg:border-slate-200 overflow-hidden ${mobileView !== 'cart' ? 'hidden lg:flex' : 'flex'}`}>
            
            {/* SECCIÓN FIDELIDAD REDISEÑADA */}
            <div className="p-3 bg-slate-900 text-white shrink-0 border-b border-slate-700 relative">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Identificar Cliente</span>
                    {selectedCustomer && (
                        <button onClick={() => setSelectedCustomer(null)} className="text-[8px] font-black text-red-400 uppercase flex items-center gap-1 hover:text-red-300">
                           <X size={10}/> Desvincular
                        </button>
                    )}
                </div>

                {!selectedCustomer ? (
                    <div className="space-y-2">
                        <div className="flex gap-2">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 h-3.5 w-3.5" />
                                <input 
                                    className="w-full bg-slate-800 border-none rounded-lg py-2 pl-9 pr-4 text-xs font-bold focus:ring-1 focus:ring-teal-500 outline-none" 
                                    placeholder="Cédula, nombre o celular..." 
                                    value={customerSearch}
                                    onChange={e => setCustomerSearch(e.target.value)}
                                />
                            </div>
                            <button onClick={() => setShowUserForm(true)} className="bg-teal-600 p-2 rounded-lg hover:bg-teal-700 transition" title="Nuevo Cliente"><UserPlus size={16}/></button>
                        </div>

                        {/* RESULTADOS DE BÚSQUEDA FLOTANTES */}
                        {searchResults.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-slate-800 border border-slate-700 shadow-2xl rounded-b-2xl overflow-hidden mt-1 max-h-60 overflow-y-auto">
                                {searchResults.map(u => (
                                    <div key={u.uid} className="flex items-center justify-between p-3 border-b border-slate-700 hover:bg-slate-700 transition cursor-pointer">
                                        <div className="flex-grow min-w-0" onClick={() => { setSelectedCustomer(u); setCustomerSearch(''); }}>
                                            <p className="text-[10px] font-black uppercase truncate leading-tight">{u.displayName}</p>
                                            <p className="text-[8px] font-bold text-slate-400">{u.cedula} • {u.phone || 'S/T'}</p>
                                        </div>
                                        <div className="flex gap-2 shrink-0 ml-3">
                                            <button onClick={() => startEdit(u)} className="p-1.5 bg-blue-600/20 text-blue-400 rounded hover:bg-blue-600 hover:text-white" title="Editar"><Edit2 size={12}/></button>
                                            <button onClick={() => onDeleteUser?.(u.uid)} className="p-1.5 bg-red-600/20 text-red-400 rounded hover:bg-red-600 hover:text-white" title="Borrar"><Trash2 size={12}/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {customerSearch.length >= 3 && searchResults.length === 0 && (
                            <div className="p-3 text-center text-slate-500 text-[10px] font-bold italic">No se encontraron clientes</div>
                        )}
                    </div>
                ) : (
                    <div className="bg-teal-600/20 border border-teal-500/30 p-3 rounded-xl flex items-center justify-between animate-in zoom-in-95 group">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 bg-teal-500 rounded-lg flex items-center justify-center text-white"><UserCheck size={18}/></div>
                            <div>
                                <p className="text-xs font-black uppercase tracking-tight">{selectedCustomer.displayName}</p>
                                <p className="text-[9px] font-bold text-teal-400 flex items-center gap-1"><Star size={10} className="fill-teal-400"/> {selectedCustomer.points} Puntos Vitalis</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                             <button onClick={() => startEdit(selectedCustomer)} className="p-2 bg-white/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"><Edit2 size={14}/></button>
                             <div className="text-right">
                                <p className="text-[8px] font-black text-white/50 uppercase">Gana hoy</p>
                                <p className="text-xs font-black text-teal-400">+{Math.floor(posTotal)}</p>
                             </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-3 bg-teal-600 text-white shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2 font-black tracking-widest text-[10px] uppercase">
                    <button onClick={() => setMobileView('products')} className="lg:hidden p-1.5 hover:bg-white/10 rounded-lg mr-1"><ArrowLeft size={16}/></button>
                    Detalle de Venta
                </div>
            </div>
            
            <div className="flex-grow overflow-y-auto p-2 lg:p-4 space-y-2 bg-slate-50/50">
                {posCart.map(item => (
                    <div key={item.id} className="flex gap-2 items-center bg-white p-2.5 rounded-xl border border-slate-100 shadow-sm animate-in slide-in-from-right-2">
                        <div className="h-10 w-10 bg-slate-50 rounded-lg flex items-center justify-center shrink-0 border border-slate-100">
                            <img src={item.image} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-800 uppercase truncate leading-none mb-1">{item.name}</p>
                            <p className="text-[9px] font-bold text-slate-400">{item.quantity} x ${item.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xs text-teal-700">${(item.price * item.quantity).toFixed(2)}</span>
                            <button onClick={() => removeFromPosCart(item.id)} className="text-red-400 p-1.5 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
                
                {posCart.length === 0 && (
                    <div className="text-center py-10 opacity-30">
                        <ShoppingBag size={40} className="mx-auto mb-2" />
                        <p className="font-black uppercase text-[10px]">Esperando productos</p>
                    </div>
                )}
            </div>

            <div className="p-3 lg:p-6 bg-white border-t border-slate-200 space-y-3 shadow-[0_-15px_30px_-10px_rgba(0,0,0,0.1)] shrink-0 pb-6 lg:pb-8">
                <div className="flex justify-between items-end px-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">TOTAL A PAGAR</span>
                    <span className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">${posTotal.toFixed(2)}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2">
                    <button 
                        onClick={() => setPosPaymentMethod('CASH')} 
                        className={`py-2 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${posPaymentMethod === 'CASH' ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                    >
                        <Banknote size={16}/><span className="text-[9px] font-black uppercase">Efectivo</span>
                    </button>
                    <button 
                        onClick={() => setPosPaymentMethod('TRANSFER')} 
                        className={`py-2 rounded-xl border-2 flex items-center justify-center gap-2 transition-all ${posPaymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-50 bg-slate-50 text-slate-400'}`}
                    >
                        <Landmark size={16}/><span className="text-[9px] font-black uppercase">Transf.</span>
                    </button>
                </div>

                {posPaymentMethod === 'CASH' && (
                    <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-bottom-2">
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-200 flex flex-col justify-center">
                            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Recibido</label>
                            <input 
                              type="number" inputMode="decimal" placeholder="0.00" 
                              className="w-full bg-transparent border-none p-0 text-xl font-black text-slate-800 focus:ring-0 leading-none" 
                              value={posCashReceived} onChange={e => setPosCashReceived(e.target.value)} 
                            />
                        </div>
                        <div className={`p-2 rounded-xl flex flex-col justify-center border ${changeDue >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                            <span className="text-[8px] font-black uppercase text-slate-400 mb-1">Cambio</span>
                            <span className={`text-xl font-black leading-none ${changeDue >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                ${changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}
                            </span>
                        </div>
                    </div>
                )}

                <button 
                  onClick={() => handlePosCheckout(selectedCustomer || undefined)} 
                  disabled={posCart.length === 0}
                  className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-black text-sm hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg active:scale-95"
                >
                    <Printer size={18}/> {selectedCustomer ? 'VENTA CON PUNTOS' : 'VENTA RÁPIDA'}
                </button>
            </div>
        </div>

        {/* MODAL GESTIÓN DE USUARIO (Add/Edit) */}
        {showUserForm && (
            <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                    <div className={`${isEditing ? 'bg-blue-600' : 'bg-slate-900'} p-6 text-white flex justify-between items-center`}>
                        <div>
                            <h3 className="font-black text-lg uppercase tracking-tight flex items-center gap-2">
                                {isEditing ? <Edit2 size={20}/> : <UserPlus size={20}/>} 
                                {isEditing ? 'Editar Cliente' : 'Nuevo Registro'}
                            </h3>
                            <p className="text-[9px] font-bold text-white/70 uppercase tracking-widest mt-1">
                                {isEditing ? 'Actualiza los datos del cliente' : 'Programa de Fidelidad Vitalis'}
                            </p>
                        </div>
                        <button onClick={resetForm} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
                    </div>
                    <form onSubmit={handleSaveUser} className="p-8 space-y-4">
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Número de Cédula</label>
                            <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" value={regCedula} onChange={e => setRegCedula(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                            <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm uppercase" value={regName} onChange={e => setRegName(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                            <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" value={regPhone} onChange={e => setRegPhone(e.target.value)} />
                        </div>
                        
                        <div className="flex gap-2 mt-4">
                            {isEditing && (
                                <button type="button" onClick={() => { if(onDeleteUser) onDeleteUser(userId); resetForm(); }} className="p-4 bg-red-50 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm">
                                    <Trash2 size={20}/>
                                </button>
                            )}
                            <button type="submit" className="flex-grow bg-teal-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-teal-500/20 active:scale-95 transition-all">
                                {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPOS;
