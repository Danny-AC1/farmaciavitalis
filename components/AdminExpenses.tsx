
import React, { useState } from 'react';
import { Expense } from '../types';
import { Wallet, Plus, Trash2, Calendar, Edit2, X, Save } from 'lucide-react';

interface AdminExpensesProps {
  expenses: Expense[];
  onAdd: (exp: Expense) => void;
  onUpdate: (exp: Expense) => void;
  onDelete: (id: string) => void;
}

const AdminExpenses: React.FC<AdminExpensesProps> = ({ expenses, onAdd, onUpdate, onDelete }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat] = useState<Expense['category']>('OTHER');
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const expenseData: Expense = {
        id: editingId || `exp_${Date.now()}`,
        description: desc,
        amount: parseFloat(amount),
        category: cat,
        date: new Date().toISOString()
    };

    if (editingId) {
        onUpdate(expenseData);
    } else {
        onAdd(expenseData);
    }

    resetForm();
  };

  const handleEditClick = (exp: Expense) => {
      setEditingId(exp.id);
      setDesc(exp.description);
      setAmount(exp.amount.toString());
      setCat(exp.category);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetForm = () => {
      setDesc('');
      setAmount('');
      setCat('OTHER');
      setEditingId(null);
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                  <Wallet className="text-teal-600"/> {editingId ? 'Editar Gasto' : 'Registro de Gastos (Egresos)'}
              </h3>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100 relative">
                  {editingId && (
                      <div className="absolute -top-3 left-6 bg-blue-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                          <Edit2 size={10}/> Modo Edición Activo
                      </div>
                  )}
                  
                  <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Descripción</label>
                      <input className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500" placeholder="Ej: Pago de Luz" value={desc} onChange={e => setDesc(e.target.value)} required />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Monto ($)</label>
                      <input type="number" step="0.01" className="w-full border p-2 rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500 font-bold" value={amount} onChange={e => setAmount(e.target.value)} required />
                  </div>
                  <div className="flex items-end gap-2">
                      <button type="submit" className={`w-full ${editingId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-900 hover:bg-black'} text-white p-2 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-lg`}>
                          {editingId ? <><Save size={18}/> Guardar</> : <><Plus size={18}/> Anotar</>}
                      </button>
                      {editingId && (
                          <button type="button" onClick={resetForm} className="bg-gray-200 text-gray-600 p-2 rounded-lg hover:bg-gray-300 transition">
                              <X size={18}/>
                          </button>
                      )}
                  </div>
              </form>
              
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha / Descripción</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Monto</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {expenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(exp => (
                          <tr key={exp.id} className={`hover:bg-gray-50 transition group ${editingId === exp.id ? 'bg-blue-50/50' : ''}`}>
                            <td className="px-6 py-4">
                              <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Calendar size={10}/> {new Date(exp.date).toLocaleDateString()}</p>
                              <p className="font-bold text-gray-800 text-sm">{exp.description}</p>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-red-600">-${exp.amount.toFixed(2)}</td>
                            <td className="px-6 py-4 text-right space-x-1">
                                <button 
                                    onClick={() => handleEditClick(exp)}
                                    className="p-2 text-slate-300 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                    title="Editar"
                                >
                                    <Edit2 size={16}/>
                                </button>
                                <button 
                                    onClick={() => onDelete(exp.id)}
                                    className="p-2 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                    title="Eliminar"
                                >
                                    <Trash2 size={16}/>
                                </button>
                            </td>
                          </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan={3} className="px-6 py-10 text-center text-slate-400 italic">No hay gastos registrados.</td>
                            </tr>
                        )}
                      </tbody>
                  </table>
              </div>
          </div>
          
          <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl h-fit sticky top-6">
              <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 block">Gastos Operativos Totales</span>
              <p className="text-4xl font-black text-red-400 mb-6">${total.toFixed(2)}</p>
              <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                  <p className="text-[10px] text-slate-400 leading-tight">Registra todos los egresos para que el Dashboard calcule la <strong>Utilidad Neta Real</strong> de tu farmacia.</p>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdminExpenses;


