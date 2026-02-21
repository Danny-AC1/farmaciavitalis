import { useEffect, useMemo, Dispatch, SetStateAction } from 'react';
import { Product, Category } from '../../types';
import { logSearchDB } from '../../services/db';

export const useAppSearch = (
  products: Product[], 
  categories: Category[], 
  searchTerm: string,
  setSearchTerm: Dispatch<SetStateAction<string>>,
  activeCategory: string | null,
  setActiveCategory: Dispatch<SetStateAction<string | null>>,
  isSymptomMode: boolean, 
  aiResults: string[], 
  isSearchingAI: boolean
) => {
  const displayedProducts = useMemo(() => {
    let filtered = products;
    if (activeCategory) {
      const catName = categories.find(c => c.id === activeCategory)?.name;
      filtered = products.filter(p => p.category === catName);
    }
    if (searchTerm) {
      if (isSymptomMode) {
        filtered = filtered.filter(p => aiResults.includes(p.id));
      } else {
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.description.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
    }
    return filtered;
  }, [products, searchTerm, activeCategory, categories, isSymptomMode, aiResults]);

  useEffect(() => {
    if (searchTerm.length > 3 && displayedProducts.length === 0 && !isSearchingAI) {
      const timer = setTimeout(() => {
        logSearchDB(searchTerm);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, displayedProducts.length, isSearchingAI]);

  return { searchTerm, setSearchTerm, activeCategory, setActiveCategory, displayedProducts };
};
