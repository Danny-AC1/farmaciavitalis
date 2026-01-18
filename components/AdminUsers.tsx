
import React from 'react';
import { User } from '../types';
import { Users, Star, Trash2, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react';

interface AdminUsersProps {
  users: User[];
  onUpdateRole: (uid: string, role: User['role']) => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ users, onUpdateRole }) => {
  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center gap-3 mb-2">
          <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
              <Users size={24} />
          </div>
          <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestión de Usuarios</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Control de accesos y programa de puntos</p>
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
              {users.map(user => (
                <tr key={user.uid} className="hover:bg-teal-50/20 transition group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-sm">
                        {user.displayName?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="font-black text-slate-800 text-sm leading-tight uppercase">{user.displayName || 'Sin Nombre'}</p>
                        <div className="flex items-center gap-3 mt-1">
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
                        <Calendar size={10}/> Miembro desde: {new Date(user.createdAt).toLocaleDateString()}
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
                  <td className="px-6 py-5 text-right">
                    <button className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Inactivar Usuario">
                      <Trash2 size={18}/>
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center">
                    <Users size={40} className="mx-auto text-slate-200 mb-2" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay usuarios registrados</p>
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

export default AdminUsers;
