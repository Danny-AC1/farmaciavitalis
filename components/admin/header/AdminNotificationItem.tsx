import React from 'react';
import { X, ChevronRight } from 'lucide-react';

export interface NotificationItemData {
  id: string;
  type: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  color: string;
  actionLabel: string;
  onClick: () => void;
}

interface AdminNotificationItemProps {
  item: NotificationItemData;
  onDismiss: (id: string) => void;
}

export const AdminNotificationItem: React.FC<AdminNotificationItemProps> = ({ item, onDismiss }) => {
  const Icon = item.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-white hover:bg-slate-50 rounded-2xl transition-all border border-slate-100 shadow-2xs relative group">
      <div className={`p-2 rounded-xl shrink-0 border ${item.color}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-1">
          <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">{item.title}</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-500"></span>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDismiss(item.id);
              }}
              className="text-slate-300 hover:text-slate-500 p-0.5 rounded transition cursor-pointer"
              title="Descartar"
            >
              <X size={12} />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-700 font-bold leading-snug mb-2">{item.desc}</p>
        
        <button
          onClick={item.onClick}
          className="text-[10px] font-black text-teal-600 hover:text-teal-700 uppercase tracking-widest flex items-center gap-1 transition-all cursor-pointer"
        >
          {item.actionLabel}
          <ChevronRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
};
