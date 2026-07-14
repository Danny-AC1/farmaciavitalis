import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Loader2, Mic, X, Check, Volume2, AlertCircle, 
  Sparkles, ShoppingCart, Bell, CornerDownLeft 
} from 'lucide-react';
import { Product } from '../../types';
import { useVoiceSearch } from '../../hooks/useVoiceSearch';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  isSymptomMode?: boolean; // Mantener por compatibilidad de tipos
  setIsSymptomMode?: React.Dispatch<React.SetStateAction<boolean>>; // Mantener por compatibilidad de tipos
  isSearchingAI: boolean;
  startVoiceSearch?: () => void;
  placeholder?: string;
  
  // Nuevas propiedades premium para sugerencias en tiempo real
  allProducts?: Product[];
  onAddToCart?: (p: Product, unit?: 'UNIT' | 'BOX') => void;
  onSelectProduct?: (p: Product | null) => void;
  cart?: any[];
}

const POPULAR_TERMS = [
  'Paracetamol',
  'Ibuprofeno',
  'Antigripal',
  'Ambroxol',
  'Suero Oral',
  'Fiebre',
  'Dolor de estómago',
  'Loratadina',
  'Vitaminas',
  'Omeprazol'
];

const SearchBar: React.FC<SearchBarProps> = ({ 
  searchTerm, setSearchTerm, isSearchingAI, placeholder,
  allProducts = [], onAddToCart, onSelectProduct
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Atajos de teclado: '/' para enfocar, 'Esc' para cerrar sugerencias
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        inputRef.current?.blur();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Cerrar sugerencias al hacer clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Inicializar búsqueda por voz utilizando Web Speech API
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
      setShowSuggestions(true);
    }
  });

  const handleVoiceButtonClick = () => {
    resetTranscript();
    startListening();
  };

  // Filtrar productos sugeridos instantáneamente mientras el usuario escribe
  const matchingProducts = useMemo(() => {
    if (!searchTerm.trim()) return [];
    const term = searchTerm.toLowerCase().trim();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(term) || 
      p.description.toLowerCase().includes(term) ||
      p.category.toLowerCase().includes(term) ||
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(term)) ||
      (p.keywords && p.keywords.toLowerCase().includes(term))
    ).slice(0, 4); // Mostrar máximo 4 resultados rápidos
  }, [searchTerm, allProducts]);

  // Filtrar términos de búsqueda populares basados en lo ingresado
  const filteredPopularTerms = useMemo(() => {
    if (!searchTerm.trim()) return POPULAR_TERMS.slice(0, 5);
    const term = searchTerm.toLowerCase().trim();
    return POPULAR_TERMS.filter(t => t.toLowerCase().includes(term)).slice(0, 4);
  }, [searchTerm]);

  const handleSelectSuggestion = (term: string) => {
    setSearchTerm(term);
    setShowSuggestions(false);
    inputRef.current?.blur();
  };

  const handleQuickAdd = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product, 'UNIT');
      setAddedProductId(product.id);
      setTimeout(() => setAddedProductId(null), 1500);
    }
  };

  const handleProductClick = (product: Product) => {
    if (onSelectProduct) {
      onSelectProduct(product);
      setShowSuggestions(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full mb-4 z-40 sticky top-16 bg-gray-50/95 backdrop-blur-md pt-2.5 pb-2.5 transition-all">
      <div className="relative">
        <div className={`relative flex items-center transition-all duration-300 rounded-2xl border bg-white shadow-sm ${
          isFocused 
            ? 'border-teal-500 ring-4 ring-teal-500/10 shadow-md shadow-teal-500/5' 
            : 'border-slate-200 hover:border-slate-300'
        }`}>
          {/* Lupa / Loader */}
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            {isSearchingAI ? (
              <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
            ) : (
              <Search className={`h-5 w-5 transition-colors duration-300 ${isFocused ? 'text-teal-600' : 'text-slate-400'}`} />
            )}
          </div>

          {/* Input principal de búsqueda */}
          <input 
            ref={inputRef}
            type="text" 
            placeholder={placeholder || "Buscar por medicamento, síntoma, fórmula o marca... (Ej: gripe, dolor)"} 
            className="w-full pl-12 pr-28 py-4 bg-transparent text-slate-950 text-base placeholder-slate-400 focus:outline-none rounded-2xl"
            value={searchTerm} 
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowSuggestions(true);
            }} 
            onFocus={() => {
              setIsFocused(true);
              setShowSuggestions(true);
            }}
          />

          {/* Controles de la derecha: Limpiar + Atajo + Micrófono */}
          <div className="absolute right-3 flex items-center gap-1.5">
            {searchTerm && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  inputRef.current?.focus();
                }}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Atajo de teclado (solo visible en computadoras de escritorio) */}
            {!searchTerm && !isFocused && (
              <kbd className="hidden md:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-slate-50 px-1.5 font-mono text-[10px] font-medium text-slate-400 pointer-events-none">
                <span>/</span>
              </kbd>
            )}

            <span className="w-[1px] h-5 bg-slate-200"></span>

            {/* Botón de búsqueda por voz */}
            <button 
              onClick={handleVoiceButtonClick} 
              className={`p-2.5 rounded-xl transition-all ${
                isListening 
                  ? 'bg-red-50 text-red-600 animate-pulse' 
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-700'
              }`} 
              title="Buscar por voz de primer nivel"
            >
              <Mic className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>

        {/* ================= PANEL DE SUGERENCIAS DE PRIMER NIVEL ================= */}
        {showSuggestions && (searchTerm.trim() || isFocused) && (
          <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200/80 rounded-2xl shadow-xl shadow-slate-900/10 overflow-hidden animate-in slide-in-from-top-3 duration-200 max-h-[480px] overflow-y-auto z-[60]">
            
            {/* Cabecera del buscador inteligente */}
            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-3.5 w-3.5 text-teal-600 animate-pulse" />
                Farmacia Vitalis Búsqueda Inteligente
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                Presione <kbd className="bg-white px-1 py-0.5 border border-slate-200 rounded">Esc</kbd> para salir
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 division-x division-slate-100">
              
              {/* Sección Izquierda: Términos sugeridos (md:col-span-4) */}
              <div className="p-3 md:col-span-4 bg-slate-50/50">
                <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 px-1">
                  {searchTerm.trim() ? 'Sugerencias Relacionadas' : 'Términos Populares'}
                </h4>
                <div className="flex flex-col gap-1">
                  {filteredPopularTerms.length > 0 ? (
                    filteredPopularTerms.map((term) => (
                      <button
                        key={term}
                        onClick={() => handleSelectSuggestion(term)}
                        className="w-full text-left px-2 py-1.5 rounded-lg text-xs font-bold text-slate-700 hover:bg-teal-50 hover:text-teal-800 transition-colors flex items-center justify-between group"
                      >
                        <span className="truncate">{term}</span>
                        <CornerDownLeft className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 px-1 italic">Escribe para encontrar palabras claves</span>
                  )}
                </div>
              </div>

              {/* Sección Derecha: Productos sugeridos en tiempo real (md:col-span-8) */}
              <div className="p-3 md:col-span-8 border-t md:border-t-0 md:border-l border-slate-100">
                <h4 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest mb-2 flex items-center justify-between">
                  <span>Productos Coincidentes</span>
                  {matchingProducts.length > 0 && (
                    <span className="text-[10px] text-teal-600 font-bold lowercase">
                      {matchingProducts.length} encontrados
                    </span>
                  )}
                </h4>

                {matchingProducts.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {matchingProducts.map((product) => {
                      const isOutOfStock = product.stock === 0;
                      const hasAdded = addedProductId === product.id;
                      
                      return (
                        <div 
                          key={product.id}
                          onClick={() => handleProductClick(product)}
                          className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer border border-transparent hover:border-slate-100 group"
                        >
                          {/* Miniatura del producto */}
                          <div className="h-11 w-11 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-150 flex items-center justify-center relative">
                            <img 
                              src={product.image} 
                              alt={product.name}
                              className="object-contain h-full w-full p-1"
                              referrerPolicy="no-referrer"
                            />
                            {isOutOfStock && (
                              <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center">
                                <span className="text-[8px] bg-red-600 text-white font-black px-1 rounded-sm uppercase tracking-wide">
                                  Sin Stock
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Info de texto */}
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-600 transition-colors">
                                {product.name}
                              </span>
                              {product.activeIngredient && (
                                <span className="text-[9px] bg-teal-50 text-teal-700 border border-teal-150 font-semibold px-1.5 py-0.2 rounded-full truncate shrink-0 max-w-[110px]" title={product.activeIngredient}>
                                  {product.activeIngredient}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">
                              {product.description || 'Medicamento de alta calidad'}
                            </p>
                          </div>

                          {/* Precio y Botón de acción rápido */}
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-xs font-black text-slate-800">
                              ${product.price.toFixed(2)}
                            </span>
                            
                            {isOutOfStock ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProductClick(product); // Abre detalle para poder avisarle cuando haya stock
                                }}
                                className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all"
                                title="Avísame cuando haya stock"
                              >
                                <Bell className="h-3 w-3 shrink-0 text-amber-600 animate-bounce" />
                                <span className="hidden sm:inline">Avisar</span>
                              </button>
                            ) : (
                              <button
                                onClick={(e) => handleQuickAdd(e, product)}
                                className={`p-1.5 border rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all ${
                                  hasAdded 
                                    ? 'bg-emerald-600 text-white border-emerald-600' 
                                    : 'bg-white hover:bg-teal-50 text-slate-700 hover:text-teal-700 border-slate-200 hover:border-teal-200'
                                }`}
                                title="Añadir unidad al carrito"
                              >
                                {hasAdded ? (
                                  <>
                                    <Check className="h-3 w-3 animate-in zoom-in" strokeWidth={3} />
                                    <span className="hidden sm:inline">Listo</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart className="h-3 w-3 shrink-0" />
                                    <span className="hidden sm:inline">Llevar</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 flex flex-col items-center justify-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                    <Search className="h-7 w-7 text-slate-300 mb-1" />
                    <span className="text-xs font-semibold text-slate-500">
                      {searchTerm.trim() ? `Sin coincidencias directas para "${searchTerm}"` : 'Escriba para ver productos al instante'}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5 max-w-[240px]">
                      {searchTerm.trim() ? 'Pruebe con otra palabra clave o use un término popular.' : 'Le sugeriremos medicamentos recomendados de inmediato.'}
                    </span>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ================= MODALES DE BÚSQUEDA POR VOZ ================= */}
      {isListening && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-white animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-slate-950/40 rounded-3xl p-8 border border-white/10 text-center relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[420px] max-h-[90vh]">
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-teal-500/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl"></div>

            <button 
              onClick={stopListening} 
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
              title="Cancelar"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="mb-4">
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-black uppercase tracking-widest inline-block mb-2 animate-pulse">
                Búsqueda por Voz Activa
              </span>
              <h3 className="text-xl font-extrabold text-white">Farmacia Vitalis</h3>
              <p className="text-xs text-slate-400 font-medium mt-1">Hable ahora para buscar medicamentos o síntomas</p>
            </div>

            <div className="my-6 flex flex-col items-center justify-center gap-4">
              <div className="relative flex items-center justify-center">
                <div className="absolute w-28 h-28 bg-teal-500/10 rounded-full animate-ping"></div>
                <div className="absolute w-20 h-20 bg-teal-500/20 rounded-full animate-pulse"></div>
                <div className="relative bg-gradient-to-tr from-teal-500 to-emerald-500 p-6 rounded-full shadow-lg shadow-teal-500/30 border border-teal-300/20">
                  <Volume2 className="h-8 w-8 text-white animate-bounce" />
                </div>
              </div>

              <div className="flex gap-1 items-center h-8 my-1">
                <span className="w-1.5 bg-teal-400 rounded-full animate-pulse h-4 duration-500"></span>
                <span className="w-1.5 bg-teal-400 rounded-full animate-pulse h-7 duration-350"></span>
                <span className="w-1.5 bg-teal-400 rounded-full animate-pulse h-9 duration-200"></span>
                <span className="w-1.5 bg-teal-400 rounded-full animate-pulse h-5 duration-450"></span>
                <span className="w-1.5 bg-teal-400 rounded-full animate-pulse h-8 duration-150"></span>
                <span className="w-1.5 bg-teal-400 rounded-full animate-pulse h-4 duration-600"></span>
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 rounded-2xl p-5 min-h-[96px] flex flex-col items-center justify-center mb-4">
              {transcript ? (
                <p className="text-lg font-bold text-teal-100 line-clamp-3 leading-snug animate-in fade-in duration-150">
                  "{transcript}"
                </p>
              ) : (
                <p className="text-sm text-slate-400 font-medium italic animate-pulse">
                  Escuchando su voz... hable claramente
                </p>
              )}
            </div>

            <div className="border-t border-white/5 pt-4">
              <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider block mb-1.5">Sugerencias por Voz:</span>
              <div className="flex flex-wrap justify-center gap-1.5">
                {["Paracetamol", "Gripe", "Dolor de estómago", "Jarabe para tos"].map((tip) => (
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

      {/* Navegador No Soportado */}
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

      {/* Error de Permiso de Micrófono */}
      {voiceError && voiceError !== 'Búsqueda por voz no soportada en este navegador' && (
        <div className="fixed inset-0 z-[120] bg-slate-900/80 backdrop-blur-md flex items-center justify-center p-6 text-white animate-in fade-in duration-250">
          <div className="max-w-sm w-full bg-slate-950 rounded-2xl p-6 border border-white/10 text-center relative shadow-2xl">
            <div className="mx-auto bg-amber-500/10 p-3 rounded-full w-14 h-14 flex items-center justify-center border border-amber-500/20 mb-4">
              <AlertCircle className="h-7 w-7 text-amber-400" />
            </div>
            <h3 className="text-base font-extrabold text-white">Acceso al Micrófono</h3>
            <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
              {voiceError}. Asegúrese de dar los permisos necesarios en la barra de su navegador para utilizar la búsqueda por voz.
            </p>
            <button 
              onClick={resetTranscript} 
              className="mt-5 w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold text-xs py-3 rounded-xl transition-all"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
