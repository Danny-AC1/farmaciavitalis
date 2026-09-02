import React, { useState, useMemo } from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Send, 
  MessageSquare, 
  Mail, 
  Smartphone, 
  Printer, 
  Receipt,
  Phone
} from 'lucide-react';
import { Order } from '../../types';
import { 
  generateReceiptText, 
  generateWhatsAppLink, 
  generateTelegramLink, 
  generateSmsLink, 
  generateReceiptEmail, 
  executeNativeShare
} from '../../utils/receiptSharing';
import { printPOSTicket } from '../../utils/posTicketPrinter';

interface ReceiptShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const ReceiptShareModal: React.FC<ReceiptShareModalProps> = ({
  isOpen,
  onClose,
  order
}) => {
  if (!isOpen || !order) return null;

  const [phoneOverride, setPhoneOverride] = useState<string>(order.customerPhone || '');
  const [emailOverride, setEmailOverride] = useState<string>(order.customerEmail || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [activePreviewTab, setActivePreviewTab] = useState<'visual' | 'text'>('visual');
  const [justSharedNative, setJustSharedNative] = useState<boolean>(false);

  const formattedReceiptText = useMemo(() => {
    return generateReceiptText(order);
  }, [order]);

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(formattedReceiptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = formattedReceiptText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleWhatsApp = () => {
    const url = generateWhatsAppLink(order, phoneOverride);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleTelegram = () => {
    const url = generateTelegramLink(order);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSms = () => {
    const url = generateSmsLink(order, phoneOverride);
    window.location.href = url;
  };

  const handleEmail = () => {
    const { subject, body } = generateReceiptEmail(order);
    const targetEmail = emailOverride || order.customerEmail || '';
    const mailto = `mailto:${encodeURIComponent(targetEmail)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  const handleNativeShare = async () => {
    const success = await executeNativeShare(order);
    if (success) {
      setJustSharedNative(true);
      setTimeout(() => setJustSharedNative(false), 2500);
    }
  };

  const handlePrint = () => {
    printPOSTicket(order);
  };

  const hasNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2rem] w-full max-w-2xl overflow-hidden border border-slate-100 shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        id="receipt-share-modal"
      >
        {/* Cabecera Principal */}
        <div className="p-5 md:p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white flex justify-between items-center relative overflow-hidden">
          <div className="relative z-10 flex items-center gap-3">
            <div className="h-11 w-11 bg-teal-500/20 border border-teal-400/30 rounded-2xl flex items-center justify-center text-teal-300 shadow-inner">
              <Share2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black tracking-widest text-teal-300 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60 uppercase">
                  COMPARTIR MULTICANAL
                </span>
                <span className="text-[9px] font-mono text-slate-400 font-bold">
                  #{order.id.slice(-6).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg md:text-xl font-black text-white tracking-tight mt-0.5">
                Enviar Comprobante Digital
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition-all relative z-10 active:scale-95"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-5 md:p-6 space-y-5 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* Ajuste de Destinatario Rápido */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-tight flex items-center gap-1.5">
                <Phone size={14} className="text-teal-600" />
                Destinatario del Comprobante
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                {order.customerName}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Número Teléfono (WhatsApp / SMS)
                </label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-teal-500 transition">
                  <span className="text-xs font-black text-slate-400 mr-2">🇪🇨</span>
                  <input
                    type="text"
                    value={phoneOverride}
                    onChange={(e) => setPhoneOverride(e.target.value)}
                    placeholder="0998506160"
                    className="w-full bg-transparent text-xs font-black text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">
                  Correo Electrónico
                </label>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 py-2 focus-within:border-teal-500 transition">
                  <Mail size={14} className="text-slate-400 mr-2" />
                  <input
                    type="email"
                    value={emailOverride}
                    onChange={(e) => setEmailOverride(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Canales de Compartición Instantánea */}
          <div>
            <span className="text-xs font-black text-slate-700 uppercase tracking-tight block mb-3">
              Selecciona el Canal de Envío
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center justify-center p-3.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
              >
                <div className="h-11 w-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mb-2 shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <span className="text-xs font-black text-emerald-950">WhatsApp</span>
                <span className="text-[9px] font-bold text-emerald-700 mt-0.5">Mensaje directo</span>
              </button>

              {/* Telegram */}
              <button
                onClick={handleTelegram}
                className="flex flex-col items-center justify-center p-3.5 bg-sky-50 hover:bg-sky-100/80 border border-sky-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
              >
                <div className="h-11 w-11 rounded-2xl bg-sky-500 text-white flex items-center justify-center mb-2 shadow-md shadow-sky-500/20 group-hover:scale-105 transition-transform">
                  <Send size={20} />
                </div>
                <span className="text-xs font-black text-sky-950">Telegram</span>
                <span className="text-[9px] font-bold text-sky-700 mt-0.5">Canal o chat</span>
              </button>

              {/* SMS Directo */}
              <button
                onClick={handleSms}
                className="flex flex-col items-center justify-center p-3.5 bg-indigo-50 hover:bg-indigo-100/80 border border-indigo-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
              >
                <div className="h-11 w-11 rounded-2xl bg-indigo-500 text-white flex items-center justify-center mb-2 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                  <Smartphone size={20} />
                </div>
                <span className="text-xs font-black text-indigo-950">SMS</span>
                <span className="text-[9px] font-bold text-indigo-700 mt-0.5">Texto al celular</span>
              </button>

              {/* Correo Electrónico */}
              <button
                onClick={handleEmail}
                className="flex flex-col items-center justify-center p-3.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 rounded-2xl transition-all group active:scale-95 shadow-xs"
              >
                <div className="h-11 w-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center mb-2 shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
                  <Mail size={20} />
                </div>
                <span className="text-xs font-black text-amber-950">Correo</span>
                <span className="text-[9px] font-bold text-amber-700 mt-0.5">Email con desglose</span>
              </button>

            </div>
          </div>

          {/* Opciones Adicionales de Compartición */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            
            {/* Compartir Nativo (Móvil / Web Share) */}
            {hasNativeShare && (
              <button
                onClick={handleNativeShare}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                <Share2 size={14} className="text-teal-400" />
                <span>{justSharedNative ? '¡Compartido!' : 'Compartir del Sistema'}</span>
              </button>
            )}

            {/* Copiar Texto al Portapapeles */}
            <button
              onClick={handleCopyText}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs border transition active:scale-95 ${
                copied 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} className="text-slate-500" />}
              <span>{copied ? '¡Texto Copiado!' : 'Copiar Texto Completo'}</span>
            </button>

            {/* Imprimir Ticket Físico */}
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl font-black text-xs text-slate-700 transition active:scale-95"
            >
              <Printer size={14} className="text-slate-600" />
              <span>Imprimir Ticket</span>
            </button>
          </div>

          {/* Vista Previa del Comprobante */}
          <div className="border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-50">
            <div className="flex items-center justify-between p-3 bg-slate-100/70 border-b border-slate-200/80">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                <Receipt size={13} className="text-teal-600" />
                Vista Previa del Comprobante
              </span>

              <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 text-[10px] font-black">
                <button
                  onClick={() => setActivePreviewTab('visual')}
                  className={`px-2.5 py-1 rounded-md transition ${activePreviewTab === 'visual' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Visual
                </button>
                <button
                  onClick={() => setActivePreviewTab('text')}
                  className={`px-2.5 py-1 rounded-md transition ${activePreviewTab === 'text' ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  Texto WhatsApp
                </button>
              </div>
            </div>

            <div className="p-4 max-h-56 overflow-y-auto custom-scrollbar">
              {activePreviewTab === 'visual' ? (
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3 font-mono text-xs">
                  {/* Encabezado */}
                  <div className="text-center border-b border-dashed border-slate-200 pb-2.5">
                    <p className="font-black text-slate-900 text-sm tracking-tight">FARMACIA VITALIS</p>
                    <p className="text-[10px] text-slate-500 font-bold">Tu Salud Al Día • Machalilla, Ecuador</p>
                    <p className="text-[9px] text-slate-400 mt-1">
                      Orden #{order.id.slice(-6).toUpperCase()} • {new Date(order.date).toLocaleString()}
                    </p>
                  </div>

                  {/* Detalle Items */}
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

                  {/* Totales */}
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

        </div>

        {/* Footer */}
        <div className="p-4 md:p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <span className="text-[10px] text-slate-400 font-bold">
            Farmacia Vitalis • Comprobante Digital Multicanal
          </span>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-850 text-white text-xs font-black rounded-xl transition active:scale-95"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReceiptShareModal;
