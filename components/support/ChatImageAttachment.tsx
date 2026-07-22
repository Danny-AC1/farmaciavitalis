import React, { useState } from 'react';
import { ZoomIn, Image as ImageIcon } from 'lucide-react';
import ImagePreviewModal from './ImagePreviewModal';

interface ChatImageAttachmentProps {
  mediaUrl: string;
  senderRole?: 'USER' | 'ADMIN';
  caption?: string;
}

export const ChatImageAttachment: React.FC<ChatImageAttachmentProps> = ({
  mediaUrl,
  caption
}) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  return (
    <>
      <div className="mt-2 space-y-1.5">
        <div 
          onClick={() => setIsPreviewOpen(true)}
          className="relative group rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900/5 cursor-pointer max-w-xs sm:max-w-sm shadow-sm transition-all hover:shadow-md hover:border-teal-500/60"
        >
          {/* Image Thumbnail */}
          <img 
            src={mediaUrl} 
            alt="Adjunto de Chat" 
            className="w-full max-h-60 object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Hover / Touch Overlay */}
          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-black text-xs">
            <div className="bg-teal-600/90 px-3 py-1.5 rounded-xl flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
              <ZoomIn size={14} />
              <span>Ver con Zoom</span>
            </div>
          </div>

          {/* Badge */}
          <div className="absolute top-2 left-2 bg-slate-950/70 backdrop-blur-md text-white text-[10px] font-black px-2 py-0.5 rounded-lg flex items-center gap-1 border border-white/10">
            <ImageIcon size={11} className="text-teal-400" />
            <span>Foto / Receta</span>
          </div>
        </div>

        {caption && !caption.startsWith('[Archivo adjunto') && (
          <p className="text-[11px] font-semibold opacity-90 px-1">{caption}</p>
        )}
      </div>

      {/* Full Screen Lightbox Modal with Zoom & Pan */}
      <ImagePreviewModal
        isOpen={isPreviewOpen}
        imageUrl={mediaUrl}
        title="Adjunto de Chat - Fórmula / Producto"
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
};

export default ChatImageAttachment;
