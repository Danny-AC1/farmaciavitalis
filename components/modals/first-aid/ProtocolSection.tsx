import React, { useState, useMemo } from 'react';
import { Product } from '../../../types';
import { FIRST_AID_PROTOCOLS, BOTIQUIN_CHECKLIST_ITEMS, KNOWN_INGREDIENTS } from './constants';

// Subcomponents
import { SymptomAnalyzer } from './components/SymptomAnalyzer';
import { ProtocolSelector } from './components/ProtocolSelector';
import { ProtocolSteps } from './components/ProtocolSteps';
import { ProtocolBotiquin } from './components/ProtocolBotiquin';

interface ProtocolSectionProps {
  products: Product[];
  addedItemsMap: Record<string, boolean>;
  handleAddProduct: (product: Product) => void;
}

// Synonyms mapping to direct search inputs to the correct protocol
const PROTOCOL_SYNONYMS: Record<string, string[]> = {
  quemaduras: ['quemadura', 'quemé', 'queme', 'fuego', 'sol', 'horno', 'caliente', 'aceite', 'vapor', 'agua caliente', 'plancha', 'ampolla', 'burbuja'],
  cortes: ['corte', 'corté', 'corte', 'sangre', 'sangrando', 'raspón', 'raspon', 'raspadura', 'cuchillo', 'vidrio', 'herida', 'abierta', 'caída', 'rodilla', 'raspar', 'clavo', 'tijera', 'venda'],
  picaduras: ['picadura', 'picó', 'pico', 'abeja', 'avispa', 'mosquito', 'araña', 'arana', 'alergia', 'roncha', 'comezón', 'comezon', 'rascar', 'urticaria', 'hinchado', 'bicho', 'aguijón'],
  fiebre: ['fiebre', 'temperatura', 'calentura', 'termómetro', 'termometro', 'caliente', 'frente', 'frío', 'frio', 'escalofríos', 'escalofrios', 'gripa', 'gripe', 'sudando', 'cuerpo cortado'],
  intoxicaciones: ['intoxicado', 'intoxicación', 'intoxicacion', 'veneno', 'comida mala', 'vómito', 'vomito', 'náusea', 'nausea', 'diarrea', 'químico', 'quimico', 'ingestión', 'ingestion', 'estómago', 'estomago', 'pastillas', 'empacho']
};

