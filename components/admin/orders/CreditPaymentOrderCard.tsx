import React from 'react';
import { 
  Clock, 
  Phone, 
  Printer, 
  Trash2, 
  Eye, 
  Share2, 
  Wallet, 
  CheckCircle2, 
  FileText,
  BadgeDollarSign
} from 'lucide-react';
import { Order } from '../../../types';
import { extractCreditPaymentDetails } from '../../../utils/creditPaymentOrders';

interface CreditPaymentOrderCardProps {
  order: Order;
  onSelect: (order: Order) => void;
  onDelete: (id: string) => void;
  onPrint: (order: Order) => void;
  onShare?: (order: Order) => void;
}

export const CreditPaymentOrderCard: React.FC<CreditPaymentOrderCardProps> = ({
  order,
  onSelect,
  onDelete,
  onPrint,
  onShare
}) => {
  const details = extractCreditPaymentDetails(order);
  const isCash = order.paymentMethod === 'CASH';

  return (
    <div 
      className="bg-white rounded-3xl p-5 border border-teal-150 hover:shadow-lg transition-all flex flex-col lg:flex-row gap-5 relative overflow-hidden group bg-gradient-to-r from-teal-50/25 via-white to-white"
      id={`credit-payment-card-${order.id}`}
    >
      {/* Barra visual lateral indicando Abono de Fiado */}
      <div className="absolute left-0 top-0 bottom-0 w-2 bg-gradient-to-b from-teal-500 via-emerald-500 to-teal-600" />

      {/* Contenido Principal */}
      <div className="flex-grow space-y-4">
        {/* Cabecera del Abono */}
        <div className="flex justify-between items-start gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-wider">
                Recibo #{order.id.slice(-6).toUpperCase()}
              </span>

              {/* Distintivo de Abono */}
              <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 ${
                details.isLiquidation 
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                  : 'bg-teal-100 border-teal-300 text-teal-800'
              }`}>
                {details.isLiquidation ? (
                  <CheckCircle2 size={11} className="text-emerald-600" />
                ) : (
                  <Wallet size={11} className="text-teal-600" />
                )}
                {details.isLiquidation ? 'Cancelación Total de Fiado' : 'Abono a Medicamento Fiado'}
              </span>

              {/* Método de pago */}
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                isCash 
                  ? 'bg-amber-50 border-amber-200 text-amber-800' 
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                {isCash ? 'Efectivo en Caja' : 'Transferencia'}
              </span>

              <span className="bg-slate-150 text-slate-700 px-2 py-0.5 rounded-full text-[9px] font-bold">
                Caja POS
              </span>
            </div>

            <h4 className="text-lg font-black text-slate-900 uppercase mt-1.5 flex items-center gap-2">
              <span>{order.customerName}</span>
              <span className="text-xs font-semibold text-slate-400 font-sans normal-case">
                (Deudor)
              </span>
            </h4>
          </div>

          <div className="text-right">
            <span className="text-[10px] font-black text-teal-800 uppercase tracking-widest block">
              Monto Ingresado a Caja
            </span>
            <p className="text-2xl font-black text-teal-700 font-mono">
              +${order.total.toFixed(2)}
            </p>
            {isCash && order.cashGiven && (
              <span className="text-[10px] text-slate-400 font-semibold block">
                Recibido: ${order.cashGiven.toFixed(2)}
              </span>
            )}
          </div>
        </div>

        {/* Datos del Crédito / Pagaré Asociado */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <div className="bg-teal-50 p-2 rounded-xl border border-teal-100 text-teal-600 shrink-0">
              <FileText size={14} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Ticket Deuda</span>
              <span className="font-mono font-black text-slate-800">{details.creditRef}</span>
            </div>
          </div>

          {order.customerPhone && (
            <div className="flex items-center gap-2 text-slate-600">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-400 shrink-0">
                <Phone size={14} />
              </div>
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase block">Teléfono</span>
                <span className="font-bold text-slate-700">{order.customerPhone}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 text-slate-600">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 text-slate-400 shrink-0">
              <BadgeDollarSign size={14} />
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-400 uppercase block">Estado de Cuenta</span>
              <span className="font-bold text-slate-800">
                {details.remainingAmount !== undefined 
                  ? details.remainingAmount === 0 
                    ? 'Deuda Salda al 100%' 
                    : `Resta $${details.remainingAmount.toFixed(2)}`
                  : details.isLiquidation ? 'Saldada' : 'Abono registrado'}
              </span>
            </div>
          </div>
        </div>

        {/* Nota / Descripción adicional */}
        {order.notes && (
          <div className="bg-teal-50/40 border border-teal-100/80 rounded-xl px-3 py-1.5 text-[11px] text-teal-900 font-medium">
            <span className="font-bold text-teal-950">Detalle: </span>
            {order.notes}
          </div>
        )}

        {/* Fecha y Hora */}
        <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-400 tracking-wider">
          <span className="text-emerald-700 font-extrabold flex items-center gap-1">
            <CheckCircle2 size={12} />
            Ingreso contabilizado en caja
          </span>
          <div className="flex items-center gap-1 font-bold text-slate-500 font-mono">
            <Clock size={12} />
            <span>
              {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </div>

      {/* Columna de Acciones Rápidas */}
      <div className="lg:w-44 flex lg:flex-col gap-2 justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-5 shrink-0">
        <button
          onClick={() => onSelect(order)}
          className="flex-1 lg:flex-none bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border border-slate-200/60 shadow-xs active:scale-95 cursor-pointer"
          id={`order-view-btn-${order.id}`}
        >
          <Eye size={13} /> Ver Detalle
        </button>

        <button
          onClick={() => onPrint(order)}
          className="flex-1 lg:flex-none bg-slate-900 hover:bg-slate-850 text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 cursor-pointer"
          id={`order-print-btn-${order.id}`}
        >
          <Printer size={13} /> Ticket
        </button>

        {onShare && (
          <button
            onClick={() => onShare(order)}
            className="flex-1 lg:flex-none bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
            id={`order-share-btn-${order.id}`}
          >
            <Share2 size={13} /> Compartir
          </button>
        )}

        <button
          onClick={() => onDelete(order.id)}
          className="px-3.5 bg-red-50 text-red-500 hover:bg-red-650 hover:text-white py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-all border border-red-150 active:scale-95 cursor-pointer"
          id={`order-delete-btn-${order.id}`}
          title="Eliminar Registro de Abono"
        >
          <Trash2 size={13} /> <span className="lg:hidden">Eliminar</span>
        </button>
      </div>
    </div>
  );
};
