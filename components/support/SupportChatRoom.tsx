import React, { useState, useEffect, useRef } from 'react';
import { 
  SupportMessage, 
  SupportChat, 
  sendMessageAsUser, 
  setUserTypingStatus, 
  streamChatSession 
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
  File as FileIcon
} from 'lucide-react';

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

  // Scroll to bottom
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
      await sendMessageAsUser(currentUser.uid, currentUser, textToSend);
      playChatSound('send');
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
        await sendMessageAsUser(currentUser.uid, currentUser, textDescription, dataUrl, mediaType);
        playChatSound('send');
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
                  Canal Seguro
                </p>
              </div>
            </div>

            {/* Sound toggle button */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl transition-all border ${
                soundEnabled 
                  ? 'bg-teal-50 text-teal-600 border-teal-100' 
                  : 'bg-slate-200/50 text-slate-400 border-slate-200/40'
              }`}
              title={soundEnabled ? "Silenciar audio" : "Activar audio"}
            >
              {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
          </div>

          <div className="space-y-3.5">
            <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
              Bienvenido al canal directo de atención humana. Aquí te comunicarás directamente con un farmacéutico profesional en tiempo real para resolver tus dudas de stock, recetas médicas o dosificaciones.
            </p>
            
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
        
        {/* Scrollable Messages queue */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/40 custom-scrollbar overscroll-contain relative">
          {loadingMessages ? (
            <div className="h-full flex items-center justify-center flex-col gap-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cargando conversación...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
              <div className="h-16 w-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shadow-inner animate-pulse">
                <MessageSquare size={26} />
              </div>
              <div className="max-w-xs space-y-1">
                <p className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  ¡Canal Vitalis Humano Abierto!
                </p>
                <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                  Escribe tu consulta o adjunta una receta, foto o archivo usando el botón de clip multimedia. Un farmacéutico responderá de inmediato.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3.5">
              {messages.map((msg) => {
                const isMe = msg.senderRole === 'USER';
                
                // Parse custom product recommendations
                const productMatch = msg.text.match(/^\[ATTACHMENT_PRODUCT:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]$/);

                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className="max-w-[85%] sm:max-w-[72%] space-y-0.5">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider px-1">
                        {isMe ? 'Tú' : msg.senderName}
                      </p>

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
                        /* Standard Chat Bubble (including optional multimedia support) */
                        <div className={`px-5 py-3 rounded-2xl md:rounded-[1.5rem] text-xs font-semibold shadow-sm ${
                          isMe 
                            ? 'bg-teal-600 text-white rounded-tr-none' 
                            : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
                        }`}>
                          {msg.mediaUrl && (
                            <div className="mb-2 max-w-full overflow-hidden rounded-xl">
                              {msg.mediaType === 'image' ? (
                                <img 
                                  src={msg.mediaUrl} 
                                  alt="Adjunto multimedia" 
                                  className="max-h-56 w-auto max-w-full rounded-lg object-contain border border-slate-100 bg-slate-50 cursor-zoom-in"
                                  onClick={() => {
                                    const w = window.open();
                                    if (w) w.document.write(`<img src="${msg.mediaUrl}" style="max-width:100%; max-height:100vh; display:block; margin:auto;" />`);
                                  }}
                                />
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

                          <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                          <div className="flex justify-end items-center gap-1 mt-1">
                            <span className={`text-[8px] ${isMe ? 'text-teal-200' : 'text-slate-400'} font-bold`}>
                              {msg.timestamp ? new Date(msg.timestamp.seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                            {isMe && <CheckCheck size={11} className="text-teal-200" />}
                          </div>
                        </div>
                      )}
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

        {/* 4. Active message input & hidden file input */}
        <div className="p-3 border-t border-slate-150 bg-white flex items-center gap-2 shrink-0">
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
            title="Adjuntar multimedia (Recetas, imágenes o documentos)"
          >
            <Paperclip size={15} />
          </button>

          <form onSubmit={handleSendMessage} className="flex-grow flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              disabled={isUploading || isSending}
              placeholder={isUploading ? "Leyendo archivo..." : "Escribe tu consulta al farmacéutico..."}
              className="flex-grow bg-slate-50 border border-slate-100 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none rounded-xl px-4 py-3 text-xs font-semibold text-slate-800 transition"
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
