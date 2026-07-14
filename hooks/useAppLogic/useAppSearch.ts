import { useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { Product, Category } from '../../types';
import { logSearchDB } from '../../services/db';

export const useAppSearch = (
  products: Product[], 
  categories: Category[], 
  searchTerm: string,
  setSearchTerm: Dispatch<SetStateAction<string>>,
  activeCategory: string | null,
  setActiveCategory: Dispatch<SetStateAction<string | null>>
) => {
  const displayedProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory) {
      const catName = categories.find(c => c.id === activeCategory)?.name;
      filtered = products.filter(p => p.category === catName);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) || 
        p.description.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term) ||
        (p.activeIngredient && p.activeIngredient.toLowerCase().includes(term)) ||
        (p.keywords && p.keywords.toLowerCase().includes(term))
      );
    }
    return filtered;
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
