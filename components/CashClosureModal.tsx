
import React, { useState } from 'react';
import { Calculator, X, Printer, Save } from 'lucide-react';
import { CashClosure } from '../types';

interface CashClosureModalProps {
    isOpen: boolean;
    onClose: () => void;
    todayCash: number;
    todayTrans: number;
    customDate?: string;
    onSave: (closure: CashClosure) => void;
}

const CashClosureModal: React.FC<CashClosureModalProps> = ({ isOpen, onClose, todayCash, todayTrans, customDate, onSave }) => {
    const [cashActual, setCashActual] = useState<string>(todayCash.toString());
    const [transActual, setTransActual] = useState<string>(todayTrans.toString());
    const [cashLeft, setCashLeft] = useState<string>('0');
    const [cashWithdrawn, setCashWithdrawn] = useState<string>('0');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    const handleSave = async () => {
        const cActual = parseFloat(cashActual) || 0;
        const tActual = parseFloat(transActual) || 0;
        const cLeft = parseFloat(cashLeft) || 0;
        const cWithdrawn = parseFloat(cashWithdrawn) || 0;
        const diff = (cActual + tActual) - (todayCash + todayTrans);

        try {
            await onSave({
                id: '',
                date: customDate || new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString(),
                cashExpected: todayCash,
                transExpected: todayTrans,
                cashActual: cActual,
                transActual: tActual,
                cashLeftForChange: cLeft,
                cashWithdrawn: cWithdrawn,
                difference: diff,
                recordedBy: 'Admin',
                notes: notes
            });
            alert('Corte de caja guardado con éxito.');
            onClose();
        } catch (error) {
            console.error("Error al guardar cierre:", error);
            alert('Error al guardar el cierre. Intente de nuevo.');
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-bold flex items-center gap-2"><Calculator size={18}/> Corte de Caja {customDate ? `(${customDate})` : ''}</h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Efectivo Sistema</label>
                            <p className="text-lg font-bold text-gray-800">${todayCash.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Efectivo Real</label>
                            <input 
                                type="number" 
                                value={cashActual} 
                                onChange={(e) => setCashActual(e.target.value)} 
                                className="w-full bg-transparent border-b-2 border-teal-500 font-bold text-lg outline-none"
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Transf. Sistema</label>
                            <p className="text-lg font-bold text-gray-800">${todayTrans.toFixed(2)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Transf. Real</label>
                            <input 
                                type="number" 
                                value={transActual} 
                                onChange={(e) => setTransActual(e.target.value)} 
                                className="w-full bg-transparent border-b-2 border-teal-500 font-bold text-lg outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Ef. para Cambio</label>
                            <input 
                                type="number" 
                                value={cashLeft} 
                                onChange={(e) => setCashLeft(e.target.value)} 
                                className="w-full bg-transparent border-b-2 border-slate-300 font-bold text-lg outline-none focus:border-indigo-500"
                                placeholder="0.00"
                            />
                        </div>
                        <div className="bg-gray-50 p-3 rounded-xl">
                            <label className="text-[10px] font-black text-gray-400 uppercase">Ef. Retirado</label>
                            <input 
                                type="number" 
                                value={cashWithdrawn} 
                                onChange={(e) => setCashWithdrawn(e.target.value)} 
                                className="w-full bg-transparent border-b-2 border-slate-300 font-bold text-lg outline-none focus:border-red-400"
                                placeholder="0.00"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase">Notas del Cierre</label>
                        <textarea 
                            value={notes} 
                            onChange={(e) => setNotes(e.target.value)} 
                            className="w-full border-2 border-gray-100 rounded-xl p-3 text-sm outline-none focus:border-teal-500"
                            placeholder="Ej: Sobrante de centavos, billete roto..."
                        />
                    </div>

                    <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center">
                        <span className="text-base font-black text-slate-900">DIFERENCIA TOTAL:</span>
                        <span className={`text-xl font-black ${(parseFloat(cashActual) + parseFloat(transActual) - (todayCash + todayTrans)) >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                            ${(parseFloat(cashActual) + parseFloat(transActual) - (todayCash + todayTrans) || 0).toFixed(2)}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={() => window.print()} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
                            <Printer size={18}/> Imprimir
                        </button>
                        <button onClick={handleSave} className="flex-[2] bg-teal-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg shadow-teal-600/20">
                            <Save size={18}/> Guardar Cierre Diario
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CashClosureModal;
