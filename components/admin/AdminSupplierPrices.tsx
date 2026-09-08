import React, { useState, useMemo } from 'react';
import { Product, Supplier, Category } from '../../types';
import { updateProductDB } from '../../services/db.products';
import { Building2 } from 'lucide-react';
import AdminSupplierProductEditModal from './AdminSupplierProductEditModal';
import { handlePrintCostList } from './supplier-prices/supplierPrintHelper';
import { SupplierPriceFilters } from './supplier-prices/SupplierPriceFilters';
import { SupplierPriceStatsCards } from './supplier-prices/SupplierPriceStatsCards';
import { SupplierPriceRow, ProductPriceValues } from './supplier-prices/SupplierPriceRow';

interface AdminSupplierPricesProps {
  products: Product[];
  suppliers: Supplier[];
  categoriesList?: Category[];
}

export const AdminSupplierPrices: React.FC<AdminSupplierPricesProps> = ({ products, suppliers, categoriesList = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [onlyOutRange, setOnlyOutRange] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [editedPrices, setEditedPrices] = useState<Record<string, ProductPriceValues>>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [savedSuccessId, setSavedSuccessId] = useState<string | null>(null);

  const suppliersMap = useMemo(() => {
    const map: Record<string, string> = {};
    suppliers.forEach(s => { map[s.id] = s.name; });
    return map;
  }, [suppliers]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => { if (p.category) set.add(p.category); });
    return Array.from(set);
  }, [products]);

  const getProductValues = (p: Product): ProductPriceValues => {
    const edit = editedPrices[p.id];
    if (edit) return edit;
    return {
      costPrice: p.costPrice !== undefined ? p.costPrice.toString() : '',
      supplierBoxPrice: p.supplierBoxPrice !== undefined ? p.supplierBoxPrice.toString() : (p.boxPrice !== undefined ? p.boxPrice.toString() : ''),
      supplierPriceRangeMin: p.supplierPriceRangeMin !== undefined ? p.supplierPriceRangeMin.toString() : '',
      supplierPriceRangeMax: p.supplierPriceRangeMax !== undefined ? p.supplierPriceRangeMax.toString() : '',
      suggestedRetailPrice: p.suggestedRetailPrice !== undefined ? p.suggestedRetailPrice.toString() : '',
      price: p.price !== undefined ? p.price.toString() : '',
    };
  };

  const handleValueChange = (productId: string, field: string, value: string, originalProduct: Product) => {
    const current = getProductValues(originalProduct);
    setEditedPrices(prev => ({
      ...prev,
      [productId]: { ...current, [field]: value }
    }));
  };

  const handleSaveProductPrices = async (p: Product) => {
    const values = getProductValues(p);
    setSavingId(p.id);

    try {
      const parsedCostPrice = values.costPrice !== '' ? parseFloat(values.costPrice) : p.costPrice;
      const parsedSupplierBoxPrice = values.supplierBoxPrice !== '' ? parseFloat(values.supplierBoxPrice) : undefined;
      const parsedMinRange = values.supplierPriceRangeMin !== '' ? parseFloat(values.supplierPriceRangeMin) : undefined;
      const parsedMaxRange = values.supplierPriceRangeMax !== '' ? parseFloat(values.supplierPriceRangeMax) : undefined;
      const parsedSuggestedRetail = values.suggestedRetailPrice !== '' ? parseFloat(values.suggestedRetailPrice) : undefined;
      const parsedPrice = values.price !== '' ? parseFloat(values.price) : p.price;

      const updatedProduct: Product = {
        ...p,
        costPrice: parsedCostPrice,
        supplierBoxPrice: parsedSupplierBoxPrice,
        supplierPriceRangeMin: parsedMinRange,
        supplierPriceRangeMax: parsedMaxRange,
        suggestedRetailPrice: parsedSuggestedRetail,
        price: parsedPrice
      };

      await updateProductDB(updatedProduct);
      setSavedSuccessId(p.id);
      setTimeout(() => setSavedSuccessId(null), 3000);
    } catch {
      alert("Error al guardar los precios del producto. Por favor intenta de nuevo.");
    } finally {
      setSavingId(null);
    }
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(term);
        const matchesActive = p.activeIngredient?.toLowerCase().includes(term);
        const matchesBarcode = p.barcode?.toLowerCase().includes(term);
        const supplierName = p.supplierId ? suppliersMap[p.supplierId]?.toLowerCase() : '';
        const matchesSupplier = supplierName?.includes(term);
        if (!matchesName && !matchesActive && !matchesBarcode && !matchesSupplier) return false;
      }
      if (selectedSupplier !== 'all' && p.supplierId !== selectedSupplier) return false;
      if (selectedCategory !== 'all' && p.category !== selectedCategory) return false;
      if (onlyOutRange) {
        const min = p.supplierPriceRangeMin;
        const max = p.supplierPriceRangeMax;
        if (min !== undefined && max !== undefined) {
          if (p.price >= min && p.price <= max) return false;
        } else {
          return false;
        }
      }
      return true;
    });
  }, [products, searchTerm, selectedSupplier, selectedCategory, onlyOutRange, suppliersMap]);

  const stats = useMemo(() => {
    let totalWithCost = 0;
    let totalMarginSum = 0;
    let outOfRangeCount = 0;

    products.forEach(p => {
      if (p.costPrice && p.costPrice > 0) {
        totalWithCost++;
        totalMarginSum += ((p.price - p.costPrice) / p.price) * 100;
      }
      if (p.supplierPriceRangeMin !== undefined && p.supplierPriceRangeMax !== undefined) {
        if (p.price < p.supplierPriceRangeMin || p.price > p.supplierPriceRangeMax) {
          outOfRangeCount++;
        }
      }
    });

    return {
      totalProducts: products.length,
      totalWithCost,
      avgMargin: totalWithCost > 0 ? (totalMarginSum / totalWithCost).toFixed(1) : '0.0',
      outOfRangeCount,
    };
  }, [products]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      <SupplierPriceStatsCards stats={stats} onPrint={() => handlePrintCostList(filteredProducts)} />

      <SupplierPriceFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedSupplier={selectedSupplier}
        setSelectedSupplier={setSelectedSupplier}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onlyOutRange={onlyOutRange}
        setOnlyOutRange={setOnlyOutRange}
        suppliers={suppliers}
        categories={categories}
      />

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 md:p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider">
              Listado de Medicamentos para Registro de Costos ({filteredProducts.length})
            </h3>
            <p className="text-xs text-slate-400">Edita los valores en la tabla y presiona el botón "Guardar" de cada fila.</p>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Building2 size={48} className="mx-auto text-slate-300" />
            <h4 className="font-bold text-slate-700 text-sm">No se encontraron medicamentos</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto">Intenta cambiar los términos de búsqueda o desactiva los filtros activos.</p>
          </div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/70 border-b border-slate-200 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="p-4 pl-6 min-w-[200px]">Medicamento / Info</th>
                  <th className="p-4 min-w-[130px]">P. Compra Unit. ($)</th>
                  <th className="p-4 min-w-[120px]">Costo Caja ($)</th>
                  <th className="p-4 min-w-[140px]">Rango Mín. Sugerido ($)</th>
                  <th className="p-4 min-w-[140px]">Rango Máx. Sugerido ($)</th>
                  <th className="p-4 min-w-[170px]">PVP Recom. Unitario ($)</th>
                  <th className="p-4 min-w-[130px]">PVP Actual Unit. ($)</th>
                  <th className="p-4 text-center min-w-[120px]">Margen / Estado</th>
                  <th className="p-4 pr-6 text-right min-w-[150px]">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredProducts.map(p => (
                  <SupplierPriceRow
                    key={p.id}
                    product={p}
                    values={getProductValues(p)}
                    suppliersMap={suppliersMap}
                    isSaving={savingId === p.id}
                    isSavedSuccess={savedSuccessId === p.id}
                    onValueChange={handleValueChange}
                    onSave={handleSaveProductPrices}
                    onEditFull={(prod) => setEditingProduct(prod)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingProduct && (
        <AdminSupplierProductEditModal 
          product={editingProduct}
          categories={categoriesList}
          suppliers={suppliers}
          onClose={() => setEditingProduct(null)}
        />
      )}
    </div>
  );
};

export default AdminSupplierPrices;