export const ProtocolSection: React.FC<ProtocolSectionProps> = ({
  products,
  addedItemsMap,
  handleAddProduct
}) => {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('quemaduras');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [userDiscomfortQuery, setUserDiscomfortQuery] = useState<string>('');
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Record<string, boolean>>({
    item_2: true, // Mark gauze ready initially for a realistic home starting state
  });

  // Current selected protocol
  const currentProtocol = useMemo(() => {
    return FIRST_AID_PROTOCOLS.find(p => p.id === selectedIncidentId) || FIRST_AID_PROTOCOLS[0];
  }, [selectedIncidentId]);

  // Dynamically match and filter products based on protocol keywords
  const recommendedProducts = useMemo(() => {
    const keywords = currentProtocol.recommendedKeywords;
    return products.filter(p => {
      const nameLower = p.name.toLowerCase();
      const descLower = p.description.toLowerCase();
      const catLower = p.category.toLowerCase();
      
      return keywords.some(kw => 
        nameLower.includes(kw) || 
        descLower.includes(kw) ||
        catLower.includes(kw)
      );
    }).slice(0, 4); // limit to top 4 matches
  }, [currentProtocol, products]);

  // Map checklist items to actual inventory items if available
  const checklistInventoryMatches = useMemo(() => {
    return BOTIQUIN_CHECKLIST_ITEMS.map(item => {
      const match = products.find(p => 
        p.name.toLowerCase().includes(item.keyword) || 
        p.description.toLowerCase().includes(item.keyword)
      );
      return {
        ...item,
        matchedProduct: match
      };
    });
  }, [products]);

  // User discomfort/symptom matching logic
  const searchResults = useMemo(() => {
    const query = userDiscomfortQuery.toLowerCase().trim();
    if (!query) return null;

    // 1. Calculate matching scores for each protocol based on synonyms and terms
    const protocolMatches = FIRST_AID_PROTOCOLS.map(protocol => {
      let score = 0;
      const synonyms = PROTOCOL_SYNONYMS[protocol.id] || [];
      const keywords = protocol.recommendedKeywords;
      const titleWords = protocol.title.toLowerCase().split(' ');

      synonyms.forEach(syn => {
        if (query.includes(syn)) score += 3;
      });
      keywords.forEach(kw => {
        if (query.includes(kw)) score += 2;
      });
      titleWords.forEach(w => {
        if (w.length > 3 && query.includes(w)) score += 2;
      });

      return { protocol, score };
    }).filter(m => m.score > 0)
      .sort((a, b) => b.score - a.score);

    // 2. Calculate matching active ingredients
    const ingredientMatches = KNOWN_INGREDIENTS.filter(ing => {
      const nameMatch = ing.name.toLowerCase().includes(query);
      const keyMatch = ing.searchKeys.some(key => query.includes(key));
      const directDiscomfortMatch = 
        (query.includes('dolor') && (ing.id === 'paracetamol' || ing.id === 'ibuprofeno')) ||
        (query.includes('cabeza') && (ing.id === 'paracetamol' || ing.id === 'ibuprofeno')) ||
        (query.includes('fiebre') && (ing.id === 'paracetamol' || ing.id === 'ibuprofeno')) ||
        (query.includes('temperatura') && (ing.id === 'paracetamol' || ing.id === 'ibuprofeno')) ||
        (query.includes('tos') && ing.id === 'salbutamol') ||
        (query.includes('pecho') && ing.id === 'salbutamol') ||
        (query.includes('asma') && ing.id === 'salbutamol') ||
        (query.includes('alergia') && (ing.id === 'loratadina' || ing.id === 'cetirizina')) ||
        (query.includes('picazon') && (ing.id === 'loratadina' || ing.id === 'cetirizina')) ||
        (query.includes('picazón') && (ing.id === 'loratadina' || ing.id === 'cetirizina')) ||
        (query.includes('roncha') && (ing.id === 'loratadina' || ing.id === 'cetirizina')) ||
        (query.includes('vómito') && (ing.id === 'metoclopramida' || ing.id === 'paracetamol')) ||
        (query.includes('vomito') && (ing.id === 'metoclopramida' || ing.id === 'paracetamol')) ||
        (query.includes('nausea') && (ing.id === 'metoclopramida')) ||
        (query.includes('infección') && ing.id === 'amoxicilina') ||
        (query.includes('garganta') && ing.id === 'amoxicilina');

      return nameMatch || keyMatch || directDiscomfortMatch;
    });

    return {
      bestProtocolMatch: protocolMatches[0]?.score >= 2 ? protocolMatches[0].protocol : null,
      allProtocolMatches: protocolMatches,
      matchedIngredients: ingredientMatches
    };
  }, [userDiscomfortQuery]);

  // Toggle checklist item
  const toggleChecklistItem = (itemId: string) => {
    setCheckedChecklistItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="space-y-6">
      {/* --- SYMPTOM / DISCOMFORT FREE TEXT WRITER PANEL --- */}
      <SymptomAnalyzer 
        userDiscomfortQuery={userDiscomfortQuery}
        setUserDiscomfortQuery={setUserDiscomfortQuery}
        searchResults={searchResults}
        setSelectedIncidentId={setSelectedIncidentId}
        setActiveStepIndex={setActiveStepIndex}
        products={products}
        addedItemsMap={addedItemsMap}
        handleAddProduct={handleAddProduct}
      />

      {/* --- PROTOCOL SELECTOR GRID --- */}
      <ProtocolSelector 
        selectedIncidentId={selectedIncidentId}
        setSelectedIncidentId={setSelectedIncidentId}
        setActiveStepIndex={setActiveStepIndex}
      />

      {/* --- PROTOCOL DETAILS & RECOMMENDED KITS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="first-aid-details-grid">
        {/* MAIN COLUMN: PROTOCOL STEPS */}
        <div className="lg:col-span-8 space-y-6">
          <ProtocolSteps 
            currentProtocol={currentProtocol}
            activeStepIndex={activeStepIndex}
            setActiveStepIndex={setActiveStepIndex}
            products={products}
            addedItemsMap={addedItemsMap}
            handleAddProduct={handleAddProduct}
          />
        </div>

        {/* SIDE COLUMN: RECOMMENDED PHARMACY PRODUCTS FOR THIS INCIDENT */}
        <ProtocolBotiquin 
          currentProtocol={currentProtocol}
          recommendedProducts={recommendedProducts}
          addedItemsMap={addedItemsMap}
          handleAddProduct={handleAddProduct}
          checklistInventoryMatches={checklistInventoryMatches}
          checkedChecklistItems={checkedChecklistItems}
          toggleChecklistItem={toggleChecklistItem}
        />
      </div>
    </div>
  );
};
export default ProtocolSection;
