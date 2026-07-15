import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Calculator, 
  Send, 
  User as UserIcon, 
  ShieldCheck, 
  Clock, 
  ArrowLeft, 
  Sparkles,
  CheckCheck
} from 'lucide-react';
import { Product, User } from '../../types';
import { DoseCalculator } from '../modals/first-aid/DoseCalculator';
import { streamChatMessages, sendMessageAsUser, markChatAsReadByUser, SupportMessage } from '../../services/db.support';

interface SupportAndDoseCalculatorProps {
  products: Product[];
  currentUser: User | null;
  onAddToCart: (p: Product) => void;
  onClose: () => void;
  onLoginRequest: () => void;
}

export const SupportAndDoseCalculator: React.FC<SupportAndDoseCalculatorProps> = ({
  products,
  currentUser,
  onAddToCart,
  onClose,
  onLoginRequest
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'calculator'>('chat');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Stream chat messages if user is logged in
  useEffect(() => {
    if (!currentUser) {
      setLoadingMessages(false);
      return;
    }

    setLoadingMessages(true);
    // Mark as read immediately when user views the chat
    markChatAsReadByUser(currentUser.uid);

    const unsubscribe = streamChatMessages(currentUser.uid, (data) => {
      setMessages(data);
      setLoadingMessages(false);
      
      // Mark as read when new messages arrive and tab is active
      markChatAsReadByUser(currentUser.uid);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, activeSubTab]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || isSending) return;

    const textToSend = newMessage.trim();
    setNewMessage('');
    setIsSending(true);

    try {
      await sendMessageAsUser(currentUser.uid, currentUser, textToSend);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-2 font-sans md:py-6" id="support-and-dose-container">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-2">
              <span>Soporte Vitalis y Dosificación</span>
              <span className="bg-teal-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-widest animate-pulse">
                En Línea
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Chat privado de primera línea con farmacéuticos y calculadora de dosis pediátrica.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner shrink-0">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'chat'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat de Soporte</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'calculator'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator size={14} />
            <span>Calculadora de Dosis</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="w-full">
        {activeSubTab === 'chat' ? (
          /* SUPPORT CHAT TAB */
          <div className="w-full">
            {!currentUser ? (
              /* PROMPT USER TO LOG IN */
              <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl p-8 md:p-12 text-center max-w-xl mx-auto space-y-6">
                <div className="h-16 w-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-teal-600 shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                    Chat de Soporte Médico Seguro
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                    Para brindarte atención privada de primer nivel y permitir que nuestros farmacéuticos accedan de forma segura a tus consultas e historial de pedidos, por favor inicia sesión o regístrate.
                  </p>
                </div>
                <button
                  onClick={onLoginRequest}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white font-extrabold uppercase text-xs py-3.5 px-6 rounded-2xl tracking-wider shadow-lg shadow-teal-600/15 transition duration-150"
                >
                  Iniciar Sesión en Vitalis
                </button>
              </div>
            ) : (
              /* ACTIVE CHAT WINDOW */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-[2rem] border border-slate-200/80 shadow-xl overflow-hidden min-h-[500px]">
                
                {/* Info Panel Left */}
                <div className="lg:col-span-4 bg-slate-50 p-6 border-r border-slate-100 flex flex-col justify-between">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-teal-600 text-white rounded-xl flex items-center justify-center font-bold text-sm shadow-md shadow-teal-600/20">
                        V
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-tight text-slate-800">
                          Farmacia Vitalis
                        </h4>
                        <p className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full inline-block animate-pulse"></span>
                          Atención Personalizada
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                        Este es un canal privado directo con la administración y los farmacéuticos de Vitalis.
                      </p>
                      <div className="bg-white p-3.5 rounded-2xl border border-slate-100 space-y-2.5">
                        <div className="flex items-start gap-2.5 text-[10px] text-slate-600">
                          <Clock size={12} className="text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-bold uppercase tracking-wider text-slate-800 text-[9px]">Horario de Respuesta</p>
                            <p className="text-slate-400 font-medium mt-0.5">Lunes a Domingo: 8:00 AM - 8:00 PM</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 text-[10px] text-slate-600">
                          <ShieldCheck size={12} className="text-teal-600 mt-0.5" />
                          <div>
                            <p className="font-bold uppercase tracking-wider text-slate-800 text-[9px]">Canal Encriptado</p>
                            <p className="text-slate-400 font-medium mt-0.5">Tus consultas médicas y personales están seguras con nosotros.</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-slate-200/60 hidden lg:block">
                    <div className="flex items-center gap-2 text-slate-400">
                      <UserIcon size={14} className="text-teal-600" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Usuario Activo
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1 truncate">{currentUser.displayName}</p>
                    <p className="text-[10px] font-semibold text-slate-400 truncate">{currentUser.email}</p>
                  </div>
                </div>

                {/* Chat window right */}
                <div className="lg:col-span-8 flex flex-col h-[500px]">
                  {/* Messages container */}
                  <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/40 no-scrollbar">
                    {loadingMessages ? (
                      <div className="h-full flex items-center justify-center flex-col gap-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                        <span className="text-xs text-slate-400 font-bold uppercase">Cargando conversación...</span>
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                        <div className="h-14 w-14 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center shadow-inner">
                          <MessageSquare size={24} />
                        </div>
                        <div className="max-w-xs space-y-1">
                          <p className="text-xs font-black text-slate-800 uppercase tracking-tight">
                            ¡Comienza la conversación!
                          </p>
                          <p className="text-[10px] text-slate-400 font-semibold leading-normal">
                            Escribe tu duda, consulta de medicamentos, consulta sobre cobertura de envíos, o cualquier requerimiento especial.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {messages.map((msg) => {
                          const isMe = msg.senderRole === 'USER';
                          return (
                            <div 
                              key={msg.id} 
                              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                            >
                              <div className="max-w-[85%] sm:max-w-[70%]">
                                <p className="text-[9px] text-slate-400 font-bold uppercase mb-0.5 px-1">
                                  {isMe ? 'Tú' : msg.senderName}
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
                                    {isMe && (
                                      <CheckCheck size={10} className="text-teal-200" />
                                    )}
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

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white flex items-center gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Escribe tu mensaje aquí..."
                      className="flex-grow bg-slate-50 border border-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 transition placeholder:text-slate-400"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isSending}
                      className="p-2.5 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-xl transition duration-150 flex items-center justify-center shrink-0 shadow-sm"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* DOSAGE CALCULATOR TAB */
          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-xl p-6 md:p-8">
            <div className="mb-4 bg-teal-50/50 rounded-2xl p-4 border border-teal-100/50 flex items-start gap-3">
              <Sparkles className="text-teal-600 mt-0.5 shrink-0" size={16} />
              <div className="text-[11px] text-teal-800 leading-normal font-semibold">
                <span className="font-extrabold uppercase">Instrucciones de Uso:</span> Seleccione el principio activo en la calculadora, configure el peso del niño en KG o Libras y la concentración de la presentación para obtener la dosis exacta recomendada por toma.
              </div>
            </div>
            <DoseCalculator 
              products={products}
              addedItemsMap={{}}
              handleAddProduct={onAddToCart}
            />
          </div>
        )}
      </div>
    </div>
  );
};
