import { useState, useEffect } from 'react';
import { Product, CartItem } from '../../types';
import { searchProductsBySymptoms, checkInteractions } from '../../services/gemini';

export const useAppAI = (searchTerm: string, products: Product[], cart: CartItem[]) => {
  const [isSymptomMode, setIsSymptomMode] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);
  const [checkingInteractions, setCheckingInteractions] = useState(false);
  const [interactionWarning, setInteractionWarning] = useState<string | null>(null);

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

  useEffect(() => {
    if (cart.length >= 2) {
      const check = async () => {
        setCheckingInteractions(true);
        const names = cart.map(i => i.name);
        const result = await checkInteractions(names);
        setInteractionWarning(result.safe ? null : result.message);
        setCheckingInteractions(false);
      };
      check();
    } else {
      setInteractionWarning(null);
    }
  }, [cart]);

  return { isSymptomMode, setIsSymptomMode, isSearchingAI, aiResults, checkingInteractions, interactionWarning };
};
