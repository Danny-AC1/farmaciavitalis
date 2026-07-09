import React from 'react';
import { Search, Stethoscope, Loader2, Mic, X, Check } from 'lucide-react';
import { SYMPTOMS_LIST } from '../../hooks/useAppLogic/useAppAI';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isSymptomMode: boolean;
  setIsSymptomMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchingAI: boolean;
  startVoiceSearch: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, setSearchTerm, isSymptomMode, setIsSymptomMode, 
  isSearchingAI, startVoiceSearch, placeholder 
}) => {
  // Check if the current searchTerm matches any symptom in our list
  const activeSymptom = SYMPTOMS_LIST.find(
    s => s.label.toLowerCase() === searchTerm.toLowerCase() || s.id === searchTerm
  );

  return (
    <div className="relative w-full mb-6 z-30 sticky top-16 bg-gray-50 pt-2 pb-2 transition-all">
        <div className="relative flex gap-2">
            <button 
              onClick={() => { 
                setIsSymptomMode(!isSymptomMode); 
                setSearchTerm(''); 
              }} 
              className={`p-3 rounded-xl shadow-md transition-all flex items-center justify-center border ${
                isSymptomMode 
                  ? 'bg-teal-600 border-teal-600 text-white shadow-teal-600/10' 
                  : 'bg-white border-slate-100 text-slate-500 hover:text-teal-600 hover:border-teal-200'
              }`} 
              title={isSymptomMode ? "Volver a búsqueda normal" : "Guía de Alivio por Síntomas"}
            >
              <Stethoscope className="h-6 w-6" strokeWidth={2.2} />
            </button>
            <div className="relative flex-grow">
                <input 
                  type="text" 
                  placeholder={isSymptomMode ? "Escribe un malestar... (Ej: dolor de estómago)" : (placeholder || "Buscar medicamentos, marcas, etc...")} 
                  className={`w-full pl-12 pr-14 py-4 rounded-xl border transition-all text-base shadow-sm focus:outline-none focus:ring-2 ${
                    isSymptomMode 
                      ? 'border-teal-200 focus:ring-teal-500 bg-teal-50/50 text-teal-900 placeholder-teal-400/80' 
                      : 'border-slate-150 focus:ring-slate-800 bg-white text-slate-900'
                  }`} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none ${isSymptomMode ? 'text-teal-600' : 'text-slate-400'}`}>
                  {isSearchingAI ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                </div>
                {searchTerm ? (
                  <button 
                    onClick={() => setSearchTerm('')}
                    className="absolute right-12 top-1/2 transform -translate-y-1/2 bg-slate-100 hover:bg-slate-200 text-slate-500 p-1.5 rounded-full transition-colors animate-in fade-in zoom-in-50 duration-150"
                    title="Limpiar búsqueda"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                ) : null}
                <button 
                  onClick={startVoiceSearch} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full transition-colors" 
                  title="Buscar por voz"
                >
                  <Mic className={`h-5 w-5 ${isSymptomMode ? 'text-teal-600' : 'text-slate-500'}`} />
                </button>
            </div>
        </div>

        {/* Guía de Síntomas / Botiquín de Alivio Rápido */}
        {isSymptomMode && (
          <div className="mt-3 bg-white rounded-2xl p-4 border border-teal-100 shadow-md shadow-teal-900/5 animate-in slide-in-from-top-3 duration-200">
            <div className="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
              <div>
                <h4 className="text-xs font-black text-teal-800 uppercase tracking-wider flex items-center gap-1.5">
                  🩺 Guía de Alivio por Síntomas
                </h4>
                <p className="text-[11px] text-slate-500 font-medium">
                  Selecciona tu malestar principal para mostrar de inmediato soluciones sugeridas.
                </p>
              </div>
              {activeSymptom && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="text-[10px] font-bold text-teal-600 hover:text-teal-800 bg-teal-50 px-2 py-1 rounded-md transition-all flex items-center gap-1 animate-in fade-in duration-150"
                >
                  Ver Todos
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SYMPTOMS_LIST.map((symptom) => {
                const isSelected = activeSymptom?.id === symptom.id;
                return (
                  <button
                    key={symptom.id}
                    onClick={() => setSearchTerm(isSelected ? '' : symptom.label)}
                    className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition-all ${
                      isSelected 
                        ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-500/10 shadow-xs' 
                        : 'bg-white border-slate-100 hover:border-teal-150 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 w-full mb-1">
                      <span className="text-base shrink-0">{symptom.icon}</span>
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">{symptom.label}</span>
                      {isSelected && <Check className="h-3 w-3 text-teal-600 ml-auto shrink-0" strokeWidth={3} />}
                    </div>
                    <span className="text-[10px] text-slate-400 line-clamp-1 font-medium">{symptom.description}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
    </div>
  );
};

export default SearchBar;
