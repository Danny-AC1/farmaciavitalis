import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingCart, 
  Eye, 
  Heart, 
  Share2, 
  Tag, 
  Check, 
  AlertCircle, 
  MessageSquare, 
  Plus, 
  Minus, 
  Sparkles, 
  ShieldCheck,
  Maximize2
} from 'lucide-react';
import { Product, CartItem } from '../../types';
import { getProductDiscount, getDiscountedPrice } from '../../utils/discounts';

interface ProductQuickPeekModalProps {
  product: Product;
  cart: CartItem[];
  onClose: () => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX', quantity?: number) => void;
  onSelectProduct: (product: Product) => void;
  onConsultPharmacist?: (product: Product) => void;
}

export const ProductQuickPeekModal: React.FC<ProductQuickPeekModalProps> = ({
  product,
  cart,
  onClose,
  onAddToCart,
  onSelectProduct,
  onConsultPharmacist
}) => {
  const [selectedUnit, setSelectedUnit] = useState<'UNIT' | 'BOX'>('UNIT');
  const [quantity, setQuantity] = useState(1);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    // Check local storage for favorites
    const favs = JSON.parse(localStorage.getItem('vitalis_favorites') || '[]');
    setIsFavorite(favs.includes(product.id));
  }, [product.id]);

  const toggleFavorite = () => {
    const favs = JSON.parse(localStorage.getItem('vitalis_favorites') || '[]');
    let updated: string[];
    if (favs.includes(product.id)) {
      updated = favs.filter((id: string) => id !== product.id);
      setIsFavorite(false);
    } else {
      updated = [...favs, product.id];
      setIsFavorite(true);
    }
    localStorage.setItem('vitalis_favorites', JSON.stringify(updated));
  };

  const discount = getProductDiscount(product.id);
  const unitPrice = discount ? getDiscountedPrice(product.price, discount) : product.price;
  const boxPrice = product.boxPrice ? (discount ? getDiscountedPrice(product.boxPrice, discount) : product.boxPrice) : undefined;
  const activePrice = selectedUnit === 'BOX' && boxPrice ? boxPrice : unitPrice;

  // Calculate reserved stock
  const reservedUnits = cart.reduce((acc, item) => {
    if (item.id !== product.id) return acc;
    const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
    return acc + (item.quantity * unitsPerItem);
  }, 0);

  const availableStock = Math.max(0, product.stock - reservedUnits);
  const isAvailable = availableStock > 0;

  const handleAdd = () => {
    if (!isAvailable) return;
    for (let i = 0; i < quantity; i++) {
      onAddToCart(product, selectedUnit);
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: `Mira este producto en Farmacia Vitalis: ${product.name}`,
        url: window.location.href
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/#product-${product.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Bar Banner */}
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-teal-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-widest text-teal-300">
              Vista Rápida • Mantener Presionado
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors text-slate-300 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
          {/* Header Image & Actions */}
          <div className="relative bg-slate-50 rounded-2xl p-4 flex items-center justify-center border border-slate-100 group min-h-[180px]">
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-48 object-contain mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
            />

            {/* Zoom Image Button */}
            <button
              onClick={() => setShowFullImage(true)}
              className="absolute bottom-3 right-3 bg-white/90 hover:bg-white p-2 rounded-xl shadow-md text-slate-700 transition"
              title="Agrandar Imagen"
            >
              <Maximize2 size={16} />
            </button>

            {/* Favorite & Share Quick Buttons */}
            <div className="absolute top-3 right-3 flex flex-col gap-2">
              <button
                onClick={toggleFavorite}
                className={`p-2.5 rounded-full shadow-md transition-all ${
                  isFavorite ? 'bg-rose-500 text-white scale-110' : 'bg-white/90 text-slate-600 hover:bg-white'
                }`}
                title="Favorito"
              >
                <Heart size={18} className={isFavorite ? 'fill-white' : ''} />
              </button>
              <button
                onClick={handleShare}
                className="p-2.5 rounded-full bg-white/90 text-slate-600 hover:bg-white shadow-md transition"
                title="Compartir"
              >
                {copied ? <Check size={18} className="text-emerald-600" /> : <Share2 size={18} />}
              </button>
            </div>

            {/* Stock Badge */}
            <div className="absolute top-3 left-3 flex flex-col gap-1">
              {isAvailable ? (
                <span className="bg-emerald-500/90 backdrop-blur-sm text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm flex items-center gap-1">
                  <ShieldCheck size={12} /> {availableStock} Disponibles
                </span>
              ) : (
                <span className="bg-rose-500 text-white font-black text-[10px] px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  Agotado
                </span>
              )}

              {discount && (
                <span className="bg-amber-500 text-white font-black text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 w-fit">
                  <Tag size={11} /> Oferta Especial
                </span>
              )}
            </div>
          </div>

          {/* Product Titles & Categories */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-600 bg-teal-50 px-2.5 py-0.5 rounded-md">
                {product.category || 'General'}
              </span>
              {product.requiresPrescription && (
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-rose-600 bg-rose-50 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                  <AlertCircle size={10} /> Requiere Receta
                </span>
              )}
            </div>
            <h3 className="text-lg md:text-xl font-black text-slate-900 leading-tight">
              {product.name}
            </h3>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              {product.description || 'Sin descripción disponible.'}
            </p>
          </div>

          {/* Price & Unit Type Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-2xl font-black text-teal-700">
                  ${(activePrice * quantity).toFixed(2)}
                </span>
                {quantity > 1 && (
                  <span className="text-xs text-slate-400 font-bold ml-2">
                    (${activePrice.toFixed(2)} c/u)
                  </span>
                )}
              </div>

              {/* Unit Switcher if box price exists */}
              {product.boxPrice && (
                <div className="flex bg-slate-200/80 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setSelectedUnit('UNIT')}
                    className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all ${
                      selectedUnit === 'UNIT' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Unidad
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedUnit('BOX')}
                    className={`px-3 py-1 text-[11px] font-black rounded-lg transition-all ${
                      selectedUnit === 'BOX' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-600'
                    }`}
                  >
                    Caja ({product.unitsPerBox || 1} u)
                  </button>
                </div>
              )}
            </div>

            {/* Quantity Controller */}
            {isAvailable && (
              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cantidad:</span>
                <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 gap-3 shadow-sm">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="font-extrabold text-sm text-slate-800 min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(availableStock, quantity + 1))}
                    disabled={quantity >= availableStock}
                    className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg disabled:opacity-30"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions Grid */}
          <div className="space-y-2">
            <button
              onClick={handleAdd}
              disabled={!isAvailable}
              className={`w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                added
                  ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                  : isAvailable
                  ? 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20 active:scale-98'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              {added ? (
                <>
                  <Check size={18} /> ¡Agregado al Carrito!
                </>
              ) : (
                <>
                  <ShoppingCart size={18} /> {isAvailable ? 'Añadir Rápido al Carrito' : 'Producto Agotado'}
                </>
              )}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSelectProduct(product);
                }}
                className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5"
              >
                <Eye size={15} /> Ver Detalle
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onConsultPharmacist) {
                    onConsultPharmacist(product);
                  }
                }}
                className="py-3 px-3 bg-teal-50 hover:bg-teal-100 text-teal-800 font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-1.5 border border-teal-200/60"
              >
                <MessageSquare size={15} className="text-teal-600" /> Consulta Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Full Image Zoom Modal */}
      {showFullImage && (
        <div 
          className="fixed inset-0 z-[80] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowFullImage(false)}
        >
          <div className="relative max-w-3xl w-full p-2 flex flex-col items-center">
            <button 
              onClick={() => setShowFullImage(false)}
              className="absolute -top-12 right-0 bg-white/20 text-white p-2 rounded-full hover:bg-white/40 transition"
            >
              <X size={24} />
            </button>
            <img 
              src={product.image} 
              alt={product.name} 
              className="max-h-[80vh] w-auto object-contain rounded-2xl bg-white p-4 shadow-2xl" 
            />
            <p className="text-white font-bold text-sm mt-4 text-center">{product.name}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductQuickPeekModal;
