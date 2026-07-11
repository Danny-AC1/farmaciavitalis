import React from 'react';
import { Search, Stethoscope, Loader2, Mic, X, Check, Volume2, AlertCircle } from 'lucide-react';
import { SYMPTOMS_LIST } from '../../hooks/useAppLogic/useAppAI';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isSymptomMode: boolean;
  setIsSymptomMode: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchingAI: boolean;
  startVoiceSearch?: () => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, setSearchTerm, isSymptomMode, setIsSymptomMode, 
  isSearchingAI, placeholder 
}) => {
  // Check if the current searchTerm matches any symptom in our list
  const activeSymptom = SYMPTOMS_LIST.find(
    s => s.label.toLowerCase() === searchTerm.toLowerCase() || s.id === searchTerm
  );

  // Initialize fully functional Web Speech API voice search hook
  const {
    isListening,
    transcript,
    supported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript
  } = useVoiceSearch((finalResult) => {
    if (finalResult) {
      setSearchTerm(finalResult);
    }
  });

  const handleVoiceButtonClick = () => {
    resetTranscript();
    startListening();
  };

  return (
    <div className="relative w-full mb-2 z-30 sticky top-16 bg-gray-50 pt-2 pb-2 transition-all">
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
                  onClick={handleVoiceButtonClick} 
                  className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2 rounded-full transition-all ${
                    isListening 
                      ? 'bg-teal-100 text-teal-700 animate-pulse' 
                      : 'bg-white/50 hover:bg-white text-slate-500 hover:text-teal-600'
                  }`} 
                  title="Buscar por voz de primer nivel"
                >
                  <Mic className="h-5 w-5" />
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

        {/* Modal de Búsqueda por Voz Premium */}
        {isListening && (
          <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
            <div className="max-w-md w-full bg-slate-950/40 rounded-3xl p-8 border border-white/10 text-center relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[420px] max-h-[90vh]">
              
              {/* Pulsing Glowing Background Accents */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
              <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

              {/* Close Button */}
              <button 
                onClick={stopListening} 
                className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                title="Cancelar"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Title Header */}
              <div className="mb-4">
                <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block mb-2">
                  Búsqueda por Voz Activa
                </span>
                <h3 className="text-xl font-extrabold text-white">Farmacia Vitalis</h3>
                <p className="text-xs text-slate-400 font-medium mt-1">Diga claramente el medicamento o malestar que busca</p>
              </div>

              {/* Audio Visualizer Waves */}
              <div className="my-6 flex flex-col items-center justify-center gap-4">
                <div className="relative flex items-center justify-center">
                  <div className="absolute w-28 h-28 bg-teal-500/10 rounded-full animate-ping"></div>
                  <div className="absolute w-20 h-20 bg-teal-500/20 rounded-full animate-pulse"></div>
                  <div className="relative bg-gradient-to-tr from-teal-500 to-emerald-500 p-5.5 rounded-full shadow-lg shadow-teal-500/30 border border-teal-300/20">
                    <Volume2 className="h-8 w-8 text-white animate-bounce" />
                  </div>
                </div>

                {/* Animated waves representation */}
                <div className="flex gap-1 items-center h-8 my-1">
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-4 duration-500"></span>
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-6 duration-300"></span>
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-8 duration-200"></span>
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-5 duration-400"></span>
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-7 duration-150"></span>
                  <span className="w-1 bg-teal-400 rounded-full animate-pulse h-4 duration-600"></span>
                </div>
              </div>

              {/* Live Transcript Panel */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-5 min-h-[96px] flex flex-col items-center justify-center mb-4 transition-all duration-300">
                {transcript ? (
                  <p className="text-lg font-bold text-teal-100 line-clamp-3 leading-snug animate-in fade-in duration-150">
                    "{transcript}"
                  </p>
                ) : (
                  <p className="text-sm text-slate-400 font-medium italic animate-pulse">
                    Escuchando... hable ahora
                  </p>
                )}
              </div>

              {/* User Guide/Tips */}
              <div className="border-t border-white/5 pt-4">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">Sugerencias:</span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {["Ibuprofeno", "Fiebre", "Ambroxol", "Estómago"].map((tip) => (
                    <button 
                      key={tip} 
                      onClick={() => {
                        setSearchTerm(tip);
                        stopListening();
                      }}
                      className="text-[10px] bg-white/5 hover:bg-teal-500/20 hover:text-teal-200 hover:border-teal-500/30 border border-white/5 px-2.5 py-1.5 rounded-lg font-bold text-slate-300 transition-colors"
                    >
                      "{tip}"
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal de Búsqueda por Voz No Soportada / Error */}
        {!supported && voiceError === 'Búsqueda por voz no soportada en este navegador' && (
          <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 text-white animate-in fade-in duration-250">
            <div className="max-w-sm w-full bg-slate-950 rounded-2xl p-6 border border-white/10 text-center relative shadow-2xl">
              <div className="mx-auto bg-red-500/10 p-3 rounded-full w-14 h-14 flex items-center justify-center border border-red-500/20 mb-4">
                <AlertCircle className="h-7 w-7 text-red-400" />
              </div>
              <h3 className="text-base font-extrabold text-white">Navegador No Soportado</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                La tecnología de reconocimiento de voz requiere de un navegador compatible (como Google Chrome o Safari).
              </p>
              <button 
                onClick={resetTranscript} 
                className="mt-5 w-full bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all"
              >
                Entendido
              </button>
            </div>
          </div>
        )}

        {/* Modal de Error de Permiso / General */}
        {voiceError && voiceError !== 'Búsqueda por voz no soportada en este navegador' && (
          <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 text-white animate-in fade-in duration-250">
            <div className="max-w-sm w-full bg-slate-950 rounded-2xl p-6 border border-white/10 text-center relative shadow-2xl">
              <div className="mx-auto bg-amber-500/10 p-3 rounded-full w-14 h-14 flex items-center justify-center border border-amber-500/20 mb-4">
                <AlertCircle className="h-7 w-7 text-amber-400" />
              </div>
              <h3 className="text-base font-extrabold text-white">Acceso al Micrófono</h3>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                {voiceError}. Asegúrate de dar los permisos necesarios en la barra de tu navegador para usar la búsqueda por voz.
              </p>
              <button 
                onClick={resetTranscript} 
                className="mt-5 w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all"
              >
                Reintentar Búsqueda
              </button>
            </div>
          </div>
        )}
    </div>
  );
};

export default SearchBar;
