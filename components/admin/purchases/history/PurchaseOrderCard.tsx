import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  Truck, 
  CheckCheck, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { PurchaseOrder } from '../../../../types/purchases';
import { PurchaseOrderItemRow } from './PurchaseOrderItemRow';

interface PurchaseOrderCardProps {
  order: PurchaseOrder;
  isExpanded: boolean;
  isProcessing: boolean;
  onToggleExpand: (orderId: string) => void;
  onReceiveStock: (order: PurchaseOrder) => void;
  onMarkAsSent: (orderId: string) => void;
  onDeleteOrder: (order: PurchaseOrder) => void;
  onSelectOrderToShare?: (order: PurchaseOrder) => void;
  onAdjustItemQuantity: (orderId: string, productId: string, productName: string, currentQty: number, unitType: string) => void;
  onRemoveMissingItem: (orderId: string, productId: string, productName: string) => void;
}

export const PurchaseOrderCard: React.FC<PurchaseOrderCardProps> = ({
  order,
  isExpanded,
  isProcessing,
  onToggleExpand,
  onReceiveStock,
  onMarkAsSent,
  onDeleteOrder,
  onSelectOrderToShare,
  onAdjustItemQuantity,
  onRemoveMissingItem,
}) => {
  const dateStr = new Date(order.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
    <div className="border border-slate-200/80 rounded-2xl md:rounded-3xl p-4 md:p-5 bg-white hover:border-slate-300 transition-all space-y-3 shadow-2xs">
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

          {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
            <button
              onClick={() => onReceiveStock(order)}
              disabled={isProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Suma automáticamente las unidades pedidas al inventario real"
            >
              {isProcessing ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <CheckCircle size={13} />
              )}
              <span>Recibir en Farmacia</span>
            </button>
          )}

          {order.status === 'DRAFT' && (
            <button
              onClick={() => onMarkAsSent(order.id)}
              className="px-2.5 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-200 cursor-pointer"
            >
              Marcar como Pedida
            </button>
          )}

          {onSelectOrderToShare && (
            <button
              onClick={() => onSelectOrderToShare(order)}
              className="px-2.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 cursor-pointer"
            >
              Compartir
            </button>
          )}

          <button
            onClick={() => onDeleteOrder(order)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Eliminar esta orden de compra"
          >
            <Trash2 size={16} />
          </button>

          <button
            onClick={() => onToggleExpand(order.id)}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            title={isExpanded ? 'Ocultar detalle' : 'Ver medicamentos'}
          >
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="pt-3 border-t border-slate-100 space-y-3 animate-in fade-in">
          {order.status !== 'RECEIVED' && order.status !== 'CANCELLED' && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-3 flex items-start gap-2.5 text-xs text-amber-900 shadow-2xs">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <div className="font-bold text-amber-950">
                  ¿El pedido no te llegó completo?
                </div>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Usa el botón <strong className="text-rose-700 bg-rose-100/80 px-1.5 py-0.5 rounded font-bold">No llegó (Eliminar)</strong> en los productos que el proveedor no te entregó antes de pulsar <strong>"Recibir en Farmacia"</strong>. De esta manera, se evitará recargar automáticamente el stock del producto faltante.
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
              Medicamentos solicitados en esta orden ({order.items.length}):
            </div>
          </div>

          {order.items.length === 0 ? (
            <div className="py-6 text-center text-slate-400 space-y-1 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
              <p className="text-xs font-bold text-slate-600">No quedan productos en esta orden.</p>
              <p className="text-[11px] text-slate-400">
                Todos los productos fueron eliminados por no haber llegado con el proveedor.
              </p>
            </div>
          ) : (
            <div className="space-y-2 text-xs">
              {order.items.map((it) => (
                <PurchaseOrderItemRow
                  key={it.productId}
                  orderId={order.id}
                  orderStatus={order.status}
                  item={it}
                  onAdjustQuantity={onAdjustItemQuantity}
                  onRemoveMissingItem={onRemoveMissingItem}
                />
              ))}
            </div>
          )}

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
};
