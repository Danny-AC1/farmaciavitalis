import React, { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { createAssistantChat } from '../services/gemini';
import type { Chat } from "@google/genai";

interface AssistantProps {
  products: Product[];
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const Assistant: React.FC<AssistantProps> = ({ products, isOpen, onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy Vitalis Asistent 🤖. ¿En qué puedo ayudarte con tu salud hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat when opened or products change
  useEffect(() => {
    if (isOpen && !chatSession.current) {
      chatSession.current = createAssistantChat(products);
    }
  }, [isOpen, products]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [messages, isOpen, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim()) return;
    
    // Attempt re-init if null
    if (!chatSession.current) {
        chatSession.current = createAssistantChat(products);
    }
    
    // If still null, API key is missing
    if (!chatSession.current) {
        setMessages(prev => [...prev, { role: 'model', text: '⚠️ Error: No se detectó la API Key. Configura VITE_API_KEY en tu .env o Vercel.' }]);
        return;
    }

    const userMsg = input;
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);
    setErrorState(null);

    try {
      const response = await chatSession.current.sendMessage({ message: userMsg });
      const text = response.text;
      
      if (text) {
          setMessages(prev => [...prev, { role: 'model', text }]);
      } else {
          throw new Error("Empty response");
      }
    } catch (error: any) {
      console.error("Chat Error:", error);
      let errorMsg = 'Tuve un problema al conectar con el servidor.';
      const rawError = error.message || error.toString();

      if (rawError.includes('401') || rawError.includes('403')) {
          errorMsg = 'Error de autenticación (403). Verifica que la API Key sea correcta y que la "Google Generative AI API" esté habilitada en tu Google Cloud Console.';
      } else if (rawError.includes('404')) {
          errorMsg = 'Modelo no disponible (404). Tu clave podría no tener acceso a Gemini 2.5 Flash.';
      } else if (rawError.includes('429')) {
          errorMsg = 'Demasiadas solicitudes. Intenta más tarde.';
      }

      setMessages(prev => [...prev, { role: 'model', text: `❌ ${errorMsg}` }]);
      setErrorState(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Overlay for mobile to darken background when chat is open */}
      <div 
        className={`fixed inset-0 bg-black/50 z-30 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Chat Window 
          Mobile optimizations:
          - top-[72px] to clear Navbar (h-16 + spacing)
          - bottom-[72px] to clear BottomNav (h-16 + spacing)
          - left-2/right-2 to show a gap from screen edges
      */}
      <div 
        className={`fixed 
          z-[60] 
          bg-white 
          shadow-2xl 
          border-gray-200 
          overflow-hidden 
          flex flex-col 
          transition-all duration-300 transform
          
          /* Mobile Positioning (Stretches between header and footer) */
          left-3 right-3
          top-[72px] 
          bottom-[72px]
          rounded-2xl
          border
          
          /* Desktop Positioning Overrides */
          md:top-auto
          md:left-auto
          md:right-6 
          md:bottom-24
          md:w-96 
          md:h-[600px]
          
          ${isOpen 
            ? 'translate-y-0 opacity-100 scale-100' 
            : 'translate-y-[110%] md:translate-y-20 opacity-0 md:opacity-0 md:scale-95 pointer-events-none'
          }
        `}
      >
        {/* Header */}
        <div className="bg-teal-600 p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <Bot className="text-white h-6 w-6" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg">Vitalis Asistent</h3>
              <p className="text-teal-100 text-xs flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Asistente IA
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50 scroll-smooth">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.role === 'user' 
                    ? 'bg-teal-600 text-white rounded-tr-none' 
                    : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                } ${msg.text.includes('Error') ? 'border-red-200 bg-red-50 text-red-800' : ''}`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-200 shadow-sm flex items-center gap-2 text-gray-400 text-sm">
                 <Loader2 className="h-4 w-4 animate-spin" /> Escribiendo...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 shrink-0 pb-safe">
          <div className="relative">
            <input
              type="text"
              placeholder="Pregunta sobre medicamentos..."
              className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-50"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 disabled:opacity-50 disabled:hover:bg-teal-600 transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <div className="text-center mt-2 flex justify-center items-center gap-1">
             {errorState ? (
                 <span className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Error de Conexión</span>
             ) : (
                 <p className="text-[10px] text-gray-400">Vitalis Asistent puede cometer errores. Consulta a un médico.</p>
             )}
          </div>
        </form>
      </div>
    </>
  );
};

export default Assistant;