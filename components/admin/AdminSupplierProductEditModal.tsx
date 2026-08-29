import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Edit3, 
  Loader2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Sparkles,
  Bot
} from 'lucide-react';
import { Product, Category, Supplier } from '../../types';
import { updateProductDB } from '../../services/db.products';
import { generateProductDescription, generateProductKeywords } from '../../services/gemini.products';
import { ProductFormTabs, ProductFormTab } from './product-form/ProductFormTabs';
import { BasicInfoSection } from './product-form/BasicInfoSection';
import { PricingSection } from './product-form/PricingSection';
import { LogisticsSection } from './product-form/LogisticsSection';

interface AdminSupplierProductEditModalProps {
  product: Product | null;
  categories: Category[];
  suppliers: Supplier[];
  onClose: () => void;
}

export const AdminSupplierProductEditModal: React.FC<AdminSupplierProductEditModalProps> = ({
  product,
  categories,
  suppliers,
  onClose,
}) => {
  if (!product) return null;

  const [activeTab, setActiveTab] = useState<ProductFormTab>('BASIC');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form local state
  const [prodName, setProdName] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodOriginalPrice, setProdOriginalPrice] = useState('');
  const [prodCostPrice, setProdCostPrice] = useState('');
  const [prodUnitsPerBox, setProdUnitsPerBox] = useState('');
  const [prodBoxPrice, setProdBoxPrice] = useState('');
  const [prodPublicBoxPrice, setProdPublicBoxPrice] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodCat, setProdCat] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [prodBarcode, setProdBarcode] = useState('');
  const [prodExpiry, setProdExpiry] = useState('');
  const [prodSupplier, setProdSupplier] = useState('');
  const [prodActiveIngredient, setProdActiveIngredient] = useState('');
  const [prodKeywords, setProdKeywords] = useState('');

  // Initial load
  useEffect(() => {
    if (product) {
      setProdName(product.name || '');
      setProdPrice(product.price ? product.price.toString() : '');
      setProdOriginalPrice(product.originalPrice ? product.originalPrice.toString() : '');
      setProdCostPrice(product.costPrice ? product.costPrice.toString() : '');
      setProdUnitsPerBox(product.unitsPerBox ? product.unitsPerBox.toString() : '');
      setProdBoxPrice(product.boxPrice ? product.boxPrice.toString() : '');
      setProdPublicBoxPrice(product.publicBoxPrice ? product.publicBoxPrice.toString() : '');
      setProdDesc(product.description || '');
      setProdCat(product.category || (categories[0]?.id || 'MEDICAMENTOS'));
      setProdImage(product.image || '');
      setProdBarcode(product.barcode || '');
      setProdExpiry(product.expiryDate || '');
      setProdSupplier(product.supplierId || '');
      setProdActiveIngredient(product.activeIngredient || '');
      setProdKeywords(product.keywords || '');
      setSaveSuccess(false);
    }
  }, [product, categories]);

  // Recalculate cost when box price / units change
  useEffect(() => {
    const boxPrice = parseFloat(prodBoxPrice);
    const units = parseInt(prodUnitsPerBox);
    if (!isNaN(boxPrice) && !isNaN(units) && units > 0) {
      const calculatedCost = (boxPrice / units).toFixed(2);
      if (calculatedCost !== prodCostPrice) {
        setProdCostPrice(calculatedCost);
      }
    }
  }, [prodBoxPrice, prodUnitsPerBox]);

  const isStepValid = (tab: ProductFormTab): boolean => {
    switch (tab) {
      case 'BASIC':
        return prodName.trim().length > 0 && prodCat.trim().length > 0;
      case 'PRICING':
        return !isNaN(parseFloat(prodPrice)) && parseFloat(prodPrice) > 0;
      case 'LOGISTICS':
        return true;
      default:
        return true;
    }
  };

  const handleGenerateDescription = async (tone: 'CLINICO' | 'PERSUASIVO' | 'CERCANO') => {
    if (!prodName.trim()) {
      alert('Ingresa primero el nombre del producto para generar la descripción.');
      return;
    }
    setIsGenerating(true);
    try {
      const desc = await generateProductDescription(prodName, prodCat, tone);
      setProdDesc(desc);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateKeywords = async () => {
    if (!prodName.trim()) {
      alert('Ingresa el nombre del producto primero.');
      return;
    }
    setIsGenerating(true);
    try {
      const kw = await generateProductKeywords(prodName, prodActiveIngredient);
      setProdKeywords(kw);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen no debe superar los 2MB');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProdImage(reader.result as string);
      setIsUploadingImage(false);
    };
    reader.onerror = () => {
      alert('Error al leer la imagen');
      setIsUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    setIsSubmitting(true);
    try {
      const updatedProduct: Product = {
        ...product,
        name: prodName.trim(),
        price: parseFloat(prodPrice) || 0,
        originalPrice: prodOriginalPrice ? parseFloat(prodOriginalPrice) : undefined,
        costPrice: prodCostPrice ? parseFloat(prodCostPrice) : undefined,
        unitsPerBox: prodUnitsPerBox ? parseInt(prodUnitsPerBox) : undefined,
        boxPrice: prodBoxPrice ? parseFloat(prodBoxPrice) : undefined,
        publicBoxPrice: prodPublicBoxPrice ? parseFloat(prodPublicBoxPrice) : undefined,
        description: prodDesc.trim(),
        category: prodCat,
        image: prodImage || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
        barcode: prodBarcode.trim() || undefined,
        expiryDate: prodExpiry || undefined,
        supplierId: prodSupplier || undefined,
        activeIngredient: prodActiveIngredient.trim() || undefined,
        keywords: prodKeywords ? prodKeywords.trim() : undefined,
      };

      await updateProductDB(updatedProduct);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Error al actualizar producto:', err);
      alert('Error al guardar los cambios del producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Cabecera del Modal */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 p-6 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Edit3 size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-teal-400">
                Ficha Completa del Producto (Vitalis Admin)
              </span>
              <h3 className="text-base font-black tracking-tight uppercase truncate max-w-md">
                {product.name}
              </h3>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Cerrar modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Selector de pestañas */}
            <ProductFormTabs 
              activeTab={activeTab}
              onTabChange={(tab) => setActiveTab(tab)}
              isStepValid={isStepValid}
            />

            {/* Pestaña 1: Información básica */}
            {activeTab === 'BASIC' && (
              <BasicInfoSection 
                prodName={prodName}
                setProdName={setProdName}
                prodCat={prodCat}
                setProdCat={setProdCat}
                prodActiveIngredient={prodActiveIngredient}
                setProdActiveIngredient={setProdActiveIngredient}
                prodDesc={prodDesc}
                setProdDesc={setProdDesc}
                prodKeywords={prodKeywords}
                setProdKeywords={setProdKeywords}
                categories={categories}
              />
            )}

            {/* Pestaña 2: Precios y Costos */}
            {activeTab === 'PRICING' && (
              <PricingSection 
                prodPrice={prodPrice}
                setProdPrice={setProdPrice}
                prodOriginalPrice={prodOriginalPrice}
                setProdOriginalPrice={setProdOriginalPrice}
                prodCostPrice={prodCostPrice}
                setProdCostPrice={setProdCostPrice}
                prodUnitsPerBox={prodUnitsPerBox}
                setProdUnitsPerBox={setProdUnitsPerBox}
                prodBoxPrice={prodBoxPrice}
                setProdBoxPrice={setProdBoxPrice}
                prodPublicBoxPrice={prodPublicBoxPrice}
                setProdPublicBoxPrice={setProdPublicBoxPrice}
              />
            )}

            {/* Pestaña 3: Logística y Proveedor */}
            {activeTab === 'LOGISTICS' && (
              <LogisticsSection 
                prodBarcode={prodBarcode}
                setProdBarcode={setProdBarcode}
                prodExpiry={prodExpiry}
                setProdExpiry={setProdExpiry}
                prodSupplier={prodSupplier}
                setProdSupplier={setProdSupplier}
                prodImage={prodImage}
                setProdImage={setProdImage}
                suppliers={suppliers}
                setShowProductScanner={() => {}}
                fileInputRef={fileInputRef}
                handleImageUpload={handleImageUpload}
                isUploadingImage={isUploadingImage}
              />
            )}

            {/* Asistente IA para Descripción y Palabras Clave */}
            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-700">
                <Bot size={18} className="text-teal-600" />
                <span className="text-xs font-bold">Asistente IA Vitalis:</span>
              </div>
              <div className="flex flex-wrap gap-2 w-full md:w-auto">
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={() => handleGenerateDescription('CLINICO')}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 rounded-xl text-[11px] font-bold text-slate-600 transition shadow-xs disabled:opacity-50"
                >
                  {isGenerating ? <Loader2 size={12} className="animate-spin inline mr-1" /> : <Sparkles size={12} className="inline mr-1 text-teal-600" />}
                  Generar Descripción
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleGenerateKeywords}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:border-teal-400 hover:text-teal-700 rounded-xl text-[11px] font-bold text-slate-600 transition shadow-xs disabled:opacity-50"
                >
                  Generar Tags IA
                </button>
              </div>
            </div>

            {/* Barra de Navegación y Guardado */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {activeTab !== 'BASIC' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'LOGISTICS') setActiveTab('PRICING');
                      else if (activeTab === 'PRICING') setActiveTab('BASIC');
                    }}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition flex items-center gap-1.5"
                  >
                    <ChevronLeft size={16} /> Anterior
                  </button>
                )}
                
                {activeTab !== 'LOGISTICS' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activeTab === 'BASIC') setActiveTab('PRICING');
                      else if (activeTab === 'PRICING') setActiveTab('LOGISTICS');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    Siguiente <ChevronRight size={16} />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition-all flex items-center gap-2 ${
                    saveSuccess 
                      ? 'bg-emerald-600 shadow-emerald-600/30' 
                      : 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/30'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <Check size={16} />
                      <span>¡Actualizado con Éxito!</span>
                    </>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Guardar Todos los Cambios</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default AdminSupplierProductEditModal;
