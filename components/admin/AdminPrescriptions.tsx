import React, { useState, useEffect } from 'react';
import { ClipboardList, Search, Eye, Check, Trash2, Calendar, Phone, Mail, Clock, AlertCircle, CheckCircle, MessageSquare, X } from 'lucide-react';
import { Prescription } from '../../types';
import { streamPrescriptions, updatePrescriptionStatusDB, deletePrescriptionDB } from '../../services/db';

const AdminPrescriptions: React.FC = () => {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'TODAS' | 'PENDIENTE' | 'COTIZADO' | 'COMPLETADO'>('TODAS');
  
  // Selected prescription for modal zoom/detail
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    const unsub = streamPrescriptions((data) => {
      setPrescriptions(data);
    });
    return () => unsub();
  }, []);

  const handleUpdateStatus = async (id: string, status: Prescription['status']) => {
    try {
      await updatePrescriptionStatusDB(id, status);
    } catch (e) {
      console.error(e);
      alert("Error al actualizar el estado de la receta.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de receta?")) return;
    try {
      await deletePrescriptionDB(id);
      if (selectedPrescription?.id === id) {
        setSelectedPrescription(null);
      }
    } catch (e) {
      console.error(e);
      alert("Error al eliminar la receta.");
    }
  };

  const filteredPrescriptions = prescriptions.filter(p => {
    const matchesSearch = 
      p.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.patientPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.patientEmail && p.patientEmail.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesStatus = statusFilter === 'TODAS' || p.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: Prescription['status']) => {
    switch (status) {
      case 'PENDIENTE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock size={12} className="animate-pulse" /> PENDIENTE
          </span>
        );
      case 'COTIZADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle size={12} /> COTIZADO
          </span>
        );
      case 'COMPLETADO':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} /> COMPLETADO
          </span>
        );
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const handleWhatsAppContact = (prescription: Prescription) => {
    const rawPhone = prescription.patientPhone.replace(/\D/g, '');
    const cleanPhone = rawPhone.startsWith('593') ? rawPhone : `593${rawPhone.replace(/^0/, '')}`;
    const message = `Hola ${prescription.patientName} 👋. Te contactamos de Farmacia Vitalis 💊 sobre la receta médica que subiste a nuestro sistema. Ya la tenemos lista para cotizarte.`;
    const link = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-teal-50 text-teal-600 p-2.5 rounded-xl">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Recetas Médicas</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestión de recetas cargadas por clientes</p>
            </div>
          </div>
        </div>
        
        {/* Quick counters */}
        <div className="flex gap-3 text-center">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
            <span className="block text-xs font-bold text-amber-600 uppercase">Pendientes</span>
            <span className="text-lg font-black text-amber-800">{prescriptions.filter(p => p.status === 'PENDIENTE').length}</span>
          </div>
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
            <span className="block text-xs font-bold text-blue-600 uppercase">Cotizadas</span>
            <span className="text-lg font-black text-blue-800">{prescriptions.filter(p => p.status === 'COTIZADO').length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
            <span className="block text-xs font-bold text-emerald-600 uppercase">Completas</span>
            <span className="text-lg font-black text-emerald-800">{prescriptions.filter(p => p.status === 'COMPLETADO').length}</span>
          </div>
        </div>
      </div>

      {/* Filters and search */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Buscar por paciente, teléfono o correo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-150 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['TODAS', 'PENDIENTE', 'COTIZADO', 'COMPLETADO'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all border ${
                statusFilter === filter
                  ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                  : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-100'
              }`}
            >
              {filter === 'TODAS' ? 'Todas' : filter}
            </button>
          ))}
        </div>
      </div>

      {/* Table/List card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {filteredPrescriptions.length === 0 ? (
          <div className="p-16 text-center text-slate-400 font-bold uppercase tracking-widest">
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            No se encontraron recetas médicas
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                  <th className="py-4 px-6">Fecha</th>
                  <th className="py-4 px-6">Paciente / Contacto</th>
                  <th className="py-4 px-6">Notas / Detalles</th>
                  <th className="py-4 px-6">Estado</th>
                  <th className="py-4 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredPrescriptions.map((prescription) => (
                  <tr key={prescription.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <Calendar size={14} />
                        {formatDate(prescription.createdAt)}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <p className="font-extrabold text-slate-800">{prescription.patientName}</p>
                        <div className="flex flex-col gap-0.5 mt-1 text-xs text-slate-400 font-bold">
                          <span className="flex items-center gap-1"><Phone size={11}/> {prescription.patientPhone}</span>
                          {prescription.patientEmail && <span className="flex items-center gap-1"><Mail size={11}/> {prescription.patientEmail}</span>}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 max-w-xs">
                      {prescription.notes ? (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed italic">
                          "{prescription.notes}"
                        </p>
                      ) : (
                        <span className="text-xs text-slate-300">Sin comentarios</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {getStatusBadge(prescription.status)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedPrescription(prescription)}
                          className="p-2 text-slate-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors border border-transparent hover:border-teal-100"
                          title="Ver receta / Imagen"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          onClick={() => handleWhatsAppContact(prescription)}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                          title="Contactar por WhatsApp"
                        >
                          <MessageSquare size={18} />
                        </button>
                        
                        {prescription.status === 'PENDIENTE' && (
                          <button
                            onClick={() => handleUpdateStatus(prescription.id!, 'COTIZADO')}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors"
                            title="Marcar como Cotizado"
                          >
                            Cotizar
                          </button>
                        )}
                        
                        {prescription.status !== 'COMPLETADO' && (
                          <button
                            onClick={() => handleUpdateStatus(prescription.id!, 'COMPLETADO')}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            title="Marcar como Completado"
                          >
                            <Check size={18} />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(prescription.id!)}
                          className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar registro"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Prescription Detail and Image Preview Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] overflow-hidden shadow-2xl animate-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="p-5 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ClipboardList className="text-teal-400" />
                <div>
                  <h4 className="font-black text-sm uppercase tracking-widest">Receta de {selectedPrescription.patientName}</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{formatDate(selectedPrescription.createdAt)}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPrescription(null)} 
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 max-h-[80vh] overflow-y-auto">
              
              {/* Left Side: Image Zoom */}
              <div className="w-full md:w-1/2 p-6 bg-slate-50 flex items-center justify-center min-h-[300px]">
                {selectedPrescription.imageUrl ? (
                  <img 
                    src={selectedPrescription.imageUrl} 
                    alt="Receta médica" 
                    className="max-h-80 md:max-h-[400px] object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-sm"
                  />
                ) : (
                  <div className="text-center text-slate-400 font-bold text-xs uppercase">
                    Sin Imagen Adjunta
                  </div>
                )}
              </div>
              
              {/* Right Side: Info & Actions */}
              <div className="w-full md:w-1/2 p-6 space-y-5 bg-white flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Detalles del Paciente</h5>
                    <div className="space-y-2.5">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Nombre del Paciente</span>
                        <span className="text-xs font-black text-slate-800">{selectedPrescription.patientName}</span>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase">Teléfono</span>
                        <span className="text-xs font-black text-slate-800">{selectedPrescription.patientPhone}</span>
                      </div>
                      {selectedPrescription.patientEmail && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase">Correo Electrónico</span>
                          <span className="text-xs font-black text-slate-800">{selectedPrescription.patientEmail}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedPrescription.notes && (
                    <div>
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Comentarios</h5>
                      <div className="bg-teal-50/30 p-3 rounded-xl border border-teal-100/50 text-xs text-slate-600 leading-relaxed font-medium">
                        "{selectedPrescription.notes}"
                      </div>
                    </div>
                  )}

                  <div>
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">Estado de la Solicitud</h5>
                    {getStatusBadge(selectedPrescription.status)}
                  </div>
                </div>
                
                {/* Actions */}
                <div className="space-y-2 pt-4 border-t border-slate-100">
                  <button
                    onClick={() => handleWhatsAppContact(selectedPrescription)}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-wider text-xs rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageSquare size={14} /> Contactar por WhatsApp
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {selectedPrescription.status !== 'COTIZADO' && (
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedPrescription.id!, 'COTIZADO');
                          setSelectedPrescription(prev => prev ? { ...prev, status: 'COTIZADO' } : null);
                        }}
                        className="py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors border border-blue-100"
                      >
                        Marcar Cotizado
                      </button>
                    )}
                    {selectedPrescription.status !== 'COMPLETADO' && (
                      <button
                        onClick={() => {
                          handleUpdateStatus(selectedPrescription.id!, 'COMPLETADO');
                          setSelectedPrescription(prev => prev ? { ...prev, status: 'COMPLETADO' } : null);
                        }}
                        className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors border border-emerald-150 col-span-2"
                      >
                        Marcar Completado
                      </button>
                    )}
                  </div>
                  
                  <button
                    onClick={() => handleDelete(selectedPrescription.id!)}
                    className="w-full py-2 text-red-500 hover:text-red-700 hover:bg-red-50 font-extrabold text-[10px] uppercase tracking-wider rounded-lg transition-colors text-center"
                  >
                    Eliminar Receta
                  </button>
                </div>
                
              </div>
              
            </div>
            
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminPrescriptions;
