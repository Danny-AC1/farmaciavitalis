import React from 'react';
import { FileText, Coins, Truck, Check } from 'lucide-react';

export type ProductFormTab = 'BASIC' | 'PRICING' | 'LOGISTICS';

interface ProductFormTabsProps {
  activeTab: ProductFormTab;
  onTabChange: (tab: ProductFormTab) => void;
  isStepValid: (tab: ProductFormTab) => boolean;
}

export const ProductFormTabs: React.FC<ProductFormTabsProps> = ({
  activeTab,
  onTabChange,
  isStepValid,
}) => {
  const steps = [
    {
      key: 'BASIC' as const,
      label: '1. Datos Clínicos',
      desc: 'Nombre, principio, clase',
      icon: FileText,
      color: 'text-teal-600 border-teal-600',
    },
    {
      key: 'PRICING' as const,
      label: '2. Precios & Costos',
      desc: 'Ganancia, margen, simulador',
      icon: Coins,
      color: 'text-blue-600 border-blue-600',
    },
    {
      key: 'LOGISTICS' as const,
      label: '3. Logística & Fotos',
      desc: 'Código, vencimiento, imagen',
      icon: Truck,
      color: 'text-purple-600 border-purple-600',
    },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-2 border-b border-slate-100 pb-4" id="product-form-tabs">
      {steps.map((step) => {
        const isActive = activeTab === step.key;
        const isValid = isStepValid(step.key);
        const StepIcon = step.icon;

        return (
          <button
            key={step.key}
            type="button"
            onClick={() => onTabChange(step.key)}
            className={`flex-1 text-left p-4 rounded-3xl border transition-all duration-200 flex items-center justify-between gap-4 ${
              isActive
                ? 'bg-slate-900 border-slate-900 text-white shadow-md scale-[1.01]'
                : 'bg-white border-slate-100 hover:border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
            id={`tab-btn-${step.key}`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`p-2.5 rounded-xl border shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-slate-50 border-slate-150 text-slate-400'
                }`}
              >
                <StepIcon size={16} />
              </div>
              <div className="min-w-0">
                <span className={`text-[10px] font-black uppercase tracking-widest block ${isActive ? 'text-teal-400' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                <span className={`text-[11px] font-semibold block truncate ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                  {step.desc}
                </span>
              </div>
            </div>

            {/* Completeness checkmark */}
            {isValid && (
              <div className={`p-1.5 rounded-full flex items-center justify-center shrink-0 border ${
                isActive 
                  ? 'bg-teal-500 border-teal-400 text-white' 
                  : 'bg-emerald-50 border-emerald-100 text-emerald-600'
              }`}>
                <Check size={11} strokeWidth={4} />
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
