
import React, { useState, useMemo } from 'react';
import { User } from '../types';
import { Users, Star, Trash2, ShieldCheck, Mail, Phone, Calendar, Search, Edit2, X, Save, UserCheck, Shield } from 'lucide-react';

interface AdminUsersProps {
  users: User[];
  onUpdateRole: (uid: string, role: User['role']) => void;
  onUpdateUser?: (user: User) => Promise<void>;
  onDeleteUser?: (uid: string) => Promise<void>;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, onUpdateRole, onUpdateUser, onDeleteUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return users;
    const s = searchTerm.toLowerCase();
    return users.filter(u => 
      u.displayName.toLowerCase().includes(s) || 
      u.email.toLowerCase().includes(s) || 
      u.cedula?.includes(s) || 
      u.phone?.includes(s)
    );
  }, [users, searchTerm]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser && onUpdateUser) {
        await onUpdateUser(editingUser);
        setEditingUser(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
          <div className="flex items-center gap-3">
              <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                  <Users size={24} />
              </div>
              <div>
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">Directorio de Clientes</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestión de perfiles, roles y Vitalis Puntos</p>
              </div>
          </div>

          <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
              <input 
                className="w-full bg-white border border-slate-200 p-2.5 pl-10 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-teal-500 shadow-sm" 
                placeholder="Buscar por Nombre, Cédula o Celular..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Información de Usuario</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Fidelidad</th>
                <th className="px-6 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Permisos / Rol</th>
                <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-50">
              {filteredUsers.map(user => (
                <tr key={user.uid} className="hover:bg-teal-50/20 transition group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-sm shrink-0">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-slate-800 text-sm leading-tight uppercase truncate">{user.displayName || 'Sin Nombre'}</p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                          <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><UserCheck size={10} className="text-teal-500"/> {user.cedula || 'SIN CÉDULA'}</p>
                          <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Mail size={10} className="text-teal-500"/> {user.email}</p>
                          {user.phone && <p className="flex items-center gap-1 text-[10px] font-bold text-slate-400"><Phone size={10} className="text-teal-500"/> {user.phone}</p>}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="inline-flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-xl border border-yellow-100">
                      <Star size={14} className="fill-yellow-500 text-yellow-500"/>
                      <span className="font-black text-yellow-700 text-sm">{user.points || 0}</span>
                      <span className="text-[10px] font-black text-yellow-600/50 uppercase tracking-tighter">PTS</span>
                    </div>
                    {user.createdAt && (
                      <p className="text-[9px] text-slate-400 font-bold mt-1.5 flex items-center gap-1">
                        <Calendar size={10}/> {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        <ShieldCheck size={16}/>
                      </div>
                      <select 
                        className={`text-xs font-black px-3 py-2 rounded-xl outline-none border-2 transition-all ${
                          user.role === 'ADMIN' ? 'bg-purple-50 border-purple-200 text-purple-700' : 
                          user.role === 'CASHIER' ? 'bg-blue-50 border-blue-200 text-blue-700' :
                          user.role === 'DRIVER' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                          'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                        value={user.role}
                        onChange={e => onUpdateRole(user.uid, e.target.value as any)}
                      >
                        <option value="USER">USUARIO CLIENTE</option>
                        <option value="CASHIER">CAJERO FARMACIA</option>
                        <option value="DRIVER">REPARTIDOR</option>
                        <option value="ADMIN">ADMINISTRADOR GLOBAL</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right space-x-1">
                    <button 
                        onClick={() => setEditingUser(user)}
                        className="p-2 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition-all" 
                        title="Editar Datos"
                    >
                      <Edit2 size={18}/>
                    </button>
                    <button 
                        onClick={() => onDeleteUser?.(user.uid)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all" 
                        title="Eliminar permanentemente"
                    >
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-24 text-center">
                    <div className="max-w-xs mx-auto">
                        <Users size={60} className="mx-auto text-slate-100 mb-4" strokeWidth={1} />
                        <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No se encontraron clientes</p>
                        <p className="text-xs text-slate-300 font-bold mt-1">Prueba con otro término o borra el filtro actual.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE EDICIÓN DE USUARIO */}
      {editingUser && (
          <div className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white rounded-[2.5rem] w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in duration-300">
                  <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
                      <div className="flex items-center gap-3">
                          <div className="bg-teal-500 p-2 rounded-xl shadow-lg shadow-teal-500/20"><Edit2 size={18}/></div>
                          <div>
                            <h3 className="font-black text-sm uppercase tracking-tight">Editar Perfil</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Ajuste de datos maestros</p>
                          </div>
                      </div>
                      <button onClick={() => setEditingUser(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                  </div>
                  <form onSubmit={handleEditSubmit} className="p-8 space-y-5">
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                          <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold uppercase text-sm" value={editingUser.displayName} onChange={e => setEditingUser({...editingUser, displayName: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cédula de Identidad</label>
                          <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold text-sm" value={editingUser.cedula || ''} onChange={e => setEditingUser({...editingUser, cedula: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Teléfono Móvil</label>
                          <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold text-sm" value={editingUser.phone || ''} onChange={e => setEditingUser({...editingUser, phone: e.target.value})} />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vitalis Puntos (Ajuste Manual)</label>
                          <div className="relative">
                            <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-yellow-500" size={16}/>
                            <input type="number" className="w-full bg-yellow-50 border-2 border-transparent p-3 pl-10 rounded-xl outline-none focus:border-yellow-500 font-black text-yellow-700 text-sm" value={editingUser.points} onChange={e => setEditingUser({...editingUser, points: parseInt(e.target.value) || 0})} />
                          </div>
                      </div>
                      
                      <div className="pt-4 flex gap-3">
                          <button type="button" onClick={() => setEditingUser(null)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors">Cancelar</button>
                          <button type="submit" className="flex-[2] bg-teal-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition shadow-lg shadow-teal-500/20 flex items-center justify-center gap-2">
                            <Save size={18}/> Guardar Cambios
                          </button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default AdminUsers;
