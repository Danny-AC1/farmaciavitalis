import React, { useMemo } from 'react';
import { Truck, ScanBarcode, Calendar, Loader2, X, Plus, AlertCircle, CheckCircle } from 'lucide-react';
import { Supplier } from '../../../types';

interface LogisticsSectionProps {
  prodBarcode: string;
  setProdBarcode: (s: string) => void;
  prodExpiry: string;
  setProdExpiry: (s: string) => void;
  prodSupplier: string;
  setProdSupplier: (s: string) => void;
  prodImage: string;
  setProdImage: (s: string) => void;
  setShowProductScanner: (b: boolean) => void;
  isUploadingImage: boolean;
  fileInputRef: React.Ref<HTMLInputElement>;
  handleImageUpload: (e: any, setter: any) => void | Promise<void>;
  suppliers: Supplier[];
}

export const LogisticsSection: React.FC<LogisticsSectionProps> = ({
  prodBarcode,
  setProdBarcode,
  prodExpiry,
  setProdExpiry,
  prodSupplier,
  setProdSupplier,
  prodImage,
  setProdImage,
  setShowProductScanner,
  isUploadingImage,
  fileInputRef,
  handleImageUpload,
  suppliers,
}) => {
  
  // Date Expiry Alert calculations
  const expiryStatus = useMemo(() => {
    if (!prodExpiry) return null;
    
    const expiryDate = new Date(prodExpiry + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = expiryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return {
        style: 'bg-red-50 border-red-100 text-red-700',
        message: '¡CRÍTICO: MEDICAMENTO CADUCADO! Este lote no puede ser ingresado ni vendido.',
        icon: AlertCircle,
        type: 'DANGER' as const,
      };
    } else if (diffDays <= 180) {
      return {
        style: 'bg-amber-50 border-amber-100 text-amber-700',
        message: `¡ATENCIÓN: PRÓXIMO A VENCER! Caduca en ${diffDays} días (${new Date(prodExpiry).toLocaleDateString()}).`,
        icon: AlertCircle,
        type: 'WARNING' as const,
      };
    } else {
      return {
        style: 'bg-emerald-50 border-emerald-100 text-emerald-700',
        message: 'Lote Vigente y Seguro. Fecha de vencimiento óptima.',
        icon: CheckCircle,
        type: 'SAFE' as const,
      };
    }
  }, [prodExpiry]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300" id="product-form-logistics">
      {/* Section Header */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-start gap-3">
        <div className="bg-teal-50 p-2.5 rounded-xl border border-teal-100 text-teal-600">
          <Truck size={18} />
        </div>
        <div>
          <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight">Logística, Caducidad & Medios</h4>
          <p className="text-[11px] text-slate-500 font-semibold">
            Registra el código de barras, controla fechas de vencimiento de seguridad y sube imágenes de alta resolución.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Logistics Fields Left Side */}
        <div className="space-y-5">
          {/* Barcode Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Código de Barras / EAN-13
            </label>
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <input
                  className="w-full bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs font-black text-slate-800 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all uppercase"
                  value={prodBarcode}
                  onChange={(e) => setProdBarcode(e.target.value)}
                  placeholder="Ej: 7861012345678"
                  id="input-prod-barcode"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowProductScanner(true)}
                className="px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-150 rounded-2xl transition-all flex items-center justify-center gap-1.5 active:scale-95 text-xs font-black"
                title="Escanear Código de Barras"
                id="btn-scan-barcode"
              >
                <ScanBarcode size={16} /> Escanear
              </button>
            </div>
            <span className="text-[9px] text-slate-400 font-medium block">Utiliza la pistola de códigos o la cámara del dispositivo.</span>
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block flex items-center gap-1">
              <Calendar size={12} className="text-teal-600" /> Fecha de Caducidad
            </label>
            <input
              type="date"
              className="w-full bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
              value={prodExpiry}
              onChange={(e) => setProdExpiry(e.target.value)}
              id="input-prod-expiry"
            />
            {expiryStatus && (
              <div className={`p-3 rounded-xl border flex items-start gap-2.5 ${expiryStatus.style} mt-2 text-[10px] font-bold uppercase`}>
                <expiryStatus.icon size={14} className="shrink-0 mt-0.5" />
                <p>{expiryStatus.message}</p>
              </div>
            )}
          </div>

          {/* Supplier */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              Laboratorio / Proveedor Principal
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200/80 p-3 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all cursor-pointer"
              value={prodSupplier}
              onChange={(e) => setProdSupplier(e.target.value)}
              id="select-prod-supplier"
            >
              <option value="">Sin proveedor asignado</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id} className="font-bold text-xs">
                  {s.name.toUpperCase()}
                </option>
              ))}
            </select>
            <span className="text-[9px] text-slate-400 font-medium block">Facilita el rastreo para futuras compras de reposición.</span>
          </div>

        </div>

        {/* Media Upload Right Side */}
        <div className="flex flex-col justify-between space-y-3 bg-slate-50/50 p-5 rounded-3xl border border-slate-100">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">
              Imagen Ilustrativa
            </label>
            <span className="text-[9px] text-slate-400 font-semibold block leading-tight">
              Sube fotos claras sobre fondo blanco. Formatos: PNG, JPG, WEBP. Compresión automática.
            </span>
          </div>

          <div className="flex-grow w-full h-56 border-2 border-dashed border-slate-200/80 hover:border-teal-500 rounded-3xl flex items-center justify-center overflow-hidden bg-white relative group transition-all mt-2">
            {isUploadingImage ? (
              <div className="flex flex-col items-center gap-3 animate-pulse">
                <Loader2 className="animate-spin text-teal-600 h-8 w-8" strokeWidth={3} />
                <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Sincronizando foto...</span>
              </div>
            ) : prodImage ? (
              <div className="w-full h-full p-4 flex items-center justify-center relative">
                <img src={prodImage} className="max-w-full max-h-full object-contain mix-blend-multiply transition-transform group-hover:scale-105 duration-300" alt="Vista previa de medicamento" />
                <button
                  type="button"
                  onClick={() => setProdImage('')}
                  className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg active:scale-90"
                  id="btn-remove-prod-image"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="text-center p-4 space-y-1 text-slate-400">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 inline-block text-slate-400 group-hover:text-teal-600 transition-colors">
                  <Plus size={24} />
                </div>
                <p className="text-xs font-black text-slate-600 uppercase tracking-wider pt-2">Seleccionar Archivo</p>
                <p className="text-[9px] font-medium text-slate-400">o arrástralo directamente aquí</p>
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleImageUpload(e, setProdImage)}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              disabled={isUploadingImage}
              accept="image/*"
              id="file-prod-image-uploader"
            />
          </div>
        </div>

      </div>
    </div>
  );
};
