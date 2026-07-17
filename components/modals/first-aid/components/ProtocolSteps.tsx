import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, ShieldAlert, Check, Plus } from 'lucide-react';
import { Product } from '../../../../types';

interface ProtocolStepsProps {
  currentProtocol: any;
  activeStepIndex: number;
  setActiveStepIndex: (idx: number) => void;
  products: Product[];
  addedItemsMap: Record<string, boolean>;
  handleAddProduct: (product: Product) => void;
}

export const ProtocolSteps: React.FC<ProtocolStepsProps> = ({
  currentProtocol,
  activeStepIndex,
  setActiveStepIndex,
  products,
  addedItemsMap,
  handleAddProduct,
}) => {
  const IconComponent = currentProtocol.icon;

  return (
    <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
      {/* Header inside manual */}
      <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
        <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${currentProtocol.colorClass}`}>
          <IconComponent size={22} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
            Protocolo: {currentProtocol.title}
          </h3>
          <p className="text-xs text-slate-400 font-semibold mt-0.5">{currentProtocol.shortDesc}</p>
        </div>
      </div>

      {/* Steps interactive layout */}
      <div className="space-y-4">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
          Guía Paso a Paso para la Emergencia
        </span>

        {/* Active Step Display */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentProtocol.id}-${activeStepIndex}`}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="bg-slate-50 p-5 rounded-2xl border border-slate-100/50 space-y-2 relative"
          >
            <span className="absolute top-4 right-4 text-[10px] font-mono font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
              Paso {activeStepIndex + 1} de {currentProtocol.steps.length}
            </span>

            <h4 className="text-xs font-black text-slate-800 uppercase pr-16">
              {currentProtocol.steps[activeStepIndex].title}
            </h4>
            <p className="text-xs font-semibold text-slate-500 leading-relaxed pt-1">
              {currentProtocol.steps[activeStepIndex].description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Step Navigation Dots / Buttons */}
        <div className="grid grid-cols-3 gap-2">
          {currentProtocol.steps.map((step: any, idx: number) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`py-2 px-3 rounded-xl border text-left transition-all ${
                activeStepIndex === idx
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-800 shadow-2xs'
                  : 'bg-white border-slate-100 text-slate-500 hover:bg-slate-50/50'
              }`}
            >
              <span className="text-[9px] font-black uppercase tracking-wider block">Paso {idx + 1}</span>
              <span className="text-[10px] font-bold line-clamp-1 mt-0.5">{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* --- MEDICACIONES COHERENTES DEL INCIDENTE --- */}
      <div className="space-y-4 border-t border-slate-100 pt-5">
        <div>
          <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full uppercase tracking-wider inline-block">
            Pautas de Medicación Coherente
          </span>
          <h4 className="text-xs font-black text-slate-800 uppercase mt-1.5">
            Fármacos e Insumos Sugeridos para Tratamiento
          </h4>
          <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
            Uso recomendado por profesionales médicos para aliviar o mitigar este incidente doméstico:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentProtocol.coherentMedications?.map((med: any, idx: number) => {
            const matchedStoreProducts = products.filter(p => {
              const nameLower = p.name.toLowerCase();
              const descLower = p.description.toLowerCase();
              return nameLower.includes(med.productKeyword) || descLower.includes(med.productKeyword);
            }).slice(0, 1);

            return (
              <div 
                key={idx} 
                className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/70 hover:border-indigo-100 transition-colors flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h5 className="text-[11px] font-black text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                      {med.name}
                    </h5>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[10px] text-slate-500 font-medium">
                      <span className="font-bold text-slate-700">Propósito:</span> {med.purpose}
                    </p>
                    <p className="text-[10px] text-slate-500 font-medium leading-relaxed bg-white p-2 rounded-lg border border-slate-100">
                      📢 <span className="font-bold text-slate-700">Aplicación/Dosis:</span> {med.dosageInstructions}
                    </p>
                  </div>

                  <div className="text-[9.5px] text-rose-600/90 font-bold bg-rose-50/30 p-2 rounded-lg border border-rose-100/50">
                    ⚠ <span className="uppercase text-rose-700 font-black">Precaución:</span> {med.caution}
                  </div>
                </div>

                {/* Store matcher for this specific medication */}
                {matchedStoreProducts.map(prod => {
                  const isAdded = addedItemsMap[prod.id];
                  return (
                    <div 
                      key={prod.id} 
                      className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white border border-slate-100 mt-2 hover:border-slate-200 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img 
                          src={prod.image} 
                          alt={prod.name} 
                          className="h-7 w-7 rounded bg-slate-50 border border-slate-100 object-cover shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-700 line-clamp-1">{prod.name}</p>
                          <p className="text-[9px] font-mono text-slate-500 font-semibold">${prod.price.toFixed(2)}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddProduct(prod)}
                        disabled={prod.stock === 0 || isAdded}
                        className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 shrink-0 ${
                          isAdded 
                            ? 'bg-emerald-600 text-white shadow-xs' 
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                        }`}
                      >
                        {isAdded ? <Check size={9} /> : <Plus size={9} />}
                        {isAdded ? 'Añadido' : 'Comprar'}
                      </button>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Warning box: What NOT to do */}
      <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-3">
        <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block flex items-center gap-1.5">
          <ShieldAlert size={14} /> ¡Atención! Qué NO hacer bajo ninguna circunstancia
        </span>
        <ul className="space-y-2">
          {currentProtocol.dontDo.map((dont: string, idx: number) => (
            <li key={idx} className="text-xs font-semibold text-rose-700/90 flex gap-2 items-start">
              <span className="text-rose-500 mt-0.5">•</span>
              <span>{dont}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* When to go to emergency / doctor */}
      <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-3">
        <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block flex items-center gap-1.5">
          <Info size={14} /> Cuándo buscar asistencia médica profesional
        </span>
        <ul className="space-y-2">
          {currentProtocol.whenToCallDoc.map((when: string, idx: number) => (
            <li key={idx} className="text-xs font-semibold text-amber-800/90 flex gap-2 items-start">
              <span className="text-amber-500 mt-0.5">•</span>
              <span>{when}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
export default ProtocolSteps;
