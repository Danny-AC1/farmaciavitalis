
import React, { useState } from 'react';
import { Truck, Plus, Trash2, Phone, Mail, User, Search } from 'lucide-react';
import { Supplier } from '../types';

interface AdminSuppliersProps {
  suppliers: Supplier[];
  onAdd: (s: Supplier) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const AdminSuppliers: React.FC<AdminSuppliersProps> = ({ suppliers, onAdd, onDelete }) => {
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    await onAdd({
        id: `sup_${Date.now()}`,
        name,
        contactName: contact,
        phone,
        email
    });
    
    setName(''); setContact(''); setPhone(''); setEmail('');
    setShowForm(false);
  };

  const filtered = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contactName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
            <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                <Truck size={24} />
            </div>
            <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Proveedores</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Directorio de Laboratorios y Distribuidores</p>
            </div>
        </div>
        
        <button 
            onClick={() => setShowForm(!showForm)}
            className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs hover:bg-black transition flex items-center gap-2 shadow-lg"
        >
            {showForm ? 'Cerrar Formulario' : <><Plus size={16}/> Nuevo Proveedor</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-white p-8 rounded-[2rem] border border-teal-100 shadow-xl animate-in slide-in-from-top-4 duration-300">
            <h3 className="font-black text-slate-800 mb-6 text-lg uppercase tracking-tight border-b pb-4 border-slate-50">Registrar nuevo aliado</h3>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa / Distribuidor</label>
                    <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" placeholder="Ej: Difare S.A." value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre de Contacto</label>
                    <input className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" placeholder="Ej: Ing. Juan Pérez" value={contact} onChange={e => setContact(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono</label>
                    <input className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" placeholder="099..." value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Corporativo</label>
                    <input type="email" className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 transition-all font-bold text-sm" placeholder="pedidos@empresa.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="lg:col-span-4 flex justify-end gap-3 pt-2">
                    <button type="submit" className="bg-teal-600 text-white px-10 py-3.5 rounded-xl font-black text-xs hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 uppercase tracking-widest">
                        Guardar Registro
                    </button>
                </div>
            </form>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b flex items-center gap-3">
            <Search className="text-slate-400" size={18}/>
            <input 
                className="bg-transparent border-none outline-none font-bold text-sm w-full text-slate-600" 
                placeholder="Filtrar por nombre o contacto..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-slate-50">
                    <tr>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Contacto</th>
                        <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Información</th>
                        <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-50">
                    {filtered.map(sup => (
                        <tr key={sup.id} className="hover:bg-teal-50/20 transition group">
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black">
                                        {sup.name.charAt(0)}
                                    </div>
                                    <span className="font-black text-slate-800 text-sm uppercase">{sup.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-2 text-slate-600 font-bold text-xs">
                                    <User size={14} className="text-teal-500"/> {sup.contactName || 'N/A'}
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="space-y-1">
                                    <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><Phone size={12} className="text-teal-400"/> {sup.phone || '---'}</p>
                                    <p className="flex items-center gap-2 text-[11px] font-bold text-slate-500"><Mail size={12} className="text-teal-400"/> {sup.email || '---'}</p>
                                </div>
                            </td>
                            <td className="px-6 py-5 text-right">
                                <button 
                                    onClick={() => { if(confirm('¿Eliminar este proveedor?')) onDelete(sup.id); }}
                                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                >
                                    <Trash2 size={18}/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filtered.length === 0 && (
                        <tr>
                            <td colSpan={4} className="px-6 py-20 text-center">
                                <Truck size={40} className="mx-auto text-slate-200 mb-2" />
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay proveedores registrados</p>
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default AdminSuppliers;
