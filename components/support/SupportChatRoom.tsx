import React, { useState, useEffect, useRef } from 'react';
import { 
  SupportMessage, 
  SupportChat, 
  sendMessageAsUser, 
  setUserTypingStatus, 
  streamChatSession,
  deleteSupportMessage,
  reactToMessage,
  ReplyToPayload
} from '../../services/db.support';
import { Product, User } from '../../types';
import { 
  MessageSquare, 
  Volume2, 
  VolumeX, 
  Search, 
  X,
  MoreVertical,
  Clock,
  ShieldCheck,
  ClipboardList
} from 'lucide-react';
import PrescriptionModal from '../modals/PrescriptionModal';
import ChatMessageItem from './ChatMessageItem';
import ChatInputBar from './ChatInputBar';

interface SupportChatRoomProps {
  products: Product[];
  currentUser: User;
  messages: SupportMessage[];
  loadingMessages: boolean;
  onAddToCart: (p: Product) => void;
  onOpenCalculator?: () => void;
}

export const SupportChatRoom: React.FC<SupportChatRoomProps> = ({
  products,
  currentUser,
  messages,
  loadingMessages,
  onAddToCart,
  onOpenCalculator,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [session, setSession] = useState<SupportChat | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Premium Chat States
  const [searchQuery, setSearchQuery] = useState('');
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyToPayload | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null); // messageId
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showPlusMenu, setShowPlusMenu] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(messages.length);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Stream chat session metadata (to get adminTyping status)
  useEffect(() => {
    if (!currentUser.uid) return;
    const unsubscribe = streamChatSession(currentUser.uid, (data) => {
      setSession(data);
    });
    return () => unsubscribe();
  }, [currentUser.uid]);

  // Scroll to bottom when messages or typing indicators change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, session?.adminTyping]);

  // Audio feedback
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

  // Sound triggers on new incoming messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderRole === 'ADMIN') {
        playChatSound('receive');
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Handle customer typing indicators & textarea auto-resize
  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }

    if (currentUser.uid) {
      setUserTypingStatus(currentUser.uid, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        setUserTypingStatus(currentUser.uid, false);
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
    if (!newMessage.trim() || isSending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setIsSending(true);

    if (currentUser.uid) {
      setUserTypingStatus(currentUser.uid, false);
    }

    try {
      await sendMessageAsUser(
        currentUser.uid,
        currentUser,
        textToSend,
        undefined,
        undefined,
        replyingTo || undefined
      );
      playChatSound('send');
      setReplyingTo(null);
    } catch (error) {
      console.error("Error al enviar mensaje:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Voice Note sending handler
  const handleSendVoice = async (base64Audio: string) => {
    if (!currentUser.uid || isSending) return;
    setIsSending(true);

    try {
      await sendMessageAsUser(
        currentUser.uid,
        currentUser,
        '🎤 Nota de voz enviada',
        base64Audio,
        'audio',
        replyingTo || undefined
      );
      playChatSound('send');
      setReplyingTo(null);
    } catch (e) {
      console.error("Error enviando nota de voz:", e);
    } finally {
      setIsSending(false);
    }
  };

  // File uploading handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser.uid) return;

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
        
        await sendMessageAsUser(
          currentUser.uid,
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
      console.error("Error cargando archivo:", err);
      setIsUploading(false);
    }
  };

  // Delete message
  const handleDeleteMsg = async (msgId: string) => {
    if (!currentUser.uid) return;
    try {
      await deleteSupportMessage(currentUser.uid, msgId);
    } catch (err) {
      console.error("Error deleting message:", err);
    }
  };

  // React to message
  const handleReactToMsg = async (msgId: string, emoji: string) => {
    if (!currentUser.uid) return;
    try {
      await reactToMessage(currentUser.uid, msgId, emoji, currentUser.displayName || 'Usuario');
      setActiveReactionMenu(null);
    } catch (err) {
      console.error("Error reacting to message:", err);
    }
  };

  const emojis = ['👍', '❤️', '💊', '😊', '🙏', '🔥'];

  // Filter messages by search term
  const filteredMessages = messages.filter(m => 
    searchQuery === '' || m.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden flex flex-col w-full h-full flex-grow min-h-0 relative">
      
      {/* Top Header Bar */}
      <div className="p-3.5 sm:p-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0 relative z-30">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="h-9 w-9 bg-teal-600 text-white rounded-xl flex items-center justify-center font-black text-xs shadow-md shadow-teal-600/15 shrink-0">
            V
          </div>
          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-800 truncate">
              Farmacia Vitalis
            </h3>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1.5 mt-0.5 truncate">
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block animate-pulse shrink-0"></span>
              Soporte Activo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Sound Toggle */}
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition border ${
              soundEnabled 
                ? 'bg-teal-50 text-teal-600 border-teal-100 shadow-2xs' 
                : 'bg-slate-50 text-slate-400 border-slate-200'
            }`}
            title={soundEnabled ? "Silenciar" : "Activar Sonido"}
          >
            {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
          </button>

          {/* Three Dots (...) Menu Toggle */}
          <button
            type="button"
            onClick={() => setShowMoreMenu(!showMoreMenu)}
            className={`p-2 rounded-xl transition border ${
              showMoreMenu 
                ? 'bg-teal-600 text-white border-teal-600 shadow-sm' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
            title="Opciones adicionales"
          >
            <MoreVertical size={16} />
          </button>
        </div>

        {/* Subtle Dropdown Options Menu */}
        {showMoreMenu && (
          <div className="absolute top-full right-3 mt-1.5 z-50 bg-white border border-slate-200/90 shadow-2xl rounded-2xl p-3.5 w-72 sm:w-80 space-y-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Opciones del Chat</span>
              <button 
                type="button" 
                onClick={() => setShowMoreMenu(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* 1. Search Bar */}
            <div className="space-y-1">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Buscar en conversación</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 pointer-events-none">
                  <Search size={12} />
                </span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar mensaje por palabra..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none font-semibold text-slate-800 focus:border-teal-500 transition"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')} 
                    className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* 2. Subir Receta Médica Button */}
            <button
              type="button"
              onClick={() => {
                setShowMoreMenu(false);
                setShowPrescriptionModal(true);
              }}
              className="w-full py-2.5 px-3 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl transition flex items-center justify-center gap-2 shadow-sm"
            >
              <ClipboardList size={14} />
              Subir Receta Médica
            </button>

            {/* 3. Redes Sociales */}
            <div className="pt-2 border-t border-slate-100 space-y-1.5">
              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Síguenos en Redes Sociales</label>
              <div className="grid grid-cols-2 gap-2">
                <a
                  href="https://www.facebook.com/share/1EgmXJBpFK/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition border border-blue-100"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </a>

                <a
                  href="https://www.instagram.com/farmacia__vitalis?igsh=d2ZseWU0NXlyZDBr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2 px-2.5 bg-pink-50 hover:bg-pink-100 text-pink-700 rounded-xl font-extrabold text-[10px] uppercase tracking-wider transition border border-pink-100"
                >
                  <svg className="w-3.5 h-3.5 fill-current shrink-0" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  <span>Instagram</span>
                </a>
              </div>
            </div>

            {/* 4. Subtle Info items (No wordiness) */}
            <div className="pt-2 border-t border-slate-100 space-y-2 text-[10px] font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Clock size={13} className="text-teal-600 shrink-0" />
                <span><strong className="text-slate-800">Horario:</strong> Lunes a Domingo 8:00 AM - 8:00 PM</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={13} className="text-teal-600 shrink-0" />
                <span><strong className="text-slate-800">Confidencialidad:</strong> Secreto médico protegido</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Active Search Filter Indicator Banner */}
      {searchQuery && (
        <div className="px-4 py-2 bg-amber-50 border-b border-amber-200/60 flex items-center justify-between text-xs text-amber-800 font-semibold shrink-0">
          <span className="truncate">Mostrando resultados para: <strong>"{searchQuery}"</strong></span>
          <button 
            type="button"
            onClick={() => setSearchQuery('')}
            className="p-1 hover:bg-amber-200/50 rounded-lg text-amber-700 transition shrink-0 ml-2"
            title="Limpiar búsqueda"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Scrollable Messages Stream */}
      <div className="flex-grow overflow-y-auto p-3 sm:p-4 space-y-4 bg-slate-50/40 custom-scrollbar overscroll-contain relative">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center flex-col gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cargando conversación...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shadow-inner animate-pulse">
              <MessageSquare size={26} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {searchQuery ? 'Sin Resultados' : '¡Canal Vitalis Abierto!'}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                {searchQuery 
                  ? `No se encontraron mensajes con la palabra "${searchQuery}".`
                  : 'Escribe tu consulta o adjunta una receta, foto o archivo usando el botón de (+). Ahora puedes responder mensajes citándolos o enviando notas de voz.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => (
              <ChatMessageItem
                key={msg.id}
                msg={msg}
                isMe={msg.senderRole === 'USER'}
                currentUserRole="USER"
                products={products}
                emojis={emojis}
                activeReactionMenu={activeReactionMenu}
                onAddToCart={onAddToCart}
                onReply={setReplyingTo}
                onToggleReactionMenu={id => setActiveReactionMenu(activeReactionMenu === id ? null : id)}
                onReact={handleReactToMsg}
                onDelete={handleDeleteMsg}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Pharmacist Typing Indicator */}
        {session?.adminTyping && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="max-w-[70%] space-y-0.5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide px-1.5">Farmacéutico</p>
              <div className="bg-white border border-slate-100 px-5 py-3 rounded-2xl md:rounded-[1.5rem] rounded-tl-none flex items-center gap-2.5 shadow-sm">
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

      {/* Reply Target Indicator Box */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150 shrink-0">
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

      {/* Input Bar Component */}
      <ChatInputBar
        newMessage={newMessage}
        isSending={isSending}
        isUploading={isUploading}
        showPlusMenu={showPlusMenu}
        setShowPlusMenu={setShowPlusMenu}
        onTextareaChange={handleTextareaChange}
        onKeyDown={handleKeyDown}
        onSendMessage={handleSendMessage}
        onFileUpload={handleFileUpload}
        onSendVoice={handleSendVoice}
        onOpenPrescriptionModal={() => setShowPrescriptionModal(true)}
        onOpenCalculator={onOpenCalculator}
        textareaRef={textareaRef}
      />

      {showPrescriptionModal && (
        <PrescriptionModal 
          currentUser={currentUser} 
          onClose={() => setShowPrescriptionModal(false)} 
        />
      )}
    </div>
  );
};

export default SupportChatRoom;
