
import React, { useState } from 'react';
import { Product, Category } from '../types';
import { generateProductDescription } from '../services/gemini';
import { uploadImageToStorage } from '../services/db';

export const useAdminProductForm = (
    products: Product[],
    categories: Category[],
    onAddProduct: (p: Product) => Promise<any>,
    onEditProduct: (p: Product) => Promise<void>
) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const [prodName, setProdName] = useState('');
    const [prodPrice, setProdPrice] = useState('');
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, setter: (s: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingImage(true);
        try {
            // Utilizamos la utilidad existente que comprime y devuelve un Base64
            const url = await uploadImageToStorage(file, `products/${Date.now()}`);
            setter(url);
        } catch (error) {
            console.error("Error al cargar imagen:", error);
            alert("Hubo un problema al procesar la imagen. Intenta con otra.");
        } finally {
            setIsUploadingImage(false);
        }
    };

    const handleProductSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const productData: Product = {
            id: editingId || '',
            name: prodName, description: prodDesc, price: parseFloat(prodPrice),
            costPrice: prodCostPrice ? parseFloat(prodCostPrice) : undefined,
            unitsPerBox: prodUnitsPerBox ? parseInt(prodUnitsPerBox) : undefined,
            boxPrice: prodBoxPrice ? parseFloat(prodBoxPrice) : undefined,
            publicBoxPrice: prodPublicBoxPrice ? parseFloat(prodPublicBoxPrice) : undefined,
            category: prodCat || categories[0]?.name || 'Medicamentos',
            stock: editingId ? (products.find(p => p.id === editingId)?.stock || 0) : (prodUnitsPerBox ? parseInt(prodUnitsPerBox) : 0),
            image: prodImage || "https://via.placeholder.com/300",
            barcode: prodBarcode, expiryDate: prodExpiry, supplierId: prodSupplier
        };
        try {
            if (editingId) await onEditProduct(productData);
            else await onAddProduct(productData);
            resetForm();
        } finally { setIsSubmitting(false); }
    };

    const resetForm = () => {
        setEditingId(null); setProdName(''); setProdPrice(''); setProdCostPrice(''); setProdUnitsPerBox('');
        setProdBoxPrice(''); setProdPublicBoxPrice(''); setProdDesc(''); setProdImage(''); 
        setProdBarcode(''); setProdExpiry(''); setProdSupplier('');
    };

    const handleGenerateDescription = async (tone: 'CLINICO' | 'PERSUASIVO' | 'CERCANO') => {
        if (!prodName) return alert("Escribe el nombre");
        setIsGenerating(true);
        try {
            const desc = await generateProductDescription(prodName, prodCat || 'Medicamentos', tone);
            setProdDesc(desc);
        } finally { setIsGenerating(false); }
    };

    const handleEditClick = (p: Product) => {
        setEditingId(p.id); setProdName(p.name); setProdPrice(p.price.toString()); 
        setProdCostPrice(p.costPrice?.toString() || ''); setProdUnitsPerBox(p.unitsPerBox?.toString() || ''); 
        setProdBoxPrice(p.boxPrice?.toString() || ''); setProdPublicBoxPrice(p.publicBoxPrice?.toString() || ''); 
        setProdDesc(p.description); setProdCat(p.category); setProdImage(p.image); 
        setProdBarcode(p.barcode || ''); setProdExpiry(p.expiryDate || ''); setProdSupplier(p.supplierId || '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return {
        editingId, setEditingId, prodName, setProdName, prodPrice, setProdPrice, 
        prodCostPrice, setProdCostPrice, prodUnitsPerBox, setProdUnitsPerBox, 
        prodBoxPrice, setProdBoxPrice, prodPublicBoxPrice, setProdPublicBoxPrice,
        prodDesc, setProdDesc, prodCat, setProdCat, prodImage, setProdImage, 
        prodBarcode, setProdBarcode, prodExpiry, setProdExpiry, prodSupplier, setProdSupplier,
        isGenerating, isSubmitting, isUploadingImage, setIsUploadingImage,
        handleProductSubmit, handleGenerateDescription, handleEditClick, resetForm, handleImageUpload
    };
};
