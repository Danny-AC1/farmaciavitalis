import React from 'react';
import { Image as ImageIcon, Share2, Copy, Check, Download, Loader2, Info } from 'lucide-react';

interface ReceiptImageActionsCardProps {
  imageNotice: { type: 'success' | 'info' | 'error'; text: string } | null;
  isProcessingImage: boolean;
  copiedImage: boolean;
  handleShareImage: () => void;
  handleCopyImage: () => void;
  handleDownloadImage: () => void;
}

export const ReceiptImageActionsCard: React.FC<ReceiptImageActionsCardProps> = ({
  imageNotice,
  isProcessingImage,
  copiedImage,
  handleShareImage,
  handleCopyImage,
  handleDownloadImage
}) => {
  return (
    <div className="space-y-3">
      {/* Notificación de Estado de Imagen (sin iconos de IA) */}
      {imageNotice && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition animate-in fade-in ${
          imageNotice.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : imageNotice.type === 'error'
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'bg-teal-50 text-teal-800 border border-teal-200'
        }`}>
          {imageNotice.type === 'success' ? (
            <Check size={16} className="text-emerald-600 shrink-0" />
          ) : (
            <Info size={16} className="text-teal-600 shrink-0" />
          )}
          <span>{imageNotice.text}</span>
        </div>
      )}

      {/* Sección Destacada: Compartir Comprobante como Imagen */}
      <div className="bg-gradient-to-br from-teal-950 via-slate-900 to-slate-950 p-4 sm:p-5 rounded-2xl text-white shadow-lg border border-teal-500/30 relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/40 text-teal-300 flex items-center justify-center shrink-0">
              <ImageIcon size={20} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 bg-teal-950/80 px-2 py-0.5 rounded border border-teal-800/60">
                  COMPROBANTE VISUAL
                </span>
                <span className="text-xs font-black tracking-tight text-white">Compartir como Imagen</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Genera el comprobante oficial en foto HD para enviar por WhatsApp o redes sociales.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          {/* Botón 1: Compartir Imagen */}
          <button
            type="button"
            onClick={handleShareImage}
            disabled={isProcessingImage}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-600/30 transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isProcessingImage ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Share2 size={14} className="text-emerald-200" />
            )}
            <span>Compartir Imagen</span>
          </button>

          {/* Botón 2: Copiar Imagen */}
          <button
            type="button"
            onClick={handleCopyImage}
            disabled={isProcessingImage}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition active:scale-95 disabled:opacity-50 border cursor-pointer ${
              copiedImage 
                ? 'bg-emerald-700/80 border-emerald-500 text-white' 
                : 'bg-white/10 hover:bg-white/20 border-white/10 text-white'
            }`}
          >
            {copiedImage ? (
              <Check size={14} className="text-emerald-300" />
            ) : (
              <Copy size={14} className="text-teal-300" />
            )}
            <span>{copiedImage ? '¡Imagen Copiada!' : 'Copiar Imagen (Ctrl+V)'}</span>
          </button>

          {/* Botón 3: Descargar Imagen */}
          <button
            type="button"
            onClick={handleDownloadImage}
            disabled={isProcessingImage}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-white/10 text-white rounded-xl text-xs font-black transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Download size={14} className="text-teal-300" />
            <span>Descargar Imagen PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
