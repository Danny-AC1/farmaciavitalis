
import React, { useState } from 'react';
import { Wallet, History, TrendingUp, Save, Calendar, RefreshCw, Database, Terminal, ShieldCheck, Edit, Trash2 } from 'lucide-react';
import { CashClosure, MonthlyFinance } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { diagnosticFetchClosures, deleteCashClosureDB } from '../services/db.admin';
import { CURRENT_FIREBASE_CONFIG } from '../services/firebase';

interface AdminFinancesProps {
    cashClosures: CashClosure[];
    monthlyFinance: MonthlyFinance[];
    currentMonthStats: {
        currentMonthRev: number;
        currentMonthGP: number;
        currentMonthOrdersCount: number;
        monthKey: string;
    };
    currentMonthExpenses: number;
    expenseBreakdown: Record<string, number>;
    netProfit: number;
    onRegisterMonthlyFinance: () => void;
    onEditClosure?: (closure: CashClosure) => void;
}

const AdminFinances: React.FC<AdminFinancesProps> = ({ 
    cashClosures, 
    monthlyFinance, 
    currentMonthStats, 
    currentMonthExpenses, 
    expenseBreakdown,
    netProfit,
    onRegisterMonthlyFinance,
    onEditClosure
}) => {
    const [subTab, setSubTab] = useState<'daily' | 'monthly'>('daily');
    const [isSyncing, setIsSyncing] = useState(false);
    const [diagResult, setDiagResult] = useState<{success:boolean, count:number, error?:string, data?: any[]} | null>(null);

    const handleDeleteClosure = async (id: string) => {
        if (!window.confirm('¿Estás seguro de eliminar este registro de cierre? Esta acción no se puede deshacer.')) return;
        try {
            await deleteCashClosureDB(id);
            alert('Registro eliminado correctamente');
        } catch (error: any) {
            alert('Error al eliminar: ' + error.message);
        }
    };

    const handleDiagnostic = async () => {
        setIsSyncing(true);
        try {
            const result = await diagnosticFetchClosures();
            setDiagResult(result as any);
            if (!result.success) {
                alert(`FALLO DE CONEXIÓN:\n\nError: ${result.error}\n\nEsto confirma un problema de permisos en Firebase Console.`);
            } else if (result.count && result.count > 0 && cashClosures.length === 0) {
                alert(`¡DATOS RECUPERADOS!\n\nSe encontraron ${result.count} registros que estaban "escondidos". He forzado su visualización ahora mismo.`);
            } else if (result.count === 0) {
                alert(`CONEXIÓN OK PERO VACÍA:\n\nFirebase responde bien, pero no hay registros reales en la base de datos de este proyecto.`);
            }
        } catch (e: any) {
            alert(`Error inesperado: ${e.message}`);
        } finally {
            setIsSyncing(false);
        }
    };

    // Usar datos de diagnóstico si el stream principal falla
    const effectiveClosures = cashClosures.length > 0 ? cashClosures : (diagResult?.data || []);

    const safeFormatDate = (dateStr: string, formatStr: string) => {
        try {
            if (!dateStr) return '---';
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return '---';
            return format(d, formatStr, { locale: es });
        } catch (e) {
            return '---';
        }
    };

    const renderDailyClosures = () => {
        const sortedClosures = [...(effectiveClosures || [])].sort((a, b) => {
            if (!a.date || !b.date) return 0;
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            if (dateA !== dateB) return dateB - dateA;
            if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
            return 0;
        });

        return (
            <div className="space-y-6">
                {effectiveClosures.length > 0 && (
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-4 py-4">Fecha / Periodo</th>
                                    <th className="px-4 py-4 text-center">Ventas Sistema</th>
                                    <th className="px-4 py-4 text-center">Efectivo Real</th>
                                    <th className="px-4 py-4 text-center">Transf. Real</th>
                                    <th className="px-4 py-4 text-center">Fondo Cambio</th>
                                    <th className="px-4 py-4 text-center">Retirado</th>
                                    <th className="px-4 py-4 text-center">Total Audidato</th>
                                    <th className="px-4 py-4 text-center">Estado / Dif.</th>
                                    <th className="px-4 py-4 text-right">Usuario</th>
                                    <th className="px-4 py-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {sortedClosures.map((c) => {
                                    const totalReal = (c.cashActual || 0) + (c.transActual || 0);
                                    const totalExpected = (c.cashExpected || 0) + (c.transExpected || 0);
                                    const isSquare = (c.difference || 0) >= 0;
                                    return (
                                        <tr key={c.id || Math.random()} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="px-4 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-black text-slate-900 uppercase whitespace-nowrap">{safeFormatDate(c.date + 'T12:00:00', 'eee, d MMM')}</span>
                                                    {c.notes && (
                                                        <span className="text-[9px] text-slate-400 italic font-medium truncate max-w-[120px] group-hover:text-slate-500">
                                                            "{c.notes}"
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-slate-400 text-[8px] font-bold uppercase">Sistema</span>
                                                    <span className="font-bold text-slate-500">${totalExpected.toFixed(2)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-700">${(c.cashActual || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-center font-bold text-slate-700">${(c.transActual || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-center font-bold text-indigo-600">${(c.cashLeftForChange || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-center font-bold text-orange-600">${(c.cashWithdrawn || 0).toFixed(2)}</td>
                                            <td className="px-4 py-4 text-center">
                                                <span className="font-black text-slate-900 bg-slate-100 px-2 py-1 rounded-lg">${totalReal.toFixed(2)}</span>
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[9px] font-black ${isSquare ? 'bg-teal-50 text-teal-600 border border-teal-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                                    {isSquare ? 'CUADRADO' : 'FALTANTE'}
                                                    <span className="opacity-60">(${Math.abs(c.difference || 0).toFixed(2)})</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right">
                                                <span className="text-[10px] text-slate-400 font-black uppercase bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 whitespace-nowrap">{c.recordedBy}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => onEditClosure && onEditClosure(c)}
                                                        className="p-1.5 hover:bg-teal-50 text-teal-600 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit size={14} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteClosure(c.id || '')}
                                                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {effectiveClosures.length === 0 && (
                    <div className="bg-white p-6 md:p-16 rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center relative overflow-hidden">
                        <div className="relative z-10">
                        <History className="mx-auto text-slate-100 h-16 w-16 mb-4" />
                        <p className="text-slate-400 font-bold text-lg mb-2">Aún no hay registros de cierres diarios guardados.</p>
                        
                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                            {/* Panel de Conexión */}
                            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-left">
                                <div className="flex items-center gap-2 mb-4">
                                    <Database className="h-4 w-4 text-teal-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Conexión Firebase</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mb-1 uppercase font-bold">Proyecto Configurado:</p>
                                <p className="text-xs font-mono font-bold text-slate-700 bg-white p-3 rounded-xl border border-slate-100 break-all">
                                    {CURRENT_FIREBASE_CONFIG.projectId || 'NO CARGADO'}
                                </p>
                                <div className="mt-4 flex items-center gap-2 text-[9px] text-teal-600 font-black bg-teal-50/50 p-2 rounded-xl">
                                    <ShieldCheck className="h-3 w-3" />
                                    <span>PROTOCOLOS DE SINCRONIZACIÓN ACTIVOS</span>
                                </div>
                            </div>

                            {/* Panel de Diagnóstico */}
                            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-left">
                                <div className="flex items-center gap-2 mb-4">
                                    <Terminal className="h-4 w-4 text-orange-600" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Diagnóstico Maestro</span>
                                </div>
                                <p className="text-[10px] text-orange-800/70 mb-3 font-medium leading-relaxed">Si registraste y no aparece, usa esta herramienta para detectar errores de permisos:</p>
                                <button 
                                    onClick={handleDiagnostic}
                                    disabled={isSyncing}
                                    className="w-full bg-orange-500 text-white flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {isSyncing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Terminal className="h-3 w-3" />}
                                    {isSyncing ? 'Diagnosticando...' : 'Diagnosticar Conexión'}
                                </button>
                                {diagResult && !diagResult.success && (
                                    <div className="mt-3 bg-white p-2 rounded-lg border border-red-100">
                                        <p className="text-[9px] text-red-500 font-bold uppercase">Error Detectado:</p>
                                        <p className="text-[8px] text-red-400 font-medium break-words">{diagResult.error}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-10 flex flex-col items-center gap-4">
                            <button 
                                onClick={() => window.location.reload()}
                                className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-slate-900/20 hover:scale-105 active:scale-95 transition-all"
                            >
                                <RefreshCw className="inline-block h-3 w-3 mr-2" />
                                Reiniciar Aplicación
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        );
    };

    const renderMonthlyYearlySummary = () => {
        // Agrupar por año
        const yearlyMap: Record<string, { gross: number, net: number, expenses: number, count: number }> = {};
        
        const safeMonthlyFinance = Array.isArray(monthlyFinance) ? monthlyFinance : [];
        safeMonthlyFinance.forEach(f => {
            if (!f || !f.month) return;
            const year = f.month.split('-')[0];
            if (!year) return;
            if (!yearlyMap[year]) yearlyMap[year] = { gross: 0, net: 0, expenses: 0, count: 0 };
            yearlyMap[year].gross += f.grossIncome || 0;
            yearlyMap[year].net += f.netProfit || 0;
            yearlyMap[year].expenses += f.totalExpenses || 0;
            yearlyMap[year].count++;
        });

        return (
            <div className="space-y-10">
                {/* Cuadro Resumen Mes Actual */}
                <div className="bg-white p-8 rounded-[2.5rem] border border-teal-100 shadow-xl shadow-teal-900/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl group-hover:bg-teal-100 transition-colors duration-700"></div>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="text-center md:text-left">
                            <div className="flex items-center gap-2 mb-3 justify-center md:justify-start">
                                <TrendingUp size={16} className="text-teal-600" />
                                <h4 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em]">Desempeño Mes Actual ({currentMonthStats?.monthKey || '---'})</h4>
                            </div>
                            <div className="text-5xl font-black text-slate-900 tracking-tighter flex items-baseline gap-2">
                                ${(netProfit || 0).toFixed(2)}
                                <span className="text-xs font-bold text-gray-400 lowercase tracking-normal bg-gray-100 px-3 py-1 rounded-full">utilidad neta real</span>
                            </div>
                        </div>
                        
                        <button 
                            onClick={onRegisterMonthlyFinance}
                            className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-slate-900/20 hover:bg-black transition-all active:scale-95 flex items-center gap-3 group/btn"
                        >
                            <Save size={20} className="group-hover/btn:scale-110 transition-transform"/> Registrar Cierre de Mes
                        </button>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-12 relative z-10 border-t border-gray-50 pt-10">
                        <div className="space-y-1 text-center md:text-left">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Ingresos Brutos</label>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">${(currentMonthStats?.currentMonthRev || 0).toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Margen Ventas</label>
                            <span className="text-2xl font-black text-teal-600 tracking-tight">${(currentMonthStats?.currentMonthGP || 0).toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                            <label className="text-[9px] font-black text-red-400 uppercase tracking-widest block">Gastos Operativos</label>
                            <span className="text-2xl font-black text-red-600 tracking-tight">-${(currentMonthExpenses || 0).toFixed(2)}</span>
                        </div>
                        <div className="space-y-1 text-center md:text-left">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cant. Pedidos</label>
                            <span className="text-2xl font-black text-slate-900 tracking-tight">{currentMonthStats?.currentMonthOrdersCount || 0}</span>
                        </div>
                    </div>

                    {/* Breakdown de Gastos */}
                    <div className="mt-8 pt-8 border-t border-gray-50 relative z-10">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Desglose de Gastos del Mes</h5>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(expenseBreakdown || {}).map(([cat, val]) => (
                                <div key={cat} className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                                    <span className="w-2 h-2 rounded-full bg-red-400"></span>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{cat === 'INVENTORY' ? 'Inventario/Proveedores' : cat}:</span>
                                    <span className="text-xs font-black text-slate-800">${(typeof val === 'number' ? val : 0).toFixed(2)}</span>
                                </div>
                            ))}
                            {Object.keys(expenseBreakdown || {}).length === 0 && (
                                <p className="text-[10px] text-gray-400 font-medium italic">Sin gastos registrados este mes.</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Resúmenes Anuales */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Calendar className="text-teal-600" size={18} /> Resumen de Cierres Anuales
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(yearlyMap).map(([year, data]) => (
                            <div key={year} className="bg-slate-900 text-white p-7 rounded-[2rem] shadow-2xl relative overflow-hidden group">
                                <TrendingUp className="absolute bottom-4 right-4 text-white/5 w-24 h-24 rotate-12 group-hover:text-teal-500/10 transition-colors" />
                                <div className="flex justify-between items-center mb-8">
                                    <h4 className="text-2xl font-black italic tracking-tighter uppercase whitespace-pre line-clamp-1">{year}</h4>
                                    <span className="bg-teal-500/20 text-teal-400 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest">{data.count} meses</span>
                                </div>
                                <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Bruto Anual</p>
                                        <p className="text-lg font-black text-teal-400 tracking-tight">${data.gross.toFixed(2)}</p>
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">Gastos Total</p>
                                        <p className="text-lg font-black text-red-400 tracking-tight">${data.expenses.toFixed(2)}</p>
                                    </div>
                                    <div className="col-span-2 pt-4 border-t border-white/10 mt-2">
                                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Utilidad Neta del Año</p>
                                        <p className="text-3xl font-black text-white tracking-tighter">${data.net.toFixed(2)}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabla de Historial Mes a Mes */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <History className="text-teal-600" size={18} /> Detalle de Meses Registrados
                    </h3>
                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm overflow-hidden overflow-x-auto">
                        <table className="min-w-full text-left">
                            <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest border-b">
                                <tr>
                                    <th className="px-8 py-5">Mes / Periodo</th>
                                    <th className="px-8 py-5">Ventas Brutas</th>
                                    <th className="px-8 py-5">Gastos</th>
                                    <th className="px-8 py-5">Utilidad Neta</th>
                                    <th className="px-8 py-5">Pedidos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 text-xs">
                                {(monthlyFinance || []).map((f) => (
                                    <tr key={f.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-8 py-6 font-black uppercase text-slate-900">{safeFormatDate(f.month + '-02', 'MMMM yyyy')}</td>
                                        <td className="px-8 py-6 font-bold text-slate-600">${(f.grossIncome || 0).toFixed(2)}</td>
                                        <td className="px-8 py-6 text-red-500 font-bold">-${(f.totalExpenses || 0).toFixed(2)}</td>
                                        <td className="px-8 py-6">
                                            <span className={`inline-block px-4 py-1.5 rounded-xl font-black text-[10px] tracking-tight ${(f.netProfit || 0) >= 0 ? 'bg-teal-50 text-teal-600 shadow-sm shadow-teal-600/5' : 'bg-red-50 text-red-600 shadow-sm shadow-red-600/5'}`}>
                                                ${(f.netProfit || 0).toFixed(2)}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 font-black text-slate-400">{f.totalOrders || 0}</td>
                                    </tr>
                                ))}
                                {(monthlyFinance || []).length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-8 py-16 text-center text-gray-400 font-bold uppercase text-[10px] tracking-widest italic">
                                            No hay cierres mensuales registrados aún.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-8 animate-in mt-2 mb-10 overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tighter flex items-center gap-4">
                        <div className="bg-teal-600 p-2 rounded-2xl shadow-xl shadow-teal-600/20 text-white">
                            <Wallet size={24} />
                        </div>
                        Registro Financiero Auditado
                    </h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1.5 ml-1">Administración de ingresos, gastos y márgenes de utilidad</p>
                </div>

                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto self-stretch md:self-auto gap-2 items-center">
                    <button 
                        onClick={() => {
                            console.log("Forcing manual re-sync...");
                            window.location.reload();
                        }}
                        className="bg-white px-4 py-2.5 rounded-xl text-slate-600 hover:text-teal-600 transition-all shadow-sm border border-slate-200 flex items-center gap-2 group"
                    >
                        <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Sincronizar</span>
                    </button>
                    <div className="h-8 w-px bg-slate-200 mx-1 hidden md:block"></div>
                    <button 
                        onClick={() => setSubTab('daily')}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'daily' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Cierres Diarios
                    </button>
                    <button 
                        onClick={() => setSubTab('monthly')}
                        className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${subTab === 'monthly' ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Mensual / Anual
                    </button>
                </div>
            </div>

            {subTab === 'daily' ? renderDailyClosures() : renderMonthlyYearlySummary()}
        </div>
    );
};

export default AdminFinances;
