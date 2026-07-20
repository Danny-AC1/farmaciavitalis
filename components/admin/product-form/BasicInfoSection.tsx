import React from 'react';
import { FileText, Tag, Shield, HelpCircle, Key } from 'lucide-react';
import { Category } from '../../../types';

interface BasicInfoSectionProps {
  prodName: string;
  setProdName: (s: string) => void;
  prodCat: string;
  setProdCat: (s: string) => void;
  prodActiveIngredient: string;
  setProdActiveIngredient: (s: string) => void;
  prodDesc: string;
  setProdDesc: (s: string) => void;
  prodKeywords: string;
  setProdKeywords: (s: string) => void;
  categories: Category[];
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  prodName,
  setProdName,
  prodCat,
  setProdCat,
  prodActiveIngredient,
  setProdActiveIngredient,
  prodDesc,
  setProdDesc,
  prodKeywords,
  setProdKeywords,
  categories,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" id="product-form-basic-info">
      {/* Visual Section Indicator */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
        <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100 text-teal-600">
          <FileText size={18} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Información del Medicamento</h4>
          <p className="text-[11px] text-slate-500 font-semibold">
            Define los datos identificatorios de catálogo, principio activo y descriptivos para la consulta rápida.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Product Name */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Nombre Comercial <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              required
              className="w-full bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all uppercase placeholder:normal-case"
              value={prodName}
              onChange={(e) => setProdName(e.target.value)}
              placeholder="Ej: APRONAX 550MG"
              id="input-prod-name"
            />
          </div>
          <span className="text-[9px] text-slate-400 font-medium block">Nombre de marca visible para los clientes y cajeros.</span>
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
            Categoría del Catálogo <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              required
              className="w-full bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all appearance-none cursor-pointer"
              value={prodCat}
              onChange={(e) => setProdCat(e.target.value)}
              id="select-prod-cat"
            >
              <option value="">Seleccionar categoría...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name} className="uppercase font-bold text-xs text-slate-700">
                  {c.name.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <Tag size={14} />
            </div>
          </div>
          <span className="text-[9px] text-slate-400 font-medium block">Ubicación del producto en la estantería digital.</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Active Ingredient */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest flex items-center gap-1">
            <Shield size={12} className="text-teal-600" /> Principio Activo
          </label>
          <input
            className="w-full bg-teal-50/20 border border-teal-200/60 p-3 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all uppercase placeholder:normal-case"
            value={prodActiveIngredient}
            onChange={(e) => setProdActiveIngredient(e.target.value)}
            placeholder="Ej: NAPROXENO SÓDICO"
            id="input-prod-ingredient"
          />
          <span className="text-[9px] text-teal-600 font-semibold block">Crítico para búsquedas clínicas de sustitutos genéricos.</span>
        </div>

        {/* Equivalents/Keywords */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-1">
            <Key size={12} className="text-purple-600" /> Palabras Clave / Equivalentes
          </label>
          <input
            className="w-full bg-purple-50/20 border border-purple-200/60 p-3 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition-all placeholder:normal-case"
            value={prodKeywords}
            onChange={(e) => setProdKeywords(e.target.value)}
            placeholder="Ej: dolor de cabeza, inflamacion, desinflamatorio"
            id="input-prod-keywords"
          />
          <span className="text-[9px] text-purple-600 font-semibold block">Separados por comas para optimizar búsquedas rápidas.</span>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
          <HelpCircle size={12} /> Indicaciones y Contraindicaciones (Descripción)
        </label>
        <textarea
          className="w-full bg-slate-50 border border-slate-200/80 p-3.5 rounded-2xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all h-28 resize-none leading-relaxed"
          value={prodDesc}
          onChange={(e) => setProdDesc(e.target.value)}
          placeholder="Ej: Indicado para el tratamiento de procesos inflamatorios y dolor agudo. No administrar en pacientes con úlcera péptica activa..."
          id="textarea-prod-desc"
        />
        <span className="text-[9px] text-slate-400 font-medium block">
          Información clave para dar soporte o mostrar al cliente final sobre la posología o precauciones.
        </span>
      </div>
    </div>
  );
};
