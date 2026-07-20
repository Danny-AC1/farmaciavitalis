import React, { useState, useEffect } from 'react';
import { User, Product } from '../../types';
import { 
  streamAdminChats, 
  streamChatMessages, 
  markChatAsReadByAdmin,
  deleteSupportChat,
  SupportChat, 
  SupportMessage 
} from '../../services/db.support';
import { streamProducts } from '../../services/db.products';

// Subcomponents
import { ChatList } from './support/ChatList';
import { ChatWindow } from './support/ChatWindow';
import { CustomerSidebar } from './support/CustomerSidebar';
import { MessageSquare } from 'lucide-react';

interface AdminSupportChatsProps {
  currentUser: User | null;
  initialSelectedChatId?: string | null;
  onClearInitialChatId?: () => void;
}

export const AdminSupportChats: React.FC<AdminSupportChatsProps> = ({ 
  currentUser, 
  initialSelectedChatId, 
  onClearInitialChatId 
}) => {
  const [chats, setChats] = useState<SupportChat[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedChat, setSelectedChat] = useState<SupportChat | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Auto-select chat when triggered from a floating notification
  useEffect(() => {
    if (initialSelectedChatId && chats.length > 0) {
      const found = chats.find(c => c.id === initialSelectedChatId);
      if (found) {
        setSelectedChat(found);
        if (onClearInitialChatId) {
          onClearInitialChatId();
        }
      }
    }
  }, [initialSelectedChatId, chats, onClearInitialChatId]);

  // Stream active support chats
  useEffect(() => {
    const unsubscribe = streamAdminChats((data) => {
      setChats(data);
      // Keep selectedChat updated if it still exists in incoming chats
      if (selectedChat) {
        const updated = data.find(c => c.id === selectedChat.id);
        if (updated) setSelectedChat(updated);
      }
    });
    return () => unsubscribe();
  }, [selectedChat]);

  // Stream products for sharing
  useEffect(() => {
    const unsubscribe = streamProducts((data) => {
      setProducts(data);
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
    const unsubscribe = streamChatMessages(selectedChat.id, (data) => {
      setMessages(data);
      setLoadingMessages(false);
    });

    return () => unsubscribe();
  }, [selectedChat?.id]);

  // Mark active chat as read by admin
  useEffect(() => {
    if (selectedChat?.id && selectedChat.unreadByAdmin) {
      markChatAsReadByAdmin(selectedChat.id);
    }
  }, [selectedChat?.id, selectedChat?.unreadByAdmin]);

  return (
    <div className="bg-white md:rounded-[2rem] md:border border-slate-200/80 shadow-md overflow-hidden h-full flex flex-col lg:flex-row font-sans" id="admin-support-chats-container">
      
      {/* 1. Left Sidebar: Chats Queue */}
      <ChatList 
        chats={chats}
        selectedChatId={selectedChat?.id}
        onSelectChat={(chat) => setSelectedChat(chat)}
        onDeleteChat={async (userId) => {
          try {
            await deleteSupportChat(userId);
            if (selectedChat?.id === userId) {
              setSelectedChat(null);
            }
          } catch (error) {
            console.error("Error deleting support chat:", error);
          }
        }}
      />

      {/* 2. Main Area: Active Chat or Placeholder */}
      <div className="flex-grow flex flex-col lg:flex-row min-w-0 h-full min-h-0">
        {selectedChat ? (
          <>
            {/* Active Message Board */}
            <ChatWindow 
              selectedChat={selectedChat}
              messages={messages}
              products={products}
              currentUser={currentUser}
              loadingMessages={loadingMessages}
              onBack={() => setSelectedChat(null)}
            />

            {/* Right Panel: Customer CRM Sidebar */}
            <CustomerSidebar 
              userId={selectedChat.userId}
              userDisplayName={selectedChat.userDisplayName}
              userEmail={selectedChat.userEmail}
            />
          </>
        ) : (
          /* Empty State Placeholder */
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 space-y-5">
            <div className="h-20 w-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center shadow-inner animate-bounce">
              <MessageSquare size={32} />
            </div>
            <div className="max-w-xs space-y-1.5">
              <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">
                Consola de Soporte de Primera Línea
              </h4>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Selecciona una conversación del panel de la izquierda para interactuar en tiempo real, compartir recomendaciones y ver el historial de pedidos de tus clientes.
              </p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminSupportChats;
