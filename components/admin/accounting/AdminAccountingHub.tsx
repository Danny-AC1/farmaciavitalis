import React, { useState, useEffect } from 'react';
import { Account, JournalEntry } from '../../../types/accounting';
import { Order, CreditTicket, Expense } from '../../../types';
import { 
  streamAccounts, 
  streamJournalEntries, 
  addJournalEntryDB, 
  saveAccountDB, 
  syncAutomaticAccountingEntries 
} from '../../../services/db.accounting';
import { 
  Scale, 
  BookOpenCheck, 
  Calculator, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  Layers 
} from 'lucide-react';
import { JournalEntriesTab } from './JournalEntriesTab';
import { ChartOfAccountsTab } from './ChartOfAccountsTab';
import { FinancialStatementsTab } from './FinancialStatementsTab';
import { NewJournalEntryModal } from './NewJournalEntryModal';

interface AdminAccountingHubProps {
  orders: Order[];
  credits: CreditTicket[];
  expenses: Expense[];
}

export const AdminAccountingHub: React.FC<AdminAccountingHubProps> = ({
  orders,
  credits,
  expenses
}) => {
  const [activeTab, setActiveTab] = useState<'financial_statements' | 'journal_entries' | 'chart_of_accounts'>('financial_statements');
  
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [showNewEntryModal, setShowNewEntryModal] = useState(false);

  // Escuchar cuentas y asientos en tiempo real
  useEffect(() => {
    const unsubscribeAcc = streamAccounts((accs) => {
      setAccounts(accs);
    });

    const unsubscribeEntries = streamJournalEntries((ent) => {
      setEntries(ent);
    });

    return () => {
      unsubscribeAcc();
      unsubscribeEntries();
    };
  }, []);

  // Función para sincronizar asientos automáticos desde ventas POS, gastos y créditos
  const handleAutoSync = async () => {
    setIsSyncing(true);
    try {
      const createdCount = await syncAutomaticAccountingEntries(entries, orders, credits, expenses);
      if (createdCount > 0) {
        setToastMessage(`¡Éxito! Se generaron y asentaron ${createdCount} comprobantes contables automáticamente.`);
      } else {
        setToastMessage(`La contabilidad ya se encuentra 100% al día con las ventas y gastos actuales.`);
      }
      setTimeout(() => setToastMessage(null), 5000);
    } catch (err) {
      console.error(err);
      alert("Error durante la sincronización contable.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSaveJournalEntry = async (entry: JournalEntry) => {
    await addJournalEntryDB(entry);
    setToastMessage(`¡Asiento contable ${entry.entryNumber} registrado con éxito!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveAccount = async (acc: Account) => {
    await saveAccountDB(acc);
    setToastMessage(`¡Cuenta contable ${acc.code} - ${acc.name} guardada!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Mensaje Flotante de Confirmación */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-teal-300 border border-teal-500/30 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-black animate-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="text-teal-400" size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Principal del Módulo Contable */}
      <div className="bg-gradient-to-r from-slate-950 via-teal-950 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl border border-teal-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 bg-teal-500/20 text-teal-300 border border-teal-400/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
              <Sparkles size={13} /> Sistema Contable Gerencial Nivel 1
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              Contabilidad de Partida Doble
            </h2>
            <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
              Libro Diario, Plan de Cuentas, Estado de Resultados (P&L) y Balance General sincronizado automáticamente con ventas POS, medicamentos fiados y gastos.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              onClick={handleAutoSync}
              disabled={isSyncing}
              className="bg-teal-500 hover:bg-teal-400 text-slate-950 font-black text-xs px-5 py-3 rounded-2xl shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? 'Sincronizando...' : 'Sincronizar Ventas/Gastos POS'}</span>
            </button>

            <button
              onClick={() => setShowNewEntryModal(true)}
              className="bg-white/10 hover:bg-white/20 border border-white/20 text-white font-black text-xs px-5 py-3 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Calculator size={16} />
              <span>Asiento Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas Interactivas */}
      <div className="flex border-b border-slate-200 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <button
          onClick={() => setActiveTab('financial_statements')}
          className={`px-6 py-3.5 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'financial_statements'
              ? 'border-teal-600 text-teal-700 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Scale size={16} />
          <span>Estados Financieros (P&L y Balance)</span>
        </button>

        <button
          onClick={() => setActiveTab('journal_entries')}
          className={`px-6 py-3.5 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'journal_entries'
              ? 'border-teal-600 text-teal-700 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <BookOpenCheck size={16} />
          <span>Libro Diario ({entries.length} Asientos)</span>
        </button>

        <button
          onClick={() => setActiveTab('chart_of_accounts')}
          className={`px-6 py-3.5 text-xs font-black tracking-tight border-b-2 transition-all flex items-center gap-2 flex-shrink-0 ${
            activeTab === 'chart_of_accounts'
              ? 'border-teal-600 text-teal-700 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Layers size={16} />
          <span>Plan de Cuentas ({accounts.length})</span>
        </button>
      </div>

      {/* Contenido de la Pestaña Seleccionada */}
      {activeTab === 'financial_statements' && (
        <FinancialStatementsTab accounts={accounts} entries={entries} />
      )}

      {activeTab === 'journal_entries' && (
        <JournalEntriesTab 
          entries={entries} 
          onOpenNewModal={() => setShowNewEntryModal(true)} 
        />
      )}

      {activeTab === 'chart_of_accounts' && (
        <ChartOfAccountsTab 
          accounts={accounts} 
          entries={entries} 
          onSaveAccount={handleSaveAccount} 
        />
      )}

      {/* Modal para Crear Asiento Contable Manual */}
      {showNewEntryModal && (
        <NewJournalEntryModal
          accounts={accounts}
          onClose={() => setShowNewEntryModal(false)}
          onSubmit={handleSaveJournalEntry}
        />
      )}

    </div>
  );
};
