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
  Send, 
  MessageSquare, 
  Clock, 
  ShieldCheck, 
  Volume2, 
  VolumeX, 
  CheckCheck, 
  ShoppingBag,
  Paperclip,
  File as FileIcon,
  Search,
  Trash2,
  CornerUpLeft,
  Smile,
  X
} from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';
import { AudioPlayer } from './AudioPlayer';

interface SupportChatRoomProps {
  products: Product[];
  currentUser: User;
  messages: SupportMessage[];
  loadingMessages: boolean;
  onAddToCart: (p: Product) => void;
}

export const SupportChatRoom: React.FC<SupportChatRoomProps> = ({
  products,
  currentUser,
  messages,
  loadingMessages,
  onAddToCart,
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [session, setSession] = useState<SupportChat | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Premium Chat States
  const [searchQuery, setSearchQuery] = useState('');
  const [replyingTo, setReplyingTo] = useState<ReplyToPayload | null>(null);
  const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null); // messageId
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastMessageCountRef = useRef(messages.length);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Synth Audio feedback
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

  // Play sound on incoming messages
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderRole === 'ADMIN') {
        playChatSound('receive');
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Handle customer typing indicators
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (currentUser.uid) {
      setUserTypingStatus(currentUser.uid, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setUserTypingStatus(currentUser.uid, false);
      }, 2500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Stop typing status instantly
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setUserTypingStatus(currentUser.uid, false);

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
    } catch (err) {
      console.error("Error sending user message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Multimedia file uploader handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit size to 5MB for self-contained Base64 preview
    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo es demasiado grande. El límite es de 5MB.");
      return;
    }

    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) {
        setIsUploading(false);
        return;
      }

      const mediaType = file.type.startsWith('image/') ? 'image' : 'file';
      const textDescription = `[Archivo adjunto: ${file.name}]`;

      try {
        await sendMessageAsUser(
          currentUser.uid, 
          currentUser, 
          textDescription, 
          dataUrl, 
          mediaType,
          replyingTo || undefined
        );
        playChatSound('send');
        setReplyingTo(null);
      } catch (err) {
        console.error("Error al subir archivo:", err);
      } finally {
        setIsUploading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      alert("Error al leer el archivo.");
    };
    reader.readAsDataURL(file);
  };

  // Handle sending recorded audio
  const handleSendVoice = async (base64Audio: string, durationSec: number) => {
    setIsSending(true);
    try {
      const textDescription = `🎤 Mensaje de voz (${durationSec}s)`;
      await sendMessageAsUser(
        currentUser.uid,
        currentUser,
        textDescription,
        base64Audio,
        'audio',
        replyingTo || undefined
      );
      playChatSound('send');
      setReplyingTo(null);
    } catch (err) {
      console.error("Error sending voice message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Handle message deletion
  const handleDeleteMsg = async (msgId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este mensaje?")) {
      try {
        await deleteSupportMessage(currentUser.uid, msgId);
      } catch (err) {
        alert("No se pudo eliminar el mensaje.");
      }
    }
  };

  // Handle toggling reaction
  const handleReactToMsg = async (msgId: string, emoji: string) => {
    try {
      const senderName = currentUser.displayName || currentUser.email || 'Cliente';
      await reactToMessage(currentUser.uid, msgId, emoji, senderName);
      setActiveReactionMenu(null);
    } catch (err) {
      console.error("Error setting reaction:", err);
    }
  };

  // Filter messages based on local search query
  const filteredMessages = searchQuery.trim() === ''
    ? messages
    : messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 bg-white rounded-[2rem] border border-slate-200/80 shadow-xl overflow-hidden h-full flex-grow font-sans">
      
      {/* 1. Left Info Panel */}
      <div className="hidden lg:flex lg:col-span-4 bg-slate-50 p-6 border-r border-slate-100 flex-col justify-between overflow-y-auto custom-scrollbar">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-teal-600 text-white rounded-xl flex items-center justify-center font-black text-sm shadow-md shadow-teal-600/20">
                V
              </div>
              <div>
                <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                  Farmacia Vitalis
                </h4>
                <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  Canal Humano
                </p>
              </div>
            </div>

            {/* Sound toggle button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-all border ${
                soundEnabled 
                  ? 'bg-teal-55 text-teal-600 border-teal-100' 
                  : 'bg-slate-200/50 text-slate-400 border-slate-200/40'
              }`}
              title={soundEnabled ? "Silenciar audio" : "Activar audio"}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          </div>

          <div className="space-y-3.5">
            <p className="text-[11px] text-slate-550 leading-relaxed font-semibold">
              Bienvenido al canal premium de soporte. Ahora cuentas con respuestas citadas, mensajes de voz de alta fidelidad, reacciones rápidas con emojis y buscador de historial.
            </p>
            
            {/* Local chat history search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={13} />
              </span>
              <input 
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar mensajes en este chat..."
                className="w-full pl-8 pr-7 py-2 text-[11px] bg-white border border-slate-200 rounded-xl focus:border-teal-500 outline-none font-semibold text-slate-700"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            <div className="bg-white p-3.5 rounded-2xl border border-slate-100 space-y-2.5 shadow-xs">
              <div className="flex items-start gap-2.5 text-[10px] text-slate-600">
                <Clock size={12} className="text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-black uppercase tracking-wider text-slate-800 text-[9px]">Horario de Atención</p>
                  <p className="text-slate-400 font-semibold mt-0.5">Lunes a Domingo: 8:00 AM - 8:00 PM</p>
                </div>
              </div>
              <div className="flex items-start gap-2.5 text-[10px] text-slate-600">
                <ShieldCheck size={12} className="text-teal-600 mt-0.5 shrink-0" />
                <div>
                  <p className="font-black uppercase tracking-wider text-slate-800 text-[9px]">Confidencialidad Médica</p>
                  <p className="text-slate-400 font-semibold mt-0.5">Tus datos, recetas y consultas están protegidos por secreto farmacéutico.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* User Card */}
        <div className="mt-6 pt-5 border-t border-slate-200/60 hidden lg:block">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Sesión Iniciada como</span>
          <p className="text-xs font-black text-slate-800 mt-0.5 truncate uppercase">{currentUser.displayName}</p>
          <p className="text-[10px] font-semibold text-slate-400 truncate">{currentUser.email}</p>
        </div>
      </div>

      {/* 2. Active Chat Frame */}
      <div className="lg:col-span-8 flex flex-col h-full overflow-hidden">
        
        {/* Mobile-Only Header */}
        <div className="lg:hidden p-3.5 border-b border-slate-100 bg-white flex flex-col gap-2 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 bg-teal-600 text-white rounded-lg flex items-center justify-center font-black text-xs shadow-md shadow-teal-600/15">
                V
              </div>
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-800">
                  Farmacia Vitalis
                </h4>
                <p className="text-[9px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                  <span className="h-1 w-1 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                  Soporte Humano Activo
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-lg transition-all border ${
                  soundEnabled 
                    ? 'bg-teal-50 text-teal-600 border-teal-100' 
                    : 'bg-slate-50 text-slate-400 border-slate-100'
                }`}
                title={soundEnabled ? "Silenciar" : "Activar Sonido"}
              >
                {soundEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
              </button>
            </div>
          </div>

          {/* Search bar for Mobile */}
          <div className="relative mt-1">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2 text-slate-400 pointer-events-none">
              <Search size={11} />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar mensajes..."
              className="w-full pl-7 pr-7 py-1.5 text-[10px] bg-slate-50 border border-slate-100 rounded-lg outline-none font-bold text-slate-700"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                <X size={11} />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Messages queue */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/40 custom-scrollbar overscroll-contain relative">
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
                    : 'Escribe tu consulta o adjunta una receta, foto o archivo usando el botón de clip. Ahora puedes responder mensajes citándolos o enviando notas de voz.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((msg) => {
                const isMe = msg.senderRole === 'USER';
                const productMatch = msg.text.match(/^\[ATTACHMENT_PRODUCT:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]$/);

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
                  >
                    <div className="max-w-[85%] sm:max-w-[72%] space-y-1 relative">
                      
                      {/* Sender Display Name */}
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider px-1">
                        {isMe ? 'Tú' : msg.senderName}
                      </p>

                      {/* Reply Quoted Header inside the bubble */}
                      {msg.replyToId && (
                        <div className={`mb-1 p-2 rounded-xl border text-[10px] leading-tight flex flex-col gap-0.5 ${
                          isMe 
                            ? 'bg-teal-700/50 border-teal-500/20 text-teal-100' 
                            : 'bg-slate-100 border-slate-200 text-slate-600'
                        }`}>
                          <span className="font-black text-[8px] uppercase tracking-wider text-teal-300">
                            ⤺ Respondido a {msg.replyToSenderName}
                          </span>
                          <span className="italic line-clamp-2 font-medium">"{msg.replyToText}"</span>
                        </div>
                      )}

                      {productMatch ? (
                        /* Premium parsed product recommendation card */
                        <div className="bg-white rounded-3xl border border-slate-150 shadow-md p-4 space-y-3 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                          <div className="absolute right-0 top-0 bg-teal-600 text-white text-[8px] font-black uppercase px-3 py-1.5 rounded-bl-xl tracking-wider">
                            Recomendado
                          </div>
                          <div className="flex gap-3">
                            <img 
                              src={productMatch[4]} 
                              alt={productMatch[2]} 
                              referrerPolicy="no-referrer"
                              className="h-14 w-14 rounded-xl object-cover border border-slate-100 bg-slate-50 shrink-0"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120';
                              }}
                            />
                            <div className="min-w-0 flex-grow pr-12">
                              <span className="text-[8px] font-black tracking-widest text-teal-600 uppercase block">Farmacia Vitalis</span>
                              <h5 className="text-xs font-extrabold text-slate-800 truncate leading-tight mt-0.5">{productMatch[2]}</h5>
                              <p className="text-[11px] font-mono font-black text-slate-800 mt-1">${parseFloat(productMatch[3]).toFixed(2)}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => {
                              const originalProduct = products.find(p => p.id === productMatch[1]);
                              const productToCart = originalProduct || {
                                id: productMatch[1],
                                name: productMatch[2],
                                price: parseFloat(productMatch[3]),
                                image: productMatch[4],
                                description: 'Recomendación del farmacéutico',
                                category: 'Recomendados',
                                stock: 99
                              };
                              onAddToCart(productToCart);
                            }}
                            className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-black text-[10px] uppercase rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-teal-600/10"
                          >
                            <ShoppingBag size={12} />
                            <span>Añadir al Carrito</span>
                          </button>
                        </div>
                      ) : (
                        /* Standard Chat Bubble (with hover quick action menus) */
                        <div className={`px-5 py-3 rounded-2xl md:rounded-[1.5rem] text-xs font-semibold shadow-sm transition-all group-hover:shadow-md relative ${
                          isMe 
                            ? 'bg-teal-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          
                          {/* Attachments */}
                          {msg.mediaUrl && (
                            <div className="mb-2 max-w-full overflow-hidden rounded-xl">
                              {msg.mediaType === 'image' ? (
                                <img 
                                  src={msg.mediaUrl} 
                                  alt="Adjunto" 
                                  className="max-h-56 w-auto max-w-full rounded-lg object-contain border border-slate-100 bg-slate-50 cursor-zoom-in"
                                  onClick={() => {
                                    const w = window.open();
                                    if (w) w.document.write(`<img src="${msg.mediaUrl}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                  }}
                                />
                              ) : msg.mediaType === 'audio' ? (
                                <AudioPlayer src={msg.mediaUrl} isMe={isMe} />
                              ) : (
                                <a 
                                  href={msg.mediaUrl} 
                                  download={msg.text ? msg.text.replace('[Archivo adjunto: ', '').replace(']', '') : 'adjunto'}
                                  className={`flex items-center gap-2 p-3 rounded-lg border transition ${
                                    isMe 
                                      ? 'bg-teal-700/55 hover:bg-teal-800 text-teal-50 border-teal-500/30' 
                                      : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                  }`}
                                >
                                  <FileIcon size={16} className={isMe ? 'text-teal-200' : 'text-teal-600'} />
                                  <span className="truncate max-w-[180px] text-[10px] font-bold">Descargar Documento</span>
                                </a>
                              )}
                            </div>
                          )}

                          {/* Message Text (if not pure voice note) */}
                          {msg.mediaType !== 'audio' && (
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          )}

                          {/* Reactions Display Panel */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button
                                  key={emoji}
                                  onClick={() => handleReactToMsg(msg.id, emoji)}
                                  className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border shadow-xs transition ${
                                    isMe 
                                      ? 'bg-teal-700/60 border-teal-500/30 text-white hover:bg-teal-800/80' 
                                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                  }`}
                                  title={`Reaccionado por: ${users.join(', ')}`}
                                >
                                  <span>{emoji}</span>
                                  <span className="font-extrabold text-[8px]">{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Time & Read Receipts */}
                          <div className="flex justify-end items-center gap-1 mt-1 select-none">
                            <span className={`text-[8px] ${isMe ? 'text-teal-200' : 'text-slate-400'} font-bold`}>
                              {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {isMe && <CheckCheck size={11} className="text-teal-200" />}
                          </div>
                        </div>
                      )}

                      {/* Hover action menus for replies, reactions, deletions */}
                      <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1 z-20 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 ${
                        isMe ? 'right-full mr-2' : 'left-full ml-2'
                      }`}>
                        {/* Reply icon */}
                        <button
                          type="button"
                          onClick={() => setReplyingTo({
                            id: msg.id,
                            text: msg.text.startsWith('[ATTACHMENT_') ? 'Medicamento Recomendado' : msg.text,
                            senderName: isMe ? 'Tú' : msg.senderName
                          })}
                          className="p-1 hover:bg-slate-150 text-slate-500 hover:text-teal-600 rounded-full transition-colors"
                          title="Responder / Citar"
                        >
                          <CornerUpLeft size={12} />
                        </button>

                        {/* Smile Reaction Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                            className="p-1 hover:bg-slate-150 text-slate-500 hover:text-amber-500 rounded-full transition-colors"
                            title="Reaccionar"
                          >
                            <Smile size={12} />
                          </button>

                          {/* Micro emoji reactions bar */}
                          {activeReactionMenu === msg.id && (
                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 p-1 rounded-xl flex gap-1.5 shadow-2xl z-30 animate-in zoom-in-90 duration-150">
                              {emojis.map(e => (
                                <button
                                  key={e}
                                  type="button"
                                  onClick={() => handleReactToMsg(msg.id, e)}
                                  className="hover:scale-125 transition-transform text-xs"
                                >
                                  {e}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Delete message (Only if it's mine) */}
                        {isMe && (
                          <button
                            type="button"
                            onClick={() => handleDeleteMsg(msg.id)}
                            className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-600 rounded-full transition-colors"
                            title="Eliminar mensaje"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
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

        {/* 3. Reply Target Indicator Box (above inputs) */}
        {replyingTo && (
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
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

        {/* 4. Active message input & voice recorder & file upload */}
        <div className="p-3 border-t border-slate-150 bg-white flex items-center gap-2 shrink-0">
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
          />

          {/* Upload clip button */}
          <button
            type="button"
            disabled={isUploading || isSending}
            onClick={() => fileInputRef.current?.click()}
            className={`p-3 rounded-xl border transition flex items-center justify-center shrink-0 ${
              isUploading 
                ? 'bg-amber-50 text-amber-500 border-amber-200 animate-pulse' 
                : 'bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border-slate-200'
            }`}
            title="Adjuntar multimedia"
          >
            <Paperclip size={15} />
          </button>

          {/* Voice recorder action button */}
          <VoiceRecorder onSendVoice={handleSendVoice} disabled={isSending || isUploading} />

          {/* Typing input form */}
          <form onSubmit={handleSendMessage} className="flex-grow flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              disabled={isUploading || isSending}
              placeholder={isUploading ? "Cargando archivo..." : "Escribe tu consulta al farmacéutico..."}
              className="flex-grow bg-slate-50 border border-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 transition min-w-0"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending || isUploading}
              className="p-3 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition shadow-md flex items-center justify-center shrink-0"
            >
              <Send size={15} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default SupportChatRoom;
