import React, { useState, useEffect } from 'react';
import { 
    ArrowLeftRight, ChevronRight, AlertCircle, ShoppingBag, 
    PackageSearch, Info, CheckCircle2, X, RefreshCw
} from 'lucide-react';
import { Product } from '../../types';

interface SmartSubstitutionPOSProps {
    missingTerm: string;
    allProducts: Product[];
    onSelectAlternative: (product: Product) => void;
    onClose: () => void;
}

const SmartSubstitutionPOS: React.FC<SmartSubstitutionPOSProps> = ({ 
    missingTerm, allProducts, onSelectAlternative, onClose 
}) => {
    const [generics, setGenerics] = useState<Product[]>([]);
    const [categoryAlternatives, setCategoryAlternatives] = useState<Product[]>([]);
    const [referenceProduct, setReferenceProduct] = useState<Product | null>(null);

    useEffect(() => {
        if (!missingTerm) return;

        const term = missingTerm.toLowerCase().trim();

        // 1. Intentar encontrar el producto de referencia por nombre o id
        const refProd = allProducts.find(p => 
            p.name.toLowerCase() === term || 
            p.id.toLowerCase() === term ||
            p.name.toLowerCase().includes(term)
        );
        setReferenceProduct(refProd || null);

        // Definir principio activo y categoría a buscar
        const activeIngredientToMatch = refProd?.activeIngredient?.toLowerCase().trim() || 
                                      (refProd ? '' : term); // Si no se halló el producto, asumir que el término de búsqueda puede ser el principio activo
        const categoryToMatch = refProd?.category || '';

        // 2. Buscar genéricos / productos con el mismo principio activo
        const foundGenerics: Product[] = [];
        const foundCategoryAlts: Product[] = [];

        allProducts.forEach(p => {
            // No incluir el mismo producto de referencia en los resultados de sustitutos
            if (refProd && p.id === refProd.id) return;

            const pIngredient = p.activeIngredient?.toLowerCase().trim();
            const pCategory = p.category;

            // Coincidencia de principio activo (Sustitutos directos)
            if (activeIngredientToMatch && pIngredient && (
                pIngredient.includes(activeIngredientToMatch) || 
                activeIngredientToMatch.includes(pIngredient)
            )) {
                foundGenerics.push(p);
            } 
            // Coincidencia de categoría (Sustitutos de la misma categoría/función)
            else if (categoryToMatch && pCategory === categoryToMatch) {
                foundCategoryAlts.push(p);
            }
        });

        setGenerics(foundGenerics);
        setCategoryAlternatives(foundCategoryAlts);
    }, [missingTerm, allProducts]);

    return (
        <div className="bg-white rounded-[2rem] border-2 border-teal-100 shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {/* Header tradicional sin IA */}
            <div className="bg-gradient-to-r from-teal-600 to-cyan-600 p-5 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm">
                        <ArrowLeftRight size={22} />
                    </div>
                    <div>
                        <h3 className="font-black text-md uppercase tracking-tight">Sustitutos y Equivalentes</h3>
                        <p className="text-[10px] text-teal-100 font-bold uppercase tracking-widest">
                            Buscando alternativas para: "{referenceProduct?.name || missingTerm}"
                        </p>
                    </div>
                </div>
                <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition-colors">
                    <X size={18}/>
                </button>
            </div>

            <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto no-scrollbar">
                {/* Producto de referencia actual (si existe) */}
                {referenceProduct && (
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-3">
                        <Info size={16} className="text-slate-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-slate-800 uppercase">Producto de Referencia</p>
                            <p className="text-xs font-bold text-slate-500 uppercase mt-0.5">{referenceProduct.name}</p>
                            {referenceProduct.activeIngredient && (
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                                    Principio Activo: <span className="text-teal-600">{referenceProduct.activeIngredient}</span>
                                </p>
                            )}
                            <p className="text-[10px] text-rose-500 font-bold uppercase mt-1">
                                Sin Stock disponible en inventario
                            </p>
                        </div>
                    </div>
                )}

                {(generics.length > 0 || categoryAlternatives.length > 0) ? (
                    <>
                        {/* Genéricos Directos */}
                        {generics.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="bg-emerald-50 p-1.5 rounded-lg text-emerald-600">
                                        <CheckCircle2 size={16}/>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">
                                        Sustitutos Directos (Mismo Principio Activo)
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {generics.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => onSelectAlternative(p)}
                                            className="group flex items-center justify-between p-3.5 bg-emerald-50/40 border border-emerald-100/80 rounded-xl hover:bg-teal-600 hover:text-white transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white h-10 w-10 rounded-lg flex items-center justify-center font-black text-emerald-600 shadow-sm group-hover:bg-white/20 group-hover:text-white shrink-0">
                                                    <PackageSearch size={18}/>
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase text-xs line-clamp-1">{p.name}</p>
                                                    <p className="text-[10px] font-bold opacity-75 mt-0.5">
                                                        Stock: {p.stock} un. | Precio: ${p.price.toFixed(2)}
                                                    </p>
                                                    {p.activeIngredient && (
                                                        <p className="text-[9px] font-medium opacity-60 truncate">
                                                            {p.activeIngredient}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Alternativas de la misma categoría */}
                        {categoryAlternatives.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="bg-sky-50 p-1.5 rounded-lg text-sky-600">
                                        <ShoppingBag size={16}/>
                                    </div>
                                    <h4 className="font-black text-slate-800 text-xs uppercase tracking-tight">
                                        Alternativas Terapéuticas (Misma Categoría)
                                    </h4>
                                </div>
                                <div className="grid grid-cols-1 gap-2">
                                    {categoryAlternatives.map(p => (
                                        <button 
                                            key={p.id}
                                            onClick={() => onSelectAlternative(p)}
                                            className="group flex items-center justify-between p-3.5 bg-sky-50/40 border border-sky-100/80 rounded-xl hover:bg-teal-600 hover:text-white transition-all text-left"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="bg-white h-10 w-10 rounded-lg flex items-center justify-center font-black text-sky-600 shadow-sm group-hover:bg-white/20 group-hover:text-white shrink-0">
                                                    <ShoppingBag size={18}/>
                                                </div>
                                                <div>
                                                    <p className="font-black uppercase text-xs line-clamp-1">{p.name}</p>
                                                    <p className="text-[10px] font-bold opacity-75 mt-0.5">
                                                        Stock: {p.stock} un. | Precio: ${p.price.toFixed(2)}
                                                    </p>
                                                    <p className="text-[9px] font-medium opacity-60">
                                                        Categoría: {p.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <ChevronRight size={16} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-12 space-y-3">
                        <AlertCircle size={44} className="mx-auto text-slate-300 animate-bounce"/>
                        <p className="text-slate-400 font-bold text-xs max-w-[280px] mx-auto uppercase tracking-wide">
                            No se encontraron sustitutos directos ni alternativas en esta categoría.
                        </p>
                    </div>
                )}
            </div>

            {/* Footer tradicional */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex justify-center">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <RefreshCw size={10} className="text-slate-400 animate-spin" style={{ animationDuration: '6s' }} /> Mapeo de inventario tradicional de Vitalis
                </p>
            </div>
        </div>
    );
};

export default SmartSubstitutionPOS;
