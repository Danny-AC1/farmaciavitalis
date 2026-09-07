import React, { useRef, useState } from 'react';
import { Download, Copy, Check, Image as ImageIcon, Loader2 } from 'lucide-react';
import { PurchaseOrderItem } from '../../../types/purchases';
import { PurchaseListImageCard } from './PurchaseListImageCard';
import { 
  downloadPurchaseListImage, 
  copyPurchaseListImageToClipboard 
} from '../../../services/purchaseImageGenerator';

interface PurchaseImageDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: PurchaseOrderItem[];
  supplierName?: string;
  orderCode?: string;
}

export const PurchaseImageDownloadModal: React.FC<PurchaseImageDownloadModalProps> = ({
  isOpen,
  onClose,
  items,
  supplierName,
  orderCode,
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  if (!isOpen || items.length === 0) return null;

  const fileName = orderCode || `Lista_Compras_${new Date().toISOString().slice(0, 10)}`;

  const handleDownload = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    setStatusMessage('Generando imagen de alta calidad...');
    try {
      await downloadPurchaseListImage(cardRef.current, fileName);
      setStatusMessage('¡Imagen descargada exitosamente!');
      setTimeout(() => setStatusMessage(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un inconveniente al generar la imagen. Por favor intenta nuevamente.');
      setStatusMessage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyImage = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    setStatusMessage('Copiando imagen al portapapeles...');
    try {
      const success = await copyPurchaseListImageToClipboard(cardRef.current);
      if (success) {
        setCopied(true);
        setStatusMessage('¡Imagen copiada! Puedes pegarla directamente en WhatsApp.');
        setTimeout(() => {
          setCopied(false);
          setStatusMessage(null);
        }, 3500);
      } else {
        // Si el navegador bloquea copiar imagen directo, descargamos automáticamente
        await downloadPurchaseListImage(cardRef.current, fileName);
        setStatusMessage('Tu navegador no admite copiar imagen directo; la hemos descargado en tu dispositivo.');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error(err);
      setStatusMessage(null);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-3xl md:rounded-[2.5rem] shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Cabecera */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-teal-600/20">
              <ImageIcon size={20} />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-black text-slate-800 tracking-tight">
                Descargar Imagen de la Lista
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Solo nombres de medicamentos y cantidades en caja / unidad (sin precios ni costos).
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors font-bold text-lg"
          >
            ✕
          </button>
        </div>

        {/* Mensaje de estado */}
        {statusMessage && (
          <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-2.5 text-xs font-bold text-emerald-800 text-center animate-in fade-in">
            {statusMessage}
          </div>
        )}

        {/* Vista previa scrolleable de la tarjeta a exportar */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-100/60 flex items-center justify-center">
          <div className="shadow-lg rounded-3xl overflow-hidden border border-slate-200/80 max-w-full">
            <PurchaseListImageCard
              items={items}
              cardRef={cardRef}
              supplierName={supplierName}
              orderCode={orderCode}
            />
          </div>
        </div>

        {/* Acciones del pie */}
        <div className="p-4 md:p-6 border-t border-slate-100 bg-white flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-medium">
            Formato: <strong className="text-slate-700">PNG Alta Definición</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyImage}
              disabled={isGenerating}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              title="Copiar imagen al portapapeles para pegar en WhatsApp"
            >
              {copied ? <Check size={15} className="text-emerald-600" /> : <Copy size={15} />}
              <span>{copied ? '¡Copiada!' : 'Copiar Imagen'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-black transition-all shadow-md shadow-teal-600/20 disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Download size={16} />
              )}
              <span>Descargar Imagen</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
