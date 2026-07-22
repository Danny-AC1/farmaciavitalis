import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  SupportMessage, 
  SupportChat, 
  sendMessageAsAdmin, 
  setAdminTypingStatus,
  deleteSupportMessage,
  reactToMessage,
  ReplyToPayload
} from '../../../services/db.support';
import { Product, User } from '../../../types';
import { 
  Send, 
  Paperclip, 
  X, 
  MessageSquare 
} from 'lucide-react';
import { VoiceRecorder } from '../../support/VoiceRecorder';
import ChatMessageItem from '../../support/ChatMessageItem';
import ChatHeaderBar from './ChatHeaderBar';
import ProductSharerModal from './ProductSharerModal';
import CannedResponsesBar from './CannedResponsesBar';

interface ChatWindowProps {
  selectedChat: SupportChat;
  messages: SupportMessage[];
  products: Product[];
  currentUser: User | null;
  loadingMessages: boolean;
  onBack: () => void;
}

const CANNED_RESPONSES = [
  { label: 'Bienvenida', text: '¡Hola! Gracias por comunicarte con el soporte de Farmacia Vitalis. ¿En qué te puedo asesorar hoy?' },
  { label: 'Envío Gratis', text: 'El costo de envío dentro de Machalilla es por ciudadela para todas tus compras. El tiempo aproximado es de 30 a 60 minutos.' },
  { label: 'Recetas Médicas', text: 'Para medicamentos que requieran receta, puedes adjuntar una foto de tu receta en la pagina principal el boton "Subir receta" o enviarla aquí.' },
  { label: 'Formas de Pago', text: 'Aceptamos pagos en Efectivo contra entrega y Transferencia Bancaria (Banco Pichincha 2204665481). Recibirás los datos al finalizar tu pedido.' },
  { label: 'Pedido Listo', text: '¡Buenas noticias! Tu pedido ha sido verificado por nuestro farmacéutico y se encuentra en camino con el repartidor. Llegará muy pronto.' },
];

