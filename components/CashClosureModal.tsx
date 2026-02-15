
import React from 'react';
import { Calculator, X, Printer } from 'lucide-react';

interface CashClosureModalProps {
    isOpen: boolean;
    onClose: () => void;
    todayCash: number;
    todayTrans: number;
}

const CashClosureModal: React.FC<CashClosureModalProps> = ({ isOpen, onClose, todayCash, todayTrans }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-sm shadow-2xl overflow-hidden animate-in zoom-in">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-bold flex items-center gap-2"><Calculator size={18}/> Corte de Caja</h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="border-t border-dashed border-gray-200 pt-4 space-y-3">
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-green-600">Ventas Efectivo:</span>
                            <span className="text-green-600">+ ${todayCash.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold">
                            <span className="text-blue-600">Ventas Transf.:</span>
                            <span className="text-blue-600">+ ${todayTrans.toFixed(2)}</span>
                        </div>
                    </div>
                    <div className="border-t border-dashed border-gray-200 pt-4 flex justify-between items-center">
                        <span className="text-base font-black text-slate-900">TOTAL CIERRE:</span>
                        <span className="text-xl font-black text-teal-600">${(todayCash + todayTrans).toFixed(2)}</span>
                    </div>
                    <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95">
                        <Printer size={18}/> Imprimir Comprobante
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CashClosureModal;
