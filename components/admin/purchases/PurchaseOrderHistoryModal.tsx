import React, { useState } from 'react';
import { X, Package, CheckCircle, Clock, Truck, CheckCheck, FileText, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { PurchaseOrder } from '../../../types/purchases';
import { Product } from '../../../types';
import { receivePurchaseOrderAndRestock, updateOrderStatus } from '../../../services/db.purchases';

interface PurchaseOrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: PurchaseOrder[];
  products: Product[];
  onOrdersUpdated: () => void;
  onSelectOrderToShare?: (order: PurchaseOrder) => void;
}

export const PurchaseOrderHistoryModal: React.FC<PurchaseOrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  products,
  onOrdersUpdated,
  onSelectOrderToShare,
}) => {
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleReceiveStock = async (order: PurchaseOrder) => {
    const confirm = window.confirm(
      `¿Deseas confirmar la recepción de la orden ${order.code}?\n\nEsto ingresará automáticamente ${order.totalUnitsCount} unidades de medicamento al stock de tu inventario.`
    );
    if (!confirm) return;

    setProcessingOrderId(order.id);
    try {
      const result = await receivePurchaseOrderAndRestock(order, products);
      setActionMessage(result.message);
      onOrdersUpdated();
      setTimeout(() => setActionMessage(null), 5000);
    } catch (e) {
      console.error(e);
      alert('Ocurrió un error al procesar la entrada de mercadería.');
    } finally {
      setProcessingOrderId(null);
    }
  };

  const handleMarkAsSent = (orderId: string) => {
    updateOrderStatus(orderId, 'SENT');
    onOrdersUpdated();
  };

  const getStatusBadge = (status: PurchaseOrder['status']) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
            <Clock size={11} /> Borrador
          </span>
        );
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            <Truck size={11} /> Pedida / En camino
          </span>
        );
      case 'RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCheck size={11} /> Mercadería Recibida
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            Cancelada
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-md">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                Historial de Órdenes de Compra
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Consulta pedidos pasados, haz seguimiento a distribuidoras y confirma recepción de stock.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mensaje de acción */}
        {actionMessage && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-3 flex items-center gap-2 text-xs font-bold text-emerald-800 animate-in fade-in">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {/* Lista de Órdenes */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3">
          {orders.length === 0 ? (
            <div className="py-14 text-center text-slate-400 space-y-2">
              <Package size={40} className="mx-auto text-slate-300" />
              <h4 className="text-sm font-bold text-slate-600">No hay órdenes de compra guardadas</h4>
              <p className="text-xs text-slate-400">
                Cuando finalices o guardes una orden de compra, quedará archivada aquí para su control.
              </p>
            </div>
          ) : (
            orders.map((order) => {
              const isExpanded = expandedOrderId === order.id;
              const dateStr = new Date(order.createdAt).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={order.id}
                  className="border border-slate-200/80 rounded-2xl md:rounded-3xl p-4 md:p-5 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs"
                >
                  {/* Fila principal */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-900 text-xs md:text-sm">
                          {order.code}
                        </span>
                        {getStatusBadge(order.status)}
                        <span className="text-xs text-slate-400 font-medium">• {dateStr}</span>
                      </div>

                      <div className="text-xs text-slate-600">
                        Proveedor:{' '}
                        <strong className="text-slate-800">
                          {order.supplierName === 'ALL' ? 'Todos los Proveedores' : order.supplierName}
                        </strong>{' '}
                        • {order.items.length} productos ({order.totalUnitsCount} uds totales)
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                      <div className="text-right mr-2">
                        <div className="text-[10px] font-black uppercase text-slate-400">Inversión</div>
                        <div className="font-mono font-black text-sm md:text-base text-slate-900">
                          ${order.totalCost.toFixed(2)}
                        </div>
                      </div>

                      {/* Botón de Recibir Mercadería si no está recibida */}
                      {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
                        <button
                          onClick={() => handleReceiveStock(order)}
                          disabled={processingOrderId === order.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                          title="Suma automáticamente las unidades pedidas al inventario real"
                        >
                          {processingOrderId === order.id ? (
                            <RefreshCw size={13} className="animate-spin" />
                          ) : (
                            <CheckCircle size={13} />
                          )}
                          <span>Recibir en Farmacia</span>
                        </button>
                      )}

                      {order.status === 'DRAFT' && (
                        <button
                          onClick={() => handleMarkAsSent(order.id)}
                          className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200"
                        >
                          Marcar como Pedida
                        </button>
                      )}

                      {onSelectOrderToShare && (
                        <button
                          onClick={() => onSelectOrderToShare(order)}
                          className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                        >
                          Compartir
                        </button>
                      )}

                      <button
                        onClick={() => setExpandedOrderId(isExpanded ? null : order.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                        title={isExpanded ? 'Ocultar detalle' : 'Ver medicamentos'}
                      >
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Detalle Desplegable */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-slate-100 space-y-2 animate-in fade-in">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        Medicamentos solicitados en esta orden:
                      </div>
                      <div className="divide-y divide-slate-100 text-xs">
                        {order.items.map((it) => (
                          <div
                            key={it.productId}
                            className="py-2 flex items-center justify-between gap-2 text-slate-700"
                          >
                            <div className="space-y-0.5">
                              <span className="font-bold text-slate-900">{it.productName}</span>
                              <div className="text-[10px] text-slate-400">
                                {it.unitType === 'BOX'
                                  ? `Caja(s) x${it.unitsPerBox} uds`
                                  : 'Unidades sueltas'}{' '}
                                • Costo: ${it.unitCost.toFixed(2)} c/u
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="font-black text-slate-900">
                                {it.quantity} {it.unitType === 'BOX' ? 'cajas' : 'uds'}
                              </span>
                              <div className="font-mono text-teal-700 font-bold text-[11px]">
                                ${it.subtotal.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {order.receivedAt && (
                        <div className="text-[11px] text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-medium">
                          <CheckCircle size={13} />
                          <span>
                            Mercadería ingresada al inventario el{' '}
                            {new Date(order.receivedAt).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};
