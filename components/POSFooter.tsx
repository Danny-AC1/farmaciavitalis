
import React from 'react';
import { Gift, ChevronDown, ChevronUp, Loader2, Printer, Banknote, Landmark } from 'lucide-react';
import { User } from '../types';

interface POSFooterProps {
  selectedCustomer: User | null;
  canUsePoints: boolean;
  usePoints: boolean;
  setUsePoints: (b: boolean) => void;
  posTotal: number;
  discount: number;
  showPaymentDetails: boolean;
  setShowPaymentDetails: (b: boolean) => void;
  onCheckoutClick: () => void;
  isProcessing: boolean;
  posCartEmpty: boolean;
  posPaymentMethod: 'CASH' | 'TRANSFER';
  setPosPaymentMethod: (m: 'CASH' | 'TRANSFER') => void;
  posCashReceived: string;
  setPosCashReceived: (s: string) => void;
  changeDue: number;
}

const POSFooter: React.FC<POSFooterProps> = ({
  selectedCustomer, canUsePoints, usePoints, setUsePoints, posTotal, discount,
  showPaymentDetails, setShowPaymentDetails, onCheckoutClick, isProcessing,
  posCartEmpty, posPaymentMethod, setPosPaymentMethod, posCashReceived,
  setPosCashReceived, changeDue
}) => {
  return (
    <div className="shrink-0 bg-slate-900 p-3 md:p-4 md:px-8 md:py-5 text-white border-t border-slate-800 shadow-2xl z-30">
      <div className="max-w-[1600px] mx-auto">
        
        {/* Lógica de Canje en Footer */}
        {selectedCustomer && canUsePoints && (
          <div className="mb-4 bg-teal-500/10 border border-teal-500/30 p-3 rounded-2xl flex items-center justify-between animate-in slide-in-from-bottom-2">
              <div className="flex items-center gap-3">
                  <div className="bg-teal-600 p-2 rounded-xl shadow-lg shadow-teal-600/20 text-white">
                      <Gift size={18}/>
                  </div>
                  <div>
                      <p className="text-[10px] font-black uppercase text-teal-400 leading-none mb-1">Premio Disponible</p>
                      <p className="text-xs font-bold text-white uppercase tracking-tight">Canjear $5.00 OFF con 500 pts</p>
                  </div>
              </div>
              <div className="flex items-center gap-3">
                  <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${usePoints ? 'bg-yellow-400 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                      {usePoints ? 'APLICADO ✅' : 'SIN USAR'}
                  </span>
                  <input 
                    type="checkbox" 
                    className="h-6 w-6 rounded-lg accent-teal-500 cursor-pointer" 
                    checked={usePoints}
                    onChange={e => setUsePoints(e.target.checked)}
                  />
              </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-3 md:hidden">
          <div>
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block">TOTAL</span>
            <p className="text-2xl font-black text-teal-400 tracking-tighter leading-none flex items-start gap-0.5">
              <span className="text-xs opacity-50 mt-1">$</span>{posTotal.toFixed(2)}
            </p>
            {discount > 0 && <p className="text-[8px] text-yellow-400 font-bold uppercase mt-1">Beneficio: -$5.00</p>}
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowPaymentDetails(!showPaymentDetails)}
              className="text-slate-400 flex items-center gap-1 text-[10px] font-bold uppercase p-2 bg-slate-800 rounded-lg"
            >
              {showPaymentDetails ? <ChevronDown size={14}/> : <ChevronUp size={14}/>} Pago
            </button>
            <button 
              onClick={onCheckoutClick} 
              disabled={posCartEmpty || isProcessing}
              className="bg-teal-600 text-white p-2 rounded-lg shadow-lg disabled:opacity-30"
              title="Finalizar Venta"
            >
              {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Printer size={20}/>}
            </button>
          </div>
        </div>

        <div className={`flex flex-col lg:flex-row items-center justify-between gap-4 ${showPaymentDetails ? 'flex' : 'hidden md:flex'}`}>
          
          <div className="flex items-center gap-4 md:gap-6 shrink-0 w-full lg:w-auto border-b lg:border-b-0 lg:border-r border-slate-800 pb-3 lg:pb-0 lg:pr-8">
            <div className="hidden md:block">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block">TOTAL FINAL</span>
              <p className="text-4xl font-black text-teal-400 tracking-tighter leading-none flex items-start gap-0.5">
                <span className="text-lg opacity-50 mt-1">$</span>{posTotal.toFixed(2)}
              </p>
              {discount > 0 && <p className="text-[10px] text-yellow-400 font-black uppercase mt-1 animate-pulse tracking-widest">RECOMPENSA APLICADA (-$5)</p>}
            </div>

            <div className="flex gap-2 w-full md:w-auto justify-around sm:justify-start">
              <button 
                onClick={() => setPosPaymentMethod('CASH')} 
                className={`flex flex-col items-center justify-center flex-1 sm:flex-none w-14 h-14 rounded-xl border-2 transition-all gap-0.5 ${posPaymentMethod === 'CASH' ? 'border-teal-500 bg-teal-500/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
              >
                <Banknote size={20}/><span className="text-[8px] font-black uppercase">Efect.</span>
              </button>
              <button 
                onClick={() => setPosPaymentMethod('TRANSFER')} 
                className={`flex flex-col items-center justify-center flex-1 sm:flex-none w-14 h-14 rounded-xl border-2 transition-all gap-0.5 ${posPaymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-slate-800 text-slate-500 hover:border-slate-700'}`}
              >
                <Landmark size={20}/><span className="text-[8px] font-black uppercase">Trans.</span>
              </button>
            </div>
          </div>

          <div className="flex-grow w-full flex flex-col sm:flex-row items-center gap-4">
            {posPaymentMethod === 'CASH' && (
              <div className="grid grid-cols-2 gap-2 md:gap-3 w-full sm:w-auto flex-grow animate-in slide-in-from-right-2">
                <div className="space-y-1">
                  <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase ml-1">Paga con</label>
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 font-black text-[10px]">$</span>
                    <input 
                      type="number" inputMode="decimal" placeholder="0.00" 
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg py-1 md:py-1.5 pl-5 pr-2 text-sm md:text-base font-black text-white focus:border-teal-500 outline-none transition-all" 
                      value={posCashReceived} onChange={e => setPosCashReceived(e.target.value)} 
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] md:text-[9px] font-black text-slate-500 uppercase ml-1">Cambio</label>
                  <div className={`h-[28px] md:h-[34px] rounded-lg flex items-center justify-center border border-dashed ${changeDue >= 0 ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-red-500/50 text-red-400'}`}>
                    <span className="text-xs md:text-base font-black tabular-nums">${changeDue >= 0 ? changeDue.toFixed(2) : '0.00'}</span>
                  </div>
                </div>
              </div>
            )}

            <button 
              onClick={onCheckoutClick} 
              disabled={posCartEmpty || isProcessing}
              className="w-full sm:w-auto flex-grow bg-teal-600 hover:bg-teal-500 text-white py-3 md:py-3.5 px-4 md:px-6 rounded-lg md:rounded-xl font-black text-xs uppercase tracking-[0.1em] shadow-lg shadow-teal-500/10 transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Printer size={16}/>} 
              <span className="text-[10px] md:text-xs">
                  {isProcessing ? 'PROCESANDO...' : 'FINALIZAR VENTA'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSFooter;
