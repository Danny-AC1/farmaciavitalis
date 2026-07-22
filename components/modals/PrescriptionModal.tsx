import React, { useState } from 'react';
import { X, Send, Loader2, UploadCloud, Image as ImageIcon, Info, Phone, User as UserIcon, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';
import { User } from '../../types';
import { sendPrescriptionToChatAndDB } from '../../services/prescriptionChatService';

interface PrescriptionModalProps {
  currentUser?: User | null;
  onClose: () => void;
  onOpenChat?: () => void;
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({ currentUser, onClose, onOpenChat }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  
  // Contact details
  const [patientName, setPatientName] = useState(currentUser?.displayName || '');
  const [patientPhone, setPatientPhone] = useState(currentUser?.phone || '');
  const [patientEmail, setPatientEmail] = useState(currentUser?.email || '');
  const [notes, setNotes] = useState('');
  
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSend = async () => {
    if (!file) {
      alert("Por favor, selecciona una foto de tu receta.");
      return;
    }
    if (!patientName.trim()) {
      alert("Por favor, ingresa el nombre del paciente.");
      return;
    }
    if (!patientPhone.trim()) {
      alert("Por favor, ingresa un número de teléfono de contacto.");
      return;
    }

    setIsUploading(true);
    try {
        await sendPrescriptionToChatAndDB({
          file,
          patientName,
          patientPhone,
          patientEmail,
          notes,
          currentUser
        });
        
        setSuccess(true);
    } catch (error) {
        alert("Hubo un error al enviar tu receta al chat. Por favor, intenta de nuevo.");
        console.error(error);
    } finally {
        setIsUploading(false);
    }
  };

  const handleGoToChat = () => {
    onClose();
    if (onOpenChat) {
      onOpenChat();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300 my-8">
        {/* Header */}
        <div className="p-5 bg-teal-600 text-white flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
                <div className="bg-white/20 p-2 rounded-xl">
                    <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-sm uppercase tracking-widest">Subir Receta Médica</h3>
                  <p className="text-[10px] text-teal-100 font-bold uppercase tracking-wider">Envío directo a Chat en Vivo</p>
                </div>
            </div>
            <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="h-6 w-6" /></button>
        </div>
        
        {success ? (
          <div className="p-8 flex flex-col items-center text-center py-12 animate-in fade-in duration-300">
            <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-5 shadow-lg shadow-emerald-600/10">
              <CheckCircle className="h-14 w-14" />
            </div>
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">¡Receta Enviada al Chat!</h4>
            <p className="text-xs text-slate-600 max-w-xs leading-relaxed mb-6 font-medium">
              Hemos subido la foto y los datos de tu receta médica directamente al <strong className="text-teal-700">Chat de Soporte en Vivo</strong>. Un farmacéutico responderá tu mensaje allí.
            </p>
            
            <div className="w-full space-y-3">
              <button
                onClick={handleGoToChat}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-black uppercase text-xs tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition-all active:scale-98"
              >
                <MessageSquare size={16} /> Abrir Chat de Soporte
                <ArrowRight size={16} />
              </button>

              <button
                onClick={onClose}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 py-3 rounded-xl font-bold uppercase text-xs tracking-wider transition-all"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 md:p-8 flex flex-col space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar">
              
              {/* Info Header Box */}
              <div className="bg-teal-50/70 p-3.5 rounded-2xl border border-teal-100 flex items-start gap-3">
                <MessageSquare className="text-teal-600 shrink-0 mt-0.5" size={18} />
                <p className="text-[11px] font-bold text-teal-800 leading-normal">
                  Tu receta se cargará automáticamente en el <span className="underline">Chat de Soporte de la App</span> para que converser en tiempo real con nuestros farmacéuticos.
                </p>
              </div>

              {/* Form Fields Section */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Datos del Paciente</h4>
                
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight flex items-center gap-1">
                    <UserIcon size={12}/> Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight flex items-center gap-1">
                      <Phone size={12}/> Teléfono WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={patientPhone}
                      onChange={(e) => setPatientPhone(e.target.value)}
                      placeholder="Ej: +593 99 999 9999"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={patientEmail}
                      onChange={(e) => setPatientEmail(e.target.value)}
                      placeholder="Ej: paciente@correo.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 tracking-tight flex items-center gap-1">
                    <MessageSquare size={12}/> Comentarios o Notas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ej: Necesito cotizar todos los medicamentos de la receta..."
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all resize-none"
                  />
                </div>
              </div>

              {/* File Upload Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Imagen de la Receta *</h4>
                {!preview ? (
                    <label className="w-full h-44 border-4 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/50 transition-all bg-slate-50/50 group">
                        <div className="bg-white p-3 rounded-full shadow-sm mb-2 group-hover:scale-105 transition-transform border border-slate-100">
                            <UploadCloud className="h-8 w-8 text-teal-600" />
                        </div>
                        <span className="text-slate-700 font-bold uppercase text-[10px] tracking-widest">Seleccionar Archivo</span>
                        <span className="text-[9px] text-slate-400 mt-1 font-semibold uppercase tracking-tight">Cámara o Galería</span>
                        <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleFileChange} 
                        />
                    </label>
                ) : (
                    <div className="relative w-full h-44 rounded-2xl overflow-hidden border-2 border-slate-200 shadow-inner group bg-slate-50">
                        <img src={preview} alt="Receta" className="w-full h-full object-contain p-2" />
                        <button 
                            onClick={() => { setFile(null); setPreview(''); }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}
              </div>

              {/* Info text */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-start gap-2.5">
                  <Info className="text-slate-400 shrink-0 mt-0.5" size={14}/>
                  <p className="text-[9px] font-bold text-slate-500 leading-normal uppercase tracking-tight">
                      Tu información y fotos se resguardan bajo secreto farmacéutico.
                  </p>
              </div>

              {/* Action Button */}
              <button 
                  onClick={handleSend}
                  disabled={!file || !patientName.trim() || !patientPhone.trim() || isUploading}
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3.5 rounded-xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-3.5 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-teal-600/20 active:scale-98"
              >
                  {isUploading ? <Loader2 className="animate-spin h-5 w-5" /> : <Send className="h-4 w-4" />}
                  {isUploading ? "Enviando al Chat..." : "Enviar Receta al Chat de Soporte"}
              </button>
              
              <p className="text-center text-[9px] text-slate-400 font-bold uppercase tracking-widest pt-1">
                  Farmacia Vitalis • Atención Inmediata en Chat
              </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrescriptionModal;
