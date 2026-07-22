import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Calculator, 
  ShieldCheck, 
  ArrowLeft, 
  Sparkles
} from 'lucide-react';
import { Product, User } from '../../types';
import { DoseCalculator } from '../modals/first-aid/DoseCalculator';
import { streamChatMessages, markChatAsReadByUser, SupportMessage } from '../../services/db.support';
import { SupportChatRoom } from './SupportChatRoom';

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
  const [loadingMessages, setLoadingMessages] = useState(true);
  
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

  return (
    <div className="w-full max-w-5xl mx-auto px-1 pt-1 pb-0 sm:px-4 sm:py-2 md:py-6 flex flex-col h-[100dvh] md:h-full overflow-hidden font-sans" id="support-and-dose-container">
      {/* Header */}
      <div className="flex flex-row items-center justify-between gap-2 mb-1 sm:mb-2 md:mb-6 pb-1 sm:pb-2 md:pb-4 border-b border-slate-200 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 shrink-0"
            title="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm sm:text-xl font-extrabold text-slate-800 tracking-tight flex items-center gap-1.5 truncate">
              <span className="truncate">Soporte y Dosificación</span>
              <span className="bg-teal-500 text-white text-[8px] sm:text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full tracking-widest animate-pulse shrink-0">
                En Línea
              </span>
            </h2>
            <p className="hidden sm:block text-xs text-slate-400 font-semibold mt-0.5">
              Chat privado de primera línea con farmacéuticos y calculadora de dosis pediátrica.
            </p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200 shadow-inner shrink-0">
          <button
            onClick={() => setActiveSubTab('chat')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'chat'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>
          <button
            onClick={() => setActiveSubTab('calculator')}
            className={`flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all duration-200 ${
              activeSubTab === 'calculator'
                ? 'bg-teal-600 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calculator size={13} />
            <span className="hidden sm:inline">Calculadora</span>
            <span className="sm:hidden">Dosis</span>
          </button>
        </div>
      </div>

      {/* Main Area */}
      <div className="w-full flex-grow overflow-hidden flex flex-col min-h-0">
        {activeSubTab === 'chat' ? (
          /* SUPPORT CHAT TAB */
          <div className="w-full flex-grow overflow-hidden flex flex-col min-h-0">
            {!currentUser ? (
              /* PROMPT USER TO LOG IN */
              <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xl p-6 sm:p-12 text-center max-w-xl mx-auto space-y-6 my-auto">
                <div className="h-16 w-16 bg-teal-50 rounded-2xl flex items-center justify-center mx-auto text-teal-600 shadow-inner">
                  <ShieldCheck size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-base sm:text-lg font-black text-slate-800 uppercase tracking-tight">
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
              <SupportChatRoom 
                products={products}
                currentUser={currentUser}
                messages={messages}
                loadingMessages={loadingMessages}
                onAddToCart={onAddToCart}
                onOpenCalculator={() => setActiveSubTab('calculator')}
              />
            )}
          </div>
        ) : (
          /* DOSAGE CALCULATOR TAB */
          <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-slate-200/80 shadow-xl p-4 sm:p-8 overflow-y-auto custom-scrollbar flex-grow">
            <div className="mb-4 bg-teal-50/50 rounded-2xl p-3 sm:p-4 border border-teal-100/50 flex items-start gap-3">
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
