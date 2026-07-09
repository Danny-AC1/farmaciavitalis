import React, { useState } from 'react';
import { Heart, PhoneCall } from 'lucide-react';
import { Product } from '../../types';
import { ProtocolSection, DoseCalculator } from './first-aid';

interface FirstAidGuideProps {
  products: Product[];
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  onClose?: () => void;
}

const FirstAidGuide: React.FC<FirstAidGuideProps> = ({ products, onAddToCart, onClose }) => {
  const [activeSection, setActiveSection] = useState<'protocols' | 'calculator'>('protocols');
  const [addedItemsMap, setAddedItemsMap] = useState<Record<string, boolean>>({});

  // Handle direct cart adding with visual confirmation feedback
  const handleAddProduct = (product: Product) => {
    onAddToCart(product, 'UNIT');
    setAddedItemsMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemsMap(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-4 pb-24 px-4 md:px-8" id="first-aid-guide-container">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* --- HEADER DE LA GUÍA --- */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6" id="first-aid-guide-header">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
              <Heart size={28} className="fill-emerald-100 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full inline-block">
                Manual de Respuesta Rápida
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1.5">
                Primeros Auxilios e Incidentes Domésticos
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Aprende a actuar de inmediato ante emergencias y equipa tu botiquín ideal de forma manual, segura y sin inteligencia artificial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div className="bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-rose-700">
              <PhoneCall size={16} className="animate-bounce" />
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-rose-500 tracking-wider">Línea Nacional</p>
                <p className="text-xs font-black font-mono">Emergencias: 911</p>
              </div>
            </div>
            
            {onClose && (
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs transition-colors shadow-xs"
                id="btn-back-to-shop"
              >
                Volver a la Tienda
              </button>
            )}
          </div>
        </div>

        {/* --- SECCIÓN DE TABS --- */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 max-w-md shadow-xs" id="first-aid-tabs">
          <button
            onClick={() => setActiveSection('protocols')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeSection === 'protocols'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
            id="tab-protocols"
          >
            Guías de Respuesta Rápida
          </button>
          <button
            onClick={() => setActiveSection('calculator')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeSection === 'calculator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
            id="tab-calculator"
          >
            Calculadora de Dosis Infantil
          </button>
        </div>

        {activeSection === 'protocols' ? (
          <ProtocolSection
            products={products}
            addedItemsMap={addedItemsMap}
            handleAddProduct={handleAddProduct}
          />
        ) : (
          <DoseCalculator
            products={products}
            addedItemsMap={addedItemsMap}
            handleAddProduct={handleAddProduct}
          />
        )}

      </div>
    </div>
  );
};

export default FirstAidGuide;
export type { FirstAidGuideProps };
