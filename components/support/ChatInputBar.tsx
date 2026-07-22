import React, { useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  ClipboardList, 
  Calculator, 
  Plus, 
  X 
} from 'lucide-react';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatInputBarProps {
  newMessage: string;
  isSending: boolean;
  isUploading: boolean;
  showPlusMenu: boolean;
  setShowPlusMenu: (val: boolean) => void;
  onTextareaChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onSendMessage: (e: React.FormEvent) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSendVoice: (base64Audio: string, durationSec: number) => void;
  onOpenPrescriptionModal?: () => void;
  onOpenCalculator?: () => void;
  placeholder?: string;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  newMessage,
  isSending,
  isUploading,
  showPlusMenu,
  setShowPlusMenu,
  onTextareaChange,
  onKeyDown,
  onSendMessage,
  onFileUpload,
  onSendVoice,
  onOpenPrescriptionModal,
  onOpenCalculator,
  placeholder = "Escribe tu consulta... (Enter para salto de línea)",
  textareaRef,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="p-1 sm:p-2.5 border-t border-slate-150 bg-white flex items-center sm:items-end gap-1.5 sm:gap-2 shrink-0 relative">
      <input 
        type="file"
        ref={fileInputRef}
        onChange={onFileUpload}
        className="hidden"
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx"
      />

      {/* Expandable (+) Floating Actions Drawer */}
      {showPlusMenu && (
        <div className="absolute bottom-16 left-2 z-40 bg-white border border-slate-200 shadow-2xl rounded-2xl p-2 w-72 animate-in slide-in-from-bottom-3 fade-in duration-200">
          <div className="flex items-center justify-between pb-2 mb-1 px-2 border-b border-slate-100">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Opciones de Soporte</span>
            <button 
              type="button" 
              onClick={() => setShowPlusMenu(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
            >
              <X size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {/* 1. Adjuntar Foto / Fórmula / Comprobante */}
            <button
              type="button"
              disabled={isUploading || isSending}
              onClick={() => {
                setShowPlusMenu(false);
                fileInputRef.current?.click();
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-teal-50 text-left transition group"
            >
              <div className="h-9 w-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:bg-teal-600 group-hover:text-white transition">
                <Paperclip size={16} />
              </div>
              <div>
                <h5 className="text-xs font-bold text-slate-800">Adjuntar Foto / Fórmula</h5>
                <p className="text-[10px] text-slate-400">Receta, medicamento o comprobante</p>
              </div>
            </button>

            {/* 2. Subir Receta Médica */}
            {onOpenPrescriptionModal && (
              <button
                type="button"
                disabled={isUploading || isSending}
                onClick={() => {
                  setShowPlusMenu(false);
                  onOpenPrescriptionModal();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-50 text-left transition group"
              >
                <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition">
                  <ClipboardList size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Formulario de Receta</h5>
                  <p className="text-[10px] text-slate-400">Envía receta detallada para validación</p>
                </div>
              </button>
            )}

            {/* 3. Calculadora de Dosis */}
            {onOpenCalculator && (
              <button
                type="button"
                onClick={() => {
                  setShowPlusMenu(false);
                  onOpenCalculator();
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-amber-50 text-left transition group"
              >
                <div className="h-9 w-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition">
                  <Calculator size={16} />
                </div>
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Calculadora de Dosis</h5>
                  <p className="text-[10px] text-slate-400">Dosis exacta en jarabe por peso en KG</p>
                </div>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Plus (+) Button */}
      <button
        type="button"
        disabled={isUploading || isSending}
        onClick={() => setShowPlusMenu(!showPlusMenu)}
        className={`p-2.5 sm:p-3 rounded-2xl border transition flex items-center justify-center shrink-0 shadow-sm ${
          showPlusMenu 
            ? 'bg-teal-600 text-white border-teal-600 rotate-45' 
            : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
        }`}
        title="Opciones adicionales (+)"
      >
        <Plus size={18} className="transition-transform duration-200" />
      </button>

      {/* Voice Recorder Action Button (ALWAYS VISIBLE) */}
      <div className="shrink-0">
        <VoiceRecorder onSendVoice={onSendVoice} disabled={isSending || isUploading} />
      </div>

      {/* Auto-expanding Textarea Form */}
      <form onSubmit={onSendMessage} className="flex-grow flex items-end gap-1.5 sm:gap-2 min-w-0">
        <textarea
          ref={textareaRef as any}
          rows={1}
          value={newMessage}
          onChange={onTextareaChange}
          onKeyDown={onKeyDown}
          disabled={isUploading || isSending}
          placeholder={isUploading ? "Cargando archivo..." : placeholder}
          className="flex-grow bg-slate-50 border border-slate-200/90 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/10 outline-none rounded-2xl px-3.5 py-2.5 text-xs font-medium text-slate-800 transition min-w-0 resize-none max-h-28 overflow-y-auto leading-relaxed"
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
  );
};

export default ChatInputBar;
