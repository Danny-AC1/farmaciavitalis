
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
    initialClosure?: CashClosure | null;
}

const CashClosureModal: React.FC<CashClosureModalProps> = ({ isOpen, onClose, todayCash, todayTrans, customDate, onSave, initialClosure }) => {
    const [cashActual, setCashActual] = useState<string>(initialClosure ? initialClosure.cashActual?.toString() || '0' : todayCash.toString());
    const [transActual, setTransActual] = useState<string>(initialClosure ? initialClosure.transActual?.toString() || '0' : todayTrans.toString());
    const [cashLeft, setCashLeft] = useState<string>(initialClosure ? initialClosure.cashLeftForChange?.toString() || '0' : '0');
    const [cashWithdrawn, setCashWithdrawn] = useState<string>(initialClosure ? initialClosure.cashWithdrawn?.toString() || '0' : '0');
    const [notes, setNotes] = useState(initialClosure?.notes || '');

    // Resetear estados cuando cambia initialClosure
    React.useEffect(() => {
        if (initialClosure) {
            setCashActual(initialClosure.cashActual?.toString() || '0');
            setTransActual(initialClosure.transActual?.toString() || '0');
            setCashLeft(initialClosure.cashLeftForChange?.toString() || '0');
            setCashWithdrawn(initialClosure.cashWithdrawn?.toString() || '0');
            setNotes(initialClosure.notes || '');
        } else {
            setCashActual(todayCash.toString());
            setTransActual(todayTrans.toString());
            setCashLeft('0');
            setCashWithdrawn('0');
            setNotes('');
        }
    }, [initialClosure, todayCash, todayTrans, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        const cActual = parseFloat(cashActual) || 0;
        const tActual = parseFloat(transActual) || 0;
        const cLeft = parseFloat(cashLeft) || 0;
        const cWithdrawn = parseFloat(cashWithdrawn) || 0;
        
        // Mantener datos originales si es edición
        const cashExp = initialClosure ? initialClosure.cashExpected || 0 : todayCash;
        const transExp = initialClosure ? initialClosure.transExpected || 0 : todayTrans;

        const diff = (cActual - cLeft + tActual) - (cashExp + transExp);

        try {
            await onSave({
                id: initialClosure?.id || '',
                date: initialClosure?.date || customDate || new Date().toISOString().split('T')[0],
                createdAt: initialClosure?.createdAt || new Date().toISOString(),
                cashExpected: cashExp,
                transExpected: transExp,
                cashActual: cActual,
                transActual: tActual,
                cashLeftForChange: cLeft,
                cashWithdrawn: cWithdrawn,
                difference: diff,
                recordedBy: initialClosure?.recordedBy || 'Admin',
                notes: notes
            });
            alert(initialClosure ? '¡Cierre de caja actualizado!' : '¡Corte de caja guardado con éxito!');
            onClose();
        } catch (error: any) {
            console.error("Error al guardar cierre:", error);
            alert(`Error al guardar: ${error.message}`);
        }
    };

    const cActualVal = parseFloat(cashActual) || 0;
    const tActualVal = parseFloat(transActual) || 0;
    const cLeftVal = parseFloat(cashLeft) || 0;
    const totalSugerido = todayCash + cLeftVal;
    const handlePrint = () => {
        const cashExp = initialClosure ? initialClosure.cashExpected || 0 : todayCash;
        const transExp = initialClosure ? initialClosure.transExpected || 0 : todayTrans;
        const cActualVal = parseFloat(cashActual) || 0;
        const tActualVal = parseFloat(transActual) || 0;
        const cLeftVal = parseFloat(cashLeft) || 0;
        const cWithdrawnVal = parseFloat(cashWithdrawn) || 0;
        const diff = (cActualVal - cLeftVal + tActualVal) - (cashExp + transExp);
        const recordedBy = initialClosure?.recordedBy || 'Admin';
        const dateStr = initialClosure?.date || customDate || new Date().toLocaleString();

        const printFrame = document.createElement('iframe');
        printFrame.style.display = 'none';
        document.body.appendChild(printFrame);

        const content = `
            <html>
                <head>
                    <style>
                        @page { margin: 0; }
                        body { 
                            font-family: 'Courier New', Courier, monospace; 
                            width: 48mm; 
                            padding: 2mm; 
                            margin: 0; 
                            font-size: 10px;
                            color: #000;
                            line-height: 1.2;
                        }
                        .text-center { text-align: center; }
                        .bold { font-weight: bold; }
                        .divider { border-top: 1px dashed #000; margin: 5px 0; }
                        .header { font-size: 12px; margin-bottom: 5px; }
                        .row { display: flex; justify-content: space-between; margin: 2px 0; }
                        .total-row { border-top: 1px solid #000; padding-top: 2px; margin-top: 5px; font-weight: bold; }
                    </style>
                </head>
                <body>
                    <div class="text-center bold header">CIERRE DE CAJA</div>
                    <div class="text-center bold">FARMACIA VITALIS</div>
                    <div class="divider"></div>
                    <div class="row"><span>FECHA:</span> <span>${dateStr}</span></div>
                    <div class="row"><span>USUARIO:</span> <span>${recordedBy}</span></div>
                    <div class="divider"></div>
                    
                    <div class="bold uppercase">DATOS SISTEMA:</div>
                    <div class="row"><span>EFECTIVO:</span> <span>$${cashExp.toFixed(2)}</span></div>
                    <div class="row"><span>TRANSF:</span> <span>$${transExp.toFixed(2)}</span></div>
                    <div class="row bold"><span>TOTAL SIST:</span> <span>$${(cashExp + transExp).toFixed(2)}</span></div>
                    
                    <div class="divider"></div>
                    
                    <div class="bold uppercase">DATOS CONTADOS:</div>
                    <div class="row"><span>EF. REAL:</span> <span>$${cActualVal.toFixed(2)}</span></div>
                    <div class="row"><span>TR. REAL:</span> <span>$${tActualVal.toFixed(2)}</span></div>
                    <div class="row"><span>F. CAMBIO:</span> <span>-$${cLeftVal.toFixed(2)}</span></div>
                    <div class="row"><span>RETIRADO:</span> <span>-$${cWithdrawnVal.toFixed(2)}</span></div>
                    
                    <div class="divider"></div>
                    
                    <div class="row bold total-row">
                        <span>AUDITADO:</span>
                        <span>$${(cActualVal - cLeftVal + tActualVal).toFixed(2)}</span>
                    </div>
                    <div class="row bold" style="font-size: 11px;">
                        <span>DIFERENCIA:</span>
                        <span>$${diff.toFixed(2)}</span>
                    </div>
                    
                    <div class="divider"></div>
                    <div class="bold">NOTAS:</div>
                    <div style="font-size: 9px;">${notes || 'Sin notas'}</div>
                    
                    <div class="divider"></div>
                    <div class="text-center" style="font-size: 8px; margin-top: 10px;">
                        AUDITORIA FINANCIERA VITALIS<br>
                        ${new Date().toLocaleString()}
                    </div>
                    <div style="height: 10mm;"></div>
                </body>
            </html>
        `;

        const frameDoc = printFrame.contentWindow?.document;
        if (frameDoc) {
            frameDoc.open();
            frameDoc.write(content);
            frameDoc.close();
            setTimeout(() => {
                printFrame.contentWindow?.focus();
                printFrame.contentWindow?.print();
                setTimeout(() => {
                    document.body.removeChild(printFrame);
                }, 1000);
            }, 500);
        }
    };

    const differenceVal = (cActualVal - cLeftVal + tActualVal) - (todayCash + todayTrans);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0">
                    <h3 className="text-sm font-bold flex items-center gap-2"><Calculator size={18}/> Corte de Caja {customDate ? `(${customDate})` : ''}</h3>
                    <button onClick={onClose} className="hover:bg-white/10 p-1.5 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6">
                    {/* Suma Sugerida (Ventas + Cambio) */}
                    <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex justify-between items-center animate-in fade-in slide-in-from-top-2">
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1">Total Sugerido a Contar</p>
                            <p className="text-[8px] text-indigo-300 font-bold uppercase">(Efectivo Sistema + Ef. Cambio)</p>
                        </div>
                        <p className="text-xl font-black text-indigo-600">${totalSugerido.toFixed(2)}</p>
                    </div>

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
                        <span className={`text-xl font-black ${differenceVal >= 0 ? 'text-teal-600' : 'text-red-600'}`}>
                            ${differenceVal.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex gap-3">
                        <button onClick={handlePrint} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-all">
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
