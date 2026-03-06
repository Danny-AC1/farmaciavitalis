import { useState, useEffect } from 'react';
import { Product } from '../../types';
import { searchProductsBySymptoms } from '../../services/gemini';

export const useAppAI = (searchTerm: string, products: Product[]) => {
  const [isSymptomMode, setIsSymptomMode] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);

  useEffect(() => {
    if (isSymptomMode && searchTerm.length > 3) {
      const timer = setTimeout(async () => {
        setIsSearchingAI(true);
        const ids = await searchProductsBySymptoms(searchTerm, products);
        setAiResults(ids);
        setIsSearchingAI(false);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setAiResults([]);
    }
  }, [searchTerm, isSymptomMode, products]);

  return { isSymptomMode, setIsSymptomMode, isSearchingAI, aiResults };
};
