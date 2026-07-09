import { Product } from '../../../types';

export interface FirstAidGuideProps {
  products: Product[];
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  onClose?: () => void;
}

export interface CoherentMedicationGuide {
  name: string;
  purpose: string;
  dosageInstructions: string;
  caution: string;
  productKeyword: string;
}

export interface IncidentProtocol {
  id: string;
  title: string;
  icon: any;
  colorClass: string;
  bgLightClass: string;
  borderColorClass: string;
  shortDesc: string;
  steps: {
    title: string;
    description: string;
  }[];
  dontDo: string[];
  whenToCallDoc: string[];
  recommendedKeywords: string[];
  coherentMedications: CoherentMedicationGuide[];
}

export interface KnownActiveIngredient {
  name: string;
  id: string;
  category: string;
  searchKeys: string[];
  defaultConcentrationMg: number;
  defaultConcentrationMl: number;
  defaultDosageMgKg: number;
  doseUnit: 'mL' | 'gotas';
  frequencyHours: number;
  maxDailyDoses: number;
  warning: string;
  administrationTip: string;
}

export interface BotiquinChecklistItem {
  id: string;
  name: string;
  category: string;
  keyword: string;
}
