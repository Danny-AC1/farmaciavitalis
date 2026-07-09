import React, { useState } from 'react';
import { X, Copy, Check, Mail, Share2 } from 'lucide-react';
import { Product } from '../../types';

interface ShareSheetProps {
  product: Product;
  discountedPrice: number;
  isOpen: boolean;
  onClose: () => void;
}

const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const TelegramIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.384-1.362 5.992-.168.68-.415.908-.658.93-.529.048-.93-.351-1.442-.686-.802-.524-1.255-.85-2.035-1.363-.9-.593-.317-.92.196-1.454.135-.14 2.474-2.27 2.519-2.463.006-.024.01-.113-.043-.16-.053-.047-.13-.031-.186-.018-.08.018-1.353.86-3.821 2.528-.362.248-.69.37-.984.363-.325-.007-.95-.184-1.415-.335-.57-.185-1.023-.284-1.011-.6.006-.164.23-.332.671-.504 2.73-1.189 4.551-1.975 5.464-2.358 2.603-1.093 3.142-1.283 3.495-1.289.078-.001.252.019.365.111.095.078.121.183.129.256.008.073.018.239.01.371z" />
  </svg>
);

const ShareSheet: React.FC<ShareSheetProps> = ({ product, discountedPrice, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const url = new URL(window.location.origin);
  url.searchParams.set('product', product.id);
  const shareUrl = url.toString();

  const shareText = `¡Hola! Te comparto este producto de Farmacia Vitalis: *${product.name}* a un precio increíble de $${discountedPrice.toFixed(2)}. Míralo aquí: ${shareUrl}`;
  const encodedText = encodeURIComponent(shareText);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const triggerNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `Farmacia Vitalis - ${product.name} a $${discountedPrice.toFixed(2)}`,
          url: shareUrl,
        });
      } catch (err) {
        console.log('User cancelled or native share failed', err);
      }
    } else {
      handleCopy();
    }
  };

  // Standard styled QR Server URL - matching brand teal #0f766e color
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=0f766e&data=${encodeURIComponent(shareUrl)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div 
        className="bg-white w-full md:max-w-md rounded-t-3xl md:rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header decoration bar for mobile */}
        <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto my-3 md:hidden"></div>

        {/* Header */}
        <div className="px-6 pb-4 pt-2 md:pt-6 flex items-center justify-between border-b border-slate-100">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-teal-600">Compartir Producto</span>
            <h3 className="text-lg font-black text-slate-800 leading-tight">Enlace de Primer Nivel</h3>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-full bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Product Mini Banner */}
          <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 flex items-center gap-4">
            <img 
              src={product.image} 
              alt={product.name} 
              className="h-16 w-16 rounded-xl object-contain bg-white border border-slate-100 p-1 shrink-0 mix-blend-multiply" 
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-extrabold text-slate-800 truncate">{product.name}</h4>
              <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{product.description}</p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-sm font-black text-teal-700">${discountedPrice.toFixed(2)}</span>
                <span className="text-[10px] bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded-full font-bold text-teal-700 uppercase tracking-tight">Farmacia Vitalis</span>
              </div>
            </div>
          </div>

          {/* QR Code section */}
          <div className="flex flex-col items-center justify-center bg-gradient-to-b from-teal-50/30 to-white border border-teal-50 rounded-3xl p-6 text-center shadow-inner relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-teal-600/20"></div>
            <div className="relative p-3.5 bg-white rounded-2xl shadow-md border border-teal-100/60 mb-3 group hover:scale-[1.02] transition-transform">
              <img 
                src={qrCodeUrl} 
                alt="QR Code de Producto" 
                className="w-36 h-36 select-none" 
                loading="lazy"
              />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-white/90 backdrop-blur-[1px] transition-opacity rounded-2xl">
                <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider">Farmacia Vitalis</span>
              </div>
            </div>
            <span className="text-xs font-black text-teal-900 tracking-tight">Escanea para abrir en tu celular</span>
            <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Comparte el código QR directamente con tus amigos</p>
          </div>

          {/* Social Share grid */}
          <div className="space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.1em] block mb-1">Redes de Envío Express</span>
            <div className="grid grid-cols-2 gap-3">
              <a 
                href={`https://api.whatsapp.com/send?text=${encodedText}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 active:scale-95 transition-all text-center"
              >
                <WhatsAppIcon />
                <span>WhatsApp</span>
              </a>

              <a 
                href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`¡Mira este producto de Farmacia Vitalis! *${product.name}* a $${discountedPrice.toFixed(2)}`)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg shadow-sky-500/10 hover:shadow-sky-500/20 active:scale-95 transition-all text-center"
              >
                <TelegramIcon />
                <span>Telegram</span>
              </a>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a 
                href={`mailto:?subject=${encodeURIComponent(`Mira esto en Farmacia Vitalis: ${product.name}`)}&body=${encodeURIComponent(`¡Hola! Te recomiendo ver ${product.name} en Farmacia Vitalis por $${discountedPrice.toFixed(2)}: ${shareUrl}`)}`}
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all text-center"
              >
                <Mail className="h-5 w-5" />
                <span>Correo</span>
              </a>

              {/* Native share / quick option */}
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' ? (
                <button 
                  onClick={triggerNativeShare}
                  className="flex items-center justify-center gap-2 bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all"
                >
                  <Share2 className="h-5 w-5" />
                  <span>Compartir...</span>
                </button>
              ) : (
                <button 
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 font-extrabold text-xs py-3.5 px-4 rounded-xl transition-all ${
                    copied 
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/15' 
                      : 'bg-teal-50 hover:bg-teal-100 text-teal-700'
                  }`}
                >
                  {copied ? <Check className="h-5 w-5 animate-in zoom-in" /> : <Copy className="h-5 w-5" />}
                  <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <div className="p-4 bg-slate-50 border-t border-slate-100/80 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 font-medium">¿Quieres el enlace directo?</span>
            <button 
              onClick={handleCopy}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase tracking-wider transition-all ${
                copied 
                  ? 'bg-teal-600 text-white shadow-sm' 
                  : 'text-teal-700 hover:bg-teal-100/50'
              }`}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copiar Link</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShareSheet;
