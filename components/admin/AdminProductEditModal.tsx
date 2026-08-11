import React from 'react';
import { X, Edit3 } from 'lucide-react';
import { Category, Supplier } from '../../types';
import AdminProductForm from './AdminProductForm';

interface AdminProductEditModalProps {
  editingId: string | null;
  prodName: string; setProdName: (s: string) => void;
  prodPrice: string; setProdPrice: (s: string) => void;
  prodOriginalPrice: string; setProdOriginalPrice: (s: string) => void;
  prodCostPrice: string; setProdCostPrice: (s: string) => void;
  prodUnitsPerBox: string; setProdUnitsPerBox: (s: string) => void;
  prodBoxPrice: string; setProdBoxPrice: (s: string) => void;
  prodPublicBoxPrice: string; setProdPublicBoxPrice: (s: string) => void;
  prodDesc: string; setProdDesc: (s: string) => void;
  prodCat: string; setProdCat: (s: string) => void;
  prodImage: string; setProdImage: (s: string) => void;
  prodBarcode: string; setProdBarcode: (s: string) => void;
  prodExpiry: string; setProdExpiry: (s: string) => void;
  prodSupplier: string; setProdSupplier: (s: string) => void;
  prodActiveIngredient: string; setProdActiveIngredient: (s: string) => void;
  prodKeywords: string; setProdKeywords: (s: string) => void;
  handleProductSubmit: (e: React.FormEvent) => void | Promise<void>;
  handleGenerateDescription: (tone: 'CLINICO' | 'PERSUASIVO' | 'CERCANO') => Promise<void>;
  handleGenerateKeywords: () => Promise<void>;
  handleImageUpload: (e: any, setter: any) => void | Promise<void>;
  setShowProductScanner: (b: boolean) => void;
  resetProductForm: () => void;
  isGenerating: boolean;
  isSubmitting: boolean;
  isUploadingImage?: boolean;
  fileInputRef: React.Ref<HTMLInputElement>;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
}

export const AdminProductEditModal: React.FC<AdminProductEditModalProps> = (props) => {
  if (!props.editingId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-slate-900 to-teal-950 p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Edit3 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">Edición Rápida de Producto</span>
              <h3 className="text-base font-black tracking-tight uppercase">{props.prodName || 'Editar Medicamento'}</h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={props.onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Cerrar modal de edición"
          >
            <X size={20} />
          </button>
        </div>

        {/* Formulario de edición dentro del modal */}
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto">
          <AdminProductForm {...props} />
        </div>

      </div>
    </div>
  );
};

export default AdminProductEditModal;