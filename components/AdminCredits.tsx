import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, Order, CreditTicket } from '../types';
import { 
  Search, 
  DollarSign, 
  User as UserIcon, 
  Phone, 
  ShoppingCart, 
  Calendar, 
  Check, 
  Trash2, 
  Plus, 
  Minus, 
  FileText, 
  AlertCircle, 
  CreditCard, 
  CheckCircle, 
  Bookmark, 
  Clock 
} from 'lucide-react';
import { streamCredits, addCreditDB, updateCreditStatusDB, deleteCreditDB } from '../services/db.credits';
import { addOrderDB } from '../services/db.orders';
import { updateStockDB } from '../services/db.products';

interface AdminCreditsProps {
  products: Product[];
}

const AdminCredits: React.FC<AdminCreditsProps> = ({ products }) => {
  // Lista de créditos persistidos en tiempo real
  const [credits, setCredits] = useState<CreditTicket[]>([]);
  
  // Vistas y filtros
  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [listFilter, setListFilter] = useState<'ALL' | 'PENDIENTE' | 'PAGADO'>('PENDIENTE');
  const [searchTerm, setSearchTerm] = useState('');

  // Formulario de creación de crédito
  const [debtorName, setDebtorName] = useState('');
  const [debtorPhone, setDebtorPhone] = useState('');
  const [debtorAddress, setDebtorAddress] = useState('');
  const [creditCart, setCreditCart] = useState<CartItem[]>([]);
  const [productSearch, setProductSearch] = useState('');

  // Proceso de pago / liquidación
  const [selectedPaymentCredit, setSelectedPaymentCredit] = useState<CreditTicket | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [cashGiven, setCashGiven] = useState('');

  // Mensajes de éxito y alertas
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Escuchar cambios de créditos en tiempo real
  useEffect(() => {
    const unsubscribe = streamCredits((data) => {
      setCredits(data);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Filtrado y búsqueda de productos para el formulario de creación
  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return [];
    const lower = productSearch.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(lower)) ||
      (p.barcode && p.barcode.includes(lower))
    ).slice(0, 5); // Mostrar máximo 5 resultados sugeridos
  }, [products, productSearch]);

  // Filtrado y búsqueda de créditos
  const filteredCredits = useMemo(() => {
    return credits.filter(c => {
      const matchStatus = listFilter === 'ALL' || c.status === listFilter;
      const matchSearch = !searchTerm.trim() || 
        c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.customerPhone && c.customerPhone.includes(searchTerm));
      return matchStatus && matchSearch;
    });
  }, [credits, listFilter, searchTerm]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const pending = credits.filter(c => c.status === 'PENDIENTE');
    const totalPendingAmount = pending.reduce((sum, c) => sum + c.total, 0);
    const paid = credits.filter(c => c.status === 'PAGADO');
    const totalPaidAmount = paid.reduce((sum, c) => sum + c.total, 0);
    return {
      pendingCount: pending.length,
      pendingAmount: totalPendingAmount,
      paidCount: paid.length,
      paidAmount: totalPaidAmount
    };
  }, [credits]);

  // Agregar un producto al carrito de fiados
  const addToCreditCart = (product: Product, unitType: 'UNIT' | 'BOX' = 'UNIT') => {
    const unitsNeeded = unitType === 'BOX' ? (product.unitsPerBox || 1) : 1;
    
    // Calcular cantidad ya agregada
    const alreadyInCart = creditCart
      .filter(item => item.id === product.id)
      .reduce((sum, item) => {
        const itemUnits = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
        return sum + (item.quantity * itemUnits);
      }, 0);

    if (alreadyInCart + unitsNeeded > product.stock) {
      setErrorMessage(`Stock insuficiente de ${product.name}. Disponible: ${product.stock} uds.`);
      setTimeout(() => setErrorMessage(null), 4000);
      return;
    }

    setCreditCart(prev => {
      const exists = prev.find(item => item.id === product.id && item.selectedUnit === unitType);
      if (exists) {
        return prev.map(item => (item.id === product.id && item.selectedUnit === unitType)
          ? { ...item, quantity: item.quantity + 1 }
          : item
        );
      }
      return [...prev, { ...product, quantity: 1, selectedUnit: unitType }];
    });
    setProductSearch('');
  };

  // Modificar cantidad en el carrito de fiados
  const updateCartQty = (productId: string, unitType: 'UNIT' | 'BOX', delta: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setCreditCart(prev => {
      return prev.map(item => {
        if (item.id === productId && item.selectedUnit === unitType) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;

          // Validar stock total requerido
          const unitsNeeded = unitType === 'BOX' ? (product.unitsPerBox || 1) * newQty : newQty;
          if (unitsNeeded > product.stock) {
            setErrorMessage(`No puedes agregar más de lo disponible en stock (${product.stock} uds.)`);
            setTimeout(() => setErrorMessage(null), 4000);
            return item;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  // Guardar/Registrar el ticket de fiado (deduciendo el stock inmediatamente ya que se llevan los medicamentos)
  const handleRegisterCredit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtorName.trim()) {
      alert("Por favor digite el nombre de la persona.");
      return;
    }
    if (creditCart.length === 0) {
      alert("Por favor agregue al menos un producto a la lista.");
      return;
    }

    const subtotalValue = creditCart.reduce((sum, item) => {
      const isBox = item.selectedUnit === 'BOX';
      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
    }, 0);

    const creditId = `CRED-${Date.now()}`;
    const newCredit: CreditTicket = {
      id: creditId,
      customerName: debtorName,
      customerPhone: debtorPhone || undefined,
      customerAddress: debtorAddress || undefined,
      items: creditCart,
      subtotal: subtotalValue,
      total: subtotalValue,
      date: new Date().toISOString(),
      status: 'PENDIENTE'
    };

    try {
      // 1. Descontar stock inmediatamente de la farmacia
      for (const item of creditCart) {
        const orig = products.find(p => p.id === item.id);
        if (orig) {
          const isBox = item.selectedUnit === 'BOX';
          const unitsToSubtract = isBox ? (orig.unitsPerBox || 1) * item.quantity : item.quantity;
          await updateStockDB(item.id, Math.max(0, orig.stock - unitsToSubtract));
        }
      }

      // 2. Guardar ticket de fiado
      await addCreditDB(newCredit);

      // Limpiar estados
      setDebtorName('');
      setDebtorPhone('');
      setDebtorAddress('');
      setCreditCart([]);
      setActiveTab('list');
      setListFilter('PENDIENTE');
      
      setSuccessMessage("¡Medicamento fiado (crédito) registrado con éxito! El stock ha sido descontado.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Error al registrar el crédito.");
    }
  };

  // Procesar liquidación de deuda / registrar la venta en pedidos
  const handlePayCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentCredit) return;

    const change = paymentMethod === 'CASH' && cashGiven 
      ? parseFloat(cashGiven) - selectedPaymentCredit.total 
      : 0;

    if (paymentMethod === 'CASH' && cashGiven && change < 0) {
      alert("El dinero recibido es menor que el total de la deuda.");
      return;
    }

    const orderData: Order = {
      id: `POS-${Date.now()}`,
      customerName: selectedPaymentCredit.customerName,
      customerPhone: selectedPaymentCredit.customerPhone || 'N/A',
      customerAddress: selectedPaymentCredit.customerAddress || 'Crédito Cancelado',
      items: selectedPaymentCredit.items,
      subtotal: selectedPaymentCredit.subtotal,
      deliveryFee: 0,
      discount: 0,
      total: selectedPaymentCredit.total,
      paymentMethod: paymentMethod,
      cashGiven: paymentMethod === 'CASH' && cashGiven ? parseFloat(cashGiven) : undefined,
      status: 'DELIVERED', // Entregado porque ya se llevaron el medicamento
      source: 'POS',
      date: new Date().toISOString()
    };

    try {
      // 1. Agregar venta al historial global de pedidos
      await addOrderDB(orderData);

      // 2. Actualizar estado del crédito a PAGADO
      await updateCreditStatusDB(selectedPaymentCredit.id, 'PAGADO');

      // Limpiar estados
      setSelectedPaymentCredit(null);
      setCashGiven('');
      setSuccessMessage(`¡Deuda cancelada con éxito! La venta se ha registrado en el módulo de Pedidos.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Error al registrar la cancelación de la deuda.");
    }
  };

  const handleDeleteCredit = async (credit: CreditTicket) => {
    if (!confirm(`¿Está seguro de eliminar el crédito de ${credit.customerName}? Esto no devolverá el stock automáticamente, hágalo de forma manual si es necesario.`)) {
      return;
    }
    try {
      await deleteCreditDB(credit.id);
      setSuccessMessage("Crédito eliminado con éxito.");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      alert("Error al eliminar.");
    }
  };

  // Calcular el total dinámico para la nueva orden
  const cartTotal = useMemo(() => {
    return creditCart.reduce((sum, item) => {
      const isBox = item.selectedUnit === 'BOX';
      const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
      return sum + (price * item.quantity);
    }, 0);
  }, [creditCart]);

  return (
    <div className="space-y-6">
      
      {/* Cabecera del Módulo */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full inline-block">
            Módulo de Créditos / Fiados
          </span>
          <h3 className="text-xl font-black text-slate-800 tracking-tight mt-2">Gestión de Cuentas por Cobrar</h3>
          <p className="text-xs text-slate-500 font-medium">Registra medicamentos fiados a clientes de confianza y liquida sus cuentas para registrar la venta final.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { setActiveTab('list'); setListFilter('PENDIENTE'); }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'list' && listFilter === 'PENDIENTE'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <FileText size={14} />
            Créditos Pendientes ({stats.pendingCount})
          </button>
          
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                : 'bg-slate-50 text-slate-600 border border-slate-200/80 hover:bg-slate-100'
            }`}
          >
            <Plus size={14} />
            Fiar Medicamento (Nuevo)
          </button>
        </div>
      </div>

      {/* Alertas de Notificación */}
      {successMessage && (
        <div className="bg-teal-50 border-l-4 border-teal-500 text-teal-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <CheckCircle size={18} className="text-teal-600 shrink-0" />
          <span className="text-xs font-semibold">{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="bg-rose-50 border-l-4 border-rose-500 text-rose-800 p-4 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span className="text-xs font-semibold">{errorMessage}</span>
        </div>
      )}

      {/* Tarjetas de Resumen Financiero */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ${stats.pendingAmount.toFixed(2)}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Por Cobrar</span>
            <span className="text-sm font-black text-slate-800 block">Deuda Pendiente ({stats.pendingCount} per.)</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            ${stats.paidAmount.toFixed(2)}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Cobrado Histórico</span>
            <span className="text-sm font-black text-slate-800 block">Cuentas Liquidadas ({stats.paidCount})</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-50 text-slate-600 flex items-center justify-center font-bold">
            ${(stats.pendingAmount + stats.paidAmount).toFixed(2)}
          </div>
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Flujo Total Registrado</span>
            <span className="text-sm font-black text-slate-800 block">Cartera Total</span>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL DEL MÓDULO */}
      {activeTab === 'list' ? (
        <div className="space-y-4">
          {/* Barra de Filtros y Búsqueda */}
          <div className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
            
            {/* Buscador */}
            <div className="relative w-full sm:max-w-xs">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar deudor..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Filtros de Estado */}
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              {(['PENDIENTE', 'PAGADO', 'ALL'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setListFilter(status)}
                  className={`flex-1 sm:flex-initial px-4 py-1.5 rounded-lg text-[10.5px] font-black uppercase tracking-wider transition-all ${
                    listFilter === status
                      ? 'bg-white text-slate-800 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {status === 'ALL' ? 'Todos' : status === 'PENDIENTE' ? 'Pendientes' : 'Pagados'}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Créditos */}
          {filteredCredits.length === 0 ? (
            <div className="bg-white py-12 rounded-[2.5rem] border border-slate-100 text-center">
              <Clock size={40} className="mx-auto text-slate-300 mb-3" />
              <p className="text-xs text-slate-500 font-bold">No se encontraron registros de créditos.</p>
              <p className="text-[10px] text-slate-400 mt-1">Usa el botón superior para fiar un medicamento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCredits.map((credit) => (
                <div 
                  key={credit.id}
                  className={`bg-white rounded-[2rem] border p-6 transition-all relative overflow-hidden flex flex-col justify-between ${
                    credit.status === 'PENDIENTE' 
                      ? 'border-slate-100 hover:border-amber-200 shadow-sm' 
                      : 'border-slate-100 bg-slate-50/50 opacity-85'
                  }`}
                >
                  {/* Etiqueta de Estado */}
                  <div className="absolute right-4 top-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                      credit.status === 'PENDIENTE'
                        ? 'bg-amber-50 text-amber-600 border border-amber-100'
                        : 'bg-teal-50 text-teal-600 border border-teal-100'
                    }`}>
                      {credit.status === 'PENDIENTE' ? 'Pendiente' : 'Pagado (Vendido)'}
                    </span>
                  </div>

                  <div>
                    {/* Información del Cliente */}
                    <div className="space-y-1 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-800">
                        <UserIcon size={14} className="text-slate-400" />
                        <h4 className="font-extrabold text-sm text-slate-800">{credit.customerName}</h4>
                      </div>
                      {credit.customerPhone && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                          <Phone size={12} className="text-slate-400" />
                          <span>{credit.customerPhone}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                        <Calendar size={12} className="text-slate-300" />
                        <span>Fecha: {new Date(credit.date).toLocaleDateString('es-ES')} {new Date(credit.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    {/* Detalle de Productos */}
                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Medicamentos Entregados:</span>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {credit.items.map((item, idx) => {
                          const isBox = item.selectedUnit === 'BOX';
                          const priceUsed = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                          return (
                            <div key={idx} className="flex justify-between items-center text-[11.5px] font-semibold text-slate-700">
                              <span className="line-clamp-1 flex-1 pr-4">
                                {item.quantity}x {item.name} <span className="text-[9px] text-slate-400">({isBox ? 'Caja' : 'Unid'})</span>
                              </span>
                              <span className="font-mono text-slate-600">${(priceUsed * item.quantity).toFixed(2)}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Pie de la tarjeta */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Total Deuda</span>
                      <span className="text-lg font-black text-slate-800 font-mono">${credit.total.toFixed(2)}</span>
                    </div>

                    {credit.status === 'PENDIENTE' ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedPaymentCredit(credit)}
                          className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-colors"
                        >
                          <CreditCard size={13} />
                          Registrar Pago
                        </button>
                        <button
                          onClick={() => handleDeleteCredit(credit)}
                          title="Eliminar registro"
                          className="p-2 border border-slate-200 text-slate-400 hover:text-rose-500 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-teal-600 text-xs font-bold bg-teal-50 px-2.5 py-1 rounded-lg">
                        <Check size={14} />
                        Pago Registrado
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* VISTA: REGISTRAR UN NUEVO CRÉDITO / FIADO */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Columna Izquierda: Datos de la Persona y Agregar Productos */}
          <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <UserIcon size={16} className="text-teal-600" />
              1. Datos de la Persona que lleva el Medicamento
            </h4>

            <form onSubmit={handleRegisterCredit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Juan Pérez"
                    value={debtorName}
                    onChange={(e) => setDebtorName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Teléfono / Celular</label>
                  <input
                    type="text"
                    placeholder="Ej: 0991234567"
                    value={debtorPhone}
                    onChange={(e) => setDebtorPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nota de Ubicación / Dirección (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: Machalilla, Barrio Central, diagonal al parque"
                  value={debtorAddress}
                  onChange={(e) => setDebtorAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Buscador e Incorporación de Productos */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <ShoppingCart size={16} className="text-teal-600" />
                  2. Buscar y Añadir Medicamentos
                </h4>

                <div className="relative">
                  <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Buscar producto por nombre, barra o activo..."
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none transition-colors"
                  />
                </div>

                {/* Resultados de búsqueda rápidos */}
                {filteredProducts.length > 0 && (
                  <div className="bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto shadow-inner">
                    {filteredProducts.map((p) => (
                      <div key={p.id} className="p-3 hover:bg-slate-100/50 flex justify-between items-center transition-colors">
                        <div className="flex-1 pr-4">
                          <span className="text-xs font-bold text-slate-800 block line-clamp-1">{p.name}</span>
                          <span className="text-[9px] text-slate-400 block">Stock: {p.stock} uds. | PA: {p.activeIngredient || 'N/A'}</span>
                        </div>

                        <div className="flex gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => addToCreditCart(p, 'UNIT')}
                            disabled={p.stock <= 0}
                            className="bg-white border border-slate-200/80 hover:bg-teal-50 hover:border-teal-300 text-[10.5px] font-black text-slate-600 hover:text-teal-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            + Unidad (${p.price.toFixed(2)})
                          </button>
                          {p.unitsPerBox && p.unitsPerBox > 1 && (
                            <button
                              type="button"
                              onClick={() => addToCreditCart(p, 'BOX')}
                              disabled={p.stock < (p.unitsPerBox || 1)}
                              className="bg-white border border-slate-200/80 hover:bg-teal-50 hover:border-teal-300 text-[10.5px] font-black text-slate-600 hover:text-teal-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              + Caja (${(p.publicBoxPrice || p.boxPrice || 0).toFixed(2)})
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón de Enviar final */}
              <div className="pt-6 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={creditCart.length === 0 || !debtorName.trim()}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl text-xs font-black shadow-md shadow-teal-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                >
                  <Bookmark size={15} />
                  Confirmar y Registrar Crédito
                </button>
              </div>
            </form>
          </div>

          {/* Columna Derecha: Detalle de Medicamentos Agregados (El Carrito del Crédito) */}
          <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Medicamentos Seleccionados</span>
                <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-black">
                  {creditCart.reduce((sum, i) => sum + i.quantity, 0)} items
                </span>
              </h4>

              {creditCart.length === 0 ? (
                <div className="py-12 text-center">
                  <ShoppingCart size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs text-slate-400 font-bold">No has añadido productos aún.</p>
                  <p className="text-[10px] text-slate-300 mt-1">Busca arriba y añade medicamentos.</p>
                </div>
              ) : (
                <div className="space-y-3 divide-y divide-slate-100 max-h-[22rem] overflow-y-auto pr-1">
                  {creditCart.map((item, idx) => {
                    const isBox = item.selectedUnit === 'BOX';
                    const itemPrice = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                    return (
                      <div key={idx} className="pt-3 flex items-start justify-between gap-3 text-xs">
                        <div className="flex-1 space-y-0.5">
                          <span className="font-bold text-slate-800 block line-clamp-1">{item.name}</span>
                          <span className="text-[9.5px] text-slate-400 font-bold block">
                            {isBox ? 'Venta por Caja' : 'Venta por Unidad'} • ${itemPrice.toFixed(2)} c/u
                          </span>
                        </div>

                        {/* Modificador de Cantidad */}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, item.selectedUnit, -1)}
                            className="h-6 w-6 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                          >
                            <Minus size={11} />
                          </button>
                          <span className="w-5 text-center font-bold text-slate-700">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateCartQty(item.id, item.selectedUnit, 1)}
                            className="h-6 w-6 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Subtotal y Eliminar */}
                        <div className="text-right pl-2 space-y-1">
                          <span className="font-mono font-bold text-slate-800 block">
                            ${(itemPrice * item.quantity).toFixed(2)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCreditCart(prev => prev.filter((_, i) => i !== idx))}
                            className="text-[10px] text-rose-500 hover:underline font-bold"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Total acumulado */}
            {creditCart.length > 0 && (
              <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
                  <span>Subtotal:</span>
                  <span className="font-mono">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-dashed border-slate-200 pt-2 font-black text-slate-800">
                  <span className="flex items-center gap-1 text-teal-600">
                    <DollarSign size={16} /> Total Deuda:
                  </span>
                  <span className="text-lg font-mono">${cartTotal.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL / FORMULARIO FLOTANTE PARA REGISTRAR PAGO (CANCELAR DEUDA) */}
      {selectedPaymentCredit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Cabecera del Modal */}
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white p-6 relative">
              <button 
                onClick={() => setSelectedPaymentCredit(null)}
                className="absolute right-4 top-4 text-white/80 hover:text-white font-extrabold text-sm"
              >
                ✕
              </button>
              <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full">
                Liquidación de Cuenta
              </span>
              <h4 className="text-lg font-black tracking-tight mt-2">Registrar Pago de Cliente</h4>
              <p className="text-[11px] text-teal-100 font-medium">Confirma la cancelación total de la deuda para archivar el crédito y generar la venta.</p>
            </div>

            {/* Formulario */}
            <form onSubmit={handlePayCreditSubmit} className="p-6 space-y-4">
              
              {/* Información del Cliente */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[9px] font-black text-slate-400 block uppercase tracking-wider">Cliente Deudor</span>
                <span className="text-sm font-black text-slate-800 block">{selectedPaymentCredit.customerName}</span>
                {selectedPaymentCredit.customerPhone && (
                  <span className="text-[11px] text-slate-500 font-semibold block">Tlf: {selectedPaymentCredit.customerPhone}</span>
                )}
                <span className="text-xs font-black text-slate-700 block pt-1 border-t border-slate-200/50 mt-1">
                  Total de la Deuda: <span className="font-mono text-teal-600 text-sm">${selectedPaymentCredit.total.toFixed(2)}</span>
                </span>
              </div>

              {/* Selección de Método de Pago */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Método de Pago</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'CASH'
                        ? 'border-teal-500 bg-teal-50/50 text-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>💵</span>
                    Efectivo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('TRANSFER')}
                    className={`p-3 rounded-xl border text-xs font-black flex flex-col items-center justify-center gap-1.5 transition-all ${
                      paymentMethod === 'TRANSFER'
                        ? 'border-teal-500 bg-teal-50/50 text-teal-700'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <span>🏦</span>
                    Transferencia
                  </button>
                </div>
              </div>

              {/* Detalle si es efectivo */}
              {paymentMethod === 'CASH' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-150">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Monto Recibido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">$</span>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
                    />
                  </div>

                  {cashGiven && !isNaN(parseFloat(cashGiven)) && (
                    <div className="flex justify-between items-center text-xs font-bold pt-1">
                      <span className="text-slate-500">Cambio a entregar:</span>
                      <span className={`font-mono ${parseFloat(cashGiven) - selectedPaymentCredit.total >= 0 ? 'text-teal-600' : 'text-rose-500'}`}>
                        ${(parseFloat(cashGiven) - selectedPaymentCredit.total).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Enviar Pago */}
              <div className="pt-4 border-t border-slate-100 flex gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPaymentCredit(null)}
                  className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-xl text-xs font-extrabold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2.5 rounded-xl text-xs font-black shadow-md shadow-teal-600/10 transition-colors"
                >
                  Confirmar Pago
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminCredits;
