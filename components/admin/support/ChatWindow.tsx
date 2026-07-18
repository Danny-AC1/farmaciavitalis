import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  SupportMessage, 
  SupportChat, 
  sendMessageAsAdmin, 
  setAdminTypingStatus 
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
  ShieldCheck,
  Paperclip,
  File as FileIcon
} from 'lucide-react';

interface ChatWindowProps {
  selectedChat: SupportChat;
  messages: SupportMessage[];
  products: Product[];
  currentUser: User | null;
  loadingMessages: boolean;
  onBack: () => void;
}

// Quick response templates for pharmacists
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

  // Play sound when new message is received
  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderRole === 'USER') {
        playChatSound('receive');
      }
    }
    lastMessageCountRef.current = messages.length;
  }, [messages]);

  // Handle typing status updates
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    if (selectedChat.id) {
      setAdminTypingStatus(selectedChat.id, true);
      
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      
      typingTimeoutRef.current = setTimeout(() => {
        setAdminTypingStatus(selectedChat.id, false);
      }, 2500);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    // Clear typing status immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setAdminTypingStatus(selectedChat.id, false);

    const adminUser: User = currentUser || {
      uid: 'admin',
      email: 'admin@vitalis.com',
      displayName: 'Farmacéutico Vitalis',
      role: 'ADMIN',
      points: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await sendMessageAsAdmin(selectedChat.id, adminUser, textToSend);
      playChatSound('send');
    } catch (err) {
      console.error("Error sending admin message:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Send a pre-made reply
  const handleSendCannedResponse = async (text: string) => {
    setIsSending(true);
    const adminUser: User = currentUser || {
      uid: 'admin',
      email: 'admin@vitalis.com',
      displayName: 'Farmacéutico Vitalis',
      role: 'ADMIN',
      points: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await sendMessageAsAdmin(selectedChat.id, adminUser, text);
      playChatSound('send');
    } catch (err) {
      console.error("Error sending canned reply:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Recommend/Attach a product
  const handleShareProduct = async (product: Product) => {
    // Custom formatted token that gets parsed into a product card
    const attachmentText = `[ATTACHMENT_PRODUCT:${product.id}|${product.name}|${product.price}|${product.image}]`;
    setIsSending(true);
    setShowProductSharer(false);

    const adminUser: User = currentUser || {
      uid: 'admin',
      email: 'admin@vitalis.com',
      displayName: 'Farmacéutico Vitalis',
      role: 'ADMIN',
      points: 0,
      createdAt: new Date().toISOString()
    };

    try {
      await sendMessageAsAdmin(selectedChat.id, adminUser, attachmentText);
      playChatSound('send');
    } catch (err) {
      console.error("Error sharing product:", err);
    } finally {
      setIsSending(false);
    }
  };

  // Multimedia file uploader handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Limit size to 5MB for base64 storage
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

      const adminUser: User = currentUser || {
        uid: 'admin',
        email: 'admin@vitalis.com',
        displayName: 'Farmacéutico Vitalis',
        role: 'ADMIN',
        points: 0,
        createdAt: new Date().toISOString()
      };

      try {
        await sendMessageAsAdmin(selectedChat.id, adminUser, textDescription, dataUrl, mediaType);
        playChatSound('send');
      } catch (err) {
        console.error("Error al subir archivo como administrador:", err);
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

  // Search/Filter products
  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return products.slice(0, 5);
    const q = searchProductQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.activeIngredient && p.activeIngredient.toLowerCase().includes(q))
    ).slice(0, 5);
  }, [products, searchProductQuery]);

  return (
    <div className="flex-grow flex flex-col h-full bg-white relative font-sans">
      
      {/* Active Chat Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="lg:hidden p-1.5 text-slate-500 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <h4 className="text-xs font-black uppercase tracking-tight text-slate-800 flex items-center gap-2">
              <span>{selectedChat.userDisplayName}</span>
              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
            </h4>
            <p className="text-[9.5px] text-slate-400 font-bold flex items-center gap-1 mt-0.5">
              <Mail size={10} />
              <span>{selectedChat.userEmail}</span>
            </p>
          </div>
        </div>

        {/* Audio Toggle & Badge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-2 rounded-xl transition-all border ${
              soundEnabled 
                ? 'bg-teal-50 text-teal-600 border-teal-100' 
                : 'bg-slate-50 text-slate-400 border-slate-100'
            }`}
            title={soundEnabled ? "Silenciar" : "Activar Sonido"}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
          </button>
          
          <span className="bg-emerald-500 text-white text-[8px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase shadow-xs">
            Atendiendo
          </span>
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-grow overflow-y-auto p-5 space-y-4 bg-slate-50/30 custom-scrollbar overscroll-contain relative">
        {loadingMessages ? (
          <div className="h-full flex items-center justify-center flex-col gap-2.5">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-teal-600"></div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cargando conversación...</span>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Disclaimer */}
            <div className="text-center p-3 max-w-md mx-auto bg-white rounded-2xl border border-slate-100 shadow-xs space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest text-teal-600 flex items-center justify-center gap-1">
                <ShieldCheck size={11} /> Canal Certificado Vitalis
              </span>
              <p className="text-[9.5px] text-slate-400 font-semibold leading-relaxed">
                Tus respuestas están encriptadas bajo secreto profesional médico-farmacéutico.
              </p>
            </div>

            {messages.map((msg) => {
              const isMe = msg.senderRole === 'ADMIN';
              
              // Parse custom product recommendations in bubble
              const productMatch = msg.text.match(/^\[ATTACHMENT_PRODUCT:([^|]+)\|([^|]+)\|([^|]+)\|([^\]]+)\]$/);

              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div className="max-w-[85%] sm:max-w-[70%] space-y-0.5">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide px-1.5">
                      {isMe ? msg.senderName : 'Cliente'}
                    </p>

                    {productMatch ? (
                      /* Rich product recommendation card */
                      <div className="bg-white rounded-3xl border border-slate-100 shadow-md p-3.5 space-y-3 relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bg-teal-500 text-white text-[8px] font-black uppercase px-2.5 py-1 rounded-bl-xl tracking-wider">
                          Recomendado
                        </div>
                        <div className="flex items-center gap-3">
                          <img 
                            src={productMatch[4]} 
                            alt={productMatch[2]} 
                            referrerPolicy="no-referrer"
                            className="h-14 w-14 rounded-2xl object-cover border border-slate-100 shrink-0 bg-slate-50"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=120';
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-[8.5px] font-black tracking-wider text-slate-400 uppercase">Medicamento Sugerido</span>
                            <h5 className="text-xs font-extrabold text-slate-800 truncate leading-tight mt-0.5">{productMatch[2]}</h5>
                            <span className="text-xs font-mono font-black text-slate-800 block mt-1">${parseFloat(productMatch[3]).toFixed(2)}</span>
                          </div>
                        </div>
                        <div className="pt-2.5 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-500 font-bold">
                          <span>Recomendado por Farmacia Vitalis</span>
                          <span className="text-teal-600 font-black uppercase flex items-center gap-0.5">Compartido</span>
                        </div>
                      </div>
                    ) : (
                      /* Regular Text Message bubble */
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

            {/* Dynamic Customer Typing Indicator */}
            {selectedChat.userTyping && (
              <div className="flex flex-col items-start animate-pulse">
                <div className="max-w-[70%] space-y-0.5">
                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-wide px-1.5">Cliente</p>
                  <div className="bg-slate-100 border border-slate-200/50 px-5 py-3 rounded-2xl md:rounded-[1.5rem] rounded-tl-none flex items-center gap-2.5 shadow-sm">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                      <span className="h-1.5 w-1.5 bg-slate-400 rounded-full animate-bounce delay-300"></span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Escribiendo...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Recommended product search overlay panel */}
      {showProductSharer && (
        <div className="absolute inset-x-0 bottom-[140px] bg-white border-t border-slate-200 p-4 shadow-xl space-y-3 z-20 animate-in slide-in-from-bottom duration-200">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
              <ShoppingBag size={13} className="text-teal-600" />
              <span>Recomendar Producto del Catálogo</span>
            </span>
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

      {/* Quick Action bar & Canned Responses drawer */}
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

      {/* Message Input form */}
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
            placeholder={isUploading ? "Leyendo archivo..." : "Escribe la respuesta del farmacéutico o presiona una respuesta rápida..."}
            className="flex-grow bg-slate-50 border border-slate-200/80 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none rounded-xl px-4 py-3 text-xs font-bold text-slate-800 transition"
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
