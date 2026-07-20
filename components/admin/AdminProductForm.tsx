import React, { useState, useEffect } from 'react';
import { Package, Loader2, ChevronLeft, ChevronRight, Check, ArrowLeft } from 'lucide-react';
import { Category, Supplier } from '../../types';

// Sub-components
import { ProductFormTabs, ProductFormTab } from './product-form/ProductFormTabs';
import { BasicInfoSection } from './product-form/BasicInfoSection';
import { PricingSection } from './product-form/PricingSection';
import { LogisticsSection } from './product-form/LogisticsSection';

interface AdminProductFormProps {
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
}

const AdminProductForm: React.FC<AdminProductFormProps> = (props) => {
  const [activeTab, setActiveTab] = useState<ProductFormTab>('BASIC');

  // Automatic calculation of unit cost from box price and box size
  useEffect(() => {
    const boxPrice = parseFloat(props.prodBoxPrice);
    const units = parseInt(props.prodUnitsPerBox);
    if (!isNaN(boxPrice) && !isNaN(units) && units > 0) {
      const calculatedCost = (boxPrice / units).toFixed(2);
      if (calculatedCost !== props.prodCostPrice) {
        props.setProdCostPrice(calculatedCost);
      }
    }
  }, [props.prodBoxPrice, props.prodUnitsPerBox, props.prodCostPrice, props.setProdCostPrice]);

  // Tab validation indicators
  const isStepValid = (tab: ProductFormTab): boolean => {
    switch (tab) {
      case 'BASIC':
        return !!props.prodName.trim() && !!props.prodCat;
      case 'PRICING':
        return !!props.prodPrice && parseFloat(props.prodPrice) > 0;
      case 'LOGISTICS':
        // Optional step structurally, completed if any fields filled
        return !!props.prodBarcode || !!props.prodExpiry || !!props.prodImage || !!props.prodSupplier;
      default:
        return false;
    }
  };

  // Safe navigation handlers
  const handleNextStep = () => {
    if (activeTab === 'BASIC') setActiveTab('PRICING');
    else if (activeTab === 'PRICING') setActiveTab('LOGISTICS');
  };

  const handlePrevStep = () => {
    if (activeTab === 'PRICING') setActiveTab('BASIC');
    else if (activeTab === 'LOGISTICS') setActiveTab('PRICING');
  };

  // Form Submission Safeguards
  const isFormSubmittable = isStepValid('BASIC') && isStepValid('PRICING') && !props.isSubmitting && !props.isUploadingImage;

  return (
    <div className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-xs space-y-6" id="product-form-card">
      
      {/* Header with Title and Cancel button */}
      <div className="flex justify-between items-center border-b border-slate-50 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-teal-50 p-3 rounded-2xl border border-teal-100 text-teal-600">
            <Package size={22} />
          </div>
          <div>
            <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Administración de Stock</span>
            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">
              {props.editingId ? 'Editar Medicamento' : 'Nuevo Registro de Catálogo'}
            </h3>
          </div>
        </div>

        {props.editingId && (
          <button
            type="button"
            onClick={props.resetProductForm}
            className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 active:scale-95"
            id="btn-cancel-edit"
          >
            <ArrowLeft size={13} /> Volver Nuevo
          </button>
        )}
      </div>

      {/* Tabs / Step Navigation */}
      <ProductFormTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isStepValid={isStepValid}
      />

      {/* Active Form Section */}
      <form onSubmit={props.handleProductSubmit} className="space-y-8" id="pharmacy-product-form">
        
        {activeTab === 'BASIC' && (
          <BasicInfoSection
            prodName={props.prodName}
            setProdName={props.setProdName}
            prodCat={props.prodCat}
            setProdCat={props.setProdCat}
            prodActiveIngredient={props.prodActiveIngredient}
            setProdActiveIngredient={props.setProdActiveIngredient}
            prodDesc={props.prodDesc}
            setProdDesc={props.setProdDesc}
            prodKeywords={props.prodKeywords}
            setProdKeywords={props.setProdKeywords}
            categories={props.categories}
          />
        )}

        {activeTab === 'PRICING' && (
          <PricingSection
            prodPrice={props.prodPrice}
            setProdPrice={props.setProdPrice}
            prodOriginalPrice={props.prodOriginalPrice}
            setProdOriginalPrice={props.setProdOriginalPrice}
            prodCostPrice={props.prodCostPrice}
            setProdCostPrice={props.setProdCostPrice}
            prodUnitsPerBox={props.prodUnitsPerBox}
            setProdUnitsPerBox={props.setProdUnitsPerBox}
            prodBoxPrice={props.prodBoxPrice}
            setProdBoxPrice={props.setProdBoxPrice}
            prodPublicBoxPrice={props.prodPublicBoxPrice}
            setProdPublicBoxPrice={props.setProdPublicBoxPrice}
          />
        )}

        {activeTab === 'LOGISTICS' && (
          <LogisticsSection
            prodBarcode={props.prodBarcode}
            setProdBarcode={props.setProdBarcode}
            prodExpiry={props.prodExpiry}
            setProdExpiry={props.setProdExpiry}
            prodSupplier={props.prodSupplier}
            setProdSupplier={props.setProdSupplier}
            prodImage={props.prodImage}
            setProdImage={props.setProdImage}
            setShowProductScanner={props.setShowProductScanner}
            isUploadingImage={!!props.isUploadingImage}
            fileInputRef={props.fileInputRef}
            handleImageUpload={props.handleImageUpload}
            suppliers={props.suppliers}
          />
        )}

        {/* Navigation Action Buttons footer */}
        <div className="flex justify-between items-center pt-5 border-t border-slate-50 gap-4">
          
          {/* Back Step */}
          <button
            type="button"
            onClick={handlePrevStep}
            disabled={activeTab === 'BASIC'}
            className="px-5 py-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95"
            id="btn-prev-step"
          >
            <ChevronLeft size={14} /> Paso Anterior
          </button>

          {/* Next / Submit Container */}
          <div className="flex gap-2">
            {activeTab !== 'LOGISTICS' ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm active:scale-95"
                id="btn-next-step"
              >
                Siguiente Paso <ChevronRight size={14} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!isFormSubmittable}
                className="px-6 py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-md shadow-teal-600/15 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
                id="btn-submit-form"
              >
                {props.isSubmitting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Procesando...
                  </>
                ) : (
                  <>
                    <Check size={14} strokeWidth={3} /> {props.editingId ? 'Actualizar Registro' : 'Registrar Medicamento'}
                  </>
                )}
              </button>
            )}
          </div>

        </div>

      </form>
    </div>
  );
};

export default AdminProductForm;
