import React, { useState, useMemo } from 'react';
import { Ticket, Sparkles, Loader2, Check } from 'lucide-react';
import { Coupon } from '../../../types';

interface CouponFormProps {
  coupons: Coupon[];
  onSubmit: (coupon: { code: string; value: number; type: 'PERCENTAGE' | 'FIXED'; active: boolean }) => Promise<void>;
}

export const CouponForm: React.FC<CouponFormProps> = ({ coupons, onSubmit }) => {
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [value, setValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if code already exists
  const isDuplicate = useMemo(() => {
    if (!code.trim()) return false;
    const cleanInput = code.trim().toUpperCase();
    return coupons.some(c => c.code.toUpperCase() === cleanInput);
  }, [code, coupons]);

  // Generate random clinical / promotional codes
  const handleGenerateCode = () => {
    const prefixes = ['VITALIS', 'SALUD', 'BIENESTAR', 'SALUDABLE', 'PROMO', 'VITA', 'FIT', 'MED'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90); // 10 to 99
    setCode(`${randomPrefix}${randomNum}`);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valNum = parseFloat(value);
    if (!code.trim() || isDuplicate || isNaN(valNum) || valNum <= 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        code: code.trim().toUpperCase(),
        value: valNum,
        type,
        active: true
      });
      setCode('');
      setValue('');
    } catch (err) {
      console.error("Error al registrar cupón:", err);
      alert("No se pudo agregar el cupón.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs flex flex-col gap-6" id="coupon-creation-form">
      <div>
        <h4 className="text-base font-black text-slate-800 flex items-center gap-2">
          <Ticket size={18} className="text-amber-500" />
          Nuevo Cupón de Descuento
        </h4>
        <p className="text-xs text-slate-500">Genera códigos de descuento personalizados para tus clientes.</p>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        
        {/* Code Input & Generator */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block">Código del Cupón</label>
            <button
              type="button"
              onClick={handleGenerateCode}
              className="text-[10px] font-black text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-all"
            >
              <Sparkles size={11} className="text-amber-500" />
              Generar Código
            </button>
          </div>
          <input
            type="text"
            required
            placeholder="Ej: SALUD20, VITALIS15"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className={`w-full border p-3 rounded-2xl text-sm bg-slate-50 focus:ring-2 outline-none uppercase font-bold tracking-wider transition-all ${
              isDuplicate 
                ? 'border-red-200 focus:ring-red-400 focus:border-red-400' 
                : 'border-slate-100 focus:ring-teal-500 focus:border-teal-500'
            }`}
          />
          {isDuplicate && (
            <span className="text-[10px] text-red-500 font-bold mt-1 block">
              ⚠️ Este código de cupón ya existe.
            </span>
          )}
        </div>

        {/* Discount Type */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1.5">Tipo de Descuento</label>
          <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <button
              type="button"
              onClick={() => setType('PERCENTAGE')}
              className={`py-2 text-xs font-black rounded-xl transition-all ${
                type === 'PERCENTAGE'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Porcentaje (%)
            </button>
            <button
              type="button"
              onClick={() => setType('FIXED')}
              className={`py-2 text-xs font-black rounded-xl transition-all ${
                type === 'FIXED'
                  ? 'bg-white text-teal-600 shadow-sm border border-slate-100'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monto Fijo ($)
            </button>
          </div>
        </div>

        {/* Value Input */}
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-1">
            Valor del Descuento ({type === 'PERCENTAGE' ? 'Porcentaje %' : 'Dólares $'})
          </label>
          <div className="relative">
            <input
              type="number"
              required
              min="0.01"
              max={type === 'PERCENTAGE' ? '100' : '10000'}
              step="any"
              placeholder={type === 'PERCENTAGE' ? 'Ej: 15 (para 15% OFF)' : 'Ej: 5 (para $5.00 OFF)'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full border border-slate-100 p-3 rounded-2xl text-sm bg-slate-50 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none font-bold transition-all"
            />
            <span className="absolute right-4 top-3 text-sm font-black text-slate-400">
              {type === 'PERCENTAGE' ? '%' : 'USD'}
            </span>
          </div>
        </div>

        {/* Interactive Visual Preview */}
        <div className="pt-2 border-t border-slate-50">
          <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">Vista Previa del Boleto</label>
          
          <div className="bg-slate-900 text-white rounded-2xl p-4 border border-slate-800 relative overflow-hidden flex flex-col justify-between h-28 shadow-xl">
            {/* Left and right ticket cutouts */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full z-10"></div>
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full z-10"></div>
            
            <div className="flex justify-between items-start relative z-10">
              <div>
                <span className="text-[8px] font-black text-amber-400 uppercase tracking-widest block">Código Activo</span>
                <p className="text-lg font-black tracking-widest text-white uppercase">{code || 'CÓDIGO'}</p>
              </div>
              <div className="bg-white/10 px-2 py-1 rounded-lg text-right">
                <span className="text-[8px] font-black text-slate-300 block uppercase">Descuento</span>
                <span className="text-sm font-black text-teal-400">
                  {value ? (type === 'PERCENTAGE' ? `${value}%` : `$${value}`) : '-'}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-end relative z-10 border-t border-dashed border-white/10 pt-2 mt-2">
              <span className="text-[8px] font-bold text-slate-400">FARMACIA VITALIS</span>
              <span className="text-[8px] font-bold text-slate-400">Canjeable en checkout</span>
            </div>
            
            <div className="absolute -right-6 -bottom-6 bg-teal-500/10 w-24 h-24 rounded-full blur-2xl"></div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!code.trim() || !value || isDuplicate || isSubmitting}
          className="w-full bg-teal-600 text-white font-black p-3.5 rounded-2xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/10 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 text-sm"
        >
          {isSubmitting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Check size={18} />
              Registrar Cupón
            </>
          )}
        </button>

      </form>
    </div>
  );
};
