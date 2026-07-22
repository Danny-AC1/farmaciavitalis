import React, { useState } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  RefreshCw,
  FileText
} from 'lucide-react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({
  isOpen,
  imageUrl,
  title = 'Vista previa de imagen',
  onClose
}) => {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  if (!isOpen || !imageUrl) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `vitalis-adjunto-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div 
      className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-between p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Header bar */}
      <div 
        className="w-full max-w-5xl flex items-center justify-between text-white py-2 px-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
            <FileText size={16} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-100">{title}</h4>
            <p className="text-[10px] text-slate-400 font-bold">Usa los controles de zoom para leer letras pequeñas o detalles</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs flex items-center gap-1 font-bold"
            title="Descargar imagen"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Descargar</span>
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500 text-rose-300 hover:text-white transition"
            title="Cerrar vista previa"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Main Image Stage */}
      <div 
        className="relative flex-grow w-full max-w-5xl my-4 flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing rounded-3xl bg-slate-900/40 border border-slate-800/60"
        onClick={e => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <img
          src={imageUrl}
          alt="Adjunto de Chat"
          className="max-h-[72vh] max-w-full object-contain transition-transform duration-150 ease-out shadow-2xl rounded-xl"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`
          }}
          draggable={false}
        />
      </div>

      {/* Floating Toolbar */}
      <div 
        className="w-auto flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-white shadow-2xl backdrop-blur-lg"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={handleZoomOut}
          disabled={scale <= 0.5}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition text-slate-200"
          title="Alejar (-)"
        >
          <ZoomOut size={16} />
        </button>

        <span className="text-xs font-black min-w-[50px] text-center text-teal-400">
          {Math.round(scale * 100)}%
        </span>

        <button
          onClick={handleZoomIn}
          disabled={scale >= 4}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 transition text-slate-200"
          title="Acercar (+)"
        >
          <ZoomIn size={16} />
        </button>

        <div className="h-4 w-px bg-slate-800 mx-1" />

        <button
          onClick={handleRotate}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-200"
          title="Rotar 90°"
        >
          <RotateCw size={16} />
        </button>

        <button
          onClick={handleReset}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition text-slate-200"
          title="Restablecer vista"
        >
          <RefreshCw size={16} />
        </button>
      </div>
    </div>
  );
};

export default ImagePreviewModal;
