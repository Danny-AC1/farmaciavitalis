
import React from 'react';
import { ServiceBooking } from '../types';
import { CalendarCheck, CheckCircle, Clock, XCircle, Phone, MessageCircle, ClipboardCheck } from 'lucide-react';

interface AdminBookingsProps {
  bookings: ServiceBooking[];
  onUpdateStatus: (id: string, status: ServiceBooking['status']) => void;
}

const AdminBookings: React.FC<AdminBookingsProps> = ({ bookings, onUpdateStatus }) => {
  
  const handleNotifyWhatsApp = (booking: ServiceBooking) => {
    const message = `*CONFIRMACIÓN DE CITA - VITALIS* 💊\n\n` +
                    `Hola *${booking.patientName}*, te confirmamos tu cita para el servicio de *${booking.serviceName}*.\n\n` +
                    `📅 *Fecha:* ${booking.date}\n` +
                    `⏰ *Hora:* ${booking.time}\n\n` +
                    `📍 Te esperamos en nuestra sucursal de Machalilla.\n` +
                    `_Por favor llegar 5 minutos antes. ¡Gracias!_`;
    
    const waLink = `https://wa.me/${booking.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waLink, '_blank');
  };

  const handleConfirm = async (booking: ServiceBooking) => {
    if (window.confirm(`¿Confirmar cita para ${booking.patientName}?`)) {
      await onUpdateStatus(booking.id, 'CONFIRMED');
      // Opcional: preguntar si quiere enviar WhatsApp inmediatamente
      if (window.confirm("¿Deseas enviar la confirmación por WhatsApp al paciente ahora?")) {
        handleNotifyWhatsApp(booking);
      }
    }
  };

  const handleComplete = async (id: string) => {
    if (window.confirm("¿Marcar servicio como completado?")) {
      await onUpdateStatus(id, 'COMPLETED');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                  <CalendarCheck size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Citas Médicas</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de servicios y consultorio</p>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {bookings.map(booking => (
            <div key={booking.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm relative group overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
                {/* Status Bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-2 ${
                    booking.status === 'CONFIRMED' ? 'bg-green-500' : 
                    booking.status === 'COMPLETED' ? 'bg-blue-500' :
                    booking.status === 'CANCELLED' ? 'bg-red-500' : 'bg-orange-400'
                }`}></div>

                <div className="flex justify-between items-start mb-4">
                    <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-black text-teal-600 uppercase bg-teal-50 px-2.5 py-1 rounded-lg mb-2 inline-block tracking-widest border border-teal-100">
                            {booking.serviceName}
                        </span>
                        <h4 className="text-xl font-black text-slate-900 truncate uppercase leading-tight">{booking.patientName}</h4>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                             <p className="text-[11px] text-slate-500 flex items-center gap-1 font-bold uppercase">
                                <Clock size={12} className="text-teal-500"/> {booking.date} • {booking.time}
                             </p>
                             <p className="text-[11px] text-blue-600 flex items-center gap-1 font-bold uppercase">
                                <Phone size={12} className="text-blue-500"/> {booking.phone}
                             </p>
                        </div>
                    </div>
                    <span className={`shrink-0 px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border ${
                        booking.status === 'CONFIRMED' ? 'bg-green-50 text-green-700 border-green-100' : 
                        booking.status === 'COMPLETED' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        booking.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-orange-50 text-orange-700 border-orange-100'
                    }`}>
                        {booking.status === 'CONFIRMED' ? 'Confirmada' : 
                         booking.status === 'COMPLETED' ? 'Completada' :
                         booking.status === 'CANCELLED' ? 'Cancelada' : 'Pendiente'}
                    </span>
                </div>
                
                {booking.notes && (
                    <div className="bg-slate-50 p-3 rounded-xl mb-6 border border-slate-100">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Notas del paciente:</p>
                        <p className="text-xs text-slate-600 italic leading-relaxed">"{booking.notes}"</p>
                    </div>
                )}

                <div className="mt-auto space-y-2 pt-4 border-t border-slate-50">
                    <div className="flex gap-2">
                        {booking.status === 'PENDING' && (
                            <button 
                                onClick={() => handleConfirm(booking)} 
                                className="flex-1 bg-green-600 text-white py-3 rounded-xl text-xs font-black hover:bg-green-700 transition flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                            >
                                <CheckCircle size={16}/> CONFIRMAR
                            </button>
                        )}
                        {booking.status === 'CONFIRMED' && (
                            <>
                                <button 
                                    onClick={() => handleComplete(booking.id)} 
                                    className="flex-1 bg-blue-600 text-white py-3 rounded-xl text-xs font-black hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                                >
                                    <ClipboardCheck size={16}/> COMPLETAR
                                </button>
                                <button 
                                    onClick={() => handleNotifyWhatsApp(booking)} 
                                    className="bg-emerald-500 text-white p-3 rounded-xl hover:bg-emerald-600 transition shadow-lg shadow-emerald-500/20"
                                    title="Notificar por WhatsApp"
                                >
                                    <MessageCircle size={20}/>
                                </button>
                            </>
                        )}
                    </div>
                    
                    {booking.status !== 'CANCELLED' && booking.status !== 'COMPLETED' && (
                        <button 
                            onClick={() => onUpdateStatus(booking.id, 'CANCELLED')} 
                            className="w-full bg-white text-slate-400 py-2 rounded-xl text-[10px] font-black hover:text-red-500 hover:bg-red-50 transition flex items-center justify-center gap-1 uppercase"
                        >
                            <XCircle size={12}/> Cancelar Cita
                        </button>
                    )}
                </div>
            </div>
          ))}
          {bookings.length === 0 && (
              <div className="col-span-full py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-center flex flex-col items-center">
                  <div className="bg-slate-50 p-6 rounded-full mb-4">
                      <CalendarCheck size={48} className="text-slate-200" />
                  </div>
                  <p className="text-slate-400 font-black uppercase tracking-widest text-sm">No hay citas registradas</p>
                  <p className="text-slate-300 text-xs mt-1">Las solicitudes de servicios aparecerán aquí.</p>
              </div>
          )}
      </div>
    </div>
  );
};

export default AdminBookings;
