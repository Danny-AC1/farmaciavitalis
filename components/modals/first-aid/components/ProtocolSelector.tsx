import React from 'react';
import { FIRST_AID_PROTOCOLS } from '../constants';

interface ProtocolSelectorProps {
  selectedIncidentId: string;
  setSelectedIncidentId: (id: string) => void;
  setActiveStepIndex: (idx: number) => void;
}

export const ProtocolSelector: React.FC<ProtocolSelectorProps> = ({
  selectedIncidentId,
  setSelectedIncidentId,
  setActiveStepIndex,
}) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3" id="first-aid-selector">
      {FIRST_AID_PROTOCOLS.map((protocol) => {
        const ItemIcon = protocol.icon;
        const isSelected = selectedIncidentId === protocol.id;

        return (
          <button
            key={protocol.id}
            id={`btn-protocol-${protocol.id}`}
            onClick={() => {
              setSelectedIncidentId(protocol.id);
              setActiveStepIndex(0); // Reset step progress
            }}
            className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-28 relative overflow-hidden group ${
              isSelected 
                ? 'bg-slate-900 border-slate-900 text-white shadow-lg -translate-y-1' 
                : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:shadow-xs'
            }`}
          >
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
              isSelected ? 'bg-white/10 text-white' : protocol.colorClass
            }`}>
              <ItemIcon size={20} />
            </div>
            <div>
              <h3 className="text-xs font-black tracking-tight mt-2">{protocol.title}</h3>
              <span className={`text-[9px] font-bold block mt-0.5 ${
                isSelected ? 'text-slate-300' : 'text-slate-400'
              }`}>Ver guía rápida</span>
            </div>
            
            {/* Subtle background decoration */}
            <div className={`absolute -right-3 -bottom-3 opacity-5 group-hover:scale-110 transition-transform ${
              isSelected ? 'text-white' : 'text-slate-700'
            }`}>
              <ItemIcon size={72} />
            </div>
          </button>
        );
      })}
    </div>
  );
};
export default ProtocolSelector;
