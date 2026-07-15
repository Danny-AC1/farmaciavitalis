import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Search, 
  Send, 
  Mail, 
  ArrowLeft
} from 'lucide-react';
import { User } from '../../types';
import { 
  streamAdminChats, 
  streamChatMessages, 
  sendMessageAsAdmin, 
  markChatAsReadByAdmin, 
  SupportChat, 
  SupportMessage 
} from '../../services/db.support';

interface AdminSupportChatsProps {
  currentUser: User | null;
}

export const AdminSupportChats: React.FC<AdminSupportChatsProps> = ({ currentUser }) => {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stream active support chats
  useEffect(() => {
    const unsubscribe = streamAdminChats((data) => {
      setChats(data);
    });
    return () => unsubscribe();
  }, []);

  // Stream messages for selected chat
  useEffect(() => {
    if (!selectedChat) {
      setMessages([]);
      return;
    }

    setLoadingMessages(true);
    // Mark as read immediately when admin views the chat
    markChatAsReadByAdmin(selectedChat.id);

    const unsubscribe = streamChatMessages(selectedChat.id, (data) => {
      setMessages(data);
      setLoadingMessages(false);
      // Mark as read for new messages arriving while active
      markChatAsReadByAdmin(selectedChat.id);
    });

    return () => {
      unsubscribe();
    };
  }, [selectedChat]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || isSending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Build standard Admin sender user profile if currentUser not fully ready
    const adminUser: User = currentUser || {
      uid: 'admin',
      email: 'admin@vitalis.com',
      displayName: 'Administrador Vitalis',
      role: 'ADMIN',
      points: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await sendMessageAsAdmin(selectedChat.id, adminUser, textToSend);
    } catch (err) {
      console.error("Error sending admin message:", err);
    } finally {
      setIsSending(false);
    }
  };

  const filteredChats = chats.filter(c => {
    const name = (c.userDisplayName || '').toLowerCase();
    const email = (c.userEmail || '').toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    return name.includes(query) || email.includes(query);
  });

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-md overflow-hidden min-h-[600px] flex flex-col lg:flex-row font-sans" id="admin-support-chats-container">
      
      {/* LEFT COLUMN: CHATS LIST */}
      <div className="lg:w-2/5 xl:w-1/3 border-r border-slate-200 flex flex-col h-[600px] bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 bg-white space-y-3">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
            <MessageSquare className="text-teal-600 animate-pulse" size={16} />
            <span>Mensajes de Soporte</span>
            {chats.filter(c => c.unreadByAdmin).length > 0 && (
              <span className="bg-rose-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-bounce">
                {chats.filter(c => c.unreadByAdmin).length} NUEVOS
              </span>
            )}
          </h3>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por cliente o email..."
              className="w-full bg-slate-50 border border-slate-200/80 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-xl pl-9 pr-4 py-2 text-xs font-bold text-slate-800 transition"
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Chats queue */}
        <div className="flex-grow overflow-y-auto p-2 space-y-1 no-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="py-12 text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider italic">
              No se encontraron chats activos.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const isSelected = selectedChat?.id === chat.id;
              const hasUnread = chat.unreadByAdmin;
              return (
                <button
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`w-full text-left p-3.5 rounded-2xl transition duration-150 flex items-start gap-3 relative border ${
                    isSelected 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-lg' 
                      : 'bg-white text-slate-800 border-slate-100 hover:border-teal-500/30'
                  }`}
                >
                  <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-teal-50 text-teal-600'
                  }`}>
                    {chat.userDisplayName.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="min-w-0 flex-grow pr-4">
                    <div className="flex justify-between items-start gap-1">
                      <p className={`text-xs font-extrabold truncate ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                        {chat.userDisplayName}
                      </p>
                      <span className={`text-[8px] font-bold uppercase shrink-0 ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>
                        {chat.lastMessageTime ? new Date(chat.lastMessageTime.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                    
                    <p className={`text-[10px] truncate font-medium ${isSelected ? 'text-teal-100' : 'text-slate-500'} mt-0.5`}>
                      {chat.lastMessageText || 'No hay mensajes'}
                    </p>
                    
                    {chat.userEmail && (
                      <p className={`text-[8px] font-bold truncate ${isSelected ? 'text-teal-200' : 'text-slate-400'} mt-1 flex items-center gap-1`}>
                        <Mail size={10} />
                        <span>{chat.userEmail}</span>
                      </p>
                    )}
                  </div>

                  {hasUnread && !isSelected && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 h-2 w-2 bg-rose-500 rounded-full animate-ping" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: ACTIVE CHAT LOG */}
      <div className="lg:w-3/5 xl:w-2/3 flex flex-col h-[600px] bg-white relative">
        {selectedChat ? (
          <>
            {/* Header chat */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setSelectedChat(null)}
                  className="lg:hidden p-1 text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                    Chat con {selectedChat.userDisplayName}
                  </h4>
                  <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1">
                    <Mail size={10} />
                    <span>{selectedChat.userEmail}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full tracking-widest uppercase">
                  Atendiendo
                </span>
              </div>
            </div>

            {/* Message lists */}
            <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/30 no-scrollbar">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center flex-col gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Cargando conversación...</span>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => {
                    const isMe = msg.senderRole === 'ADMIN';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="max-w-[85%] sm:max-w-[70%]">
                          <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5 px-1">
                            {isMe ? msg.senderName : 'Cliente'}
                          </p>
                          <div className={`p-3 rounded-2xl text-xs font-semibold shadow-xs ${
                            isMe 
                              ? 'bg-teal-600 text-white rounded-tr-none' 
                              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                          }`}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                            <div className="flex justify-end items-center gap-1 mt-1">
                              <span className={`text-[8px] ${isMe ? 'text-teal-200' : 'text-slate-400'} font-semibold`}>
                                {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input admin */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe la respuesta del farmacéutico..."
                className="flex-grow bg-slate-50 border border-slate-200/80 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 transition"
              />
              <button
                type="submit"
                disabled={!newMessage.trim() || isSending}
                className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition duration-150 flex items-center justify-center shrink-0"
              >
                <Send size={14} />
              </button>
            </form>
          </>
        ) : (
          /* PLACEHOLDER */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shadow-inner animate-bounce">
              <MessageSquare size={28} />
            </div>
            <div className="max-w-xs space-y-1">
              <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">
                Canal de Soporte Activo
              </h4>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                Selecciona una conversación de la lista de la izquierda para responder en tiempo real a las dudas médicas o comerciales del cliente.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
