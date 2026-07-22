import React from 'react';
import { Product, CartItem } from '../../types';
import { Tag, Plus, Check } from 'lucide-react';
import { getProductDiscount, getDiscountedPrice } from '../../utils/discounts';

interface RelatedProductsProps {
  currentProduct: Product;
  allProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  cart: CartItem[];
}

export const RelatedProducts: React.FC<RelatedProductsProps> = ({
  currentProduct,
  allProducts,
  onSelectProduct,
  onAddToCart,
  cart,
}) => {
  // Filter products: exclude current product, prioritize same category
  const related = React.useMemo(() => {
    if (!allProducts || allProducts.length === 0) return [];

    const sameCategory = allProducts.filter(
      (p) => p.id !== currentProduct.id && p.category === currentProduct.category
    );
    
    const otherCategories = allProducts.filter(
      (p) => p.id !== currentProduct.id && p.category !== currentProduct.category
    );

    // Combine and limit to 4 products
    const combined = [...sameCategory, ...otherCategories];
    return combined.slice(0, 4);
  }, [currentProduct, allProducts]);

  if (related.length === 0) return null;

  return (
    <div id="related-products-section" className="bg-slate-50/70 border-t border-slate-100 p-6 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-black text-slate-800 uppercase tracking-wider">
              Productos Relacionados
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Otros clientes también buscaron estos medicamentos y suplementos.
            </p>
          </div>
          <span className="text-[10px] bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
            Recomendados
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {related.map((prod) => {
            const disc = getProductDiscount(prod.id);
            const finalPrice = disc ? getDiscountedPrice(prod.price, disc) : prod.price;
            const hasOrigPrice = !!(prod.originalPrice && prod.originalPrice > finalPrice);
            const origPriceToShow = hasOrigPrice ? prod.originalPrice : (disc ? prod.price : undefined);
            const showDiscount = hasOrigPrice || !!disc;
            const discountPct = origPriceToShow && origPriceToShow > finalPrice
              ? Math.round(((origPriceToShow - finalPrice) / origPriceToShow) * 100)
              : 0;

            const isInCart = cart.some((item) => item.id === prod.id);
            const hasStock = prod.stock > 0;

            return (
              <div
                key={prod.id}
                id={`related-card-${prod.id}`}
                onClick={() => onSelectProduct(prod)}
                className="bg-white rounded-2xl border border-slate-200/60 p-3 flex flex-col justify-between hover:shadow-lg hover:border-teal-200 hover:scale-[1.02] transition-all duration-300 cursor-pointer group relative"
              >
                <div>
                  {/* Image container */}
                  <div className="h-24 md:h-28 bg-slate-50 rounded-xl overflow-hidden relative flex items-center justify-center p-2 mb-3">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="max-h-full max-w-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-500"
                    />
                    {hasStock && showDiscount && discountPct > 0 && (
                      <span className="absolute top-1.5 left-1.5 bg-rose-500 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-md shadow-sm flex items-center gap-0.5 uppercase tracking-wide">
                        <Tag className="h-2 w-2 shrink-0" />
                        -{discountPct}%
                      </span>
                    )}
                    {!hasStock && (
                      <span className="absolute inset-0 bg-white/70 flex items-center justify-center text-[10px] font-black text-rose-600 tracking-wider">
                        AGOTADO
                      </span>
                    )}
                  </div>

                  {/* Product Details */}
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block mb-0.5">
                    {prod.category}
                  </span>
                  <h4 className="text-xs font-bold text-slate-800 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors">
                    {prod.name}
                  </h4>
                  {prod.activeIngredient && (
                    <span className="text-[9px] text-slate-500 italic block mt-0.5 line-clamp-1">
                      {prod.activeIngredient}
                    </span>
                  )}
                </div>

                {/* Price and Cart controls */}
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5" onClick={(e) => e.stopPropagation()}>
                  <div className="flex flex-col">
                    <span className="text-xs md:text-sm font-black text-teal-700">
                      ${finalPrice.toFixed(2)}
                    </span>
                    {origPriceToShow && origPriceToShow > finalPrice && (
                      <span className="text-[9px] text-slate-400 line-through">
                        ${origPriceToShow.toFixed(2)}
                      </span>
                    )}
                  </div>

                  {hasStock && (
                    <button
                      id={`btn-add-related-${prod.id}`}
                      onClick={() => onAddToCart(prod, 'UNIT')}
                      className={`p-1.5 rounded-lg transition-all ${
                        isInCart
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                          : 'bg-teal-600 hover:bg-teal-700 text-white hover:scale-105 shadow-md shadow-teal-600/10'
                      }`}
                      title="Agregar al carrito"
                    >
                      {isInCart ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
