import React, { useState } from 'react';
import { X, Package, CheckCircle, FileText } from 'lucide-react';
import { PurchaseOrder } from '../../../types/purchases';
import { Product } from '../../../types';
import { 
  receivePurchaseOrderAndRestock, 
  updateOrderStatus, 
  deletePurchaseOrder,
  removeItemFromPurchaseOrder,
  updateItemQuantityInPurchaseOrder
} from '../../../services/db.purchases';
import { PurchaseOrderCard } from './history/PurchaseOrderCard';

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
    const currentOrder = orders.find((o) => o.id === order.id) || order;

    if (!currentOrder.items || currentOrder.items.length === 0) {
      alert('Esta orden no tiene productos pendientes para ingresar. Si ningún producto llegó, puedes cancelar o eliminar la orden.');
      return;
    }

    const confirm = window.confirm(
      `¿Deseas confirmar la recepción de la orden ${currentOrder.code}?\n\n` +
      `Se ingresarán automáticamente las existencias de ${currentOrder.items.length} producto(s) (${currentOrder.totalUnitsCount} unidades en total) al stock de tu inventario.\n\n` +
      `⚠️ Nota: Los productos que hayas eliminado por no haber llegado NO serán recargados.`
    );
    if (!confirm) return;

    setProcessingOrderId(currentOrder.id);
    try {
      const result = await receivePurchaseOrderAndRestock(currentOrder, products);
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

  const handleRemoveMissingItem = (orderId: string, productId: string, productName: string) => {
    const confirm = window.confirm(
      `¿Confirmas que el producto "${productName}" NO LLEGÓ en el pedido del proveedor?\n\n` +
      `• Se eliminará de esta orden de compra.\n` +
      `• Se recalculará la inversión total.\n` +
      `• Al presionar "Recibir en Farmacia", SE EVITARÁ recargar su stock en el inventario.`
    );
    if (!confirm) return;

    removeItemFromPurchaseOrder(orderId, productId);
    onOrdersUpdated();
    setActionMessage(`"${productName}" fue eliminado de la orden. Su stock NO será recargado.`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleAdjustItemQuantity = (
    orderId: string,
    productId: string,
    productName: string,
    currentQty: number,
    unitType: string
  ) => {
    const unitLabel = unitType === 'BOX' ? 'cajas' : 'unidades';
    const input = window.prompt(
      `Modificar cantidad realmente recibida de "${productName}":\n\n` +
      `Cantidad solicitada en el pedido: ${currentQty} ${unitLabel}.\n` +
      `Escribe cuántas ${unitLabel} te entregó realmente el proveedor:\n` +
      `(Escribe 0 si no te llegó nada para eliminarlo):`,
      String(currentQty)
    );

    if (input === null) return;
    const newQty = parseInt(input.trim(), 10);
    if (isNaN(newQty) || newQty < 0) {
      alert('Por favor ingresa un número entero válido mayor o igual a 0.');
      return;
    }

    if (newQty === 0) {
      handleRemoveMissingItem(orderId, productId, productName);
      return;
    }

    updateItemQuantityInPurchaseOrder(orderId, productId, newQty);
    onOrdersUpdated();
    setActionMessage(`Cantidad de "${productName}" ajustada a ${newQty} ${unitLabel}.`);
    setTimeout(() => setActionMessage(null), 5000);
  };

  const handleMarkAsSent = (orderId: string) => {
    updateOrderStatus(orderId, 'SENT');
    onOrdersUpdated();
  };

  const handleDeleteOrder = (order: PurchaseOrder) => {
    const confirmDelete = window.confirm(
      `¿Estás seguro de que deseas eliminar la orden ${order.code}?\n\nEsta acción quitará permanentemente la orden del historial.`
    );
    if (!confirmDelete) return;

    deletePurchaseOrder(order.id);
    onOrdersUpdated();
    setActionMessage(`Orden ${order.code} eliminada del historial.`);
    setTimeout(() => setActionMessage(null), 4000);
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
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
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
            orders.map((order) => (
              <PurchaseOrderCard
                key={order.id}
                order={order}
                isExpanded={expandedOrderId === order.id}
                isProcessing={processingOrderId === order.id}
                onToggleExpand={(id) => setExpandedOrderId(expandedOrderId === id ? null : id)}
                onReceiveStock={handleReceiveStock}
                onMarkAsSent={handleMarkAsSent}
                onDeleteOrder={handleDeleteOrder}
                onSelectOrderToShare={onSelectOrderToShare}
                onAdjustItemQuantity={handleAdjustItemQuantity}
                onRemoveMissingItem={handleRemoveMissingItem}
              />
            ))
          )}
        </div>

        {/* Pie */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cerrar Historial
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderHistoryModal;
