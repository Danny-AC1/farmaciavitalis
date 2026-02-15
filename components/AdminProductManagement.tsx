
import React from 'react';
import { Product, Category, Supplier } from '../types';
import AdminProductForm from './AdminProductForm';
import AdminProductList from './AdminProductList';

interface AdminProductManagementProps {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  editingId: string | null;
  prodName: string; setProdName: (s: string) => void;
  prodPrice: string; setProdPrice: (s: string) => void;
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
  handleProductSubmit: (e: React.FormEvent) => void | Promise<void>;
  handleGenerateDescription: (tone: 'CLINICO' | 'PERSUASIVO' | 'CERCANO') => Promise<void>;
  handleImageUpload: (e: any, setter: any) => void | Promise<void>;
  setShowProductScanner: (b: boolean) => void;
  handleEditClick: (p: Product) => void;
  onDeleteProduct: (id: string) => void | Promise<void>;
  onUpdateStock: (id: string, s: number) => void | Promise<void>;
  resetProductForm: () => void;
  isGenerating: boolean;
  isSubmitting: boolean;
  isUploadingImage?: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const AdminProductManagement: React.FC<AdminProductManagementProps> = (props) => {
  return (
    <div className="space-y-8 animate-in fade-in">
        <AdminProductForm 
            editingId={props.editingId}
            prodName={props.prodName} setProdName={props.setProdName}
            prodPrice={props.prodPrice} setProdPrice={props.setProdPrice}
            prodCostPrice={props.prodCostPrice} setProdCostPrice={props.setProdCostPrice}
            prodUnitsPerBox={props.prodUnitsPerBox} setProdUnitsPerBox={props.setProdUnitsPerBox}
            prodBoxPrice={props.prodBoxPrice} setProdBoxPrice={props.setProdBoxPrice}
            prodPublicBoxPrice={props.prodPublicBoxPrice} setProdPublicBoxPrice={props.setProdPublicBoxPrice}
            prodDesc={props.prodDesc} setProdDesc={props.setProdDesc}
            prodCat={props.prodCat} setProdCat={props.setProdCat}
            prodImage={props.prodImage} setProdImage={props.setProdImage}
            prodBarcode={props.prodBarcode} setProdBarcode={props.setProdBarcode}
            prodExpiry={props.prodExpiry} setProdExpiry={props.setProdExpiry}
            prodSupplier={props.prodSupplier} setProdSupplier={props.setProdSupplier}
            handleProductSubmit={props.handleProductSubmit}
            handleGenerateDescription={props.handleGenerateDescription}
            handleImageUpload={props.handleImageUpload}
            setShowProductScanner={props.setShowProductScanner}
            resetProductForm={props.resetProductForm}
            isGenerating={props.isGenerating}
            isSubmitting={props.isSubmitting}
            isUploadingImage={props.isUploadingImage}
            fileInputRef={props.fileInputRef}
            categories={props.categories}
            suppliers={props.suppliers}
        />

        <AdminProductList 
            products={props.products}
            handleEditClick={props.handleEditClick}
            onDeleteProduct={props.onDeleteProduct}
            onUpdateStock={props.onUpdateStock}
        />
    </div>
  );
};

export default AdminProductManagement;
