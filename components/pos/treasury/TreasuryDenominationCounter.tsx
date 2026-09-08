import React from 'react';

export interface ArqueoDenominations {
  bills100: number;
  bills50: number;
  bills20: number;
  bills10: number;
  bills5: number;
  bills1: number;
  coins050: number;
  coins025: number;
  coins010: number;
  coins005: number;
  coins001: number;
}

interface TreasuryDenominationCounterProps {
  arqueo: ArqueoDenominations;
  setArqueo: React.Dispatch<React.SetStateAction<ArqueoDenominations>>;
  adjustDenom: (field: keyof ArqueoDenominations, delta: number) => void;
}

const DENOMINATIONS: Array<{
  label: string;
  field: keyof ArqueoDenominations;
  mult: number;
}> = [
  { label: '$100', field: 'bills100', mult: 100 },
  { label: '$50', field: 'bills50', mult: 50 },
  { label: '$20', field: 'bills20', mult: 20 },
  { label: '$10', field: 'bills10', mult: 10 },
  { label: '$5', field: 'bills5', mult: 5 },
  { label: '$1 (Billete/Moneda)', field: 'bills1', mult: 1 },
  { label: '50¢ (Moneda)', field: 'coins050', mult: 0.50 },
  { label: '25¢ (Moneda)', field: 'coins025', mult: 0.25 },
  { label: '10¢ (Moneda)', field: 'coins010', mult: 0.10 },
  { label: '5¢ (Moneda)', field: 'coins005', mult: 0.05 },
  { label: '1¢ (Moneda)', field: 'coins001', mult: 0.01 }
];

export const TreasuryDenominationCounter: React.FC<TreasuryDenominationCounterProps> = ({
  arqueo,
  setArqueo,
  adjustDenom
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
      {DENOMINATIONS.map(denom => {
        const count = arqueo[denom.field] || 0;
        const subtotal = count * denom.mult;
        return (
          <div key={denom.field} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-bold text-slate-700">
              <span>{denom.label}</span>
              <span className="font-black text-rose-600">${subtotal.toFixed(2)}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => adjustDenom(denom.field, -1)}
                className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-black text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              
              <input
                type="number"
                min="0"
                value={count}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 0;
                  setArqueo(prev => ({ ...prev, [denom.field]: Math.max(0, val) }));
                }}
                className="w-full text-center py-1 bg-white border border-slate-200 rounded-lg text-xs font-black text-slate-900 focus:outline-none"
              />

              <button
                type="button"
                onClick={() => adjustDenom(denom.field, 1)}
                className="w-6 h-6 rounded-lg bg-white border border-slate-200 font-black text-xs text-slate-600 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>

            <div className="flex gap-1 justify-center pt-0.5">
              <button
                type="button"
                onClick={() => adjustDenom(denom.field, 5)}
                className="px-1.5 py-0.5 bg-slate-200/60 hover:bg-slate-200 rounded text-[8px] font-bold text-slate-600 cursor-pointer"
              >
                +5
              </button>
              <button
                type="button"
                onClick={() => adjustDenom(denom.field, 10)}
                className="px-1.5 py-0.5 bg-slate-200/60 hover:bg-slate-200 rounded text-[8px] font-bold text-slate-600 cursor-pointer"
              >
                +10
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
