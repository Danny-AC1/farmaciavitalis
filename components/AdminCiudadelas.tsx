
import React, { useState, useEffect } from 'react';
import { Ciudadela } from '../types';
import { streamCiudadelas, addCiudadelaDB, updateCiudadelaDB, deleteCiudadelaDB } from '../services/db';
import { MapPin, Plus, Trash2, Edit2, Save, X, DollarSign } from 'lucide-react';

const AdminCiudadelas: React.FC = () => {
    const [ciudadelas, setCiudadelas] = useState<Ciudadela[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');

    useEffect(() => {
        const unsub = streamCiudadelas(setCiudadelas);
        return () => unsub();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !price) return;

        const data = { id: editingId || '', name, price: parseFloat(price) };
        
        if (editingId) await updateCiudadelaDB(data);
        else await addCiudadelaDB(data);

        setName(''); setPrice(''); setEditingId(null);
    };

    const handleEdit = (c: Ciudadela) => {
        setEditingId(c.id);
        setName(c.name);
        setPrice(c.price.toString());
    };

    const handleDelete = async (id: string) => {
        if (confirm("¿Eliminar esta zona de entrega?")) await deleteCiudadelaDB(id);
    };

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 mb-2">
                <div className="bg-teal-600 p-2.5 rounded-2xl shadow-lg shadow-teal-600/20 text-white">
                    <MapPin size={24} />
                </div>
                <div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">Zonas de Entrega</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestiona ciudadelas y tarifas en Machalilla</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-4 items-end">
                    <div className="flex-grow space-y-1 w-full">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Nombre de la Ciudadela / Sector</label>
                        <input required className="w-full bg-slate-50 border-2 border-transparent p-3 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold text-sm" placeholder="Ej: Los Ciriales" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div className="w-full md:w-40 space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Tarifa Envío ($)</label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-teal-600" size={14}/>
                            <input required type="number" step="0.01" className="w-full bg-slate-50 border-2 border-transparent p-3 pl-8 rounded-xl outline-none focus:bg-white focus:border-teal-500 font-bold text-sm" placeholder="0.50" value={price} onChange={e => setPrice(e.target.value)} />
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button type="submit" className="flex-grow md:flex-none bg-teal-600 text-white px-6 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-teal-700 transition shadow-lg shadow-teal-600/20 flex items-center justify-center gap-2">
                            {editingId ? <><Save size={16}/> Guardar</> : <><Plus size={16}/> Añadir</>}
                        </button>
                        {editingId && (
                            <button type="button" onClick={() => { setEditingId(null); setName(''); setPrice(''); }} className="p-3.5 bg-slate-100 text-slate-400 rounded-xl hover:bg-slate-200 transition">
                                <X size={18}/>
                            </button>
                        )}
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Ciudadela / Sector</th>
                            <th className="px-6 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Tarifa Envío</th>
                            <th className="px-6 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-50">
                        {ciudadelas.map(c => (
                            <tr key={c.id} className="hover:bg-teal-50/20 transition group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600"><MapPin size={16}/></div>
                                        <span className="font-black text-slate-800 text-sm uppercase">{c.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="font-black text-teal-700 bg-teal-50 px-3 py-1 rounded-full text-xs">${c.price.toFixed(2)}</span>
                                </td>
                                <td className="px-6 py-4 text-right space-x-2">
                                    <button onClick={() => handleEdit(c)} className="p-2 text-slate-300 hover:text-blue-500 transition-colors"><Edit2 size={16}/></button>
                                    <button onClick={() => handleDelete(c.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {ciudadelas.length === 0 && (
                    <div className="py-12 text-center text-slate-400">
                        <MapPin size={40} className="mx-auto opacity-10 mb-2"/>
                        <p className="text-[10px] font-black uppercase">No has registrado zonas de entrega</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminCiudadelas;
