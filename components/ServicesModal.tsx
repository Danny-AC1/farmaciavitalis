
import React, { useState } from 'react';
import { User, AVAILABLE_SERVICES, ServiceBooking } from '../types';
import { addBookingDB } from '../services/db';
import { X, Calendar, Stethoscope, CheckCircle, MapPin, ExternalLink, Navigation, Info, Phone as PhoneIcon, AlignLeft } from 'lucide-react';

interface ServicesModalProps {
  user: User | null;
  onClose: () => void;
  onLoginRequest: () => void;
}

const ServicesModal: React.FC<ServicesModalProps> = ({ user, onClose, onLoginRequest }) => {
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [patientName, setPatientName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!user) {
          onLoginRequest();
          return;
      }
      const service = AVAILABLE_SERVICES.find(s => s.id === selectedServiceId);
      if (!service) return;

      setIsSubmitting(true);
      try {
          const booking: ServiceBooking = {
              id: `bk_${Date.now()}`,
              userId: user.uid,
              patientName,
              serviceName: service.name,
              date,
              time,
              status: 'PENDING',
              phone,
              notes
          };
          await addBookingDB(booking);
          setSuccess(true);
      } catch (error) {
          alert("Error al reservar. Intenta de nuevo.");
      } finally {
          setIsSubmitting(false);
      }
  };

  if (success) {
      return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm text-center shadow-2xl border border-teal-50">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <CheckCircle className="h-10 w-10 text-green-600"/>
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-tighter">¡Cita Agendada!</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">Un farmacéutico de Vitalis te contactará al <strong>{phone}</strong> para confirmar el horario final.</p>
                <button onClick={onClose} className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 transition shadow-lg shadow-teal-100">Entendido</button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl flex flex-col max-h-[95vh] overflow-hidden">
            <div className="bg-teal-600 p-6 text-white flex justify-between items-center shrink-0">
                <div>
                    <h3 className="font-black text-xl flex items-center gap-2 uppercase tracking-tighter"><Stethoscope className="h-6 w-6"/> Servicios Vitalis</h3>
                    <p className="text-[10px] font-bold text-teal-100 uppercase tracking-widest mt-1">Atención Médica & Prevención</p>
                </div>
                <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X className="h-6 w-6"/></button>
            </div>
            
            <div className="flex-grow overflow-y-auto bg-slate-50 no-scrollbar">
                {/* MAPA INTERACTIVO */}
                <div className="relative h-56 w-full bg-slate-200">
                    <iframe 
                        title="Localización Vitalis Machalilla"
                        className="w-full h-full border-0 contrast-[1.05]"
                        src="https://www.google.com/maps?q=-1.483699,-80.77338&hl=es&z=18&output=embed"
                        allowFullScreen
                        loading="lazy"
                    ></iframe>
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2">
                        <a 
                            href="https://www.google.com/maps/dir/?api=1&destination=-1.483699,-80.77338" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="flex-1 bg-white text-teal-700 px-4 py-3 rounded-2xl text-[10px] font-black shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest hover:bg-teal-50 transition-colors"
                        >
                            <Navigation size={14}/> Cómo llegar
                        </a>
                        <a 
                            href="https://www.google.com/maps/search/?api=1&query=-1.483699,-80.77338" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl flex items-center justify-center hover:bg-black transition-colors"
                        >
                            <ExternalLink size={16}/>
                        </a>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-white p-4 rounded-2xl border border-teal-100 shadow-sm flex items-start gap-4">
                        <div className="bg-teal-50 p-2 rounded-xl text-teal-600"><MapPin size={20}/></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ubicación Machalilla</p>
                            <p className="text-xs font-bold text-slate-800 leading-relaxed uppercase">Machalilla, Ecuador. Farmacia Vitalis.</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Selección de Servicio */}
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Selecciona la Especialidad</label>
                            <div className="grid grid-cols-1 gap-3">
                                {AVAILABLE_SERVICES.map(s => (
                                    <div 
                                        key={s.id} 
                                        onClick={() => setSelectedServiceId(s.id)}
                                        className={`p-4 rounded-[1.5rem] border-2 cursor-pointer transition-all flex justify-between items-center ${selectedServiceId === s.id ? 'border-teal-500 bg-teal-50 shadow-md scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                                    >
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 text-sm uppercase tracking-tight">{s.name}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">{s.durationMin} MIN • {s.description}</p>
                                        </div>
                                        <span className="font-black text-teal-700 bg-teal-100/50 px-3 py-1 rounded-xl text-sm">${s.price.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Fecha y Hora */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fecha</label>
                                <input required type="date" className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hora</label>
                                <input required type="time" className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all" value={time} onChange={e => setTime(e.target.value)} />
                            </div>
                        </div>

                        {/* Nombre del Paciente */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre del Paciente</label>
                            <input required className="w-full bg-white border border-slate-200 p-3.5 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all uppercase" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="¿Quién asiste a la cita?" />
                        </div>

                        {/* Teléfono de Contacto (CORRIGE LA ADVERTENCIA setPhone) */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono de Contacto</label>
                            <div className="relative">
                                <PhoneIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                <input required type="tel" className="w-full bg-white border border-slate-200 p-3.5 pl-11 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ej: 0991234567" />
                            </div>
                        </div>

                        {/* Notas adicionales (CORRIGE LA ADVERTENCIA setNotes) */}
                        <div className="space-y-1.5">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notas o Síntomas (Opcional)</label>
                            <div className="relative">
                                <AlignLeft className="absolute left-4 top-4 text-slate-400" size={16}/>
                                <textarea className="w-full bg-white border border-slate-200 p-3.5 pl-11 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-teal-500 transition-all h-24 resize-none" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Cuéntanos un poco más para prepararnos..." />
                            </div>
                        </div>

                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                            <Info className="text-blue-500 shrink-0 mt-0.5" size={16}/>
                            <p className="text-[10px] font-bold text-blue-600 leading-relaxed uppercase">Tu cita queda sujeta a disponibilidad de consultorio. Te avisaremos pronto.</p>
                        </div>

                        <button disabled={isSubmitting || !selectedServiceId} className="w-full bg-slate-900 text-white py-4.5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl hover:bg-black transition-all disabled:opacity-50 flex justify-center items-center gap-2 active:scale-95 mb-6">
                            {isSubmitting ? 'Procesando...' : <><Calendar size={18}/> Agendar Cita Ahora</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
};

export default ServicesModal;
