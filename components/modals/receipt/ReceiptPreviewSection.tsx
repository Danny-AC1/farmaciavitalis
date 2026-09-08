import React from 'react';
import { Receipt, Image as ImageIcon } from 'lucide-react';
import { Order } from '../../../types';
import { DigitalReceiptImageCard } from './DigitalReceiptImageCard';

interface ReceiptPreviewSectionProps {
  order: Order;
  cardRef: React.RefObject<HTMLDivElement>;
  activePreviewTab: 'image' | 'visual' | 'text';
  setActivePreviewTab: (tab: 'image' | 'visual' | 'text') => void;
  formattedReceiptText: string;
}

export const ReceiptPreviewSection: React.FC<ReceiptPreviewSectionProps> = ({
  order,
  cardRef,
  activePreviewTab,
  setActivePreviewTab,
  formattedReceiptText
}) => {
  return (
    <>
      {/* Renderizado de respaldo off-screen si no estamos en la pestaña de imagen para que siempre exista el ref */}
      {activePreviewTab !== 'image' && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, opacity: 0, pointerEvents: 'none' }}>
          <DigitalReceiptImageCard order={order} cardRef={cardRef} />
        </div>
      )}

      {/* Vista Previa del Comprobante */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50">
        <div className="flex items-center justify-between p-3 bg-slate-100/70 border-b border-slate-200/80">
          <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
            <Receipt size={13} className="text-teal-600" />
            Vista Previa del Comprobante
          </span>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-black">
            <button
              onClick={() => setActivePreviewTab('image')}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${activePreviewTab === 'image' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <ImageIcon size={11} />
              <span>Imagen HD</span>
            </button>
            <button
              onClick={() => setActivePreviewTab('visual')}
              className={`px-2.5 py-1 rounded-md transition ${activePreviewTab === 'visual' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Ticket Térmico
            </button>
            <button
              onClick={() => setActivePreviewTab('text')}
              className={`px-2.5 py-1 rounded-md transition ${activePreviewTab === 'text' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
            >
              Texto WhatsApp
            </button>
          </div>
        </div>

        <div className="p-4 max-h-72 overflow-y-auto custom-scrollbar">
          {activePreviewTab === 'image' ? (
            <div className="flex justify-center bg-slate-200/50 p-3 rounded-2xl">
              <DigitalReceiptImageCard order={order} cardRef={cardRef} />
            </div>
          ) : activePreviewTab === 'visual' ? (
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3 font-mono text-xs">
              <div className="text-center border-b border-dashed border-slate-200 pb-2.5">
                <p className="font-black text-slate-900 text-sm tracking-tight">FARMACIA VITALIS</p>
                <p className="text-[10px] text-slate-500 font-bold">Tu Salud Al Día • Machalilla, Ecuador</p>
                <p className="text-[9px] text-slate-400 mt-1">
                  Orden #{order.id.slice(-6).toUpperCase()} • {new Date(order.date).toLocaleString()}
                </p>
              </div>

              <div className="space-y-1.5 py-1">
                {order.items.map((item, idx) => {
                  const isBox = item.selectedUnit === 'BOX';
                  const price = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                  return (
                    <div key={idx} className="flex justify-between items-start text-[11px]">
                      <span className="font-bold text-slate-800">
                        {item.quantity}x {item.name} {isBox ? `[CJ x${item.unitsPerBox}]` : '[UN]'}
                      </span>
                      <span className="font-black text-slate-900 shrink-0 ml-2">
                        ${(price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span>${order.subtotal.toFixed(2)}</span>
                </div>
                {order.deliveryFee ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Envío:</span>
                    <span>${order.deliveryFee.toFixed(2)}</span>
                  </div>
                ) : null}
                {order.discount ? (
                  <div className="flex justify-between text-rose-600">
                    <span>Descuento:</span>
                    <span>-${order.discount.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between font-black text-sm text-teal-800 border-t border-slate-200 pt-1.5">
                  <span>TOTAL:</span>
                  <span>${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <pre className="text-[11px] font-mono text-slate-700 bg-white p-3 rounded-xl border border-slate-200/80 whitespace-pre-wrap select-all leading-relaxed">
              {formattedReceiptText}
            </pre>
          )}
        </div>
      </div>
    </>
  );
};
