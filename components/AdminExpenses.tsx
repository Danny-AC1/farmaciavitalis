
import React, { useState } from 'react';
import { Expense } from '../types';
import { Wallet, Plus, Calendar } from 'lucide-react';

interface AdminExpensesProps {
  expenses: Expense[];
  onAdd: (exp: Expense) => void;
}

const AdminExpenses: React.FC<AdminExpensesProps> = ({ expenses, onAdd }) => {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [cat] = useState<Expense['category']>('OTHER');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;
    onAdd({
        id: `exp_${Date.now()}`,
        description: desc,
        amount: parseFloat(amount),
        category: cat,
        date: new Date().toISOString()
    });
    setDesc(''); setAmount('');
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><Wallet className="text-teal-600"/> Registro de Gastos (Egresos)</h3>
              <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <div className="md:col-span-2">
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Descripción</label>
                      <input className="w-full border p-2 rounded-lg text-sm" placeholder="Ej: Pago de Luz" value={desc} onChange={e => setDesc(e.target.value)} required />
                  </div>
                  <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase">Monto ($)</label>
                      <input type="number" step="0.01" className="w-full border p-2 rounded-lg text-sm" value={amount} onChange={e => setAmount(e.target.value)} required />
                  </div>
                  <div className="flex items-end">
                      <button type="submit" className="w-full bg-slate-900 text-white p-2 rounded-lg font-bold hover:bg-black transition flex items-center justify-center gap-2"><Plus size={18}/> Anotar</button>
                  </div>
              </form>
              
              <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Fecha / Descripción</th>
                          <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center gap-1"><Calendar size={10}/> {new Date(exp.date).toLocaleDateString()}</p>
                              <p className="font-bold text-gray-800 text-sm">{exp.description}</p>
                            </td>
                            <td className="px-6 py-4 text-right font-black text-red-600">-${exp.amount.toFixed(2)}</td>
                          </tr>
                        ))}
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
