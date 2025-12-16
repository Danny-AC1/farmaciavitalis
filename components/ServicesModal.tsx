import React, { useState } from 'react';
import { User, AVAILABLE_SERVICES, ServiceBooking } from '../types';
import { addBookingDB } from '../services/db';
import { X, Calendar, Stethoscope, CheckCircle } from 'lucide-react';

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
            <div className="bg-white rounded-2xl p-8 max-w-sm text-center shadow-2xl">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600"/>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">¡Cita Solicitada!</h3>
                <p className="text-gray-600 mb-6">Te contactaremos al {phone} para confirmar tu horario.</p>
                <button onClick={onClose} className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition">Entendido</button>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
        <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="bg-teal-600 p-4 text-white flex justify-between items-center shrink-0">
                <h3 className="font-bold text-lg flex items-center gap-2"><Stethoscope className="h-5 w-5"/> Servicios de Salud</h3>
                <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X className="h-6 w-6"/></button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 bg-gray-50">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Selecciona un Servicio</label>
                        <div className="grid grid-cols-1 gap-2">
                            {AVAILABLE_SERVICES.map(s => (
                                <div 
                                    key={s.id} 
                                    onClick={() => setSelectedServiceId(s.id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedServiceId === s.id ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                                >
                                    <div>
                                        <p className="font-bold text-gray-800">{s.name}</p>
                                        <p className="text-xs text-gray-500">{s.durationMin} min • {s.description}</p>
                                    </div>
                                    <span className="font-bold text-teal-700">${s.price.toFixed(2)}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Fecha</label>
                            <div className="relative">
                                <input required type="date" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white" value={date} onChange={e => setDate(e.target.value)} min={new Date().toISOString().split('T')[0]} />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Hora Pref.</label>
                            <div className="relative">
                                <input required type="time" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white" value={time} onChange={e => setTime(e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nombre Paciente</label>
                        <input required className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white" value={patientName} onChange={e => setPatientName(e.target.value)} placeholder="¿Quién recibirá el servicio?" />
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Teléfono Contacto</label>
                         <input required type="tel" className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white" value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>

                    <div>
                         <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Notas Adicionales</label>
                         <textarea className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 bg-white h-20" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Alergias, síntomas, etc." />
                    </div>

                    <button disabled={isSubmitting || !selectedServiceId} className="w-full bg-teal-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-teal-600/20 hover:bg-teal-700 transition disabled:opacity-50 flex justify-center items-center gap-2">
                        {isSubmitting ? 'Agendando...' : (
                            <>
                                <Calendar size={18}/> Confirmar Cita
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default ServicesModal;