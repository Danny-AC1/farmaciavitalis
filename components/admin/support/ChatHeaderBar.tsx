import React from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  Search, 
  X 
} from 'lucide-react';
import { SupportChat } from '../../../services/db.support';

interface ChatHeaderBarProps {
  selectedChat: SupportChat;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  showProductSharer: boolean;
  setShowProductSharer: (val: boolean) => void;
  onBack: () => void;
}

export const ChatHeaderBar: React.FC<ChatHeaderBarProps> = ({
  selectedChat,
  soundEnabled,
  setSoundEnabled,
  searchQuery,
  setSearchQuery,
  showProductSharer,
  setShowProductSharer,
  onBack,
}) => {
  return (
    <div className="p-3.5 border-b border-slate-200 bg-white flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 rounded-xl transition text-slate-500 lg:hidden"
            title="Volver a la lista"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="h-9 w-9 bg-teal-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md shadow-teal-600/20 uppercase shrink-0">
            {selectedChat.userDisplayName ? selectedChat.userDisplayName.charAt(0) : 'U'}
          </div>

          <div className="min-w-0">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-tight truncate flex items-center gap-1.5">
              <span>{selectedChat.userDisplayName || 'Cliente'}</span>
              {selectedChat.userTyping && (
                <span className="text-[9px] bg-teal-100 text-teal-700 font-extrabold px-1.5 py-0.5 rounded-full animate-pulse">
                  Escribiendo...
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold truncate flex items-center gap-1">
              <Mail size={10} /> {selectedChat.userEmail || 'Sin email registrado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Toggle product recommendation sharer modal */}
          <button
            type="button"
            onClick={() => setShowProductSharer(!showProductSharer)}
            className={`px-2.5 py-1.5 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition flex items-center gap-1 border ${
              showProductSharer 
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border-teal-200'
            }`}
            title="Recomendar producto del catálogo"
          >
            <ShoppingBag size={13} />
            <span className="hidden sm:inline">Recomendar Producto</span>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl transition border ${
              soundEnabled 
                ? 'bg-teal-50 text-teal-600 border-teal-200' 
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? "Silenciar notificaciones" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
          </button>
        </div>
      </div>

      {/* Search Bar for Messages */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 pointer-events-none">
          <Search size={12} />
        </span>
        <input 
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Buscar en el chat de este cliente..."
          className="w-full pl-8 pr-7 py-1 text-[10px] bg-slate-50 border border-slate-200/80 rounded-xl outline-none font-bold text-slate-700 focus:border-teal-500 focus:bg-white transition"
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')} 
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600"
          >
            <X size={12} />
          </button>
        )}
      </div>
    </div>
  );
};

export default ChatHeaderBar;
