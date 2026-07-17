import React from 'react';
import { Archive, ShoppingCart, Check, Plus, CheckSquare, Square } from 'lucide-react';
import { Product } from '../../../../types';
import { BOTIQUIN_CHECKLIST_ITEMS } from '../constants';

interface ProtocolBotiquinProps {
  currentProtocol: any;
  recommendedProducts: Product[];
  addedItemsMap: Record<string, boolean>;
  handleAddProduct: (product: Product) => void;
  checklistInventoryMatches: any[];
  checkedChecklistItems: Record<string, boolean>;
  toggleChecklistItem: (itemId: string) => void;
}

export const ProtocolBotiquin: React.FC<ProtocolBotiquinProps> = ({
  currentProtocol,
  recommendedProducts,
  addedItemsMap,
  handleAddProduct,
  checklistInventoryMatches,
  checkedChecklistItems,
  toggleChecklistItem,
}) => {
  return (
    <div className="lg:col-span-4 space-y-6">
      {/* MATCHED INVENTORY SECTION */}
      <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
        <div>
          <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
            Equipamiento Sugerido
          </span>
          <h4 className="text-xs font-black text-slate-800 mt-1.5 uppercase">Botiquín para {currentProtocol.title}</h4>
          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
            Productos reales en almacén que sirven para tratar este incidente doméstico:
          </p>
        </div>

        {recommendedProducts.length === 0 ? (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center space-y-2">
            <Archive size={24} className="mx-auto text-slate-300" />
            <p className="text-[10px] font-semibold text-slate-500">No encontramos productos listos con estas características en stock.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendedProducts.map((prod) => {
              const isAdded = addedItemsMap[prod.id];
              const isLowStock = prod.stock <= 5;

              return (
                <div 
                  key={prod.id} 
                  className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between gap-3 hover:border-slate-200 transition-colors"
                >
                  <div className="flex gap-2">
                    <img 
                      src={prod.image} 
                      alt={prod.name} 
                      className="h-10 w-10 rounded-lg bg-white border border-slate-100 object-cover shrink-0"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h5 className="text-[11.5px] font-black text-slate-800 line-clamp-1">{prod.name}</h5>
                      <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1 py-0.2 rounded-md uppercase">
                        {prod.category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
                    <div>
                      <span className="text-[10.5px] font-black font-mono text-slate-700">${prod.price.toFixed(2)}</span>
                      {prod.stock === 0 ? (
                        <span className="text-[9px] text-rose-500 font-bold block">Agotado</span>
                      ) : isLowStock ? (
                        <span className="text-[9px] text-amber-500 font-bold block">Poco stock ({prod.stock})</span>
                      ) : (
                        <span className="text-[9px] text-emerald-600 font-bold block">En stock</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddProduct(prod)}
                      disabled={prod.stock === 0 || isAdded}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 shadow-xs ${
                        prod.stock === 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={11} /> ¡Añadido!
                        </>
                      ) : (
                        <>
                          <ShoppingCart size={11} /> Añadir
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* GENERAL BASIC EMERGENCY KIT CHECKLIST */}
      <div className="bg-slate-900 text-white p-5 rounded-[2rem] border border-slate-800 shadow-md space-y-4 relative overflow-hidden">
        <div className="space-y-1 relative z-10">
          <span className="text-[9px] font-black text-amber-400 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit">
            Autodiagnóstico de Botiquín
          </span>
          <h4 className="text-xs font-black uppercase tracking-tight text-white mt-1.5">Completa tu Botiquín Básico</h4>
          <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
            Verifica qué elementos esenciales tienes en casa y equipa los que te hacen falta:
          </p>
        </div>

        {/* Checklist list */}
        <div className="space-y-2.5 relative z-10">
          {checklistInventoryMatches.map((item) => {
            const isChecked = checkedChecklistItems[item.id];
            
            return (
              <div 
                key={item.id}
                className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
              >
                <button 
                  type="button"
                  onClick={() => toggleChecklistItem(item.id)}
                  className="flex items-center gap-2.5 text-left text-[11px] font-bold text-slate-100"
                >
                  {isChecked ? (
                    <CheckSquare size={15} className="text-emerald-400 shrink-0" />
                  ) : (
                    <Square size={15} className="text-slate-500 shrink-0 group-hover:text-slate-300" />
                  )}
                  <span className={isChecked ? 'line-through text-slate-400 font-medium' : ''}>
                    {item.name}
                  </span>
                </button>

                {/* Buy missing button if matched in catalog */}
                {!isChecked && item.matchedProduct && (
                  <button
                    onClick={() => handleAddProduct(item.matchedProduct!)}
                    className="px-2 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 text-[9px] font-black transition-all flex items-center gap-1 shrink-0 shadow-sm"
                    title="Comprar repuesto oficial"
                  >
                    <Plus size={10} /> Añadir
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress counter */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-slate-300 relative z-10">
          <span>Tu nivel de preparación:</span>
          <span className="text-teal-400 font-mono">
            {Object.values(checkedChecklistItems).filter(Boolean).length} / {BOTIQUIN_CHECKLIST_ITEMS.length} Listos
          </span>
        </div>

        {/* Decorative cross symbol */}
        <div className="absolute -right-6 -bottom-6 text-white/5 pointer-events-none">
          <Plus size={100} strokeWidth={6} />
        </div>
      </div>
    </div>
  );
};
export default ProtocolBotiquin;
