
import React, { useState, useEffect, useRef } from 'react';
import { Product, CartItem } from '../../types';
import { X, ShoppingCart, Package, CheckCircle, AlertTriangle, Bell, RefreshCw, Plus, Share2, Tag, ShieldCheck, Truck } from 'lucide-react';
import { addStockAlertDB, addSubscriptionDB, streamSubscriptions, addEmailLogDB, getEmailTemplateHTML } from '../../services/db';
import { getProductDiscount, getDiscountedPrice, subscribeToDiscounts, ActiveDiscount } from '../../utils/discounts';
import ShareSheet from './ShareSheet';
import { RelatedProducts } from './RelatedProducts';

interface ProductDetailProps {
  product: Product;
  cart: CartItem[];
  products?: Product[]; // Full list for suggestions
  currentUserEmail?: string;
  onClose: () => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  onSelectProduct?: (product: Product) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ product, cart, products = [], currentUserEmail, onClose, onAddToCart, onSelectProduct }) => {
  const [emailAlert, setEmailAlert] = useState(currentUserEmail || '');
  const modalContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to top when active product changes
  useEffect(() => {
    if (modalContainerRef.current) {
      modalContainerRef.current.scrollTop = 0;
    }
  }, [product.id]);

  const [alertSent, setAlertSent] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [discount, setDiscount] = useState<ActiveDiscount | undefined>(undefined);
  
  // Verificar si ya está suscrito a este producto
  useEffect(() => {
    if (!currentUserEmail) return;
    
    const unsub = streamSubscriptions((subs) => {
      const exists = subs.find(s => s.userId === currentUserEmail && s.productId === product.id && s.active);
      setIsSubscribed(!!exists);
    });
    
    return () => unsub();
  }, [currentUserEmail, product.id]);

  // Cargar y suscribir a descuentos activos
  useEffect(() => {
    setDiscount(getProductDiscount(product.id));
    return subscribeToDiscounts(() => {
      setDiscount(getProductDiscount(product.id));
    });
  }, [product.id]);

  const getReservedStock = () => {
    return cart.reduce((acc, item) => {
      if (item.id !== product.id) return acc;
      const unitsPerItem = item.selectedUnit === 'BOX' ? (item.unitsPerBox || 1) : 1;
      return acc + (item.quantity * unitsPerItem);
    }, 0);
  };

  const reserved = getReservedStock();
  const available = Math.max(0, product.stock - reserved);
  const hasBox = (product.unitsPerBox ?? 0) > 1;
  const unitsPerBox = product.unitsPerBox ?? 1;

  const displayBoxPrice = product.publicBoxPrice || product.boxPrice || 0;
  
  const finalPrice = discount ? getDiscountedPrice(product.price, discount) : product.price;
  const hasOriginalPrice = !!(product.originalPrice && product.originalPrice > finalPrice);
  const originalPriceToShow = hasOriginalPrice ? product.originalPrice : (discount ? product.price : undefined);
  const showDiscountTag = hasOriginalPrice || !!discount;
  const finalDiscountPct = originalPriceToShow && originalPriceToShow > finalPrice
    ? Math.round(((originalPriceToShow - finalPrice) / originalPriceToShow) * 100)
    : 0;

  const handleStockAlert = async () => {
      if (!emailAlert) return alert("Ingresa tu correo");
      setIsProcessing(true);
      try {
          await addStockAlertDB(emailAlert, product.id);
          
          // Registrar correo de confirmación de registro de alerta de stock
          const subject = `[Farmacia Vitalis] Alerta de Stock Registrada: ${product.name}`;
          const emailContent = `
            <p>Estimado Cliente,</p>
            <p>Hemos registrado correctamente su solicitud para recibir un aviso tan pronto como tengamos stock disponible del producto: <strong>${product.name}</strong>.</p>
            <p>Le notificaremos de forma automática a este correo electrónico desde nuestra cuenta oficial: <strong style="color: #0d9488;">farmaciavitalis@outlook.es</strong>.</p>
            <p>Agradecemos su preferencia y confianza en Farmacia Vitalis.</p>
          `;
          
          const htmlBody = getEmailTemplateHTML(
            '¡Alerta de Stock Registrada!',
            emailContent
          );
          
          await addEmailLogDB({
            sender: 'farmaciavitalis@outlook.es',
            recipient: emailAlert,
            subject,
            body: htmlBody,
            timestamp: new Date().toISOString(),
            status: 'ENVIADO',
            type: 'CONFIRMACION_ALERTA',
            productName: product.name
          });
          
          setAlertSent(true);
      } catch (e) {
          console.error("Error al registrar alerta:", e);
          alert("Hubo un error al guardar la alerta.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleSubscribe = async () => {
      if (!currentUserEmail) {
          alert("Debes iniciar sesión para suscribirte a planes de salud recurrentes.");
          return;
      }
      
      if (isSubscribed) {
          alert("Ya tienes una suscripción activa para este producto. Puedes gestionarla desde tu perfil o contactando a soporte.");
          return;
      }

      setIsProcessing(true);
      try {
          // Suscripción estándar de 30 días
          await addSubscriptionDB(currentUserEmail, product.id, product.name, 30);
          alert(`¡Suscripción exitosa! Te enviaremos ${product.name} cada 30 días automáticamente.`);
      } catch (error) {
          console.error("Error al suscribir:", error);
          alert("Hubo un problema al procesar tu suscripción.");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleShare = () => {
    setIsShareOpen(true);
  };

  return (
    <>
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200 p-0 md:p-4">
      <div 
        ref={modalContainerRef}
        className="bg-white w-full h-full md:h-auto md:max-h-[90vh] md:max-w-4xl md:rounded-2xl rounded-none shadow-2xl overflow-y-auto flex flex-col relative animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 custom-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Absolute Header with close and share buttons */}
        <div className="absolute top-5 right-5 md:top-4 md:right-4 z-10 flex gap-2">
          <button 
            onClick={handleShare} 
            className="p-2 rounded-full transition-all shadow-sm backdrop-blur-sm flex items-center gap-1 bg-white/80 hover:bg-white text-gray-500 hover:text-teal-600 hover:scale-105 border border-slate-100"
            title="Compartir Producto"
          >
            <Share2 className="h-5 w-5" />
            <span className="text-[10px] font-bold pr-1">Compartir</span>
          </button>
          <button onClick={onClose} className="bg-white/80 p-2 rounded-full hover:bg-white text-gray-500 hover:text-red-500 transition-colors shadow-sm backdrop-blur-sm border border-slate-100">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Main Product Detail Grid (Columns) */}
        <div className="flex flex-col md:flex-row w-full border-b border-slate-100">
          
          {/* Left panel: Image */}
          <div className="w-full md:w-1/2 bg-slate-50 relative h-72 md:h-auto md:min-h-[480px] shrink-0 flex items-center justify-center p-8">
            {available > 0 && showDiscountTag && finalDiscountPct > 0 && (
               <div className="absolute top-4 left-4 z-10">
                   <span className="bg-gradient-to-r from-red-500 to-amber-500 text-white font-extrabold text-xs md:text-sm px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 uppercase tracking-wider animate-pulse">
                       <Tag className="h-4 w-4" />
                       -{finalDiscountPct}%
                   </span>
               </div>
            )}
            <img src={product.image} alt={product.name} className="max-h-64 md:max-h-[380px] max-w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-500" />
            {available <= 0 && (
               <div className="absolute inset-0 bg-white/60 flex items-center justify-center backdrop-blur-[1px]">
                   <span className="bg-red-500 text-white px-6 py-2 font-bold rounded-full text-lg shadow-lg transform -rotate-12 border-2 border-white">AGOTADO</span>
               </div>
            )}
          </div>

          {/* Right panel: Content and Buy Actions */}
          <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between bg-white">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-wider mb-3">{product.category}</span>
              <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 leading-tight">{product.name}</h2>
              <div className="flex items-center gap-2 mb-4">
                {available > 0 ? (
                  <span className="flex items-center text-sm font-bold text-green-600 bg-green-50 px-2.5 py-1 rounded-md"><CheckCircle className="h-4 w-4 mr-1.5" /> Disponible: {available} unid.</span>
                ) : (
                  <span className="flex items-center text-sm font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md"><AlertTriangle className="h-4 w-4 mr-1.5" /> Sin Stock</span>
                )}
              </div>

              <p className="text-gray-600 text-sm md:text-base leading-relaxed mb-6">{product.description}</p>

              {/* Technical Specifications Grid */}
              <div className="border-t border-slate-100 pt-5 mt-5 space-y-3.5">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Ficha de Información</h4>
                <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-100/50">
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Principio Activo</span>
                  <span className="text-xs font-black text-slate-800">{product.activeIngredient || 'No especificado'}</span>
                </div>
              </div>
            </div>

            {/* Purchase actions */}
            {available > 0 ? (
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-xl hover:border-teal-300 transition-colors bg-gray-50/50">
                    <div className="flex justify-between items-center mb-3">
                      <div>
                        <span className="block text-xs font-bold text-gray-400 uppercase">Precio Unitario</span>
                        {originalPriceToShow && originalPriceToShow > finalPrice ? (
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-teal-700">${finalPrice.toFixed(2)}</span>
                            <span className="text-sm text-gray-400 line-through">${originalPriceToShow.toFixed(2)}</span>
                            <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-100 px-1.5 py-0.5 rounded">-{finalDiscountPct}%</span>
                          </div>
                        ) : (
                          <span className="text-2xl font-black text-teal-700">${product.price.toFixed(2)}</span>
                        )}
                      </div>
                    </div>
                    <button onClick={() => onAddToCart(product, 'UNIT')} className="w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all duration-150 active:scale-98"><ShoppingCart className="h-5 w-5" /> Agregar Unidad</button>
                  </div>

                  {hasBox && displayBoxPrice > 0 && (
                      <div className="p-4 border border-blue-200 rounded-xl hover:border-blue-400 transition-colors bg-blue-50/50">
                          <div className="flex justify-between items-center mb-3">
                              <div>
                                  <span className="block text-xs font-bold text-blue-400 uppercase flex items-center gap-1"><Package className="h-3 w-3"/> Caja x{unitsPerBox} (Ahorro)</span>
                                  <span className="text-2xl font-black text-blue-700">${displayBoxPrice.toFixed(2)}</span>
                              </div>
                          </div>
                          <button 
                              onClick={() => onAddToCart(product, 'BOX')} 
                              disabled={available < unitsPerBox}
                              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-150 active:scale-98 ${available >= unitsPerBox ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
                          >
                              <Plus className="h-5 w-5" /> Agregar Caja
                          </button>
                      </div>
                  )}

                  <button 
                    onClick={handleSubscribe} 
                    disabled={isProcessing}
                    className={`w-full py-3 border-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 ${
                      isSubscribed 
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50' 
                      : 'border-teal-600 text-teal-700 hover:bg-teal-50'
                    }`}
                  >
                     {isProcessing ? (
                       <RefreshCw size={18} className="animate-spin"/>
                     ) : isSubscribed ? (
                       <><CheckCircle size={18}/> Suscripción Activa</>
                     ) : (
                       <><RefreshCw size={18}/> Suscribirse (Envío cada 30 días)</>
                     )} 
                  </button>
                  
                  {isSubscribed && (
                    <p className="text-[10px] text-center text-emerald-600 font-bold uppercase tracking-tight">
                      Recibirás este producto mensualmente de forma automática.
                    </p>
                  )}
                </div>
            ) : (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h4 className="font-bold text-gray-800 mb-2 flex items-center gap-2"><Bell size={18}/> Avísame cuando haya stock</h4>
                    {!alertSent ? (
                        <div className="flex gap-2">
                            <input className="border p-2 rounded text-sm flex-grow bg-white" placeholder="Tu correo..." value={emailAlert} onChange={e => setEmailAlert(e.target.value)}/>
                            <button onClick={handleStockAlert} className="bg-gray-800 text-white px-3 py-2 rounded text-sm font-bold">Enviar</button>
                        </div>
                    ) : (
                        <p className="text-sm text-green-600 font-bold">¡Listo! Te avisaremos.</p>
                    )}
                </div>
            )}

            {/* Quality & Trust badges */}
            <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-5 mt-6">
              <div className="flex flex-col items-center text-center">
                <ShieldCheck className="h-5 w-5 text-teal-600 mb-1" />
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">100% Original</span>
                <span className="text-[8px] text-slate-400 leading-tight">Medicamentos certificados</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Truck className="h-5 w-5 text-teal-600 mb-1" />
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">Envío Seguro</span>
                <span className="text-[8px] text-slate-400 leading-tight">Cadena de frío óptima</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <CheckCircle className="h-5 w-5 text-teal-600 mb-1" />
                <span className="text-[9px] font-black text-slate-800 uppercase tracking-tight">Atención 24/7</span>
                <span className="text-[8px] text-slate-400 leading-tight">Soporte farmacéutico</span>
              </div>
            </div>

          </div>
        </div>

        {/* RELATED PRODUCTS SECTION */}
        <RelatedProducts 
          currentProduct={product}
          allProducts={products}
          onSelectProduct={(selectedProd) => {
            if (onSelectProduct) {
              onSelectProduct(selectedProd);
            }
          }}
          onAddToCart={onAddToCart}
          cart={cart}
        />

      </div>
    </div>

    <ShareSheet 
      product={product}
      discountedPrice={finalPrice}
      isOpen={isShareOpen}
      onClose={() => setIsShareOpen(false)}
    />
    </>
  );
};

export default ProductDetail;
