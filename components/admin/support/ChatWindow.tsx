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
  ArrowLeft, 
  Mail, 
  CheckCheck, 
  Volume2, 
  VolumeX, 
  ShoppingBag, 
  Search, 
  Plus, 
  Paperclip,
  File as FileIcon,
  Trash2,
  CornerUpLeft,
  Smile,
  X,
  MessageSquare
} from 'lucide-react';
import { VoiceRecorder } from '../../support/VoiceRecorder';
import { AudioPlayer } from '../../support/AudioPlayer';

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

  // Play sound when new message is received from client
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderRole === 'USER') {
        playChatSound('receive');
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Typing status update handler
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (currentUser?.uid) {
      setAdminTypingStatus(selectedChat.userId, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setAdminTypingStatus(selectedChat.userId, false);
      }, 2500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending || !currentUser) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
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
    } catch (err) {
      console.error("Error sending admin message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Canned response direct submission
  const handleSendCannedResponse = async (text: string) => {
    if (isSending || !currentUser) return;
    setIsSending(true);
    try {
      await sendMessageAsAdmin(
        selectedChat.userId, 
        currentUser, 
        text, 
        undefined, 
        undefined, 
        replyingTo || undefined
      );
      playChatSound('send');
      setReplyingTo(null);
    } catch (err) {
      console.error("Error sending canned response:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Multimedia File uploader handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentUser) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("El archivo excede el límite de 5MB.");
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
        await sendMessageAsAdmin(
          selectedChat.userId, 
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

  // Recorded voice message submission
  const handleSendVoice = async (base64Audio: string, durationSec: number) => {
    if (!currentUser) return;
    setIsSending(true);
    try {
      const textDescription = `🎤 Mensaje de voz (${durationSec}s)`;
      await sendMessageAsAdmin(
        selectedChat.userId,
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

  // Message physical deletion handler
  const handleDeleteMsg = async (msgId: string) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar este mensaje de soporte?")) {
      try {
        await deleteSupportMessage(selectedChat.userId, msgId);
      } catch (err) {
        alert("No se pudo eliminar el mensaje.");
      }
    }
  };

  // Emoji reaction toggle handler
  const handleReactToMsg = async (msgId: string, emoji: string) => {
    try {
      const senderName = currentUser?.displayName || 'Administrador';
      await reactToMessage(selectedChat.userId, msgId, emoji, senderName);
      setActiveReactionMenu(null);
    } catch (err) {
      console.error("Error setting reaction:", err);
    }
  };

  // Share premium product recommendation attachment
  const handleShareProduct = async (product: Product) => {
    if (!currentUser) return;
    setIsSending(true);
    try {
      const recommendationText = `[ATTACHMENT_PRODUCT:${product.id}|${product.name}|${product.price}|${product.image}]`;
      await sendMessageAsAdmin(
        selectedChat.userId, 
        currentUser, 
        recommendationText, 
        undefined, 
        undefined, 
        replyingTo || undefined
      );
      playChatSound('send');
      setShowProductSharer(false);
      setReplyingTo(null);
    } catch (err) {
      console.error("Error sharing product recommendation:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Filter messages based on local active search text
  const filteredMessages = searchQuery.trim() === ''
    ? messages
    : messages.filter(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()));

  // Filter inventory items in real time
  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return products.slice(0, 5);
    return products.filter(p => 
      p.name.toLowerCase().includes(searchProductQuery.toLowerCase()) || 
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(searchProductQuery.toLowerCase()))
    );
  }, [searchProductQuery, products]);

  const emojis = ['👍', '❤️', '😂', '😮', '😢', '🙏'];

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 relative font-sans overflow-hidden">
      
      {/* 1. Header with search capabilities */}
      <div className="p-4 border-b border-slate-200/80 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition lg:hidden"
            title="Volver"
          >
            <ArrowLeft size={16} />
          </button>
          
          <div className="h-9 w-9 bg-teal-500 text-slate-900 font-black rounded-xl flex items-center justify-center text-xs shadow-md shadow-teal-500/10">
            {selectedChat.userDisplayName.charAt(0).toUpperCase()}
          </div>
          
          <div className="min-w-0">
            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider truncate">
              {selectedChat.userDisplayName}
            </h4>
            <p className="text-[10px] text-slate-400 font-semibold truncate flex items-center gap-1 mt-0.5">
              <Mail size={10} className="text-slate-300" /> {selectedChat.userEmail || 'Sin correo registrado'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Search Field */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
              <Search size={12} />
            </span>
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar mensajes..."
              className="w-full pl-7 pr-7 py-1.5 bg-slate-100 border border-slate-200/50 rounded-lg text-[10px] font-bold focus:outline-none focus:bg-white"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                <X size={11} />
              </button>
            )}
          </div>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled 
                ? 'bg-teal-50 text-teal-600 border-teal-100/50' 
                : 'bg-slate-100 text-slate-400 border-slate-200/40'
            }`}
            title={soundEnabled ? "Silenciar" : "Activar sonido"}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
        </div>
      </div>

      {/* 2. Messages Board */}
      <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar relative bg-slate-50/40">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center flex-col gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Descargando respuestas...</span>
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="h-14 w-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shadow-inner animate-pulse">
              <MessageSquare size={22} />
            </div>
            <div className="max-w-xs space-y-1">
              <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                {searchQuery ? 'Mensaje No Encontrado' : 'Sin Mensajes Recientes'}
              </p>
              <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                {searchQuery
                  ? `No se encontraron resultados para la búsqueda "${searchQuery}".`
                  : 'Este soporte está vacío. Utiliza la barra de respuestas predefinidas o envía una recomendación de fármaco para guiar al cliente.'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMessages.map((msg) => {
              const isMe = msg.senderRole === 'ADMIN';
              const productMatch = msg.text.match(/^\[ATTACHMENT_PRODUCT:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]$/);

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} group relative`}
                >
                  <div className="max-w-[85%] sm:max-w-[72%] space-y-1 relative">
                    
                    {/* Role name */}
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider px-1">
                      {isMe ? 'Farmacéutico' : msg.senderName}
                    </p>

                    {/* Quoted Message reference rendering */}
                    {msg.replyToId && (
                      <div className={`mb-1 p-2 rounded-xl border text-[10px] leading-tight flex flex-col gap-0.5 ${
                        isMe 
                          ? 'bg-teal-700/50 border-teal-500/20 text-teal-100' 
                          : 'bg-slate-100 border-slate-200 text-slate-650'
                      }`}>
                        <span className="font-black text-[8px] uppercase tracking-wider text-teal-300">
                          ⤺ Respondido a {msg.replyToSenderName}
                        </span>
                        <span className="italic line-clamp-2 font-medium">"{msg.replyToText}"</span>
                      </div>
                    )}

                    {productMatch ? (
                      /* Parsed Recommendation Visual Card */
                      <div className="bg-white rounded-2xl border border-slate-150 shadow-sm p-3.5 space-y-2 relative overflow-hidden">
                        <div className="absolute right-0 top-0 bg-teal-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-bl-lg tracking-wider">
                          Recomendado
                        </div>
                        <div className="flex gap-2.5">
                          <img src={productMatch[4]} alt={productMatch[2]} className="h-10 w-10 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0" />
                          <div className="min-w-0 pr-10">
                            <span className="text-[8px] font-black tracking-widest text-teal-600 uppercase block">Farmacia Vitalis</span>
                            <h5 className="text-[11px] font-extrabold text-slate-800 truncate leading-tight mt-0.5">{productMatch[2]}</h5>
                            <p className="text-[10px] font-mono font-black text-slate-800 mt-0.5">${parseFloat(productMatch[3]).toFixed(2)}</p>
                          </div>
                        </div>
                        <span className="block text-[8.5px] font-bold text-teal-600 bg-teal-50/50 rounded p-1 text-center">
                          Tarjeta de Recomendación enviada al cliente
                        </span>
                      </div>
                    ) : (
                      /* Standard bubble container */
                      <div className={`px-4 py-2.5 rounded-2xl md:rounded-[1.5rem] text-xs font-semibold shadow-sm transition-all group-hover:shadow-md relative ${
                        isMe 
                          ? 'bg-teal-600 text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                      }`}>
                        
                        {/* Custom multimedia files */}
                        {msg.mediaUrl && (
                          <div className="mb-2 max-w-full overflow-hidden rounded-xl">
                            {msg.mediaType === 'image' ? (
                              <img 
                                src={msg.mediaUrl} 
                                alt="Adjunto" 
                                className="max-h-56 w-auto max-w-full rounded-lg object-contain bg-slate-50 border border-slate-100 cursor-zoom-in"
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

                        {/* Text */}
                        {msg.mediaType !== 'audio' && (
                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                        )}

                        {/* Reactions */}
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

                        {/* Time details */}
                        <div className="flex justify-end items-center gap-1 mt-1 select-none">
                          <span className={`text-[8px] ${isMe ? 'text-teal-200' : 'text-slate-400'} font-bold`}>
                            {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                          {isMe && <CheckCheck size={11} className="text-teal-200" />}
                        </div>
                      </div>
                    )}

                    {/* Quick action bar popovers */}
                    <div className={`absolute top-1/2 -translate-y-1/2 flex items-center gap-1 bg-white border border-slate-200 shadow-xl rounded-full px-2 py-1 z-20 opacity-0 group-hover:opacity-100 transition-all scale-95 group-hover:scale-100 ${
                      isMe ? 'right-full mr-2' : 'left-full ml-2'
                    }`}>
                      <button
                        type="button"
                        onClick={() => setReplyingTo({
                          id: msg.id,
                          text: msg.text.startsWith('[ATTACHMENT_') ? 'Recomendación de Producto' : msg.text,
                          senderName: isMe ? 'Farmacéutico' : msg.senderName
                        })}
                        className="p-1 hover:bg-slate-150 text-slate-500 hover:text-teal-600 rounded-full transition-colors"
                        title="Responder"
                      >
                        <CornerUpLeft size={12} />
                      </button>

                      {/* Reactions smile selector */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setActiveReactionMenu(activeReactionMenu === msg.id ? null : msg.id)}
                          className="p-1 hover:bg-slate-150 text-slate-500 hover:text-amber-550 rounded-full transition-colors"
                          title="Reaccionar"
                        >
                          <Smile size={12} />
                        </button>

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

                      {/* Hard message deletion */}
                      {isMe && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMsg(msg.id)}
                          className="p-1 hover:bg-rose-50 text-slate-500 hover:text-rose-650 rounded-full transition-colors"
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

        {/* Customer Typing status */}
        {selectedChat.userTyping && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="max-w-[70%] space-y-0.5">
              <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide px-1.5">Cliente</p>
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

      {/* 3. Product recommendation overlay panel */}
      {showProductSharer && (
        <div className="absolute bottom-[108px] left-4 right-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-40 space-y-3 animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between">
            <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-700 flex items-center gap-1">
              <ShoppingBag size={12} className="text-teal-600" /> Recomendar Medicamento al Cliente
            </h5>
            <button 
              onClick={() => setShowProductSharer(false)}
              className="text-xs font-black text-slate-400 hover:text-slate-600"
            >
              Cerrar
            </button>
          </div>

          <div className="relative">
            <input 
              type="text"
              placeholder="Buscar medicamento por nombre o ingrediente activo..."
              value={searchProductQuery}
              onChange={(e) => setSearchProductQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-bold focus:outline-none"
            />
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>

          <div className="divide-y divide-slate-100 max-h-[160px] overflow-y-auto no-scrollbar">
            {filteredProducts.map(p => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 group">
                <div className="flex items-center gap-2.5">
                  <img src={p.image} alt={p.name} className="h-8 w-8 rounded-lg object-cover bg-slate-50" />
                  <div>
                    <p className="text-xs font-extrabold text-slate-800 leading-tight group-hover:text-teal-600 transition-colors">{p.name}</p>
                    <p className="text-[9px] text-slate-400 font-semibold">{p.activeIngredient || p.category} • ${p.price.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleShareProduct(p)}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-600 text-teal-600 hover:text-white text-[10px] font-black rounded-lg transition"
                >
                  Compartir
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Reply Citation Header */}
      {replyingTo && (
        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between text-xs animate-in slide-in-from-bottom-2 duration-150">
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

      {/* 5. Quick templates drawer */}
      <div className="p-2 bg-slate-50 border-t border-slate-200/70 flex flex-wrap gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        <button
          onClick={() => setShowProductSharer(!showProductSharer)}
          className="px-2.5 py-1.5 bg-teal-600 text-white font-black text-[9.5px] uppercase rounded-lg shadow-sm hover:bg-teal-700 transition flex items-center gap-1 shrink-0"
        >
          <Plus size={11} /> Recomendar Producto
        </button>

        {CANNED_RESPONSES.map((r, idx) => (
          <button
            key={idx}
            onClick={() => handleSendCannedResponse(r.text)}
            className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:border-teal-500 hover:text-teal-600 font-extrabold text-[9.5px] uppercase rounded-lg transition shrink-0"
            title={r.text}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* 6. Message Inputs panel */}
      <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2 shrink-0">
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
          accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
        />

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

        <form onSubmit={handleSendMessage} className="flex-grow flex items-center gap-2 min-w-0">
          <input
            type="text"
            value={newMessage}
            onChange={handleInputChange}
            disabled={isUploading || isSending}
            placeholder={isUploading ? "Cargando archivo..." : "Escribe la respuesta del farmacéutico..."}
            className="flex-grow bg-slate-50 border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-slate-800 transition min-w-0"
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
  );
};

export default ChatWindow;
