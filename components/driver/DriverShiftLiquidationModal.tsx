import React, { useState } from 'react';
import { Order } from '../../types';
import { 
  X, DollarSign, MessageSquare, Copy, Check, FileText 
} from 'lucide-react';
import { generateShiftReportText, formatWhatsAppPhone } from '../../services/driverService';

interface DriverShiftLiquidationModalProps {
  deliveredOrders: Order[];
  onClose: () => void;
}

export const DriverShiftLiquidationModal: React.FC<DriverShiftLiquidationModalProps> = ({
  deliveredOrders,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [adminPhone, setAdminPhone] = useState('0987654321');

  const cashOrders = deliveredOrders.filter(o => o.paymentMethod === 'CASH');
  const transferOrders = deliveredOrders.filter(o => o.paymentMethod !== 'CASH');

  const totalCash = cashOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalTransfer = transferOrders.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const grandTotal = totalCash + totalTransfer;

  const reportText = generateShiftReportText(deliveredOrders);

  const handleCopyReport = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Error al copiar:', e);
    }
  };

  const handleSendToWhatsApp = () => {
    const cleanPhone = formatWhatsAppPhone(adminPhone);
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reportText)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Encabezado */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
              <DollarSign size={22} />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-wider text-white">Liquidación y Cuadre de Caja</h2>
              <p className="text-[11px] text-amber-300 font-bold uppercase tracking-widest mt-0.5">
                Cierre de Turno • {deliveredOrders.length} Entregas Realizadas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* Tarjetas de Resumen Financiero */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="bg-orange-50 p-4 rounded-2xl border border-orange-200/80">
              <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-1">
                Efectivo en Mano
              </span>
              <span className="text-xl font-black text-orange-700 tabular-nums">
                ${totalCash.toFixed(2)}
              </span>
              <span className="text-[9px] text-orange-500 font-bold block mt-0.5">
                Entregar a Caja
              </span>
            </div>

            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200/80">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block mb-1">
                Transferencias
              </span>
              <span className="text-xl font-black text-blue-700 tabular-nums">
                ${totalTransfer.toFixed(2)}
              </span>
              <span className="text-[9px] text-blue-500 font-bold block mt-0.5">
                Verificadas
              </span>
            </div>

            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200/80">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-1">
                Total Recaudado
              </span>
              <span className="text-xl font-black text-emerald-700 tabular-nums">
                ${grandTotal.toFixed(2)}
              </span>
              <span className="text-[9px] text-emerald-500 font-bold block mt-0.5">
                {deliveredOrders.length} pedidos
              </span>
            </div>
          </div>

          {/* Vista previa del reporte formateado */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <FileText size={14} /> Resumen Oficial de Cierre
              </span>
              <button
                type="button"
                onClick={handleCopyReport}
                className="text-[10px] font-black text-slate-600 hover:text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-300 flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                <span>{copied ? '¡Copiado!' : 'Copiar Texto'}</span>
              </button>
            </div>
            <pre className="bg-white p-3.5 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-800 whitespace-pre-wrap max-h-44 overflow-y-auto leading-relaxed">
              {reportText}
            </pre>
          </div>

          {/* WhatsApp Admin Destination */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
            <span className="text-xs font-bold text-slate-700">WhatsApp de Administración/Caja:</span>
            <input
              type="tel"
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
              placeholder="09XXXXXXXX"
              className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-800 w-36 text-right focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Historial de entregas de la liquidación */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
              Desglose de Pedidos Entregados ({deliveredOrders.length})
            </h3>
            {deliveredOrders.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No hay pedidos entregados en este turno.</p>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {deliveredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-500">#{order.id.slice(-6).toUpperCase()}</span>
                      <p className="font-bold text-slate-900">{order.customerName}</p>
                      <span className="text-[10px] text-slate-400">
                        {order.deliveredAt ? new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Hoy'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-black text-sm text-slate-900 tabular-nums">${order.total.toFixed(2)}</span>
                      <span className={`block text-[9px] font-bold px-1.5 py-0.5 rounded mt-0.5 ${
                        order.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {order.paymentMethod === 'CASH' ? 'Efectivo' : 'Transfer'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Acciones de Liquidación */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row gap-2.5">
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs uppercase tracking-wider rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            {copied ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
            <span>{copied ? 'Copiado al Portapapeles' : 'Copiar Reporte'}</span>
          </button>
          
          <button
            type="button"
            onClick={handleSendToWhatsApp}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <MessageSquare size={16} />
            <span>Enviar a Administración</span>
          </button>
        </div>

      </div>
    </div>
  );
};
