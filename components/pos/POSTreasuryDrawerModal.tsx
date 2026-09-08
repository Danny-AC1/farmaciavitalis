import React from 'react';
import { 
  X, 
  Building2, 
  Coins, 
  History, 
  BookOpen, 
  CheckCircle, 
  AlertCircle, 
  Lock, 
  ExternalLink, 
  Landmark 
} from 'lucide-react';
import { User } from '../../types';
import { TreasurySessionOpenForm } from './treasury/TreasurySessionOpenForm';
import { TreasuryActiveSessionView } from './treasury/TreasuryActiveSessionView';
import { TreasuryTransactionsTab } from './treasury/TreasuryTransactionsTab';
import { TreasuryDepositsTab } from './treasury/TreasuryDepositsTab';
import { TreasuryHistoryTab } from './treasury/TreasuryHistoryTab';
import { useTreasuryModalState } from './treasury/useTreasuryModalState';

interface POSTreasuryDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: User | null;
  users?: User[];
  onGoToExtensionSuite?: () => void;
}

export const POSTreasuryDrawerModal: React.FC<POSTreasuryDrawerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users = [],
  onGoToExtensionSuite
}) => {
  const state = useTreasuryModalState(isOpen, currentUser);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-slate-50 border border-slate-200 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        <div className="bg-white px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-slate-900 to-slate-800 text-rose-400 flex items-center justify-center shadow-md">
              <Landmark size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900 tracking-tight">Tesorería Avanzada & Caja POS</h3>
                {state.activeSession ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    TURNO ABIERTO: {state.activeSession.openedBy}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                    <Lock size={10} />
                    CAJA CERRADA
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-medium">Control de arqueo de billetes, egresos de caja chica y cuadre de efectivo.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onGoToExtensionSuite && (
              <button
                onClick={() => { onClose(); onGoToExtensionSuite(); }}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
                title="Abrir en Módulo Completo de Suite Gerencial"
              >
                <ExternalLink size={13} />
                Suite Gerencial
              </button>
            )}
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="bg-slate-100 px-5 py-2 border-b border-slate-200 flex flex-wrap items-center gap-1.5 shrink-0">
          <button
            onClick={() => state.setActiveTab('session')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${state.activeTab === 'session' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <BookOpen size={13} />
            {state.activeSession ? 'Turno Activo & Arqueo' : 'Apertura de Caja'}
          </button>
          <button
            onClick={() => state.setActiveTab('transactions')}
            disabled={!state.activeSession}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${state.activeTab === 'transactions' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Coins size={13} />
            Egresos / Caja Chica {state.activeSessionCalculations?.totalEgresos ? `(-$${state.activeSessionCalculations.totalEgresos.toFixed(2)})` : ''}
          </button>
          <button
            onClick={() => state.setActiveTab('deposits')}
            disabled={!state.activeSession}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer ${state.activeTab === 'deposits' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <Building2 size={13} />
            Depósitos Bancarios
          </button>
          <button
            onClick={() => state.setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${state.activeTab === 'history' ? 'bg-slate-900 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
          >
            <History size={13} />
            Historial de Cierres ({state.sessions.filter(s => s.status === 'CLOSED').length})
          </button>
        </div>

        {state.successMsg && (
          <div className="mx-5 mt-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <CheckCircle size={16} className="text-emerald-600 shrink-0" />
            <span>{state.successMsg}</span>
          </div>
        )}
        {state.errorMsg && (
          <div className="mx-5 mt-3 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-2.5 rounded-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{state.errorMsg}</span>
          </div>
        )}

        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {state.activeTab === 'session' && (
            !state.activeSession ? (
              <TreasurySessionOpenForm
                cashierName={state.cashierName}
                setCashierName={state.setCashierName}
                initialCashStr={state.initialCashStr}
                setInitialCashStr={state.setInitialCashStr}
                users={users}
                onSubmit={state.handleOpenSession}
              />
            ) : (
              <TreasuryActiveSessionView
                activeSession={state.activeSession}
                calcs={state.activeSessionCalculations}
                arqueo={state.arqueo}
                setArqueo={state.setArqueo}
                adjustDenom={state.adjustDenom}
                countedCashSum={state.countedCashSum}
                auditNotes={state.auditNotes}
                setAuditNotes={state.setAuditNotes}
                isCierreConfirmed={state.isCierreConfirmed}
                setIsCierreConfirmed={state.setIsCierreConfirmed}
                onCloseSession={state.handleCloseSessionSubmit}
              />
            )
          )}
          {state.activeTab === 'transactions' && state.activeSession && (
            <TreasuryTransactionsTab
              txType={state.txType}
              setTxType={state.setTxType}
              txCategory={state.txCategory}
              setTxCategory={state.setTxCategory}
              txAmountStr={state.txAmountStr}
              setTxAmountStr={state.setTxAmountStr}
              txConcept={state.txConcept}
              setTxConcept={state.setTxConcept}
              txBeneficiary={state.txBeneficiary}
              setTxBeneficiary={state.setTxBeneficiary}
              transactions={state.activeSessionCalculations?.transactions || []}
              totalEgresos={state.activeSessionCalculations?.totalEgresos || 0}
              onAddTransaction={state.handleAddTransaction}
              onDeleteTransaction={state.deleteTransaction}
            />
          )}
          {state.activeTab === 'deposits' && state.activeSession && (
            <TreasuryDepositsTab
              depBankName={state.depBankName}
              setDepBankName={state.setDepBankName}
              depReference={state.depReference}
              setDepReference={state.setDepReference}
              depAmountStr={state.depAmountStr}
              setDepAmountStr={state.setDepAmountStr}
              depNotes={state.depNotes}
              setDepNotes={state.setDepNotes}
              deposits={state.deposits}
              onAddDeposit={state.handleAddDeposit}
              onToggleStatus={state.toggleDepositStatus}
              onDeleteDeposit={state.deleteDeposit}
            />
          )}
          {state.activeTab === 'history' && (
            <TreasuryHistoryTab
              sessions={state.sessions}
              onDeleteSession={state.deleteSession}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default POSTreasuryDrawerModal;
