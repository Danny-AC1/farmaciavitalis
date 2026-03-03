
import React, { useState, useEffect } from 'react';
import { 
    Sparkles, Loader2, BrainCircuit, ChevronRight, 
    AlertCircle, ShoppingBag, PackageSearch, 
    Zap, Info, CheckCircle2, X
} from 'lucide-react';
import { Product } from '../types';
import { suggestSubstitutes, SubstitutionResult } from '../services/gemini.intelligence';
import { logMissedSale } from '../services/db.intelligence';

interface SmartSubstitutionPOSProps {
    missingTerm: string;
    allProducts: Product[];
    onSelectAlternative: (product: Product) => void;
    onClose: () => void;
}

const SmartSubstitutionPOS: React.FC<SmartSubstitutionPOSProps> = ({ 
    missingTerm, allProducts, onSelectAlternative, onClose 
}) => {
    const [result, setResult] = useState<SubstitutionResult | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchSubstitutes = async () => {
            if (!missingTerm) return;
            setIsLoading(true);
            setError(null);
            try {
                // Log the missed sale for the Intelligence Hub
                await logMissedSale(missingTerm);
                
                const res = await suggestSubstitutes(missingTerm, allProducts);
                setResult(res);
            } catch (e) {
                setError("Error al conectar con el motor de IA.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSubstitutes();
    }, [missingTerm, allProducts]);

    return (
        <div className="bg-white rounded-[2.5rem] border-2 border-indigo-100 shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <BrainCircuit size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-lg uppercase tracking-tight">Asistente de Sustitución IA</h3>
                        <p className="text-[10px] text-indigo-100 font-bold uppercase tracking-widest">Buscando alternativas para: "{missingTerm}"</p>
                    </div>
                </div>
                <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                    <X size={20}/>
                </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto scroll-smooth">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin text-indigo-600" size={48}/>
                        <p className="text-slate-400 font-bold text-sm animate-pulse uppercase tracking-widest">Mapeando Principios Activos...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-20 space-y-4">
                        <AlertCircle size={48} className="mx-auto text-rose-500 opacity-20"/>
                        <p className="text-slate-500 font-bold">{error}</p>
                    </div>
                ) : result && (result.generics.length > 0 || result.therapeuticAlternatives.length > 0) ? (
                    <>
                        {/* Genéricos Directos */}
                        {result.generics.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-emerald-50 p-2 rounded-lg text-emerald-600">
                                        <CheckCircle2 size={18}/>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Genéricos Directos (Mismo Principio)</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {result.generics.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => onSelectAlternative(p)}
                                            className="group flex items-center justify-between p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all text-left"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="bg-white h-12 w-12 rounded-xl flex items-center justify-center font-black text-emerald-600 shadow-sm group-hover:bg-white/20 group-hover:text-white">
                                                    <PackageSearch size={20}/>
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase text-sm">{p.name}</p>
                                                    <p className="text-[10px] font-bold opacity-60">Stock: {p.stock} | ${p.price}</p>
                                                </div>
                                            </div>
                                            <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alternativas Terapéuticas */}
                        {result.therapeuticAlternatives.length > 0 && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                        <Zap size={18}/>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">Alternativas Terapéuticas (Misma Función)</h4>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                    {result.therapeuticAlternatives.map(alt => (
                                        <button 
                                            key={alt.product.id}
                                            onClick={() => onSelectAlternative(alt.product)}
                                            className="group flex flex-col p-4 bg-indigo-50/50 border border-indigo-100 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all text-left gap-3"
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-white h-12 w-12 rounded-xl flex items-center justify-center font-black text-indigo-600 shadow-sm group-hover:bg-white/20 group-hover:text-white">
                                                        <ShoppingBag size={20}/>
                                                    </div>
                                                    <div>
                                                        <p className="font-black uppercase text-sm">{alt.product.name}</p>
                                                        <p className="text-[10px] font-bold opacity-60">Stock: {alt.product.stock} | ${alt.product.price}</p>
                                                    </div>
                                                </div>
                                                <ChevronRight size={20} className="opacity-0 group-hover:opacity-100 transition-opacity"/>
                                            </div>
                                            <div className="bg-white/50 group-hover:bg-white/10 p-3 rounded-xl flex items-start gap-2">
                                                <Info size={14} className="shrink-0 mt-0.5"/>
                                                <p className="text-[10px] font-bold leading-relaxed">{alt.reason}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-20 space-y-4">
                        <PackageSearch size={64} className="mx-auto text-slate-200"/>
                        <p className="text-slate-400 font-bold text-sm max-w-[250px] mx-auto">No se encontraron alternativas directas en el inventario actual.</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles size={12} className="text-indigo-500"/> Vitalis Intelligence Engine v1.0
                </p>
            </div>
        </div>
    );
};

export default SmartSubstitutionPOS;
