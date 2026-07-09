import { useState, useEffect } from 'react';
import { Product } from '../../types';

export interface SymptomCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  keywords: string[];
}

export const SYMPTOMS_LIST: SymptomCategory[] = [
  {
    id: 'dolor_fiebre',
    label: 'Fiebre y Dolor',
    icon: '🤒',
    description: 'Dolor de cabeza, fiebre, malestar general, cólicos',
    keywords: ['paracetamol', 'ibuprofeno', 'aspirina', 'dolor', 'fiebre', 'analgésico', 'doloflam', 'umbral', 'butilescopolamina', 'acetaminofén', 'migraña', 'cabeza', 'cólico', 'inflamación', 'naproxeno', 'ketorolaco', 'tempra', 'apranax', 'finalin']
  },
  {
    id: 'gripe_tos',
    label: 'Gripe y Tos',
    icon: '🤧',
    description: 'Resfriado, congestión nasal, tos seca o con flema',
    keywords: ['gripe', 'tos', 'resfriado', 'garganta', 'congestión', 'antigripal', 'mucolítico', 'ambroxol', 'abrilar', 'vick', 'mentol', 'clorfenamina', 'fluimucil', 'nastizol', 'sinutab', 'caramelo', 'alergia', 'descongestionante', 'jarabe', 'pulmonar', 'sensibit']
  },
  {
    id: 'digestion',
    label: 'Estómago y Acidez',
    icon: '🤢',
    description: 'Acidez, gases, reflujo, diarrea, cólico estomacal',
    keywords: ['estómago', 'digest', 'gastritis', 'antiácido', 'acidez', 'diarrea', 'gas', 'pepto', 'bismuto', 'omeprazol', 'ranitidina', 'sal de andrés', 'bicarbonato', 'plasil', 'probiótico', 'gastro', 'enterogermina', 'laxante', 'lactobacilos', 'scopolamina', 'buscapina', 'colipan']
  },
  {
    id: 'alergias',
    label: 'Alergias y Ronchas',
    icon: '🌾',
    description: 'Estornudos, ronchas, picaduras de insectos, picazón',
    keywords: ['alergia', 'picazón', 'antihistamínico', 'cetirizina', 'loratadina', 'ronchas', 'barmicil', 'prednisona', 'hidrocortisona', 'alérgico', 'prurito', 'ojos rojos', 'lagrimeo', 'allegra', 'decaprin']
  },
  {
    id: 'nervios_sueno',
    label: 'Estrés y Sueño',
    icon: '😴',
    description: 'Dificultad para dormir, nerviosismo, cansancio mental',
    keywords: ['valeriana', 'sueño', 'insomnio', 'estrés', 'nervios', 'relajante', 'ansiedad', 'pasiflora', 'melatonina', 'calmante', 'dormir', 'té', 'relajación', 'armonyl']
  },
  {
    id: 'primeros_auxilios',
    label: 'Primeros Auxilios',
    icon: '🩹',
    description: 'Heridas, raspones, desinfección, curación',
    keywords: ['alcohol', 'algodón', 'curitas', 'venda', 'gasa', 'herida', 'desinfectante', 'antiséptico', 'agua oxigenada', 'yodo', 'cicatrizante', 'barmicil', 'vendas', 'quemadura', 'esparadrapo']
  }
];

export const useAppAI = (searchTerm: string, products: Product[]) => {
  const [isSymptomMode, setIsSymptomMode] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiResults, setAiResults] = useState<string[]>([]);

  useEffect(() => {
    if (isSymptomMode && searchTerm) {
      const termLower = searchTerm.toLowerCase();
      // Find if the search term matches any symptom category ID or label
      const selectedSymptom = SYMPTOMS_LIST.find(
        s => s.label.toLowerCase() === termLower || s.id === searchTerm || s.label.toLowerCase().includes(termLower)
      );

      setIsSearchingAI(true);

      if (selectedSymptom) {
        // Exact category matching: match any product whose fields match the predefined keywords
        const matchedIds = products
          .filter(product => {
            const nameLower = product.name.toLowerCase();
            const descLower = product.description.toLowerCase();
            const ingredientLower = (product.activeIngredient || '').toLowerCase();
            const keywordsLower = (product.keywords || '').toLowerCase();
            const categoryLower = product.category.toLowerCase();

            return selectedSymptom.keywords.some(keyword => {
              const kw = keyword.toLowerCase();
              return (
                nameLower.includes(kw) ||
                descLower.includes(kw) ||
                ingredientLower.includes(kw) ||
                keywordsLower.includes(kw) ||
                categoryLower.includes(kw)
              );
            });
          })
          .map(p => p.id);

        setAiResults(matchedIds);
      } else {
        // Free-text symptom matching: match individual typed words (minimum 3 characters)
        const searchWords = searchTerm.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (searchWords.length > 0) {
          const matchedIds = products
            .filter(product => {
              const nameLower = product.name.toLowerCase();
              const descLower = product.description.toLowerCase();
              const ingredientLower = (product.activeIngredient || '').toLowerCase();
              const keywordsLower = (product.keywords || '').toLowerCase();

              return searchWords.some(word => 
                nameLower.includes(word) ||
                descLower.includes(word) ||
                ingredientLower.includes(word) ||
                keywordsLower.includes(word)
              );
            })
            .map(p => p.id);
          setAiResults(matchedIds);
        } else {
          setAiResults([]);
        }
      }
      setIsSearchingAI(false);
    } else {
      setAiResults([]);
    }
  }, [searchTerm, isSymptomMode, products]);

  return { isSymptomMode, setIsSymptomMode, isSearchingAI, aiResults };
};