export const ChatWindow: React.FC<ChatWindowProps> = ({
  selectedChat,
  messages,
  products,
  currentUser,
  loadingMessages,
  onBack,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showProductSharer, setShowProductSharer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Premium Chat States
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyToPayload | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null); // messageId
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(messages.length);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat.userTyping]);

  // Audio cues
  const playChatSound = (type: 'send' | 'receive') => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'send') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(580, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1150, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
        osc.start();
        osc.stop(ctx.currentTime + 0.12);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(620, ctx.currentTime + 0.14);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
        osc.start();
        osc.stop(ctx.currentTime + 0.14);
      }
    } catch (e) {
      console.warn("Sound playback error:", e);
    }
  };

  // Sound triggers on new incoming customer messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderRole === 'USER') {
        playChatSound('receive');
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Typing status update handler & textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    if (currentUser?.uid) {
      setAdminTypingStatus(selectedChat.userId, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setAdminTypingStatus(selectedChat.userId, false);
      }, 2500);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !currentUser) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSending(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setAdminTypingStatus(selectedChat.userId, false);

    try {
      await sendMessageAsAdmin(
        selectedChat.userId,
        currentUser,
        textToSend,
        undefined,
        undefined,
        replyingTo || undefined
      );
      playChatSound('send');
      setReplyingTo(null);
    } catch (error) {
      console.error("Error al responder mensaje:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Voice note sending by admin
  const handleSendVoice = async (base64Audio: string) => {
    if (!currentUser || isSending) return;
    setIsSending(true);

    try {
      await sendMessageAsAdmin(
        selectedChat.userId,
        currentUser,
        '🎤 Nota de voz del farmacéutico',
        base64Audio,
        'audio',
        replyingTo || undefined
      );
      playChatSound('send');
      setReplyingTo(null);
    } catch (e) {
      console.error("Error enviando voz admin:", e);
    } finally {
      setIsSending(false);
    }
  };

  // Attachment file handler by admin
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 8 * 1024 * 1024) {
      alert('El archivo supera los 8MB permitidos.');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        const mediaType = file.type.startsWith('image/') ? 'image' : 'document';
        
        await sendMessageAsAdmin(
          selectedChat.userId,
          currentUser,
          `[Archivo adjunto: ${file.name}]`,
          base64Data,
          mediaType,
          replyingTo || undefined
        );
        playChatSound('send');
        setReplyingTo(null);
        setIsUploading(false);
      };
    } catch (err) {
      console.error("Error al adjuntar archivo admin:", err);
      setIsUploading(false);
    }
  };

  // Share product attachment card directly in chat
  const handleShareProduct = async (product: Product) => {
    if (!currentUser) return;
    setIsSending(true);

    try {
      const attachmentPayload = `[ATTACHMENT_PRODUCT:${product.id}|${product.name}|${product.price}|${product.image}]`;
      await sendMessageAsAdmin(
        selectedChat.userId,
        currentUser,
        attachmentPayload,
        undefined,
        undefined,
        replyingTo || undefined
      );
      playChatSound('send');
      setShowProductSharer(false);
      setReplyingTo(null);
    } catch (e) {
      console.error("Error compartiendo producto:", e);
    } finally {
      setIsSending(false);
    }
  };

  // Delete message
  const handleDeleteMsg = async (msgId: string) => {
    try {
      await deleteSupportMessage(selectedChat.userId, msgId);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // React to message
  const handleReactToMsg = async (msgId: string, emoji: string) => {
    try {
      await reactToMessage(selectedChat.userId, msgId, emoji, currentUser?.displayName || 'Farmacéutico');
      setActiveReactionMenu(null);
    } catch (err) {
      console.error("Error reacting to message:", err);
    }
  };

  const emojis = ['👍', '❤️', '💊', '😊', '🙏', '🔥'];

  // Filtered Products for recommendation modal
  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return products.slice(0, 10);
    return products.filter(p => 
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchProductQuery.toLowerCase())
    ).slice(0, 10);
  }, [products, searchProductQuery]);

  // Filter messages by search term
  const filteredMessages = messages.filter(m => 
    searchQuery === '' || m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden min-w-0">
      
      {/* 1. Header Bar Component */}
      <ChatHeaderBar
        selectedChat={selectedChat}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showProductSharer={showProductSharer}
        setShowProductSharer={setShowProductSharer}
        onBack={onBack}
      />

      {/* 2. Product Recommendation Drawer */}
      <ProductSharerModal
        isOpen={showProductSharer}
        onClose={() => setShowProductSharer(false)}
        searchProductQuery={searchProductQuery}
        setSearchProductQuery={setSearchProductQuery}
        filteredProducts={filteredProducts}
        onSelectProduct={handleShareProduct}
      />

      {/* 3. Messages Stream Box */}
      <div className="flex-grow overflow-y-auto p-4 space-y-1.5 bg-slate-50/50 custom-scrollbar relative">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center flex-col gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cargando conversación...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="h-12 w-12 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center">
              <MessageSquare size={22} />
            </div>
            <p className="text-xs font-bold text-slate-600">
              {searchQuery ? `No hay resultados para "${searchQuery}"` : 'Aún no hay mensajes en este chat. Envía un saludo.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {filteredMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                isMe={msg.senderRole === 'ADMIN'}
                currentUserRole="ADMIN"
                products={products}
                emojis={emojis}
                activeReactionMenu={activeReactionMenu}
                onReply={setReplyingTo}
                onToggleReactionMenu={id => setActiveReactionMenu(activeReactionMenu === id ? null : id)}
                onReact={handleReactToMsg}
                onDelete={handleDeleteMsg}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* User Typing Indicator */}
        {selectedChat.userTyping && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="max-w-[70%] space-y-0.5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide px-1.5">{selectedChat.userDisplayName}</p>
              <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl md:rounded-[1.5rem] rounded-tl-none flex items-center gap-2.5 shadow-xs">
                <div className="flex gap-1">
                  <span className="h-1.5 w-1.5 bg-teal-600 rounded-full animate-bounce delay-75"></span>
                  <span className="h-1.5 w-1.5 bg-teal-600 rounded-full animate-bounce delay-150"></span>
                  <span className="h-1.5 w-1.5 bg-teal-600 rounded-full animate-bounce delay-300"></span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escribiendo...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Reply Target Banner */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
          <div className="border-l-2 border-teal-500 pl-3 truncate min-w-0 flex-grow pr-4">
            <span className="text-[8px] font-black uppercase text-teal-600 block leading-tight">
              Respondiendo a {replyingTo.senderName}
            </span>
            <span className="text-slate-500 italic text-[11px] font-medium truncate block">
              "{replyingTo.text}"
            </span>
          </div>
          <button 
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-200 transition-colors shrink-0"
            title="Cancelar respuesta"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* 5. Canned Responses Toolbar Component */}
      <CannedResponsesBar
        cannedResponses={CANNED_RESPONSES}
        onSelectResponse={text => setNewMessage(text)}
      />

      {/* 6. Message Inputs Panel */}
      <div className="p-1.5 sm:p-3 border-t border-slate-200 bg-white flex items-center sm:items-end gap-2 shrink-0">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
        />

        {/* Upload attachment button */}
        <button
          type="button"
          disabled={isUploading || isSending}
          onClick={() => fileInputRef.current?.click()}
          className={`p-2.5 sm:p-3 rounded-2xl border transition flex items-center justify-center shrink-0 ${
            isUploading 
              ? 'bg-amber-50 text-amber-500 border-amber-200 animate-pulse' 
              : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
          }`}
          title="Adjuntar multimedia"
        >
          <Paperclip size={17} />
        </button>

        {/* Voice recorder action button */}
        <div className="shrink-0">
          <VoiceRecorder onSendVoice={handleSendVoice} disabled={isSending || isUploading} />
        </div>

        <form onSubmit={handleSendMessage} className="flex-grow flex items-end gap-2 min-w-0">
          <textarea
            ref={textareaRef}
            rows={1}
            value={newMessage}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            disabled={isUploading || isSending}
            placeholder={isUploading ? "Cargando archivo..." : "Escribe la respuesta.."}
            className="flex-grow bg-slate-50 border border-slate-200 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none rounded-2xl px-3.5 py-2.5 text-xs font-semibold text-slate-800 transition min-w-0 resize-none max-h-28 overflow-y-auto leading-relaxed"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || isSending || isUploading}
            className="p-2.5 sm:p-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-2xl transition shadow-md flex items-center justify-center shrink-0"
            title="Enviar mensaje"
          >
            <Send size={16} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default ChatWindow;
