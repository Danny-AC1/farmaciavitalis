import React, { useState, useRef } from 'react';
import { Order } from '../../types';
import { 
  X, Camera, CheckCircle2, ShieldCheck, DollarSign, 
  Image as ImageIcon, RefreshCw, AlertCircle, FileText, Loader2
} from 'lucide-react';
import { 
  getOrderDeliveryOtp, 
  applyDeliveryWatermark 
} from '../../services/driverService';

interface DriverDeliveryConfirmModalProps {
  order: Order;
  driverGps: { lat: number; lng: number } | null;
  onClose: () => void;
  onConfirm: (
    order: Order, 
    proofData: {
      deliveryProofPhoto?: string;
      paymentProofPhoto?: string;
      deliveryOtp?: string;
      driverNotes?: string;
      changeGiven?: number;
      paymentConfirmed: boolean;
      deliveredAt: string;
    }
  ) => Promise<void>;
}

export const DriverDeliveryConfirmModal: React.FC<DriverDeliveryConfirmModalProps> = ({
  order,
  driverGps,
  onClose,
  onConfirm
}) => {
  const expectedOtp = getOrderDeliveryOtp(order.id);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpBypassed, setOtpBypassed] = useState(false);

  // Foto de entrega con marca de agua
  const [deliveryPhoto, setDeliveryPhoto] = useState<string | null>(order.deliveryProofPhoto || null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Foto de comprobante de transferencia (si aplica)
  const [paymentPhoto, setPaymentPhoto] = useState<string | null>(order.paymentProofPhoto || null);
  const [isProcessingPaymentPhoto, setIsProcessingPaymentPhoto] = useState(false);
  const paymentPhotoInputRef = useRef<HTMLInputElement>(null);

  // Gestión de dinero
  const [cashGiven, setCashGiven] = useState<number>(order.cashGiven || order.total);
  const [driverNotes, setDriverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const change = Math.max(0, cashGiven - order.total);

  // Manejador para procesar foto de entrega con marca de agua
  const handlePhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPhoto(true);
    setErrorMsg(null);
    try {
      const watermarked = await applyDeliveryWatermark(file, {
        orderId: order.id,
        customerName: order.customerName,
        address: order.customerAddress,
        lat: driverGps?.lat || order.lat,
        lng: driverGps?.lng || order.lng,
        date: new Date()
      });
      setDeliveryPhoto(watermarked);
    } catch (err) {
      console.error('Error procesando foto con marca de agua:', err);
      setErrorMsg('No se pudo estampar la marca de agua a la foto. Intenta de nuevo.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  // Manejador para comprobante de transferencia
  const handlePaymentPhotoCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingPaymentPhoto(true);
    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPaymentPhoto(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error subiendo comprobante:', err);
    } finally {
      setIsProcessingPaymentPhoto(false);
    }
  };

  const handleFinalSubmit = async () => {
    // Validar OTP si no fue omitido
    if (!otpBypassed && enteredOtp.trim() !== expectedOtp) {
      setErrorMsg(`Código OTP incorrecto. Pídele al cliente el código de 4 dígitos o presiona 'Omitir código'`);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      await onConfirm(order, {
        deliveryProofPhoto: deliveryPhoto || undefined,
        paymentProofPhoto: paymentPhoto || undefined,
        deliveryOtp: otpBypassed ? 'OMITIDO_REPARTIDOR' : enteredOtp,
        driverNotes: driverNotes.trim() || undefined,
        changeGiven: order.paymentMethod === 'CASH' ? change : undefined,
        paymentConfirmed: true,
        deliveredAt: new Date().toISOString()
      });
      onClose();
    } catch (err) {
      console.error('Error al confirmar entrega:', err);
      setErrorMsg('Error al guardar la entrega. Por favor reintenta.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200">
        
        {/* Encabezado del Modal */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-black">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-wider text-white">Comprobante de Entrega (POD)</h2>
              <p className="text-[11px] text-teal-300 font-bold uppercase tracking-widest mt-0.5">
                Pedido #{order.id.slice(-6).toUpperCase()} • {order.customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-50 text-red-700 rounded-2xl text-xs font-bold border border-red-200 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* 1. Código OTP de Verificación */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-teal-600" />
                Código de Seguridad del Cliente (OTP)
              </span>
              <span className="text-[10px] font-mono font-bold bg-teal-100 text-teal-800 px-2 py-0.5 rounded">
                Esperado: {expectedOtp}
              </span>
            </div>

            {!otpBypassed ? (
              <div className="space-y-2">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Pídele al cliente el código de 4 dígitos que ve en su pantalla o WhatsApp:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={4}
                    value={enteredOtp}
                    onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="Código (4 dígitos)"
                    className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-3 text-center font-mono text-xl font-black text-slate-900 tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  {enteredOtp === expectedOtp && (
                    <div className="bg-emerald-500 text-white px-3.5 rounded-xl flex items-center justify-center font-black text-xs gap-1">
                      <CheckCircle2 size={16} /> Válido
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={() => setOtpBypassed(true)}
                    className="text-[11px] text-slate-400 hover:text-slate-600 underline font-medium cursor-pointer"
                  >
                    El cliente no tiene su teléfono (Omitir código)
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs text-amber-800 font-bold">
                <span>Código omitido bajo confirmación manual del repartidor</span>
                <button
                  type="button"
                  onClick={() => setOtpBypassed(false)}
                  className="text-amber-900 underline font-black ml-2 cursor-pointer"
                >
                  Restaurar
                </button>
              </div>
            )}
          </div>

          {/* 2. Foto de Entrega con Sello de Agua */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Camera size={14} className="text-blue-600" />
                Fotografía de Entrega (Fachada / Paquete)
              </span>
              <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                Sello Automático
              </span>
            </div>

            <input
              type="file"
              accept="image/*"
              capture="environment"
              ref={photoInputRef}
              onChange={handlePhotoCapture}
              className="hidden"
            />

            {deliveryPhoto ? (
              <div className="space-y-2">
                <div className="relative rounded-2xl overflow-hidden border-2 border-teal-500 shadow-sm">
                  <img
                    src={deliveryPhoto}
                    alt="Foto de entrega con marca de agua"
                    className="w-full max-h-56 object-cover bg-slate-900"
                  />
                  <div className="absolute top-2 right-2 bg-teal-500 text-slate-950 font-black text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow">
                    ✓ Sello GPS Aplicado
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isProcessingPhoto}
                  className="w-full py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={14} /> Tomar otra foto
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                disabled={isProcessingPhoto}
                className="w-full py-6 border-2 border-dashed border-slate-300 hover:border-teal-500 bg-white hover:bg-teal-50/50 rounded-2xl flex flex-col items-center justify-center gap-2 text-slate-600 transition-all cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-2xl bg-teal-100 group-hover:bg-teal-200 text-teal-700 flex items-center justify-center transition-colors">
                  {isProcessingPhoto ? <RefreshCw className="animate-spin" size={24} /> : <Camera size={24} />}
                </div>
                <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {isProcessingPhoto ? 'Estampando fecha y GPS...' : 'Tomar Foto de Entrega'}
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Se añadirá automáticamente la fecha, hora y coordenadas GPS
                </span>
              </button>
            )}
          </div>

          {/* 3. Cobro y Liquidación de Dinero */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <DollarSign size={14} className="text-emerald-600" />
                Liquidación Financiera
              </span>
              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                order.paymentMethod === 'CASH' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {order.paymentMethod === 'CASH' ? '💵 EFECTIVO' : '🏦 TRANSFERENCIA'}
              </span>
            </div>

            <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase">Monto Total del Pedido:</span>
              <span className="text-2xl font-black text-slate-900 tabular-nums">${order.total.toFixed(2)}</span>
            </div>

            {order.paymentMethod === 'CASH' ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    ¿Con cuánto paga el cliente en efectivo?
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3.5 top-3 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.25"
                        min={order.total}
                        value={cashGiven}
                        onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-slate-300 rounded-xl pl-8 pr-4 py-2.5 text-lg font-black text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Atajos de billetes rápidos */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCashGiven(order.total)}
                    className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Exacto
                  </button>
                  {[10, 20, 50].map((denomination) => (
                    <button
                      key={denomination}
                      type="button"
                      onClick={() => setCashGiven(denomination)}
                      className="flex-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-bold transition-all cursor-pointer"
                    >
                      ${denomination}
                    </button>
                  ))}
                </div>

                {/* Cálculo del vuelto */}
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-emerald-800 tracking-wider">
                    Vuelto / Cambio a entregar:
                  </span>
                  <span className="text-2xl font-black text-emerald-700 tabular-nums">
                    ${change.toFixed(2)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Verifica que el cliente haya realizado la transferencia bancaria (Deuna, Banco Pichincha, etc.):
                </p>
                
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  ref={paymentPhotoInputRef}
                  onChange={handlePaymentPhotoCapture}
                  className="hidden"
                />

                {paymentPhoto ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-300">
                    <img src={paymentPhoto} alt="Comprobante" className="w-full max-h-36 object-cover" />
                    <button
                      type="button"
                      onClick={() => paymentPhotoInputRef.current?.click()}
                      className="absolute bottom-2 right-2 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded cursor-pointer"
                    >
                      Cambiar foto comprobante
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={isProcessingPaymentPhoto}
                    onClick={() => paymentPhotoInputRef.current?.click()}
                    className="w-full py-3 bg-white border border-slate-300 hover:border-blue-500 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                  >
                    {isProcessingPaymentPhoto ? (
                      <Loader2 size={16} className="animate-spin text-blue-600" />
                    ) : (
                      <ImageIcon size={16} className="text-blue-600" />
                    )}
                    <span>{isProcessingPaymentPhoto ? 'Procesando comprobante...' : 'Tomar foto del comprobante de transferencia (Opcional)'}</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* 4. Notas de Entrega */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5">
              <FileText size={14} /> Observación o Nota de Entrega (Opcional)
            </label>
            <input
              type="text"
              value={driverNotes}
              onChange={(e) => setDriverNotes(e.target.value)}
              placeholder="Ej. Recibió en portería, entregado a familiar, etc."
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        {/* Pie del modal con botón de acción principal */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-5 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer"
          >
            Volver
          </button>
          <button
            type="button"
            onClick={handleFinalSubmit}
            disabled={isSubmitting}
            className="flex-1 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Sincronizando Entrega...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={18} />
                <span>Confirmar Entrega Completada ✅</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
