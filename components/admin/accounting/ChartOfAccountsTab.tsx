import React, { useState } from 'react';
import { Account, AccountCategory, JournalEntry } from '../../../types/accounting';
import { Plus, Search } from 'lucide-react';

interface ChartOfAccountsTabProps {
  accounts: Account[];
  entries: JournalEntry[];
  onSaveAccount: (account: Account) => Promise<void>;
}

export const ChartOfAccountsTab: React.FC<ChartOfAccountsTabProps> = ({
  accounts,
  entries,
  onSaveAccount
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AccountCategory | 'ALL'>('ALL');
  
  // Modal para nueva cuenta
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<AccountCategory>('ACTIVO');
  const [newDescription, setNewDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Calcular saldo en tiempo real para cada cuenta según los asientos
  const accountsWithCalculatedBalances = accounts.map(acc => {
    let balance = 0;
    entries.forEach(entry => {
      entry.lines.forEach(line => {
        if (line.accountId === acc.id || line.accountCode === acc.code) {
          if (acc.category === 'ACTIVO' || acc.category === 'GASTO') {
            balance += (line.debit - line.credit);
          } else {
            balance += (line.credit - line.debit);
          }
        }
      });
    });
    return { ...acc, calculatedBalance: balance };
  });

  const filteredAccounts = accountsWithCalculatedBalances.filter(acc => {
    const matchesSearch = 
      acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      acc.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || acc.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const categoriesList: { key: AccountCategory; label: string; bg: string; text: string }[] = [
    { key: 'ACTIVO', label: 'Activos', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', text: 'text-emerald-700' },
    { key: 'PASIVO', label: 'Pasivos', bg: 'bg-rose-50 text-rose-800 border-rose-200', text: 'text-rose-700' },
    { key: 'PATRIMONIO', label: 'Patrimonio', bg: 'bg-indigo-50 text-indigo-800 border-indigo-200', text: 'text-indigo-700' },
    { key: 'INGRESO', label: 'Ingresos', bg: 'bg-teal-50 text-teal-800 border-teal-200', text: 'text-teal-700' },
    { key: 'GASTO', label: 'Gastos', bg: 'bg-amber-50 text-amber-800 border-amber-200', text: 'text-amber-700' },
  ];

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      alert("Ingrese el código y el nombre de la cuenta.");
      return;
    }

    setIsSaving(true);
    try {
      const newAcc: Account = {
        id: newCode.trim(),
        code: newCode.trim(),
        name: newName.trim(),
        category: newCategory,
        subtype: 'GASTOS_DIVERSOS',
        balance: 0,
        isSystemAccount: false,
        description: newDescription.trim() || undefined,
        updatedAt: new Date().toISOString()
      };
      await onSaveAccount(newAcc);
      setShowAddModal(false);
      setNewCode('');
      setNewName('');
      setNewDescription('');
    } catch (err) {
      alert("Error al guardar la nueva cuenta.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">

      {/* Barra de Filtros y Acción */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex-1 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código (1.1.01) o nombre..."
              className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-2 rounded-xl text-xs font-black transition-colors ${
                selectedCategory === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas
            </button>
            {categoriesList.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-2 rounded-xl text-xs font-black border transition-colors ${
                  selectedCategory === cat.key
                    ? `${cat.bg} font-black shadow-sm`
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-slate-900 hover:bg-black text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Plus size={16} />
          <span>Añadir Cuenta Personalizada</span>
        </button>
      </div>

      {/* Grid de Cuentas Contables */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                <th className="p-4">Código</th>
                <th className="p-4">Nombre de la Cuenta Contable</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-right">Saldo Actualizado ($)</th>
                <th className="p-4">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredAccounts.map((acc) => {
                const catInfo = categoriesList.find(c => c.key === acc.category);
                return (
                  <tr key={acc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-black text-slate-900 bg-slate-50/60 w-28">{acc.code}</td>
                    <td className="p-4">
                      <div className="font-extrabold text-slate-800 text-xs">{acc.name}</div>
                      {acc.description && (
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">{acc.description}</div>
                      )}
                    </td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${catInfo?.bg || 'bg-slate-100'}`}>
                        {acc.category}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-black text-sm">
                      <span className={acc.calculatedBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}>
                        ${acc.calculatedBalance.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      {acc.isSystemAccount ? (
                        <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                          Cuenta del Sistema
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Personalizada
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal para Crear Cuenta Personalizada */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Nueva Cuenta Contable</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Código de Cuenta (Ej: 5.1.07)</label>
                <input 
                  type="text"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value)}
                  placeholder="5.1.07"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Nombre de la Cuenta</label>
                <input 
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Mantenimiento de Climatización"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Categoría Principal</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as AccountCategory)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="ACTIVO">ACTIVO</option>
                  <option value="PASIVO">PASIVO</option>
                  <option value="PATRIMONIO">PATRIMONIO</option>
                  <option value="INGRESO">INGRESO</option>
                  <option value="GASTO">GASTO</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1">Descripción / Notas</label>
                <textarea 
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Propósito de esta cuenta..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none focus:ring-2 focus:ring-teal-500"
                  rows={2}
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 font-black uppercase text-white bg-slate-900 hover:bg-black rounded-xl"
                >
                  {isSaving ? 'Guardando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
