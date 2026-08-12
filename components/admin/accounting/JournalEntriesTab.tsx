import React, { useState } from 'react';
import { JournalEntry } from '../../../types/accounting';
import { PlusCircle, Search, Calendar, FileText, CheckCircle, Filter } from 'lucide-react';

interface JournalEntriesTabProps {
  entries: JournalEntry[];
  onOpenNewModal: () => void;
}

export const JournalEntriesTab: React.FC<JournalEntriesTabProps> = ({
  entries,
  onOpenNewModal
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredEntries = entries.filter(entry => {
    const matchesSearch = 
      entry.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.entryNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (entry.createdByName && entry.createdByName.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterType === 'ALL') return matchesSearch;
    return matchesSearch && entry.referenceType === filterType;
  });

  return (
    <div className="space-y-6">
      
      {/* Controles de búsqueda y botón nuevo asiento */}
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
              <option value="ALL">Todos los Comprobantes</option>
              <option value="POS_SALE">Ventas POS / Online</option>
              <option value="EXPENSE">Gastos Operativos</option>
              <option value="CREDIT_PAYMENT">Medicamento Fiado / Créditos</option>
              <option value="MANUAL_ADJUSTMENT">Asientos Manuales</option>
            </select>
          </div>
        </div>

        <button
          onClick={onOpenNewModal}
          className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg shadow-teal-600/25 transition-all flex items-center justify-center gap-2"
        >
          <PlusCircle size={16} />
          <span>Crear Asiento Manual</span>
        </button>
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
        <div className="space-y-4">
          {filteredEntries.map((entry) => (
            <div 
              key={entry.id}
              className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-shadow space-y-4"
            >
              {/* Cabecera del comprobante */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="bg-slate-900 text-teal-400 font-mono text-[11px] font-black px-3 py-1 rounded-xl shadow-sm">
                    {entry.entryNumber}
                  </span>
                  <span className="text-xs font-black text-slate-800">{entry.concept}</span>
                </div>

                <div className="flex items-center gap-3 text-[11px] text-slate-500 font-semibold">
                  <span className="flex items-center gap-1">
                    <Calendar size={13} className="text-slate-400" />
                    {entry.date}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200 text-[10px] uppercase flex items-center gap-1">
                    <CheckCircle size={11} /> {entry.status}
                  </span>
                </div>
              </div>

              {/* Detalle de las líneas del asiento */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-[9px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-100">
                      <th className="py-2 px-3">Código</th>
                      <th className="py-2 px-3">Cuenta Contable</th>
                      <th className="py-2 px-3 text-right">Debe ($)</th>
                      <th className="py-2 px-3 text-right">Haber ($)</th>
                      <th className="py-2 px-3">Detalle</th>
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
                      <td colSpan={2} className="py-2 px-3 uppercase text-[10px] text-slate-500 font-sans">Totales de Partida Doble</td>
                      <td className="py-2 px-3 text-right text-emerald-700">${entry.totalDebit.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right text-blue-700">${entry.totalCredit.toFixed(2)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Pie del comprobante */}
              {entry.createdByName && (
                <div className="text-[10px] text-slate-400 font-medium text-right pt-1">
                  Registrado por: <span className="font-bold text-slate-600">{entry.createdByName}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
