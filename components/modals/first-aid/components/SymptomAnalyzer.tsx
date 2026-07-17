import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Activity, Info, ArrowRight } from 'lucide-react';
import { Product } from '../../../../types';

interface SymptomAnalyzerProps {
  userDiscomfortQuery: string;
  setUserDiscomfortQuery: (v: string) => void;
  searchResults: {
    bestProtocolMatch: any;
    allProtocolMatches: any[];
    matchedIngredients: any[];
  } | null;
  setSelectedIncidentId: (id: string) => void;
  setActiveStepIndex: (idx: number) => void;
  products: Product[];
  addedItemsMap: Record<string, boolean>;
  handleAddProduct: (product: Product) => void;
}

export const SymptomAnalyzer: React.FC<SymptomAnalyzerProps> = ({
  userDiscomfortQuery,
  setUserDiscomfortQuery,
  searchResults,
  setSelectedIncidentId,
  setActiveStepIndex,
  products,
  addedItemsMap,
  handleAddProduct,
}) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50/50 via-white to-slate-50/50 p-6 rounded-[2rem] border border-indigo-100/50 shadow-xs space-y-4">
      <div className="space-y-1">
        <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
          Buscador Rápido de Malestares
        </span>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
          ¿Qué malestar, síntoma o incidente doméstico tienes?
        </h3>
        <p className="text-[11px] text-slate-400 font-semibold leading-normal">
          Escribe tu incidente o malestar abajo. Analizaremos tu texto clínicamente para sugerirte el protocolo correcto de primeros auxilios y los medicamentos recomendados.
        </p>
      </div>

      <div className="relative">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          id="symptom-discomfort-input"
          value={userDiscomfortQuery}
          onChange={(e) => setUserDiscomfortQuery(e.target.value)}
          placeholder="Ej: Mi hijo tiene fiebre alta, me quemé con agua hirviendo, picadura de avispa, dolor de cabeza..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:border-indigo-500 rounded-2xl text-xs font-semibold text-slate-800 shadow-xs focus:ring-2 focus:ring-indigo-100 transition-all outline-none"
        />
      </div>

      {/* --- DYNAMIC DIAGNOSTIC ANALYSIS CARD --- */}
      <AnimatePresence mode="wait">
        {userDiscomfortQuery.trim() !== '' && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900 text-white rounded-[2rem] p-6 border border-slate-800 shadow-xl space-y-5"
          >
            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                <Activity size={20} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-white">Análisis Clínico del Malestar</h4>
                <p className="text-[10px] font-bold text-slate-400 mt-0.5">Sugerencias inmediatas basadas en el vademécum de primeros auxilios</p>
              </div>
              <button 
                onClick={() => setUserDiscomfortQuery('')}
                className="ml-auto text-[9px] font-black text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                Limpiar
              </button>
            </div>

            {/* Match protocol */}
            {searchResults && searchResults.bestProtocolMatch ? (
              <div className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black uppercase tracking-wider text-teal-400 bg-teal-400/10 px-2 py-0.5 rounded-full border border-teal-500/15">
                    Protocolo Recomendado
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 font-black uppercase">Relevancia: Alta</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-teal-400/20 text-teal-300 mt-1">
                    {React.createElement(searchResults.bestProtocolMatch.icon, { size: 20 })}
                  </div>
                  <div>
                    <h5 className="text-xs font-black text-white uppercase tracking-tight">
                      {searchResults.bestProtocolMatch.title}
                    </h5>
                    <p className="text-[11px] text-slate-300 font-medium leading-relaxed mt-1">
                      {searchResults.bestProtocolMatch.shortDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => {
                      setSelectedIncidentId(searchResults.bestProtocolMatch!.id);
                      setActiveStepIndex(0);
                      const element = document.getElementById('first-aid-details-grid');
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    Cargar Guía de Acción de {searchResults.bestProtocolMatch.title} <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ) : (
              userDiscomfortQuery.trim().length > 3 && (!searchResults || !searchResults.bestProtocolMatch) && (
                <div className="bg-white/5 border border-white/10 p-4 rounded-xl text-center">
                  <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
                    No detectamos un protocolo exacto de accidente doméstico. Intenta buscar términos como <span className="text-teal-400 font-black">"fiebre"</span>, <span className="text-teal-400 font-black">"corte"</span>, <span className="text-teal-400 font-black">"quemadura"</span>, <span className="text-teal-400 font-black">"picadura"</span> o dolores corporales para guiarte mejor.
                  </p>
                </div>
              )
            )}

            {/* Match Ingredients */}
            {searchResults && searchResults.matchedIngredients.length > 0 && (
              <div className="space-y-3">
                <span className="text-[9.5px] font-black uppercase tracking-wider text-amber-400 block">
                  Sustancias de Alivio y Medicación Coherente:
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.matchedIngredients.map((ing) => {
                    const matchingProducts = products.filter(p => {
                      const nameLower = p.name.toLowerCase();
                      const descLower = p.description.toLowerCase();
                      const kw = ing.id.toLowerCase();
                      return nameLower.includes(kw) || descLower.includes(kw) || nameLower.includes(ing.name.toLowerCase().split(' ')[0]);
                    }).slice(0, 2);

                    return (
                      <div key={ing.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl flex flex-col justify-between gap-3 hover:border-white/20 transition-all">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <h6 className="text-[11px] font-black text-teal-300 uppercase tracking-tight">{ing.name}</h6>
                            <span className="text-[8px] bg-white/10 text-slate-300 border border-white/15 px-1.5 py-0.5 rounded uppercase font-black tracking-wider shrink-0">
                              {ing.category}
                            </span>
                          </div>
                          <p className="text-[10.5px] text-slate-400 font-semibold leading-relaxed">
                            <span className="text-slate-300 font-bold">Indicación General:</span> {ing.warning}
                          </p>
                          <p className="text-[10px] text-slate-300 font-medium bg-slate-800/80 p-2.5 rounded-xl border border-white/5">
                            💡 <span className="text-teal-400 font-bold uppercase text-[9px] block mb-0.5">Uso / Administración:</span>
                            {ing.administrationTip}
                          </p>
                        </div>

                        {matchingProducts.length > 0 && (
                          <div className="pt-2 border-t border-white/5 space-y-2">
                            <span className="text-[8.5px] text-slate-400 uppercase font-black block">
                              Disponibles en Almacén Vitalis:
                            </span>
                            {matchingProducts.map(prod => {
                              const isAdded = addedItemsMap[prod.id];
                              return (
                                <div key={prod.id} className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    <img 
                                      src={prod.image} 
                                      alt={prod.name} 
                                      className="h-7 w-7 rounded bg-white object-cover shrink-0" 
                                      referrerPolicy="no-referrer"
                                    />
                                    <div className="min-w-0">
                                      <p className="text-[9.5px] font-black text-slate-200 line-clamp-1">{prod.name}</p>
                                      <p className="text-[8.5px] font-mono text-teal-400 font-bold">${prod.price.toFixed(2)}</p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleAddProduct(prod)}
                                    disabled={prod.stock === 0 || isAdded}
                                    className={`px-2 py-1 rounded text-[8.5px] font-black transition-all shrink-0 ${
                                      isAdded 
                                        ? 'bg-emerald-600 text-white' 
                                        : 'bg-teal-400 hover:bg-teal-300 text-slate-950 shadow-xs'
                                    }`}
                                  >
                                    {isAdded ? 'Añadido' : 'Comprar'}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Medical Notice */}
            <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex gap-2 items-start text-[10px] text-amber-300">
              <Info size={14} className="shrink-0 mt-0.5 text-amber-400" />
              <p className="font-semibold leading-relaxed">
                <span className="font-black text-amber-400 uppercase">⚠ Aviso de Seguridad:</span> Estas sugerencias no reemplazan de ninguna forma la consulta pediátrica o prescripción de un profesional de salud habilitado. Ante dificultades graves busque ayuda médica presencial de inmediato.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
export default SymptomAnalyzer;
