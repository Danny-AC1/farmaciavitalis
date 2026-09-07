import React, { useState } from 'react';
import { X, Printer, Download, MessageCircle, Copy, Check, FileText, Image as ImageIcon } from 'lucide-react';
import { PurchaseOrderItem } from '../../../types/purchases';
import { generateWhatsAppOrderMessage, exportOrderToCSV } from '../../../services/db.purchases';
import { PurchaseImageDownloadModal } from './PurchaseImageDownloadModal';

interface PurchaseShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PurchaseOrderItem[];
  supplierName?: string;
  orderCode?: string;
}

export const PurchaseShareModal: React.FC<PurchaseShareModalProps> = ({
  isOpen,
  onClose,
  items,
  supplierName,
  orderCode,
}) => {
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  if (!isOpen || items.length === 0) return null;

  const totalCost = items.reduce((acc, it) => acc + it.subtotal, 0);
  const totalUnits = items.reduce((acc, it) => {
    return acc + (it.unitType === 'BOX' ? it.quantity * (it.unitsPerBox || 1) : it.quantity);
  }, 0);

  const formattedMessage = generateWhatsAppOrderMessage(items, supplierName, orderCode);

  const handleCopy = () => {
    navigator.clipboard.writeText(formattedMessage).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(formattedMessage);
    const cleanPhone = targetPhone.replace(/\D/g, '');
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    exportOrderToCSV(items, orderCode || 'Orden_Compra_Vitalis');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                Emitir y Enviar Orden de Compra
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {items.length} productos ({totalUnits} unidades físicas) • ${totalCost.toFixed(2)} de inversión estimada
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

        {/* Contenido */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
          
          {/* Teléfono opcional de WhatsApp */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-2">
            <label className="text-xs font-black text-slate-700 block">
              Número de WhatsApp del Asesor / Distribuidor (Opcional):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: 593987654321 (con código de país) o déjalo vacío para elegir contacto"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
              <button
                onClick={handleSendWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm shrink-0"
              >
                <MessageCircle size={15} />
                <span>Abrir WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Previsualización del texto a enviar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Previsualización del Documento / Mensaje:
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-xs font-bold text-teal-700 hover:text-teal-800 transition-colors"
              >
                {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-900 text-slate-100 text-[11px] font-mono rounded-2xl overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64 border border-slate-800">
              {formattedMessage}
            </pre>
          </div>
        </div>

        {/* Acciones del pie */}
        <div className="p-4 md:p-6 border-t border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Download size={14} />
              <span>Descargar Excel (CSV)</span>
            </button>

            <button
              onClick={() => setIsImageModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200/90 rounded-xl text-xs font-bold transition-colors shadow-2xs"
              title="Generar imagen limpia con solo nombre de medicamento y cantidades (caja/unidad)"
            >
              <ImageIcon size={14} />
              <span>Descargar Imagen</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
            >
              <Printer size={14} />
              <span>Imprimir Orden</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
          >
            Listo, volver
          </button>
        </div>
      </div>

      {/* Modal para previsualizar y descargar la imagen solo con productos y cantidades */}
      <PurchaseImageDownloadModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        items={items}
        supplierName={supplierName}
        orderCode={orderCode}
      />
    </div>
  );
};
