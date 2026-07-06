import React, { useState, useEffect, useMemo } from 'react';
import { Product, CartItem, Order, CreditTicket } from '../../types';
import { 
  Plus, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
} from 'lucide-react';
import { streamCredits, addCreditDB, updateCreditDB, deleteCreditDB } from '../../services/db.credits';
import { addOrderDB } from '../../services/db.orders';
import { updateStockDB } from '../../services/db.products';

// Subcomponentes modulados
import { CreditStatsCards } from './CreditStatsCards';
import { CreditPaymentModal } from './CreditPaymentModal';
import { CreditCreateForm } from './CreditCreateForm';
import { CreditList } from './CreditList';

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
  const [initialAbono, setInitialAbono] = useState('');
  const [initialAbonoMethod, setInitialAbonoMethod] = useState<'CASH' | 'TRANSFER'>('CASH');

  // Proceso de pago / liquidación
  const [selectedPaymentCredit, setSelectedPaymentCredit] = useState<CreditTicket | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH');
  const [cashGiven, setCashGiven] = useState('');
  const [paymentType, setPaymentType] = useState<'FULL' | 'PARTIAL'>('FULL');
  const [partialPaymentAmount, setPartialPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

  // Resetear estados del modal de pago cuando cambia el crédito seleccionado
  useEffect(() => {
    if (selectedPaymentCredit) {
      setPaymentType('FULL');
      setPartialPaymentAmount('');
      setPaymentNote('');
      setCashGiven('');
    }
  }, [selectedPaymentCredit]);

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
    const totalPendingAmount = pending.reduce((sum, c) => sum + (c.total - (c.paidAmount || 0)), 0);
    
    // Sumamos todo lo pagado: ya sea de créditos completamente pagados o abonos de créditos pendientes
    const totalPaidAmount = credits.reduce((sum, c) => sum + (c.paidAmount || (c.status === 'PAGADO' ? c.total : 0)), 0);
    const paidFullyCount = credits.filter(c => c.status === 'PAGADO').length;
    
    return {
      pendingCount: pending.length,
      pendingAmount: totalPendingAmount,
      paidCount: paidFullyCount,
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

    const abonoVal = parseFloat(initialAbono) || 0;
    if (abonoVal < 0) {
      alert("El abono inicial no puede ser negativo.");
      return;
    }
    if (abonoVal > subtotalValue) {
      alert(`El abono inicial ($${abonoVal.toFixed(2)}) no puede ser mayor que el total de la deuda ($${subtotalValue.toFixed(2)}).`);
      return;
    }

    const creditId = `CRED-${Date.now()}`;
    const isFullyPaid = abonoVal >= subtotalValue;

    const initialPayments = abonoVal > 0 ? [{
      id: `PAY-INIT-${Date.now()}`,
      date: new Date().toISOString(),
      amount: abonoVal,
      paymentMethod: initialAbonoMethod,
      note: 'Abono Inicial'
    }] : [];

    const newCredit: CreditTicket = {
      id: creditId,
      customerName: debtorName,
      customerPhone: debtorPhone || undefined,
      customerAddress: debtorAddress || undefined,
      items: creditCart,
      subtotal: subtotalValue,
      total: subtotalValue,
      date: new Date().toISOString(),
      status: isFullyPaid ? 'PAGADO' : 'PENDIENTE',
      paidAmount: abonoVal,
      payments: initialPayments
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

      // 2. Si hubo abono inicial, registrar el ingreso en Pedidos/Ventas POS
      if (abonoVal > 0) {
        const orderData: Order = {
          id: `POS-ABONO-${Date.now()}`,
          customerName: `Abono de Crédito: ${debtorName}`,
          customerPhone: debtorPhone || 'N/A',
          customerAddress: debtorAddress || 'Módulo de Créditos',
          items: [{
            id: 'credit_payment',
            name: `Abono de Crédito Inicial: ${debtorName}`,
            price: abonoVal,
            quantity: 1,
            selectedUnit: 'UNIT',
            category: 'Crédito',
            description: `Abono inicial de crédito. Deuda total: $${subtotalValue.toFixed(2)}. Restante: $${(subtotalValue - abonoVal).toFixed(2)}`,
            image: '',
            stock: 1
          } as any],
          subtotal: abonoVal,
          deliveryFee: 0,
          discount: 0,
          total: abonoVal,
          paymentMethod: initialAbonoMethod,
          cashGiven: initialAbonoMethod === 'CASH' ? abonoVal : undefined,
          status: 'DELIVERED',
          source: 'POS',
          date: new Date().toISOString()
        };
        await addOrderDB(orderData);
      }

      // 3. Guardar ticket de fiado
      await addCreditDB(newCredit);

      // Limpiar estados
      setDebtorName('');
      setDebtorPhone('');
      setDebtorAddress('');
      setCreditCart([]);
      setInitialAbono('');
      setInitialAbonoMethod('CASH');
      setActiveTab('list');
      setListFilter('PENDIENTE');
      
      setSuccessMessage(isFullyPaid 
        ? "¡Medicamento fiado registrado y pagado en su totalidad con éxito! Stock descontado."
        : abonoVal > 0 
          ? `¡Medicamento fiado registrado con un abono inicial de $${abonoVal.toFixed(2)}! Stock descontado.`
          : "¡Medicamento fiado (crédito) registrado con éxito! El stock ha sido descontado."
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Error al registrar el crédito.");
    }
  };

  // Procesar liquidación de deuda o abonos parciales / registrar la venta en pedidos
  const handlePayCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPaymentCredit) return;

    const currentPaid = selectedPaymentCredit.paidAmount || 0;
    const remaining = selectedPaymentCredit.total - currentPaid;

    const isFull = paymentType === 'FULL';
    const amountToPay = isFull ? remaining : (parseFloat(partialPaymentAmount) || 0);

    if (amountToPay <= 0) {
      alert("Por favor ingrese un monto válido mayor a 0.");
      return;
    }

    if (amountToPay > remaining + 0.001) { // Pequeño margen para imprecisión de floats
      alert(`El monto ingresado ($${amountToPay.toFixed(2)}) no puede ser mayor al saldo pendiente ($${remaining.toFixed(2)}).`);
      return;
    }

    const change = paymentMethod === 'CASH' && cashGiven 
      ? parseFloat(cashGiven) - amountToPay 
      : 0;

    if (paymentMethod === 'CASH' && cashGiven && change < -0.001) {
      alert("El dinero recibido es menor que el monto a pagar.");
      return;
    }

    const newPaidAmount = currentPaid + amountToPay;
    const isNowPaid = isFull || newPaidAmount >= selectedPaymentCredit.total - 0.001;

    const newPaymentRecord = {
      id: `PAY-${Date.now()}`,
      date: new Date().toISOString(),
      amount: amountToPay,
      paymentMethod: paymentMethod,
      note: paymentNote || (isNowPaid ? 'Pago Final de Deuda' : 'Abono parcial')
    };

    const updatedCredit: CreditTicket = {
      ...selectedPaymentCredit,
      paidAmount: isNowPaid ? selectedPaymentCredit.total : newPaidAmount,
      status: isNowPaid ? 'PAGADO' : 'PENDIENTE',
      payments: [...(selectedPaymentCredit.payments || []), newPaymentRecord]
    };

    // Registrar la venta en pedidos
    const orderData: Order = {
      id: `POS-${isNowPaid ? 'PAGO' : 'ABONO'}-${Date.now()}`,
      customerName: `${isNowPaid ? 'Liquidación' : 'Abono'} de Crédito: ${selectedPaymentCredit.customerName}`,
      customerPhone: selectedPaymentCredit.customerPhone || 'N/A',
      customerAddress: selectedPaymentCredit.customerAddress || 'Módulo de Créditos',
      items: [{
        id: isNowPaid ? 'credit_liquidation' : 'credit_payment',
        name: `${isNowPaid ? 'Liquidación' : 'Abono'} de Crédito - ${selectedPaymentCredit.customerName}`,
        price: amountToPay,
        quantity: 1,
        selectedUnit: 'UNIT',
        category: 'Crédito',
        description: `${isNowPaid ? 'Liquidación final' : 'Abono parcial'} del crédito de ${selectedPaymentCredit.customerName}. Original: $${selectedPaymentCredit.total.toFixed(2)}. Restante después de este pago: $${(selectedPaymentCredit.total - (isNowPaid ? selectedPaymentCredit.total : newPaidAmount)).toFixed(2)}.`,
        image: '',
        stock: 1
      } as any],
      subtotal: amountToPay,
      deliveryFee: 0,
      discount: 0,
      total: amountToPay,
      paymentMethod: paymentMethod,
      cashGiven: paymentMethod === 'CASH' && cashGiven ? parseFloat(cashGiven) : undefined,
      status: 'DELIVERED',
      source: 'POS',
      date: new Date().toISOString()
    };

    try {
      // 1. Agregar venta al historial global de pedidos
      await addOrderDB(orderData);

      // 2. Actualizar estado y pagos del crédito
      await updateCreditDB(updatedCredit);

      // Limpiar estados
      setSelectedPaymentCredit(null);
      setCashGiven('');
      setPartialPaymentAmount('');
      setPaymentNote('');
      setSuccessMessage(isNowPaid 
        ? `¡Deuda cancelada con éxito! Se registró la venta de $${amountToPay.toFixed(2)}.` 
        : `¡Abono de $${amountToPay.toFixed(2)} registrado con éxito! Saldo pendiente: $${(selectedPaymentCredit.total - newPaidAmount).toFixed(2)}.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Error al registrar el pago.");
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
      <CreditStatsCards stats={stats} />

      {/* CONTENIDO PRINCIPAL DEL MÓDULO */}
      {activeTab === 'list' ? (
        <CreditList
          filteredCredits={filteredCredits}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          listFilter={listFilter}
          setListFilter={setListFilter}
          onSelectPaymentCredit={setSelectedPaymentCredit}
          onDeleteCredit={handleDeleteCredit}
        />
      ) : (
        <CreditCreateForm
          debtorName={debtorName}
          setDebtorName={setDebtorName}
          debtorPhone={debtorPhone}
          setDebtorPhone={setDebtorPhone}
          debtorAddress={debtorAddress}
          setDebtorAddress={setDebtorAddress}
          initialAbono={initialAbono}
          setInitialAbono={setInitialAbono}
          initialAbonoMethod={initialAbonoMethod}
          setInitialAbonoMethod={setInitialAbonoMethod}
          creditCart={creditCart}
          setCreditCart={setCreditCart}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          filteredProducts={filteredProducts}
          addToCreditCart={addToCreditCart}
          updateCartQty={updateCartQty}
          onSubmit={handleRegisterCredit}
          cartTotal={cartTotal}
        />
      )}

      {/* MODAL / FORMULARIO FLOTANTE PARA REGISTRAR PAGO (CANCELAR DEUDA O ABONAR) */}
      {selectedPaymentCredit && (
        <CreditPaymentModal
          selectedPaymentCredit={selectedPaymentCredit}
          onClose={() => setSelectedPaymentCredit(null)}
          onSubmit={handlePayCreditSubmit}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          cashGiven={cashGiven}
          setCashGiven={setCashGiven}
          paymentType={paymentType}
          setPaymentType={setPaymentType}
          partialPaymentAmount={partialPaymentAmount}
          setPartialPaymentAmount={setPartialPaymentAmount}
          paymentNote={paymentNote}
          setPaymentNote={setPaymentNote}
        />
      )}

    </div>
  );
};

export default AdminCredits;
