import { useState, useMemo } from 'react';
import { Product } from '../../../types';
import { StockAlertConfig, evaluateProductStockAlert } from '../../../services/stockAlertService';

export function useStockQuickFilter(products: Product[], alertConfig: StockAlertConfig) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todas');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'critical' | 'outOfStock' | 'healthy'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stockAsc' | 'stockDesc' | 'category'>('name');

  const categoriesList = useMemo(() => {
    const list = Array.from(new Set(products.map(p => p.category)));
    return ['Todas', ...list];
  }, [products]);

  const filteredAndSorted = useMemo(() => {
    return products
      .filter(p => {
        const cleanSearch = search.trim().toLowerCase();
        const matchesSearch = !cleanSearch || 
          p.name.toLowerCase().includes(cleanSearch) || 
          (p.barcode && p.barcode.toLowerCase().includes(cleanSearch)) || 
          p.id.toLowerCase().includes(cleanSearch);
        
        const matchesCategory = selectedCategory === 'Todas' || p.category === selectedCategory;
        
        let matchesStatus = true;
        if (stockStatusFilter === 'critical') matchesStatus = evaluateProductStockAlert(p, alertConfig).isAlert;
        else if (stockStatusFilter === 'outOfStock') matchesStatus = p.stock === 0;
        else if (stockStatusFilter === 'healthy') matchesStatus = !evaluateProductStockAlert(p, alertConfig).isAlert && p.stock > 0;
        
        return matchesSearch && matchesCategory && matchesStatus;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'stockAsc') return a.stock - b.stock;
        if (sortBy === 'stockDesc') return b.stock - a.stock;
        if (sortBy === 'category') return a.category.localeCompare(b.category);
        return 0;
      });
  }, [products, search, selectedCategory, stockStatusFilter, sortBy, alertConfig]);

  return {
    search, setSearch,
    selectedCategory, setSelectedCategory,
    stockStatusFilter, setStockStatusFilter,
    sortBy, setSortBy,
    categoriesList, filteredAndSorted
  };
}
