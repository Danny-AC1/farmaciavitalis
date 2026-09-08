import React from 'react';
import { Trash2 } from 'lucide-react';
import { PurchaseOrderItem, PurchaseOrderStatus } from '../../../../types/purchases';

interface PurchaseOrderItemRowProps {
  orderId: string;
  orderStatus: PurchaseOrderStatus;
  item: PurchaseOrderItem;
  onAdjustQuantity: (orderId: string, productId: string, productName: string, currentQty: number, unitType: string) => void;
  onRemoveMissingItem: (orderId: string, productId: string, productName: string) => void;
}

export const PurchaseOrderItemRow: React.FC<PurchaseOrderItemRowProps> = ({
  orderId,
  orderStatus,
  item: it,
  onAdjustQuantity,
  onRemoveMissingItem,
}) => {
  const isEditable = orderStatus !== 'RECEIVED' && orderStatus !== 'CANCELLED';

  return (
    <div className="py-2.5 px-3.5 rounded-2xl bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-700 transition-all">
      <div className="space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-bold text-slate-900 text-xs md:text-sm">
            {it.productName}
          </span>
          {it.category && (
            <span className="text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
              {it.category}
            </span>
          )}
        </div>
        <div className="text-[11px] text-slate-400 flex items-center gap-2 flex-wrap">
          <span>
            {it.unitType === 'BOX'
              ? `Caja(s) x${it.unitsPerBox || 1} uds`
              : 'Unidades sueltas'}
          </span>
          <span>•</span>
          <span>Costo: ${it.unitCost.toFixed(2)} c/u</span>
        </div>
      </div>

      <div className="flex items-center gap-3.5 self-end sm:self-center">
        <div className="text-right">
          <div className="flex items-center gap-1.5 justify-end">
            <span className="font-black text-slate-900 text-xs md:text-sm">
              {it.quantity} {it.unitType === 'BOX' ? 'cajas' : 'uds'}
            </span>
            {isEditable && (
              <button
                onClick={() =>
                  onAdjustQuantity(
                    orderId,
                    it.productId,
                    it.productName,
                    it.quantity,
                    it.unitType
                  )
                }
                className="text-[10px] text-teal-700 hover:text-teal-900 underline font-semibold ml-1 cursor-pointer"
                title="Ajustar cantidad si el proveedor entregó menos"
              >
                Editar cant.
              </button>
            )}
          </div>
          <div className="font-mono text-teal-700 font-bold text-[11px]">
            ${it.subtotal.toFixed(2)}
          </div>
        </div>

        {/* Botón para eliminar el producto que NO llegó */}
        {isEditable && (
          <button
            onClick={() => onRemoveMissingItem(orderId, it.productId, it.productName)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 text-rose-700 hover:text-rose-800 border border-rose-200/90 hover:border-rose-300 rounded-xl text-xs font-bold transition-all shadow-2xs group shrink-0 cursor-pointer"
            title={`Eliminar "${it.productName}" de la orden porque no llegó. Evita recargar su stock.`}
          >
            <Trash2
              size={13}
              className="text-rose-600 group-hover:scale-110 transition-transform"
            />
            <span className="whitespace-nowrap">No llegó (Eliminar)</span>
          </button>
        )}
      </div>
    </div>
  );
};
