import { useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { Product, Category } from '../../types';
import { logSearchDB } from '../../services/db';
import { searchProductsIntelligent } from '../../utils/smartSearch';

export const useAppSearch = (
  products: Product[], 
  categories: Category[], 
  searchTerm: string,
  setSearchTerm: Dispatch<SetStateAction<string>>,
  activeCategory: string | null,
  setActiveCategory: Dispatch<SetStateAction<string | null>>
) => {
  const displayedProducts = useMemo(() => {
    let pool = products;
    if (activeCategory) {
      const catName = categories.find(c => c.id === activeCategory)?.name;
      pool = products.filter(p => p.category === catName);
    }
    if (searchTerm && searchTerm.trim()) {
      return searchProductsIntelligent(pool, searchTerm);
    }
    return pool;
  }, [products, searchTerm, activeCategory, categories]);

  useEffect(() => {
    if (searchTerm.length > 3 && displayedProducts.length === 0) {
      const timer = setTimeout(() => {
        logSearchDB(searchTerm);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, displayedProducts.length]);

  return { searchTerm, setSearchTerm, activeCategory, setActiveCategory, displayedProducts };
};
