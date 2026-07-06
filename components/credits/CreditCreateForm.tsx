import React from 'react';
import { Product, CartItem } from '../../types';
import { 
  User as UserIcon, 
  ShoppingCart, 
  Search, 
  Bookmark, 
  Minus, 
  Plus, 
  DollarSign 
} from 'lucide-react';

interface CreditCreateFormProps {
  debtorName: string;
  setDebtorName: (val: string) => void;
  debtorPhone: string;
  setDebtorPhone: (val: string) => void;
  debtorAddress: string;
  setDebtorAddress: (val: string) => void;
  initialAbono: string;
  setInitialAbono: (val: string) => void;
  initialAbonoMethod: 'CASH' | 'TRANSFER';
  setInitialAbonoMethod: (val: 'CASH' | 'TRANSFER') => void;
  creditCart: CartItem[];
  setCreditCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  productSearch: string;
  setProductSearch: (val: string) => void;
  filteredProducts: Product[];
  addToCreditCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  updateCartQty: (productId: string, unitType: 'UNIT' | 'BOX', delta: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  cartTotal: number;
}

export const CreditCreateForm: React.FC<CreditCreateFormProps> = ({
  debtorName,
  setDebtorName,
  debtorPhone,
  setDebtorPhone,
  debtorAddress,
  setDebtorAddress,
  initialAbono,
  setInitialAbono,
  initialAbonoMethod,
  setInitialAbonoMethod,
  creditCart,
  setCreditCart,
  productSearch,
  setProductSearch,
  filteredProducts,
  addToCreditCart,
  updateCartQty,
  onSubmit,
  cartTotal,
}) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
      
