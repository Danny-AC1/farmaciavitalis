
import React, { useState } from 'react';
import { Trash2, Plus} from 'lucide-react';

interface AdminSimpleTableProps {
  title: string;
  data: any[];
  onAdd: (name: string) => void;
  onDelete: (id: string) => void;
}

const AdminSimpleTable: React.FC<AdminSimpleTableProps> = ({ title, data, onAdd, onDelete }) => {
  const [newItem, setNewItem] = useState('');
  
  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    onAdd(newItem);
    setNewItem('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in">
      <div className="p-6 border-b border-gray-50 flex justify-between items-center">
        <h3 className="text-xl font-bold text-gray-800">{title}</h3>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input 
            className="border p-2 rounded-lg text-sm bg-gray-50 focus:ring-2 focus:ring-teal-500 outline-none" 
            placeholder={`Nueva ${title.toLowerCase()}...`}
            value={newItem}
            onChange={e => setNewItem(e.target.value)}
          />
          <button type="submit" className="bg-teal-600 text-white p-2 rounded-lg hover:bg-teal-700 transition"><Plus size={20}/></button>
        </form>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">ID / Nombre</th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {data.map(item => (
              <tr key={item.id} className="hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.name || item.code || item.id}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => onDelete(item.id)} className="text-red-400 hover:text-red-600 transition p-2"><Trash2 size={18}/></button>
                </td>
              </tr>
            ))}
            {data.length === 0 && (
              <tr><td colSpan={2} className="px-6 py-10 text-center text-gray-400 italic">No hay registros disponibles.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminSimpleTable;
