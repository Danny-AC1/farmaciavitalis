import React, { useState } from 'react';
import { JournalEntry } from '../../../types/accounting';
import { 
  PlusCircle, 
  Search, 
  Calendar, 
  FileText, 
  CheckCircle, 
  Filter, 
  ChevronDown, 
  ChevronUp, 
  Eye, 
  EyeOff,
  Pencil,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

interface JournalEntriesTabProps {
  entries: JournalEntry[];
  onOpenNewModal: () => void;
  onEditEntry: (entry: JournalEntry) => void;
  onDeleteEntry: (entry: JournalEntry) => void;
}

export const JournalEntriesTab: React.FC<JournalEntriesTabProps> = ({
  entries,
  onOpenNewModal,
  onEditEntry,
  onDeleteEntry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  // Por defecto TODOS comprimidos (objeto vacío)
  const [expandedEntries, setExpandedEntries] = useState<Record<string, boolean>>({});
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | null>(null);

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.createdByName && entry.createdByName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && entry.referenceType === filterType;
  });

  const toggleEntry = (id: string) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const allExpanded: Record<string, boolean> = {};
    filteredEntries.forEach(entry => {
      allExpanded[entry.id] = true;
    });
    setExpandedEntries(allExpanded);
  };

  const collapseAll = () => {
    setExpandedEntries({});
  };

  const getReferenceBadge = (refType?: string) => {
    switch (refType) {
      case 'POS_SALE':
        return <span className="bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Venta POS</span>;
      case 'EXPENSE':
        return <span className="bg-rose-50 text-rose-700 border border-rose-200/80 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Gasto</span>;
      case 'CREDIT_PAYMENT':
        return <span className="bg-blue-50 text-blue-700 border border-blue-200/80 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Fiado / Crédito</span>;
      case 'MANUAL_ADJUSTMENT':
        return <span className="bg-purple-50 text-purple-700 border border-purple-200/80 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Manual</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 border border-slate-200/80 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase">Asiento</span>;
    }
  };

  const allAreExpanded = filteredEntries.length > 0 && filteredEntries.every(e => expandedEntries[e.id]);

  return (
    <div className="space-y-4">
      
      {/* Controles de búsqueda y acciones */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por concepto, N° comprobante..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter size={14} className="text-slate-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-2xl px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none w-full sm:w-auto"
            >
              <option value="ALL">Todos los Comprobantes ({entries.length})</option>
              <option value="POS_SALE">Ventas POS / Online</option>
              <option value="EXPENSE">Gastos Operativos</option>
              <option value="CREDIT_PAYMENT">Medicamento Fiado / Créditos</option>
              <option value="MANUAL_ADJUSTMENT">Asientos Manuales</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Botón de Comprimir / Expandir Todo */}
          {filteredEntries.length > 0 && (
            <button
              onClick={allAreExpanded ? collapseAll : expandAll}
              className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-black text-xs transition-colors flex items-center gap-1.5"
              title={allAreExpanded ? "Comprimir todos los asientos" : "Expandir todos los asientos"}
            >
              {allAreExpanded ? (
                <>
                  <EyeOff size={14} />
                  <span>Comprimir Todos</span>
                </>
              ) : (
                <>
                  <Eye size={14} />
                  <span>Expandir Todos</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onOpenNewModal}
            className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-extrabold text-xs px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            <PlusCircle size={16} />
            <span>Nuevo Asiento</span>
          </button>
        </div>
      </div>

      {/* Lista de Comprobantes Contables */}
      {filteredEntries.length === 0 ? (
        <div className="bg-slate-50 rounded-3xl p-12 text-center border border-dashed border-slate-200 space-y-3">
          <FileText className="mx-auto text-slate-300" size={40} />
          <h3 className="text-sm font-black text-slate-700 uppercase tracking-wide">No se encontraron asientos contables</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            No hay registros para este filtro o aún no has sincronizado las ventas y gastos.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredEntries.map((entry) => {
            const isExpanded = !!expandedEntries[entry.id];

            return (
              <div 
                key={entry.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Cabecera / Fila Comprimida Interactiva */}
                <div 
                  onClick={() => toggleEntry(entry.id)}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/80 transition select-none"
                >
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="bg-slate-900 text-teal-400 font-mono text-[11px] font-black px-2.5 py-1 rounded-xl shadow-xs shrink-0">
                      {entry.entryNumber}
                    </span>

                    {getReferenceBadge(entry.referenceType)}

                    <span className="text-xs font-black text-slate-800 tracking-tight line-clamp-1">
                      {entry.concept}
                    </span>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3.5 shrink-0">
                    {/* Fecha */}
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                      <Calendar size={12} />
                      <span>{entry.date}</span>
                    </div>

                    {/* Resumen Total Debe / Haber */}
                    <div className="flex items-center gap-2 bg-slate-100/90 px-2.5 py-1 rounded-xl font-mono text-xs">
                      <span className="text-[10px] text-slate-400 font-sans font-bold">Total:</span>
                      <span className="font-black text-slate-800">${entry.totalDebit.toFixed(2)}</span>
                    </div>

                    {/* Botones de Acción Rápida (Editar y Eliminar) */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditEntry(entry);
                        }}
                        className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition cursor-pointer"
                        title="Editar comprobante"
                      >
                        <Pencil size={14} />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEntryToDelete(entry);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                        title="Eliminar comprobante"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Botón Indicador de Despliegue */}
                    <div className="flex items-center gap-1 text-[10px] font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-xl">
                      <span>{isExpanded ? 'Ocultar' : 'Ver Detalle'}</span>
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>
                </div>

                {/* Detalle de las líneas del asiento (Solo si está expandido) */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 pt-0 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-150 space-y-3">
                    <div className="overflow-x-auto pt-3">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                            <th className="py-2 px-3">Código</th>
                            <th className="py-2 px-3">Cuenta Contable</th>
                            <th className="py-2 px-3 text-right">Debe ($)</th>
                            <th className="py-2 px-3 text-right">Haber ($)</th>
                            <th className="py-2 px-3">Detalle / Memo</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 text-xs">
                          {entry.lines.map((line, lIdx) => (
                            <tr key={lIdx} className="hover:bg-slate-50/50">
                              <td className="py-2 px-3 font-mono text-[11px] font-bold text-slate-500">{line.accountCode}</td>
                              <td className="py-2 px-3 font-extrabold text-slate-800">{line.accountName}</td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                                {line.debit > 0 ? `$${line.debit.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-mono font-bold text-blue-600">
                                {line.credit > 0 ? `$${line.credit.toFixed(2)}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-[11px] text-slate-400 italic">{line.memo || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-mono text-xs font-black border-t border-slate-200 text-slate-800">
                            <td colSpan={2} className="py-2 px-3 uppercase text-[10px] text-slate-500 font-sans">
                              Totales Partida Doble
                            </td>
                            <td className="py-2 px-3 text-right text-emerald-700">${entry.totalDebit.toFixed(2)}</td>
                            <td className="py-2 px-3 text-right text-blue-700">${entry.totalCredit.toFixed(2)}</td>
                            <td></td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {/* Pie del comprobante con metadata y acciones completas */}
                    <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-400 font-medium pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4 flex-wrap">
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <CheckCircle size={12} /> Estado: {entry.status}
                        </span>
                        {entry.createdByName && (
                          <span>
                            Registrado por: <strong className="text-slate-600">{entry.createdByName}</strong>
                          </span>
                        )}
                      </div>

                      {/* Botones de Acción en el pie */}
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onEditEntry(entry)}
                          className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Pencil size={13} />
                          <span>Editar Asiento</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEntryToDelete(entry)}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/80 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Trash2 size={13} />
                          <span>Eliminar Asiento</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Asiento */}
      {entryToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
                <AlertTriangle size={20} />
              </div>
              <button 
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition"
              >
                <X size={18} />
              </button>
            </div>

            <div>
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                ¿Eliminar Asiento Contable?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Estás a punto de eliminar el comprobante contable del Libro Diario. Esta acción recalculará los saldos contables y los estados financieros.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200/70 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Comprobante:</span>
                <span className="font-mono font-black text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                  {entryToDelete.entryNumber}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Fecha:</span>
                <span className="font-bold text-slate-700">{entryToDelete.date}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold">Total Asiento:</span>
                <span className="font-mono font-black text-emerald-600">${entryToDelete.totalDebit.toFixed(2)}</span>
              </div>
              <div className="pt-1.5 border-t border-slate-200/60">
                <span className="text-slate-400 font-bold block text-[10px] uppercase">Concepto:</span>
                <p className="font-bold text-slate-700 line-clamp-2 mt-0.5">{entryToDelete.concept}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEntryToDelete(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const toDel = entryToDelete;
                  setEntryToDelete(null);
                  onDeleteEntry(toDel);
                }}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Sí, Eliminar Asiento</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