      {/* Columna Izquierda: Datos de la Persona y Agregar Productos */}
      <div className="lg:col-span-7 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
          <UserIcon size={16} className="text-teal-600" />
          1. Datos de la Persona que lleva el Medicamento
        </h4>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nombre Completo *</label>
              <input
                type="text"
                required
                placeholder="Ej: Juan Pérez"
                value={debtorName}
                onChange={(e) => setDebtorName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Teléfono / Celular</label>
              <input
                type="text"
                placeholder="Ej: 0991234567"
                value={debtorPhone}
                onChange={(e) => setDebtorPhone(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">Nota de Ubicación / Dirección (Opcional)</label>
            <input
              type="text"
              placeholder="Ej: Machalilla, Barrio Central, diagonal al parque"
              value={debtorAddress}
              onChange={(e) => setDebtorAddress(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Abono Inicial Opcional */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-teal-50/20 p-4 rounded-2xl border border-teal-100/50">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">Abono Inicial (Opcional)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-teal-600 font-bold text-xs">$</span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={initialAbono}
                  onChange={(e) => setInitialAbono(e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-white border border-teal-100 rounded-xl text-xs font-bold text-slate-700 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-teal-800 uppercase tracking-wider block">Método de Abono Inicial</label>
              <div className="flex bg-slate-100 p-1 rounded-xl h-[42px] items-center">
                {(['CASH', 'TRANSFER'] as const).map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setInitialAbonoMethod(method)}
                    className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all h-full ${
                      initialAbonoMethod === method
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {method === 'CASH' ? '💵 Efectivo' : '🏦 Transf.'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Buscador e Incorporación de Productos */}
          <div className="pt-4 border-t border-slate-100 space-y-3">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <ShoppingCart size={16} className="text-teal-600" />
              2. Buscar y Añadir Medicamentos
            </h4>

            <div className="relative">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Buscar producto por nombre, barra o activo..."
                className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-teal-500 rounded-xl text-xs font-semibold text-slate-700 placeholder-slate-400 focus:outline-none transition-colors"
              />
            </div>

            {/* Resultados de búsqueda rápidos */}
            {filteredProducts.length > 0 && (
              <div className="bg-slate-50 border border-slate-150 rounded-2xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto shadow-inner">
                {filteredProducts.map((p) => (
                  <div key={p.id} className="p-3 hover:bg-slate-100/50 flex justify-between items-center transition-colors">
                    <div className="flex-1 pr-4">
                      <span className="text-xs font-bold text-slate-800 block line-clamp-1">{p.name}</span>
                      <span className="text-[9px] text-slate-400 block">Stock: {p.stock} uds. | PA: {p.activeIngredient || 'N/A'}</span>
                    </div>

                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => addToCreditCart(p, 'UNIT')}
                        disabled={p.stock <= 0}
                        className="bg-white border border-slate-200/80 hover:bg-teal-50 hover:border-teal-300 text-[10.5px] font-black text-slate-600 hover:text-teal-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        + Unidad (${p.price.toFixed(2)})
                      </button>
                      {p.unitsPerBox && p.unitsPerBox > 1 && (
                        <button
                          type="button"
                          onClick={() => addToCreditCart(p, 'BOX')}
                          disabled={p.stock < (p.unitsPerBox || 1)}
                          className="bg-white border border-slate-200/80 hover:bg-teal-50 hover:border-teal-300 text-[10.5px] font-black text-slate-600 hover:text-teal-600 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          + Caja (${(p.publicBoxPrice || p.boxPrice || 0).toFixed(2)})
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Botón de Enviar final */}
          <div className="pt-6 border-t border-slate-100">
            <button
              type="submit"
              disabled={creditCart.length === 0 || !debtorName.trim()}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-xl text-xs font-black shadow-md shadow-teal-600/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <Bookmark size={15} />
              Confirmar y Registrar Crédito
            </button>
          </div>
        </form>
      </div>

      {/* Columna Derecha: Detalle de Medicamentos Agregados (El Carrito del Crédito) */}
      <div className="lg:col-span-5 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col justify-between">
        <div className="space-y-4">
          <h4 className="font-extrabold text-slate-800 text-sm border-b border-slate-100 pb-3 flex items-center justify-between">
            <span>Medicamentos Seleccionados</span>
            <span className="text-[10px] bg-teal-50 text-teal-600 px-2 py-0.5 rounded-full font-black">
              {creditCart.reduce((sum, i) => sum + i.quantity, 0)} items
            </span>
          </h4>

          {creditCart.length === 0 ? (
            <div className="py-12 text-center">
              <ShoppingCart size={32} className="mx-auto text-slate-200 mb-2" />
              <p className="text-xs text-slate-400 font-bold">No has añadido productos aún.</p>
              <p className="text-[10px] text-slate-300 mt-1">Busca arriba y añade medicamentos.</p>
            </div>
          ) : (
            <div className="space-y-3 divide-y divide-slate-100 max-h-[22rem] overflow-y-auto pr-1">
              {creditCart.map((item, idx) => {
                const isBox = item.selectedUnit === 'BOX';
                const itemPrice = isBox ? (item.publicBoxPrice || item.boxPrice || 0) : item.price;
                return (
                  <div key={idx} className="pt-3 flex items-start justify-between gap-3 text-xs">
                    <div className="flex-1 space-y-0.5">
                      <span className="font-bold text-slate-800 block line-clamp-1">{item.name}</span>
                      <span className="text-[9.5px] text-slate-400 font-bold block">
                        {isBox ? 'Venta por Caja' : 'Venta por Unidad'} • ${itemPrice.toFixed(2)} c/u
                      </span>
                    </div>

                    {/* Modificador de Cantidad */}
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, item.selectedUnit, -1)}
                        className="h-6 w-6 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                      >
                        <Minus size={11} />
                      </button>
                      <span className="w-5 text-center font-bold text-slate-700">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, item.selectedUnit, 1)}
                        className="h-6 w-6 rounded bg-slate-50 border border-slate-200 text-slate-500 hover:bg-slate-100 flex items-center justify-center"
                      >
                        <Plus size={11} />
                      </button>
                    </div>

                    {/* Subtotal y Eliminar */}
                    <div className="text-right pl-2 space-y-1">
                      <span className="font-mono font-bold text-slate-800 block">
                        ${(itemPrice * item.quantity).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCreditCart(prev => prev.filter((_, i) => i !== idx))}
                        className="text-[10px] text-rose-500 hover:underline font-bold"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Total acumulado */}
        {creditCart.length > 0 && (
          <div className="mt-6 border-t border-slate-100 pt-4 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
              <span>Subtotal:</span>
              <span className="font-mono">${cartTotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-dashed border-slate-200 pt-2 font-black text-slate-800">
              <span className="flex items-center gap-1 text-teal-600">
                <DollarSign size={16} /> Total Deuda:
              </span>
              <span className="text-lg font-mono">${cartTotal.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
