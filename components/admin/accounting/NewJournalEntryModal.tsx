import React, { useState } from 'react';
import { X, Plus, Trash2, CheckCircle2, AlertTriangle, Calculator, FileText } from 'lucide-react';
import { Account, JournalEntry, JournalEntryLine } from '../../../types/accounting';

interface NewJournalEntryModalProps {
  accounts: Account[];
  onClose: () => void;
  onSubmit: (entry: JournalEntry) => Promise<void>;
}

export const NewJournalEntryModal: React.FC<NewJournalEntryModalProps> = ({
  accounts,
  onClose,
  onSubmit
}) => {
  const [concept, setConcept] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [createdByName, setCreatedByName] = useState('Administrador Contable');
  
  const [lines, setLines] = useState<JournalEntryLine[]>([
    { accountId: accounts[0]?.id || '', accountCode: accounts[0]?.code || '', accountName: accounts[0]?.name || '', debit: 0, credit: 0, memo: '' },
    { accountId: accounts[1]?.id || '', accountCode: accounts[1]?.code || '', accountName: accounts[1]?.name || '', debit: 0, credit: 0, memo: '' },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const totalDebit = lines.reduce((sum, line) => sum + (Number(line.debit) || 0), 0);
  const totalCredit = lines.reduce((sum, line) => sum + (Number(line.credit) || 0), 0);
  const difference = Math.abs(totalDebit - totalCredit);
  const isBalanced = difference < 0.01 && totalDebit > 0;

  const handleAccountChange = (index: number, accountId: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return;
    const updated = [...lines];
    updated[index] = {
      ...updated[index],
      accountId: acc.id,
      accountCode: acc.code,
      accountName: acc.name
    };
    setLines(updated);
  };

  const handleLineValueChange = (index: number, field: 'debit' | 'credit' | 'memo', value: string) => {
    const updated = [...lines];
    if (field === 'memo') {
      updated[index].memo = value;
    } else {
      const num = parseFloat(value) || 0;
      updated[index][field] = num;
      // Auto-clear the opposite side if adding a value to avoid line imbalance
      if (field === 'debit' && num > 0) updated[index].credit = 0;
      if (field === 'credit' && num > 0) updated[index].debit = 0;
    }
    setLines(updated);
  };

  const addLine = () => {
    const defaultAcc = accounts[0] || { id: '', code: '', name: '' };
    setLines([
      ...lines,
      {
        accountId: defaultAcc.id,
        accountCode: defaultAcc.code,
        accountName: defaultAcc.name,
        debit: 0,
        credit: 0,
        memo: ''
      }
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      alert("Un asiento contable debe tener al menos 2 líneas.");
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!concept.trim()) {
      setErrorMsg("Ingrese el concepto o la glosa del asiento contable.");
      return;
    }

    if (!isBalanced) {
      setErrorMsg(`El asiento no está cuadrado. La diferencia entre Debe ($${totalDebit.toFixed(2)}) y Haber ($${totalCredit.toFixed(2)}) es de $${difference.toFixed(2)}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const entryId = `ASC_MAN_${Date.now()}`;
      const entryNumber = `ASC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newEntry: JournalEntry = {
        id: entryId,
        entryNumber,
        date,
        concept: concept.trim(),
        referenceType: 'MANUAL_ADJUSTMENT',
        lines: lines.map(l => ({
          ...l,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0
        })),
        totalDebit,
        totalCredit,
        createdByName: createdByName.trim() || 'Admin',
        status: 'ASENTADO',
        createdAt: new Date().toISOString()
      };

      await onSubmit(newEntry);
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || "Ocurrió un error al registrar el asiento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white flex items-center justify-between border-b border-teal-500/20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shadow-inner">
              <Calculator size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Contabilidad Partida Doble</span>
              <h3 className="text-lg font-black tracking-tight text-white">Nuevo Asiento Contable Manual</h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6 max-h-[82vh] overflow-y-auto">

          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-3">
              <AlertTriangle className="text-rose-600 flex-shrink-0" size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Datos Generales */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Fecha del Comprobante
              </label>
              <input 
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Registrado por
              </label>
              <input 
                type="text"
                value={createdByName}
                onChange={(e) => setCreatedByName(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Nombre del contador o admin"
                required
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-500 mb-1">
                Concepto / Glosa de la Transacción
              </label>
              <input 
                type="text"
                value={concept}
                onChange={(e) => setConcept(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                placeholder="Ej: Ajuste de saldo en caja por compra menor de insumos o aporte de capital..."
                required
              />
            </div>
          </div>

          {/* Tabla de Partida Doble (Debe / Haber) */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText size={15} className="text-teal-600" /> Detalle de Movimientos (Líneas de Débito y Crédito)
              </h4>
              <button
                type="button"
                onClick={addLine}
                className="bg-teal-50 hover:bg-teal-100 text-teal-700 font-extrabold text-[11px] px-3 py-1.5 rounded-xl border border-teal-200/80 transition flex items-center gap-1.5"
              >
                <Plus size={14} /> Añadir Línea
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm bg-white">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 text-[10px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                      <th className="p-3">Cuenta Contable</th>
                      <th className="p-3 w-40 text-right">Debe ($)</th>
                      <th className="p-3 w-40 text-right">Haber ($)</th>
                      <th className="p-3">Nota / Detalle Lineal</th>
                      <th className="p-3 w-10 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-2.5">
                          <select
                            value={line.accountId}
                            onChange={(e) => handleAccountChange(idx, e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
                          >
                            {accounts.map(acc => (
                              <option key={acc.id} value={acc.id}>
                                {acc.code} - {acc.name} ({acc.category})
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="p-2.5">
                          <input 
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.debit || ''}
                            onChange={(e) => handleLineValueChange(idx, 'debit', e.target.value)}
                            placeholder="0.00"
                            className="w-full text-right bg-emerald-50/50 border border-emerald-200 rounded-xl p-2 font-mono font-bold text-emerald-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                          />
                        </td>

                        <td className="p-2.5">
                          <input 
                            type="number"
                            step="0.01"
                            min="0"
                            value={line.credit || ''}
                            onChange={(e) => handleLineValueChange(idx, 'credit', e.target.value)}
                            placeholder="0.00"
                            className="w-full text-right bg-blue-50/50 border border-blue-200 rounded-xl p-2 font-mono font-bold text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none"
                          />
                        </td>

                        <td className="p-2.5">
                          <input 
                            type="text"
                            value={line.memo || ''}
                            onChange={(e) => handleLineValueChange(idx, 'memo', e.target.value)}
                            placeholder="Opcional..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs text-slate-700 focus:ring-2 focus:ring-teal-500 outline-none"
                          />
                        </td>

                        <td className="p-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeLine(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Eliminar fila"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Resumen de Totales y Verificación de Equilibrio */}
              <div className="bg-slate-900 text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-800">
                <div className="flex items-center gap-6 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-emerald-400 font-sans uppercase font-bold block">Total Debe</span>
                    <span className="text-base font-black text-emerald-400">${totalDebit.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-blue-400 font-sans uppercase font-bold block">Total Haber</span>
                    <span className="text-base font-black text-blue-400">${totalCredit.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-sans uppercase font-bold block">Diferencia</span>
                    <span className={`text-base font-black ${difference < 0.01 ? 'text-slate-300' : 'text-rose-400'}`}>
                      ${difference.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isBalanced ? (
                    <div className="flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3.5 py-1.5 rounded-xl text-xs font-black">
                      <CheckCircle2 size={16} />
                      <span>¡Asiento Cuadrado!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 px-3.5 py-1.5 rounded-xl text-xs font-black">
                      <AlertTriangle size={16} />
                      <span>Asiento Descuadrado</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!isBalanced || isSubmitting}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider text-white transition-all shadow-lg flex items-center gap-2 ${
                isBalanced && !isSubmitting
                  ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30 cursor-pointer'
                  : 'bg-slate-300 cursor-not-allowed shadow-none'
              }`}
            >
              <CheckCircle2 size={16} />
              {isSubmitting ? 'Asentando Transacción...' : 'Guardar y Asentar Comprobante'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
