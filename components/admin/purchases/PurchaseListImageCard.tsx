import React from 'react';
import { PurchaseOrderItem } from '../../../types/purchases';
import { ShoppingBag } from 'lucide-react';

interface PurchaseListImageCardProps {
  items: PurchaseOrderItem[];
  cardRef: React.RefObject<HTMLDivElement>;
  supplierName?: string;
  orderCode?: string;
}

export const PurchaseListImageCard: React.FC<PurchaseListImageCardProps> = ({
  items,
  cardRef,
  supplierName,
  orderCode,
}) => {
  const currentDate = new Date().toLocaleDateString('es-EC', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="flex justify-center p-2">
      {/* Contenedor optimizado para captura en imagen de alta resolución */}
      <div
        ref={cardRef}
        id="purchase-list-image-render"
        className="w-[440px] bg-white text-slate-800 rounded-3xl p-6 shadow-xl border border-slate-200 font-sans relative overflow-hidden"
        style={{
          boxSizing: 'border-box',
          backgroundColor: '#ffffff',
        }}
      >
        {/* Franja superior decorativa */}
        <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-teal-600 via-emerald-500 to-teal-700" />

        {/* Cabecera limpia y profesional */}
        <div className="pt-2 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-md shadow-teal-600/20">
              <ShoppingBag size={18} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight leading-none">
                FARMACIA VITALIS
              </h2>
              <span className="text-[10px] font-black uppercase tracking-wider text-teal-700">
                Lista de Pedido / Compra
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-mono font-bold text-slate-400 block">
              {currentDate}
            </span>
            {orderCode && (
              <span className="text-[10px] font-mono font-black text-slate-700 block">
                {orderCode}
              </span>
            )}
          </div>
        </div>

        {/* Distribuidora / Proveedor si está definido */}
        {supplierName && supplierName !== 'ALL' && (
          <div className="py-2 px-3 my-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Proveedor:</span>
            <span className="font-bold text-slate-800">{supplierName}</span>
          </div>
        )}

        {/* Lista estricta: Solo Nombre del Producto y Cantidad (Caja o Unidad) */}
        <div className="mt-3 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-slate-400 px-3 pb-1 border-b border-slate-100">
            <span>Producto</span>
            <span className="text-right">Cantidad Solicitada</span>
          </div>

          <div className="divide-y divide-slate-100">
            {items.map((item, idx) => {
              const unitLabel =
                item.unitType === 'BOX'
                  ? `${item.quantity} ${item.quantity === 1 ? 'Caja' : 'Cajas'}`
                  : `${item.quantity} ${item.quantity === 1 ? 'Unidad' : 'Unidades'}`;

              return (
                <div
                  key={`${item.productId}-${idx}`}
                  className="py-2.5 px-3 flex items-center justify-between gap-4"
                >
                  {/* Nombre del medicamento */}
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-slate-900 leading-snug block">
                      {item.productName}
                    </span>
                  </div>

                  {/* Cantidad exacta de caja o unidad */}
                  <div className="shrink-0 text-right">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black bg-teal-50 text-teal-800 border border-teal-200/80">
                      {unitLabel}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pie de la imagen */}
        <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-medium">
          <span>Total: {items.length} ítems en lista</span>
          <span className="text-teal-700 font-bold">Vitalis • Abastecimiento</span>
        </div>
      </div>
    </div>
  );
};
