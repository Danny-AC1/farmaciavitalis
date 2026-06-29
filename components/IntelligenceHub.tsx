
import React, { useState, useEffect } from 'react';
import { 
    TrendingUp, AlertCircle, ShoppingBag, 
    PackageSearch, Zap, Trash2, Search, Plus, CheckCircle, HelpCircle
} from 'lucide-react';
import { Product, MissedSale, SearchLog } from '../types';
import { 
    streamMissedSales, 
    deleteMissedSaleDB, 
    streamSearchLogs, 
    logMissedSale, 
    deleteSearchLogDB 
} from '../services/db';

interface IntelligenceHubProps {
    products: Product[];
}

const IntelligenceHub: React.FC<IntelligenceHubProps> = ({ products }) => {
    const [missedSales, setMissedSales] = useState<MissedSale[]>([]);
    const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
    
    // Form & Search states
    const [newManualSale, setNewManualSale] = useState('');
    const [substituteSearchQuery, setSubstituteSearchQuery] = useState('');
    const [searchLogFilter, setSearchLogFilter] = useState('');
    const [missedSaleFilter, setMissedSaleFilter] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const unsubMissed = streamMissedSales(setMissedSales);
        const unsubSearch = streamSearchLogs(setSearchLogs);
        return () => {
            unsubMissed();
            unsubSearch();
        };
    }, []);

    const handleAddManualSale = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newManualSale.trim()) return;
        setIsSaving(true);
        try {
            await logMissedSale(newManualSale.trim());
            setNewManualSale('');
            alert("Venta perdida registrada correctamente.");
        } catch (err) {
            console.error("Error logging missed sale:", err);
        } finally {
            setIsSaving(false);
        }
    };

    const handleIncrementMissed = async (term: string) => {
        try {
            await logMissedSale(term);
        } catch (err) {
            console.error("Error incrementing missed sale:", err);
        }
    };

    const handleDeleteMissed = async (id: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de venta perdida?")) return;
        try {
            await deleteMissedSaleDB(id);
        } catch (err) {
            console.error("Error deleting missed sale:", err);
        }
    };

    const handleDeleteSearchLog = async (id: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de búsqueda?")) return;
        try {
            await deleteSearchLogDB(id);
        } catch (err) {
            console.error("Error deleting search log:", err);
        }
    };

    const handleSearchForSubstitute = (term: string) => {
        setSubstituteSearchQuery(term);
        const element = document.getElementById('substitute-finder-section');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Derived statistics
    const totalMissedCount = missedSales.reduce((a, b) => a + b.count, 0);
    
    // Cobertura del catálogo: Qué porcentaje de los términos de quiebres registrados tienen alternativas correspondientes
    const registeredUniqueTerms = missedSales.map(s => s.term.toUpperCase());
    const matchedTermsInCatalog = registeredUniqueTerms.filter(term => 
        products.some(p => 
            p.name.toUpperCase().includes(term) || 
            (p.activeIngredient && p.activeIngredient.toUpperCase().includes(term)) ||
            (p.keywords && p.keywords.toUpperCase().includes(term))
        )
    );
    const breachPercentage = registeredUniqueTerms.length > 0 
        ? Math.round((matchedTermsInCatalog.length / registeredUniqueTerms.length) * 100)
        : 100;

    // Filters
    const filteredMissedSales = missedSales.filter(sale => 
        sale.term.toLowerCase().includes(missedSaleFilter.toLowerCase())
    );

    const filteredSearchLogs = searchLogs.filter(log => 
        log.term.toLowerCase().includes(searchLogFilter.toLowerCase())
    );

    // Finding substitute alternatives in the active catalog
    const findMatchingProducts = () => {
        if (!substituteSearchQuery.trim()) return [];
        const queryClean = substituteSearchQuery.toUpperCase().trim();
        return products.filter(p => 
            p.name.toUpperCase().includes(queryClean) ||
            p.description.toUpperCase().includes(queryClean) ||
            (p.activeIngredient && p.activeIngredient.toUpperCase().includes(queryClean)) ||
            (p.keywords && p.keywords.toUpperCase().includes(queryClean)) ||
            p.category.toUpperCase().includes(queryClean)
        );
    };

    const matchingAlternatives = findMatchingProducts();

    return (
        <div className="space-y-8 animate-in fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                        <PackageSearch size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Centro de Demanda y Ventas Perdidas</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de quiebres de stock, búsquedas de clientes y sustitutos</p>
                    </div>
                </div>
            </div>

            {/* Sección Informativa Libre de IA */}
            <div className="bg-teal-50 border border-teal-100 p-6 rounded-[2rem] flex items-start gap-4">
                <div className="bg-white p-2 rounded-xl text-teal-600 shadow-sm shrink-0">
                    <CheckCircle size={20}/>
                </div>
                <div>
                    <p className="text-xs font-black text-teal-900 uppercase tracking-tight mb-1">Módulo 100% Manual - Analítica Local</p>
                    <p className="text-[10px] text-teal-700 font-bold leading-relaxed uppercase">
                        Hemos removido todas las dependencias y llamadas a inteligencia artificial para garantizarte un control total y absoluto de tus datos en tiempo real. 
                        Analiza las consultas de tus clientes y encuentra sustitutos o bioequivalentes de forma 100% manual.
                    </p>
                </div>
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
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Consultas Sin Stock Registradas</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-teal-50 p-3 rounded-2xl text-teal-600">
                            <ShoppingBag size={24}/>
                        </div>
                        <span className="text-[10px] font-black text-teal-500 bg-teal-50 px-2 py-1 rounded-lg uppercase">Demanda App</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 mb-1">{searchLogs.length}</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Términos Buscados en la App</p>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                        <div className="bg-amber-50 p-3 rounded-2xl text-amber-600">
                            <Zap size={24}/>
                        </div>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-50 px-2 py-1 rounded-lg uppercase">Sustitutos</span>
                    </div>
                    <h3 className="text-4xl font-black text-slate-800 mb-1">{breachPercentage}%</h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tasa de Alternativas en Catálogo</p>
                </div>
            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* Panel Izquierdo: Gestión de Ventas Perdidas / Quiebres */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                            <TrendingUp size={20} className="text-rose-600" />
                            Registro de Ventas Perdidas (Falta de Stock)
                        </h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Registra lo que tus clientes te pidieron en mostrador pero no tenías</p>
                    </div>

                    {/* Formulario Manual de Quiebre de Stock */}
                    <form onSubmit={handleAddManualSale} className="flex gap-2">
                        <input 
                            type="text"
                            required
                            placeholder="Ej: ASPIRINA 100MG, BIO-ELECTRAL..."
                            value={newManualSale}
                            onChange={e => setNewManualSale(e.target.value)}
                            className="flex-grow bg-slate-50 border-2 border-transparent p-3.5 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-xs text-slate-800"
                        />
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-1.5 transition active:scale-95 disabled:opacity-50"
                        >
                            <Plus size={16} /> Registrar
                        </button>
                    </form>

                    {/* Filtro de quiebres */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                            <Search size={14} />
                        </span>
                        <input 
                            type="text"
                            placeholder="Filtrar quiebres registrados..."
                            value={missedSaleFilter}
                            onChange={e => setMissedSaleFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-xs text-slate-700"
                        />
                    </div>

                    {/* Lista de quiebres */}
                    <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1 no-scrollbar">
                        {filteredMissedSales.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                <ShoppingBag size={32} className="mx-auto mb-2 opacity-20"/>
                                <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400">No hay ventas perdidas para mostrar</p>
                            </div>
                        ) : (
                            filteredMissedSales.map((sale) => (
                                <div key={sale.id} className="group flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 transition">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="bg-rose-50 text-rose-600 h-10 w-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-sm border border-rose-100">
                                            {sale.count}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-black text-slate-800 uppercase text-xs truncate">{sale.term}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">Último: {new Date(sale.lastAttemptedAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                        <button 
                                            onClick={() => handleIncrementMissed(sale.term)}
                                            className="p-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-lg text-slate-500 hover:text-teal-600 transition"
                                            title="Sumar 1 Consulta"
                                        >
                                            <Plus size={12} />
                                        </button>
                                        <button 
                                            onClick={() => handleSearchForSubstitute(sale.term)}
                                            className="p-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-lg text-slate-500 hover:text-teal-600 transition flex items-center gap-1 px-2"
                                            title="Buscar Sustitutos en Inventario"
                                        >
                                            <Search size={12} />
                                            <span className="text-[9px] font-black uppercase">Sustitutos</span>
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteMissed(sale.id)}
                                            className="p-1.5 bg-white border border-slate-200 hover:border-rose-500 rounded-lg text-slate-500 hover:text-rose-600 transition"
                                            title="Eliminar Registro"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Panel Derecho: Historial de Búsquedas en la App */}
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                    <div>
                        <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                            <PackageSearch size={20} className="text-teal-600" />
                            Consultas y Búsquedas Recientes en la App
                        </h3>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Lo que tus clientes buscan de forma remota en tiempo real</p>
                    </div>

                    {/* Filtro de Búsquedas */}
                    <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
                            <Search size={14} />
                        </span>
                        <input 
                            type="text"
                            placeholder="Filtrar búsquedas de clientes..."
                            value={searchLogFilter}
                            onChange={e => setSearchLogFilter(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-100 pl-9 pr-4 py-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-xs text-slate-700"
                        />
                    </div>

                    {/* Lista de búsquedas de la app */}
                    <div className="space-y-2 max-h-[415px] overflow-y-auto pr-1 no-scrollbar">
                        {filteredSearchLogs.length === 0 ? (
                            <div className="text-center py-12 text-slate-400 border-2 border-dashed border-slate-100 rounded-2xl">
                                <PackageSearch size={32} className="mx-auto mb-2 opacity-20"/>
                                <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400">No hay búsquedas registradas aún</p>
                            </div>
                        ) : (
                            [...filteredSearchLogs].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((log) => {
                                const existsInCatalog = products.some(p => p.name.toUpperCase().includes(log.term.toUpperCase()));
                                return (
                                    <div key={log.id} className="group flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/10 transition">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-slate-800 uppercase text-xs truncate">{log.term}</p>
                                                {existsInCatalog ? (
                                                    <span className="text-[8px] font-black bg-teal-50 text-teal-600 px-1.5 py-0.5 rounded uppercase border border-teal-100 shrink-0">En Catálogo</span>
                                                ) : (
                                                    <span className="text-[8px] font-black bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded uppercase border border-rose-100 shrink-0">No Registrado</span>
                                                )}
                                            </div>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Buscado: {new Date(log.date).toLocaleDateString()} • {log.count || 1} veces</p>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                                            <button 
                                                onClick={() => handleSearchForSubstitute(log.term)}
                                                className="p-1.5 bg-white border border-slate-200 hover:border-teal-500 rounded-lg text-slate-500 hover:text-teal-600 transition flex items-center gap-1 px-2"
                                                title="Buscar Equivalentes"
                                            >
                                                <Search size={12} />
                                                <span className="text-[9px] font-black uppercase">Buscar</span>
                                            </button>
                                            <button 
                                                onClick={() => handleDeleteSearchLog(log.id)}
                                                className="p-1.5 bg-white border border-slate-200 hover:border-rose-500 rounded-lg text-slate-500 hover:text-rose-600 transition"
                                                title="Eliminar Búsqueda"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>

            {/* Buscador de Sustitutos y Principio Activo */}
            <div id="substitute-finder-section" className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 space-y-6">
                <div>
                    <h3 className="font-black text-slate-800 text-lg uppercase tracking-tight flex items-center gap-2">
                        <Zap size={20} className="text-amber-500 fill-amber-500" />
                        Buscador Local de Equivalentes, Sustitutos y Principio Activo
                    </h3>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Busca un término para escanear componentes de marca, ingredientes o síntomas similares en stock</p>
                </div>

                {/* Input de Búsqueda */}
                <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 pointer-events-none">
                        <Search size={18} />
                    </span>
                    <input 
                        type="text"
                        placeholder="Escribe el nombre del medicamento, principio activo (ej: Paracetamol) o síntoma (ej: Fiebre)..."
                        value={substituteSearchQuery}
                        onChange={e => setSubstituteSearchQuery(e.target.value)}
                        className="w-full bg-slate-50 border-2 border-slate-100 pl-11 pr-4 py-4 rounded-2xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm text-slate-800"
                    />
                    {substituteSearchQuery && (
                        <button 
                            onClick={() => setSubstituteSearchQuery('')}
                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-[10px] font-black text-slate-400 hover:text-slate-600 uppercase tracking-widest"
                        >
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Tabla de Resultados de Coincidencia */}
                {substituteSearchQuery.trim() ? (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center ml-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                Resultados de Alternativas en Inventario ({matchingAlternatives.length})
                            </p>
                        </div>

                        {matchingAlternatives.length === 0 ? (
                            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                <HelpCircle size={36} className="mx-auto text-slate-300 mb-2" />
                                <p className="font-black text-xs text-slate-500 uppercase tracking-tight">No se encontraron equivalentes directos en el catálogo</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Intenta buscando únicamente por el principio activo (ej: Paracetamol, Ibuprofeno, Amoxicilina)</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border border-slate-100">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-100">
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Producto / Medicamento</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Principio Activo</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Categoría</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilidad (Stock)</th>
                                            <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Precio Público</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {matchingAlternatives.map(p => (
                                            <tr key={p.id} className="hover:bg-slate-50/50 transition">
                                                <td className="p-4">
                                                    <div className="font-black text-slate-800 uppercase text-xs">{p.name}</div>
                                                    {p.keywords && <div className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">{p.keywords}</div>}
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-bold text-slate-700 text-xs uppercase">{p.activeIngredient || 'No indicado'}</div>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[9px] font-black text-slate-500 bg-slate-100 px-2 py-1 rounded uppercase tracking-wide">
                                                        {p.category}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    {p.stock > 10 ? (
                                                        <span className="text-[9px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded uppercase border border-teal-100">
                                                            {p.stock} Unidades
                                                        </span>
                                                    ) : p.stock > 0 ? (
                                                        <span className="text-[9px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded uppercase border border-amber-100">
                                                            Stock Bajo ({p.stock})
                                                        </span>
                                                    ) : (
                                                        <span className="text-[9px] font-black text-rose-600 bg-rose-50 px-2 py-1 rounded uppercase border border-rose-100">
                                                            Agotado
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 font-black text-slate-800 text-xs">
                                                    ${p.price.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-10 bg-slate-50/50 border border-slate-100 rounded-2xl">
                        <HelpCircle size={32} className="mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-[10px] uppercase tracking-widest text-slate-400">Escribe en el buscador superior para encontrar bioequivalentes al instante</p>
                    </div>
                )}
            </div>

            {/* Footer / Tip */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center gap-8 shadow-xl">
                <div className="bg-white/10 p-5 rounded-3xl shrink-0">
                    <CheckCircle size={40} className="text-teal-400" />
                </div>
                <div className="flex-grow text-center md:text-left">
                    <h4 className="text-lg font-black mb-1 uppercase tracking-tight">Optimiza tu Compra y Planifica tu Stock</h4>
                    <p className="text-slate-300 text-xs font-bold leading-relaxed uppercase">
                        Usa las sugerencias de este panel para crear tus pedidos al proveedor. 
                        Mantener un catálogo alineado con lo que los usuarios buscan de forma presencial o digital es la clave para aumentar la satisfacción y maximizar tus ventas diarias.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default IntelligenceHub;
