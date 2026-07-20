import React, { useState, useMemo } from 'react';
import { SupportChat } from '../../../services/db.support';
import { MessageSquare, Search, Mail, Bell, Trash2 } from 'lucide-react';

interface ChatListProps {
  chats: SupportChat[];
  selectedChatId: string | undefined;
  onSelectChat: (chat: SupportChat) => void;
  onDeleteChat?: (userId: string) => void;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  selectedChatId,
  onSelectChat,
  onDeleteChat,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'unread'>('all');

  const filteredChats = useMemo(() => {
    return chats.filter(c => {
      // Apply text search
      const name = (c.userDisplayName || '').toLowerCase();
      const email = (c.userEmail || '').toLowerCase();
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = name.includes(query) || email.includes(query);

      // Apply unread filter
      if (filterMode === 'unread') {
        return matchesSearch && c.unreadByAdmin;
      }
      return matchesSearch;
    });
  }, [chats, searchQuery, filterMode]);

  const unreadCount = useMemo(() => {
    return chats.filter(c => c.unreadByAdmin).length;
  }, [chats]);

  return (
    <div className={`${selectedChatId ? 'hidden' : 'flex'} lg:flex lg:w-2/5 xl:w-1/3 border-r border-slate-200 flex-col h-full bg-slate-50/50 font-sans shrink-0`}>
      
      {/* Title & Stats */}
      <div className="p-4 border-b border-slate-200 bg-white space-y-3.5">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <MessageSquare className="text-teal-600 animate-pulse" size={15} />
            <span>Mensajes de Soporte</span>
          </h3>
          {unreadCount > 0 && (
            <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full animate-bounce flex items-center gap-1 shadow-sm">
              <Bell size={9} />
              {unreadCount} Nuevos
            </span>
          )}
        </div>

        {/* Search and Filters Toggle */}
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente o correo..."
              className="w-full bg-slate-50 border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 transition"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg">
            <button
              onClick={() => setFilterMode('all')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition ${
                filterMode === 'all'
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Todos ({chats.length})
            </button>
            <button
              onClick={() => setFilterMode('unread')}
              className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-md transition flex items-center justify-center gap-1 ${
                filterMode === 'unread'
                  ? 'bg-rose-500 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              No Leídos ({unreadCount})
            </button>
          </div>
        </div>
      </div>

      {/* Chats Scroll Queue */}
      <div className="flex-grow overflow-y-auto p-3.5 space-y-2 custom-scrollbar overscroll-contain">
        {filteredChats.length === 0 ? (
          <div className="py-16 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
            No hay conversaciones activas.
          </div>
        ) : (
          filteredChats.map((chat) => {
            const isSelected = selectedChatId === chat.id;
            const hasUnread = chat.unreadByAdmin;
            return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat)}
                className={`w-full text-left p-3.5 rounded-2xl transition duration-150 flex items-start gap-3.5 relative border group ${
                  isSelected 
                    ? 'bg-teal-600 text-white border-teal-600 shadow-lg shadow-teal-600/10' 
                    : 'bg-white text-slate-800 border-slate-100 hover:border-teal-500/30 shadow-xs'
                }`}
              >
                {/* Initial */}
                <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'
                }`}>
                  {chat.userDisplayName.charAt(0).toUpperCase()}
                </div>
                
                {/* Detail */}
                <div className="min-w-0 flex-grow pr-8">
                  <div className="flex justify-between items-start gap-1">
                    <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {chat.userDisplayName}
                    </p>
                    <span className={`text-[8px] font-bold uppercase shrink-0 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                      {chat.lastMessageTime ? new Date(chat.lastMessageTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                  
                  <p className={`text-[10px] truncate font-semibold ${isSelected ? 'text-teal-100' : 'text-slate-500'} mt-0.5`}>
                    {chat.lastMessageText || 'No hay mensajes'}
                  </p>
                  
                  {chat.userEmail && (
                    <p className={`text-[8.5px] font-bold truncate ${isSelected ? 'text-teal-200' : 'text-slate-400'} mt-1 flex items-center gap-1`}>
                      <Mail size={10} />
                      <span>{chat.userEmail}</span>
                    </p>
                  )}
                </div>

                {/* Right Bottom Actions & Unread Indicator */}
                <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2">
                  {onDeleteChat && (
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`¿Estás seguro de que deseas eliminar la conversación con ${chat.userDisplayName}? Esta acción es irreversible.`)) {
                          onDeleteChat(chat.id);
                        }
                      }}
                      className={`p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus-within:opacity-100 cursor-pointer ${
                        isSelected 
                          ? 'hover:bg-teal-700 text-teal-100 hover:text-white' 
                          : 'hover:bg-rose-50 text-slate-400 hover:text-rose-600'
                      }`}
                      title="Eliminar conversación"
                    >
                      <Trash2 size={13} />
                    </span>
                  )}
                  {hasUnread && !isSelected && (
                    <span className="h-2 w-2 bg-rose-500 rounded-full shrink-0" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

    </div>
  );
};

export default ChatList;
