import React from 'react';
import { Product, Category, Supplier } from '../../types';
import AdminProductForm from './AdminProductForm';
import AdminProductList from './AdminProductList';
import AdminProductEditModal from './AdminProductEditModal';

interface AdminProductManagementProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
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
  handleEditClick: (p: Product) => void;
  onDeleteProduct: (id: string) => void;
  onUpdateStock: (id: string, newStock: number) => void;
  resetProductForm: () => void;
  isGenerating: boolean;
  isSubmitting: boolean;
  isUploadingImage?: boolean;
  fileInputRef: React.Ref<HTMLInputElement>;
}

const AdminProductManagement: React.FC<AdminProductManagementProps> = (props) => {
  return (
    <div className="space-y-8 animate-in fade-in">
        {/* Formulario Estático para creación de nuevos productos */}
        <AdminProductForm 
            {...props}
            editingId={null}
        />

        {/* Lista de productos */}
        <AdminProductList 
            products={props.products}
            handleEditClick={props.handleEditClick}
            onDeleteProduct={props.onDeleteProduct}
            onUpdateStock={props.onUpdateStock}
        />

        {/* Modal Emergente para Editar un Producto sin tener que hacer scroll hacia arriba */}
        <AdminProductEditModal
            {...props}
            onClose={props.resetProductForm}
        />
    </div>
  );
};

export default AdminProductManagement;