import React from 'react';
import { Percent } from 'lucide-react';

interface DiscountBannerProps {
  hasDiscounts: boolean;
  onClearAllDiscounts: () => void;
}

export const DiscountBanner: React.FC<DiscountBannerProps> = ({
  hasDiscounts,
  onClearAllDiscounts,
}) => {
  return (
    <div className="bg-gradient-to-tr from-amber-50 to-orange-50 border border-amber-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 bg-amber-500 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-amber-500/10">
          <Percent size={22} />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-black text-slate-800 tracking-tight">Sistema de Descuentos & Campañas</h3>
          <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
            Administra porcentajes o valores de descuento fijos en tus productos de farmacia. 
            Visualiza en tiempo real de qué manera se ven impactados tus márgenes de ganancias frente a los costos del proveedor 
            para evitar pérdidas involuntarias.
          </p>
        </div>
      </div>

      <div className="shrink-0 flex gap-2">
        {hasDiscounts && (
          <button 
            onClick={onClearAllDiscounts}
            className="px-3.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-black rounded-xl border border-rose-100"
          >
            Retirar Todos
          </button>
        )}
      </div>
    </div>
  );
};
export default DiscountBanner;
