import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Bot, Loader2, Sparkles, AlertTriangle } from 'lucide-react';
import { Product } from '../types';
import { createAssistantChat } from '../services/gemini';
import type { Chat } from "@google/genai";

interface AssistantProps {
  products: Product[];
}

interface Message {
  role: 'user' | 'model';
  text: string;
}

const Assistant: React.FC<AssistantProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: '¡Hola! Soy Tu  Asistente Vitalis 🤖. ¿En qué puedo ayudarte con tu salud hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const chatSession = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Chat when opened or products change
  useEffect(() => {
    if (isOpen && !chatSession.current) {
      chatSession.current = createAssistantChat(products);
      if (!chatSession.current) {
         // Silently fail or log, user will see error when trying to send
         console.warn("VitalBot could not initialize (Check API Key)");
      }
    }
  }, [isOpen, products]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        setMessages(prev => [...prev, { role: 'model', text: 'Lo siento, el servicio de IA no está configurado correctamente (API Key faltante).' }]);
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
      if (error.message?.includes('401') || error.message?.includes('403')) {
          errorMsg = 'Error de autenticación (API Key inválida).';
      }
      setMessages(prev => [...prev, { role: 'model', text: errorMsg + ' ¿Podrías intentarlo de nuevo más tarde?' }]);
      setErrorState(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-40 p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 flex items-center justify-center ${
          isOpen ? 'bg-red-500 rotate-90' : 'bg-teal-600 hover:bg-teal-700'
        }`}
      >
        {isOpen ? <X className="text-white h-8 w-8" /> : <MessageCircle className="text-white h-8 w-8" />}
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-24 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl z-40 border border-gray-200 overflow-hidden flex flex-col transition-all duration-300 origin-bottom-right ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'
        }`}
        style={{ maxHeight: '600px', height: '70vh' }}
      >
        {/* Header */}
        <div className="bg-teal-600 p-4 flex items-center gap-3 shrink-0">
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

        {/* Messages Area */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-gray-50">
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
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-gray-100 shrink-0">
          <div className="relative">
            <input
              type="text"
              placeholder="Pregunta sobre medicamentos..."
              className="w-full pl-4 pr-12 py-3 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all disabled:opacity-50"
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
                 <span className="text-[10px] text-red-500 flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> Conexión inestable</span>
             ) : (
                 <p className="text-[10px] text-gray-400">VitalBot puede cometer errores. Consulta a un médico.</p>
             )}
          </div>
        </form>
      </div>
    </>
  );
};

export default Assistant;