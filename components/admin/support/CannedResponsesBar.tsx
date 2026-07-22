import React from 'react';

export interface CannedResponse {
  label: string;
  text: string;
}

interface CannedResponsesBarProps {
  cannedResponses: CannedResponse[];
  onSelectResponse: (text: string) => void;
}

export const CannedResponsesBar: React.FC<CannedResponsesBarProps> = ({
  cannedResponses,
  onSelectResponse,
}) => {
  return (
    <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto custom-scrollbar shrink-0">
      <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider whitespace-nowrap mr-1">Respuestas Rápidas:</span>
      {cannedResponses.map((item, idx) => (
        <button
          key={idx}
          type="button"
          onClick={() => onSelectResponse(item.text)}
          className="px-2.5 py-1 bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-200 text-[10px] font-extrabold rounded-lg whitespace-nowrap transition shadow-2xs"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default CannedResponsesBar;
