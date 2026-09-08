import React from 'react';
import { 
  X, 
  Share2, 
  Copy, 
  Check, 
  Printer, 
  Phone,
  Mail
} from 'lucide-react';
import { Order } from '../../types';
import { useReceiptShareState } from './receipt/useReceiptShareState';
import { ReceiptChannelsGrid } from './receipt/ReceiptChannelsGrid';
import { ReceiptImageActionsCard } from './receipt/ReceiptImageActionsCard';
import { ReceiptPreviewSection } from './receipt/ReceiptPreviewSection';

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
  const state = useReceiptShareState(order);

  if (!isOpen || !order) return null;

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
                    value={state.phoneOverride}
                    onChange={(e) => state.setPhoneOverride(e.target.value)}
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
                    value={state.emailOverride}
                    onChange={(e) => state.setEmailOverride(e.target.value)}
                    placeholder="cliente@correo.com"
                    className="w-full bg-transparent text-xs font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Canales de Compartición Instantánea */}
          <ReceiptChannelsGrid
            order={order}
            handleWhatsApp={state.handleWhatsApp}
            handleTelegram={state.handleTelegram}
            handleSms={state.handleSms}
            handleEmail={state.handleEmail}
          />

          {/* Sección Destacada: Compartir Comprobante como Imagen */}
          <ReceiptImageActionsCard
            imageNotice={state.imageNotice}
            isProcessingImage={state.isProcessingImage}
            copiedImage={state.copiedImage}
            handleShareImage={state.handleShareImage}
            handleCopyImage={state.handleCopyImage}
            handleDownloadImage={state.handleDownloadImage}
          />

          {/* Opciones Adicionales de Compartición */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {state.hasNativeShare && (
              <button
                onClick={state.handleNativeShare}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95"
              >
                <Share2 size={14} className="text-teal-400" />
                <span>{state.justSharedNative ? '¡Compartido!' : 'Compartir del Sistema'}</span>
              </button>
            )}

            <button
              onClick={state.handleCopyText}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs border transition active:scale-95 ${
                state.copied 
                  ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {state.copied ? <Check size={14} /> : <Copy size={14} className="text-slate-500" />}
              <span>{state.copied ? '¡Texto Copiado!' : 'Copiar Texto'}</span>
            </button>

            <button
              onClick={state.handlePrint}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 rounded-xl font-black text-xs text-slate-700 transition active:scale-95"
            >
              <Printer size={14} className="text-slate-600" />
              <span>Imprimir Ticket</span>
            </button>
          </div>

          {/* Vista Previa del Comprobante */}
          <ReceiptPreviewSection
            order={order}
            cardRef={state.cardRef}
            activePreviewTab={state.activePreviewTab}
            setActivePreviewTab={state.setActivePreviewTab}
            formattedReceiptText={state.formattedReceiptText}
          />

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
