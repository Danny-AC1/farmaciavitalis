
import React from 'react';
import { Search, Stethoscope, Sparkles, Loader2, Mic } from 'lucide-react';

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
  return (
    <div className="relative w-full mb-8 z-30 sticky top-16 bg-gray-50 pt-2 pb-2 transition-all">
        <div className="relative flex gap-2">
            <button 
              onClick={() => { setIsSymptomMode(!isSymptomMode); setSearchTerm(''); }} 
              className={`p-3 rounded-xl shadow-md transition-all flex items-center justify-center ${isSymptomMode ? 'bg-purple-600 text-white' : 'bg-white text-gray-400 hover:text-purple-600'}`} 
              title={isSymptomMode ? "Volver a búsqueda normal" : "Activar búsqueda por síntomas"}
            >
              <Stethoscope className="h-6 w-6" />
            </button>
            <div className="relative flex-grow">
                <input 
                  type="text" 
                  placeholder={isSymptomMode ? "¿Qué malestar sientes? (Ej: tengo fiebre)" : (placeholder || "Buscar productos...")} 
                  className={`w-full pl-12 pr-14 py-4 rounded-xl border transition-all text-lg shadow-md focus:outline-none focus:ring-2 ${isSymptomMode ? 'border-purple-200 focus:ring-purple-500 bg-purple-50 text-purple-900 placeholder-purple-300' : 'border-gray-200 focus:ring-teal-500 bg-white text-gray-900'}`} 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <div className={`absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none ${isSymptomMode ? 'text-purple-500' : 'text-gray-400'}`}>
                  {isSearchingAI ? <Loader2 className="h-6 w-6 animate-spin"/> : (isSymptomMode ? <Sparkles className="h-6 w-6"/> : <Search className="h-6 w-6" />)}
                </div>
                <button 
                  onClick={startVoiceSearch} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/50 hover:bg-white p-2 rounded-full transition-colors" 
                  title="Buscar por voz"
                >
                  <Mic className={`h-5 w-5 ${isSymptomMode ? 'text-purple-600' : 'text-gray-600'}`} />
                </button>
            </div>
        </div>
        {isSymptomMode && <p className="text-xs text-purple-600 font-bold mt-1 ml-14 flex items-center gap-1 animate-in fade-in"><Sparkles className="h-3 w-3"/> IA Triage Activo: Describe tus síntomas.</p>}
    </div>
  );
};

export default SearchBar;
