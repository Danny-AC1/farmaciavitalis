
import React, { useState, useEffect } from 'react';
import { 
    BrainCircuit, TrendingUp, AlertCircle, ShoppingBag, 
    Sparkles, Loader2, BarChart3, 
    PackageSearch, 
    Zap, Trash2
} from 'lucide-react';
import { Product, MissedSale, SearchLog } from '../types';
import { streamMissedSales, deleteMissedSaleDB, streamSearchLogs } from '../services/db';
import { analyzeMarketOpportunities } from '../services/gemini.intelligence';
import ReactMarkdown from 'react-markdown';

interface IntelligenceHubProps {
    products: Product[];
}

const IntelligenceHub: React.FC<IntelligenceHubProps> = ({ products }) => {
    const [missedSales, setMissedSales] = useState<MissedSale[]>([]);
    const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
    const [marketStudy, setMarketStudy] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        const unsubMissed = streamMissedSales(setMissedSales);
        const unsubSearch = streamSearchLogs(setSearchLogs);
        return () => {
            unsubMissed();
            unsubSearch();
        };
    }, []);

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        try {
            const res = await analyzeMarketOpportunities(missedSales, searchLogs);
            setMarketStudy(res);
        } catch (e: any) {
            console.error("Error en IntelligenceHub:", e);
            if (e.message?.includes("GEMINI_API_KEY")) {
                setMarketStudy("### ❌ Error de Configuración\nLa clave de API de Gemini no está configurada en tu entorno local. Por favor, asegúrate de tener el archivo `.env` con `GEMINI_API_KEY`.");
            } else {
                setMarketStudy("### ❌ Error de Conexión\nHubo un problema al conectar con el motor de IA. Por favor, intenta de nuevo más tarde.");
            }
        } finally {
            setIsAnalyzing(false);
        }
    };

    const totalMissedCount = missedSales.reduce((a, b) => a + b.count, 0);

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/20 text-white">
                        <BrainCircuit size={28} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-slate-800 tracking-tight">Vitalis Intelligence Hub</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estudio Profesional de Mercado & IA</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleAnalyze}
                    disabled={isAnalyzing || (missedSales.length === 0 && searchLogs.length === 0)}
                    className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-black transition shadow-xl disabled:opacity-50 active:scale-95"
                >
                    {isAnalyzing ? <Loader2 className="animate-spin" size={20}/> : <Sparkles size={20}/>} 
                    GENERAR ESTUDIO DE MERCADO IA
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-rose-50 p-3 rounded-2xl text-rose-600">
                            <AlertCircle size={24}/>
                        </div>
                        <span className="text-[10px] font-black text-rose-500 bg-rose-50 px-2 py-1 rounded-lg uppercase">Crítico</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 mb-1">{totalMissedCount}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Ventas Perdidas (Sin Stock)</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600">
                            <PackageSearch size={24}/>
                        </div>
                        <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase">Demanda</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 mb-1">{searchLogs.length}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Términos Buscados Únicos</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-emerald-50 p-3 rounded-2xl text-emerald-600">
                            <Zap size={24}/>
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg uppercase">Oportunidad</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 mb-1">{missedSales.length > 0 ? Math.round((missedSales.length / products.length) * 100) : 0}%</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Brecha de Catálogo</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Ventas Perdidas Detalle */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="bg-rose-50 p-3 rounded-2xl text-rose-600">
                                <TrendingUp size={24}/>
                            </div>
                            <div>
                                <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight">Ventas Perdidas</h3>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Lo que tus clientes no encontraron</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {missedSales.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <ShoppingBag size={48} className="mx-auto mb-4 opacity-20"/>
                                <p className="font-bold text-sm">No hay registros de ventas perdidas aún.</p>
                            </div>
                        ) : (
                            missedSales.map((sale) => (
                                <div key={sale.id} className="group flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-white h-12 w-12 rounded-xl flex items-center justify-center font-black text-rose-600 shadow-sm">
                                            {sale.count}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 uppercase text-sm">{sale.term}</p>
                                            <p className="text-[10px] text-slate-400 font-bold">Último intento: {new Date(sale.lastAttemptedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => deleteMissedSaleDB(sale.id)}
                                        className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={16}/>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Estudio de Mercado Generado */}
                <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                        <BrainCircuit size={120}/>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-8 relative z-10">
                        <div className="bg-white/10 p-3 rounded-2xl text-indigo-400 backdrop-blur-sm">
                            <Sparkles size={24}/>
                        </div>
                        <div>
                            <h3 className="font-black text-white text-lg uppercase tracking-tight">Análisis Estratégico</h3>
                            <p className="text-[10px] text-indigo-300 font-black uppercase tracking-widest">Generado por Vitalis IA</p>
                        </div>
                    </div>

                    <div className="relative z-10 min-h-[300px]">
                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center h-full py-20 gap-4">
                                <Loader2 className="animate-spin text-indigo-400" size={48}/>
                                <p className="text-indigo-200 font-bold animate-pulse">Analizando patrones de demanda...</p>
                            </div>
                        ) : marketStudy ? (
                            <div className="prose prose-invert prose-sm max-w-none markdown-body">
                                <ReactMarkdown>{marketStudy}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full py-20 text-center gap-4 opacity-50">
                                <BarChart3 size={64} className="text-slate-700"/>
                                <p className="text-sm font-bold max-w-[200px]">Haz clic en el botón superior para generar un estudio profesional.</p>
                            </div>
                        )}
                    </div>

                    {marketStudy && (
                        <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center relative z-10">
                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Estudio de Mercado v1.0</p>
                            <button 
                                onClick={() => setMarketStudy('')}
                                className="text-[9px] font-black text-white/40 uppercase hover:text-white transition-colors"
                            >
                                Limpiar Análisis
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* AI Tips */}
            <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-xl shadow-indigo-600/20">
                <div className="bg-white/20 p-6 rounded-3xl backdrop-blur-md">
                    <Zap size={48} className="text-yellow-300 fill-yellow-300"/>
                </div>
                <div className="flex-grow text-center md:text-left">
                    <h4 className="text-xl font-black mb-2 uppercase tracking-tight">¿Sabías que el 30% de las ventas perdidas se pueden recuperar?</h4>
                    <p className="text-indigo-100 text-sm font-medium leading-relaxed">
                        Usa el **Motor de Sustitución Inteligente** en el POS para ofrecer alternativas cuando no tengas stock. 
                        La IA te ayuda a retener al cliente sugiriendo productos con el mismo principio activo.
                    </p>
                </div>
                <div className="shrink-0">
                    <div className="bg-white text-indigo-600 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg">
                        Productividad +30%
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IntelligenceHub;
