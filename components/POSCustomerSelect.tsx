
import React from 'react';
import { Search, UserPlus, UserCheck, X } from 'lucide-react';
import { User } from '../types';

interface POSCustomerSelectProps {
  selectedCustomer: User | null;
  customerSearch: string;
  setCustomerSearch: (s: string) => void;
  customerSearchResults: User[];
  setSelectedCustomer: (u: User | null) => void;
  setShowUserForm: (b: boolean) => void;
  setUsePoints: (b: boolean) => void;
  subtotal: number;
  projectedPoints: number;
}

const POSCustomerSelect: React.FC<POSCustomerSelectProps> = ({
  selectedCustomer, customerSearch, setCustomerSearch, customerSearchResults,
  setSelectedCustomer, setShowUserForm, setUsePoints, subtotal, projectedPoints
}) => {
  return (
    <div className="flex-grow relative">
      {!selectedCustomer ? (
        <div className="flex gap-1 md:gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              className="w-full bg-slate-100 border-none rounded-lg md:rounded-xl py-2 pl-9 pr-3 text-xs md:text-sm font-bold focus:ring-2 focus:ring-teal-500 outline-none" 
              placeholder="Cliente (Cédula/Nombre)..." 
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
            />
          </div>
          <button onClick={() => setShowUserForm(true)} className="bg-slate-900 text-white p-2 rounded-lg md:rounded-xl hover:bg-black transition"><UserPlus size={16}/></button>
        </div>
      ) : (
        <div className="bg-teal-50 border border-teal-200 p-1.5 rounded-lg md:rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-teal-600 text-white p-1 rounded-md"><UserCheck size={14}/></div>
            <div className="min-w-0">
              <p className="text-[10px] md:text-xs font-black uppercase text-teal-800 leading-none truncate">{selectedCustomer.displayName}</p>
              <p className="text-[8px] md:text-[9px] font-bold text-teal-600 mt-0.5 uppercase tracking-tighter">
                  {selectedCustomer.cedula} • <span className="text-yellow-600">{selectedCustomer.points} PTS ACTUALES</span>
                  {Math.floor(subtotal) > 0 && <span className="ml-1 text-slate-400">({projectedPoints} Proyectados)</span>}
              </p>
            </div>
          </div>
          <button onClick={() => { setSelectedCustomer(null); setUsePoints(false); }} className="text-teal-400 hover:text-red-500 p-1"><X size={14}/></button>
        </div>
      )}
      {customerSearchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-[100] bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden mt-1 max-h-60 overflow-y-auto">
          {customerSearchResults.map(u => (
            <div key={u.uid} onClick={() => { setSelectedCustomer(u); setCustomerSearch(''); }} className="p-2 border-b last:border-0 hover:bg-teal-50 cursor-pointer flex justify-between items-center">
              <div className="min-w-0"><p className="text-[10px] font-bold uppercase truncate">{u.displayName}</p><p className="text-[8px] text-slate-400">{u.cedula} • {u.points} PTS</p></div>
              <span className="text-[7px] font-black text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded shrink-0">SELECT</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default POSCustomerSelect;
