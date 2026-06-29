import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Droplet, 
  Bug, 
  Thermometer, 
  AlertTriangle, 
  Heart, 
  Check, 
  ShoppingCart, 
  Info, 
  PhoneCall, 
  Plus, 
  CheckSquare, 
  Square,
  ShieldAlert,
  Archive,
  Calculator,
  Baby,
  Calendar
} from 'lucide-react';
import { Product } from '../types';

interface FirstAidGuideProps {
  products: Product[];
  onAddToCart: (product: Product, unitType: 'UNIT' | 'BOX') => void;
  onClose?: () => void;
}

interface IncidentProtocol {
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
  recommendedKeywords: string[]; // Keywords to search in products
}

const FIRST_AID_PROTOCOLS: IncidentProtocol[] = [
  {
    id: 'quemaduras',
    title: 'Quemaduras Leves',
    icon: Flame,
    colorClass: 'text-orange-600 bg-orange-100',
    bgLightClass: 'bg-orange-50/50',
    borderColorClass: 'border-orange-100',
    shortDesc: 'Quemaduras térmicas de primer y segundo grado (ej. accidentes de cocina, agua caliente, sol).',
    steps: [
      {
        title: 'Enfriar de inmediato',
        description: 'Coloque la zona quemada bajo agua corriente fresca (no helada) por 10 a 20 minutos. No use hielo, ya que puede dañar aún más el tejido celular.'
      },
      {
        title: 'Proteger la zona',
        description: 'Cubra suavemente la quemadura con una gasa estéril antiadherente o un paño limpio. No presione la piel y evite vendarla con fuerza.'
      },
      {
        title: 'Calmar el dolor e hidratar',
        description: 'Administre un analgésico de venta libre (como paracetamol o ibuprofeno) y aplique gel de aloe vera puro o crema hidratante recomendada una vez fría la piel.'
      }
    ],
    dontDo: [
      'No rompa las ampollas, esto previene infecciones de la piel.',
      'No aplique pasta dental, mantequilla, aceite, clara de huevo ni remedios caseros grasos.',
      'No remueva ropa que se haya quedado adherida directamente a la herida.'
    ],
    whenToCallDoc: [
      'Si la quemadura cubre un área mayor a la palma de la mano.',
      'Si se encuentra en cara, manos, articulaciones principales o genitales.',
      'Si nota signos de infección (pus, mal olor, aumento excesivo de temperatura local).'
    ],
    recommendedKeywords: ['crema', 'gel', 'gasa', 'paracetamol', 'antiséptico', 'curita']
  },
  {
    id: 'cortes',
    title: 'Cortes y Raspaduras',
    icon: Droplet,
    colorClass: 'text-rose-600 bg-rose-100',
    bgLightClass: 'bg-rose-50/50',
    borderColorClass: 'border-rose-100',
    shortDesc: 'Heridas abiertas superficiales por objetos punzocortantes, caídas u raspaduras cotidianas.',
    steps: [
      {
        title: 'Controlar el sangrado',
        description: 'Aplique presión firme y continua sobre el corte con una gasa estéril o un paño limpio durante unos minutos. Eleve la extremidad herida si es posible.'
      },
      {
        title: 'Limpiar y desinfectar',
        description: 'Lave la herida suavemente con abundante agua fresca y jabón neutro. Utilice un antiséptico suave como alcohol al 70% o solución salina para desinfectar el borde.'
      },
      {
        title: 'Sellar y vendar',
        description: 'Aplique una tira adhesiva protectora (curita) o coloque una gasa limpia asegurada con esparadrapo para evitar la entrada de suciedad y bacterias.'
      }
    ],
    dontDo: [
      'No frote con fuerza la herida para evitar reabrir el sangrado.',
      'No aplique alcohol directo al interior de cortes profundos (puede quemar tejidos sanos).',
      'No intente extraer objetos incrustados profundamente usted mismo.'
    ],
    whenToCallDoc: [
      'Si el sangrado no se detiene tras 10 minutos de presión firme.',
      'Si el corte es muy profundo, tiene bordes separados o requiere puntos de sutura.',
      'Si la herida fue causada por un metal oxidado o mordedura de un animal.'
    ],
    recommendedKeywords: ['alcohol', 'antiséptico', 'gasa', 'venda', 'esparadrapo', 'curita', 'algodón']
  },
  {
    id: 'picaduras',
    title: 'Picaduras de Insectos',
    icon: Bug,
    colorClass: 'text-amber-600 bg-amber-100',
    bgLightClass: 'bg-amber-50/50',
    borderColorClass: 'border-amber-100',
    shortDesc: 'Reacciones locales por abejas, avispas, mosquitos, hormigas o pulgas domésticas.',
    steps: [
      {
        title: 'Retirar el aguijón',
        description: 'Si fue una abeja, raspe suavemente el aguijón con el borde de una tarjeta de plástico o una uña. No use pinzas porque podrían exprimir más veneno.'
      },
      {
        title: 'Lavar y aplicar frío',
        description: 'Lave el área con agua y jabón. Aplique una compresa fría o hielo envuelto en un paño durante 10 minutos para disminuir el dolor y la inflamación local.'
      },
      {
        title: 'Aliviar la picazón',
        description: 'Aplique una crema calmante (como calamina) o administre un antihistamínico oral de venta libre en caso de picazón o urticaria molesta.'
      }
    ],
    dontDo: [
      'No se rasque con fuerza, ya que puede romper la piel y provocar una infección bacteriana secundaria.',
      'No aplique barro, saliva, ni productos químicos abrasivos sobre la picadura.'
    ],
    whenToCallDoc: [
      'Si presenta dificultad para respirar, opresión en el pecho o hinchazón en labios/lengua (emergencia anafiláctica).',
      'Si desarrolla urticaria generalizada en todo el cuerpo.',
      'Si la picadura se vuelve extremadamente roja, caliente al tacto o presenta líneas rojas difusas.'
    ],
    recommendedKeywords: ['crema', 'antialérgico', 'antihistamínico', 'calamina', 'alcohol']
  },
  {
    id: 'fiebre',
    title: 'Fiebre Alta',
    icon: Thermometer,
    colorClass: 'text-teal-600 bg-teal-100',
    bgLightClass: 'bg-teal-50/50',
    borderColorClass: 'border-teal-100',
    shortDesc: 'Elevación de la temperatura corporal por encima de los niveles normales (≥ 38.0°C).',
    steps: [
      {
        title: 'Monitorear la temperatura',
        description: 'Mida la temperatura con un termómetro clínico digital de manera precisa. Anote los horarios y lecturas para informar al médico si es necesario.'
      },
      {
        title: 'Medidas físicas',
        description: 'Mantenga la habitación fresca y ventilada. Vista con ropa ligera y aplique paños humedecidos con agua templada (no fría) en la frente y axilas.'
      },
      {
        title: 'Tratamiento y rehidratación',
        description: 'Tome abundantes líquidos (agua, sueros orales) para evitar la deshidratación. Administre antipiréticos como Paracetamol según peso/edad.'
      }
    ],
    dontDo: [
      'No bañe a la persona con agua helada o alcohol (puede provocar temblores y subir la temperatura interna).',
      'No abrigue en exceso al paciente, ya que esto atrapa el calor corporal.',
      'No administre aspirina a niños o adolescentes debido al riesgo de síndrome de Reye.'
    ],
    whenToCallDoc: [
      'Si la fiebre es superior a 39°C o no disminuye tras administrar antipiréticos recomendados.',
      'En bebés menores de 3 meses con temperatura de 38°C o más.',
      'Si se asocia con rigidez de nuca, confusión mental, dificultad para respirar o convulsiones.'
    ],
    recommendedKeywords: ['paracetamol', 'termómetro', 'ibuprofeno', 'suero', 'hidratación']
  },
  {
    id: 'intoxicaciones',
    title: 'Intoxicaciones',
    icon: AlertTriangle,
    colorClass: 'text-purple-600 bg-purple-100',
    bgLightClass: 'bg-purple-50/50',
    borderColorClass: 'border-purple-100',
    shortDesc: 'Ingestión, inhalación o contacto accidental con sustancias nocivas o alimentos en mal estado.',
    steps: [
      {
        title: 'Identificar la sustancia',
        description: 'Identifique el envase o el alimento ingerido de inmediato. Trate de estimar la cantidad consumida y la hora exacta del incidente.'
      },
      {
        title: 'Ventilar o lavar',
        description: 'Si es por gases, mueva a la persona al aire libre. Si fue por contacto con la piel u ojos, enjuague con abundante agua tibia durante 15 a 20 minutos.'
      },
      {
        title: 'Estabilizar e hidratar',
        description: 'Si la persona está consciente y la sustancia no es corrosiva, manténgala cómoda. Tenga a mano un suero de rehidratación oral para evitar el colapso.'
      }
    ],
    dontDo: [
      '¡NO provoque el vómito! Si la sustancia es ácida o corrosiva, puede quemar el esófago al subir.',
      'No administre leche, agua con sal ni remedios caseros para "neutralizar" sin indicación médica.',
      'No intente dar líquidos si el paciente está adormecido, confundido o inconsciente.'
    ],
    whenToCallDoc: [
      'Ante CUALQUIER sospecha de intoxicación química o de medicamentos, llame inmediatamente a emergencias (911).',
      'Si el paciente presenta mareos intensos, convulsiones, vómito continuo o pérdida del conocimiento.'
    ],
    recommendedKeywords: ['suero', 'hidratación', 'carbón', 'protector gástrico', 'agua']
  }
];

// Essential Botiquín Checklist Items
const BOTIQUIN_CHECKLIST_ITEMS = [
  { id: 'item_1', name: 'Alcohol Antiséptico (70%)', category: 'Desinfectantes', keyword: 'alcohol' },
  { id: 'item_2', name: 'Gasas Estériles', category: 'Material de Cura', keyword: 'gasa' },
  { id: 'item_3', name: 'Termómetro Clínico', category: 'Medición', keyword: 'termómetro' },
  { id: 'item_4', name: 'Paracetamol / Analgésico', category: 'Medicamentos', keyword: 'paracetamol' },
  { id: 'item_5', name: 'Esparadrapo o Cinta Médica', category: 'Material de Cura', keyword: 'esparadrapo' },
  { id: 'item_6', name: 'Vendas Elásticas', category: 'Material de Cura', keyword: 'venda' },
  { id: 'item_7', name: 'Suero de Rehidratación Oral', category: 'Hidratación', keyword: 'suero' }
];

interface MedicationPresentation {
  id: string;
  label: string;
  concentrationText: string;
  doseUnit: 'mL' | 'gotas';
  calculate: (weightKg: number) => {
    dose: number;
    explanation: string;
    maxDaily: string;
  };
}

interface MedicationConfig {
  id: string;
  name: string;
  category: string;
  presentations: MedicationPresentation[];
  warning: string;
  administrationTip: string;
  searchKeyword: string;
}

const MEDICATION_CONFIGS: MedicationConfig[] = [
  {
    id: 'paracetamol',
    name: 'Paracetamol (Acetaminofén)',
    category: 'Analgésico / Antipirético',
    presentations: [
      {
        id: 'susp_120_5',
        label: 'Suspensión Infantil (120 mg / 5 mL)',
        concentrationText: 'Cada 5 mL contienen 120 mg',
        doseUnit: 'mL',
        calculate: (weightKg) => {
          const rawDose = weightKg * 0.625;
          const roundedDose = Math.round(rawDose * 10) / 10;
          const mgDose = Math.round(weightKg * 15);
          return {
            dose: roundedDose,
            explanation: `Dosis calculada a razón de 15 mg/kg por toma (${mgDose} mg).`,
            maxDaily: `${Math.round(roundedDose * 5 * 10) / 10} mL al día (máximo 5 tomas en 24h).`
          };
        }
      },
      {
        id: 'susp_160_5',
        label: 'Suspensión Infantil Concentrada (160 mg / 5 mL)',
        concentrationText: 'Cada 5 mL contienen 160 mg',
        doseUnit: 'mL',
        calculate: (weightKg) => {
          const rawDose = weightKg * 0.46875;
          const roundedDose = Math.round(rawDose * 10) / 10;
          const mgDose = Math.round(weightKg * 15);
          return {
            dose: roundedDose,
            explanation: `Dosis calculada a razón de 15 mg/kg por toma (${mgDose} mg).`,
            maxDaily: `${Math.round(roundedDose * 5 * 10) / 10} mL al día (máximo 5 tomas en 24h).`
          };
        }
      },
      {
        id: 'gotas_100_1',
        label: 'Gotas Pediátricas (100 mg / mL)',
        concentrationText: 'Cada mL contiene 100 mg (aprox. 25 a 30 gotas)',
        doseUnit: 'gotas',
        calculate: (weightKg) => {
          const drops = Math.round(weightKg * 3);
          const mgDose = Math.round(weightKg * 15);
          return {
            dose: drops,
            explanation: `Dosis aproximada de 3 gotas por kg de peso (aporta aprox. ${mgDose} mg).`,
            maxDaily: `${Math.round(drops * 5)} gotas al día (máximo 5 tomas en 24h).`
          };
        }
      }
    ],
    warning: 'No administrar más de 5 veces al día. Dejar pasar al menos 4 a 6 horas entre cada dosis. El uso excesivo de paracetamol puede causar daños graves al hígado.',
    administrationTip: 'La presentación en gotas es exclusiva para bebés pequeños; para niños mayores de 2 años se prefiere la suspensión en jarabe con jeringa dosificadora.',
    searchKeyword: 'paracetamol'
  },
  {
    id: 'ibuprofeno',
    name: 'Ibuprofeno Infantil',
    category: 'Antiinflamatorio / Analgésico',
    presentations: [
      {
        id: 'susp_100_5',
        label: 'Suspensión Infantil (100 mg / 5 mL)',
        concentrationText: 'Cada 5 mL contienen 100 mg',
        doseUnit: 'mL',
        calculate: (weightKg) => {
          const rawDose = weightKg * 0.5;
          const roundedDose = Math.round(rawDose * 10) / 10;
          const mgDose = Math.round(weightKg * 10);
          return {
            dose: roundedDose,
            explanation: `Dosis calculada a razón de 10 mg/kg por toma (${mgDose} mg).`,
            maxDaily: `${Math.round(roundedDose * 4 * 10) / 10} mL al día (máximo 4 tomas en 24h).`
          };
        }
      },
      {
        id: 'susp_200_5',
        label: 'Suspensión Forte (200 mg / 5 mL)',
        concentrationText: 'Cada 5 mL contienen 200 mg',
        doseUnit: 'mL',
        calculate: (weightKg) => {
          const rawDose = weightKg * 0.25;
          const roundedDose = Math.round(rawDose * 10) / 10;
          const mgDose = Math.round(weightKg * 10);
          return {
            dose: roundedDose,
            explanation: `Dosis calculada a razón de 10 mg/kg por toma (${mgDose} mg).`,
            maxDaily: `${Math.round(roundedDose * 4 * 10) / 10} mL al día (máximo 4 tomas en 24h).`
          };
        }
      }
    ],
    warning: 'No usar en menores de 6 meses de edad sin indicación médica expresa. Administrar siempre acompañado de alimentos para proteger el estómago del niño.',
    administrationTip: 'El intervalo recomendado es de cada 6 a 8 horas. No exceder de 4 dosis en 24 horas.',
    searchKeyword: 'ibuprofeno'
  },
  {
    id: 'loratadina',
    name: 'Loratadina Jarabe',
    category: 'Antihistamínico (Alergias)',
    presentations: [
      {
        id: 'jarabe_5_5',
        label: 'Jarabe Pediátrico (5 mg / 5 mL)',
        concentrationText: 'Cada 5 mL contienen 5 mg',
        doseUnit: 'mL',
        calculate: (weightKg) => {
          let doseMl = 5;
          let explanation = 'Dosis estándar para niños menores de 30 kg: 5 mL (5 mg) una vez al día.';
          if (weightKg >= 30) {
            doseMl = 10;
            explanation = 'Dosis estándar para niños de 30 kg o más: 10 mL (10 mg) una vez al día.';
          }
          if (weightKg < 10) {
            explanation = 'ATENCIÓN: Menores de 10 kg suelen tener menos de 2 años. Consulte al pediatra antes de usar.';
          }
          return {
            dose: doseMl,
            explanation,
            maxDaily: `${doseMl} mL al día (Máximo 1 toma cada 24 horas).`
          };
        }
      }
    ],
    warning: 'Uso recomendado a partir de los 2 años. Solo se administra una vez al día. No provoca somnolencia severa en la mayoría de los casos.',
    administrationTip: 'Ideal para el alivio de rinitis alérgica, estornudos y picazón por picaduras de insectos.',
    searchKeyword: 'loratadina'
  },
  {
    id: 'cetirizina',
    name: 'Cetirizina Gotas/Jarabe',
    category: 'Antihistamínico (Alergias)',
    presentations: [
      {
        id: 'jarabe_5_5_cet',
        label: 'Jarabe Pediátrico (5 mg / 5 mL)',
        concentrationText: 'Cada 5 mL contienen 5 mg',
        doseUnit: 'mL',
        calculate: (weightKg) => {
          let dose = 2.5;
          let explanation = 'Niños de 2 a 5 años (10-20 kg): 2.5 mL una o dos veces al día.';
          if (weightKg > 20) {
            dose = 5;
            explanation = 'Niños mayores de 6 años (>20 kg): 5 mL una vez al día o dividido en dos.';
          }
          if (weightKg < 10) {
            dose = 1.25;
            explanation = 'Niños menores de 2 años (<10 kg): Consultar siempre al pediatra.';
          }
          return {
            dose,
            explanation,
            maxDaily: `${dose * 2} mL al día (Máximo 2 tomas en 24h).`
          };
        }
      },
      {
        id: 'gotas_10_1_cet',
        label: 'Gotas Concentradas (10 mg / mL)',
        concentrationText: 'Cada mL contiene 10 mg (aprox. 20 gotas)',
        doseUnit: 'gotas',
        calculate: (weightKg) => {
          let drops = 5;
          let explanation = 'Niños de 2 a 5 años (10-20 kg): 5 gotas una o dos veces al día.';
          if (weightKg > 20) {
            drops = 10;
            explanation = 'Niños mayores de 6 años (>20 kg): 10 gotas una vez al día.';
          }
          if (weightKg < 10) {
            drops = 3;
            explanation = 'Niños menores de 2 años (<10 kg): Consultar siempre al médico de cabecera.';
          }
          return {
            dose: drops,
            explanation,
            maxDaily: `${drops * 2} gotas al día (Máximo 2 tomas en 24h).`
          };
        }
      }
    ],
    warning: 'Uso en menores de 2 años requiere estricta supervisión del pediatra. Puede causar somnolencia leve en algunos niños.',
    administrationTip: 'Alivia rápidamente síntomas de alergias respiratorias, urticaria y prurito en general.',
    searchKeyword: 'antialérgico'
  }
];

const FirstAidGuide: React.FC<FirstAidGuideProps> = ({ products, onAddToCart, onClose }) => {
  // Navigation & interaction states
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('quemaduras');
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [addedItemsMap, setAddedItemsMap] = useState<Record<string, boolean>>({});
  const [checkedChecklistItems, setCheckedChecklistItems] = useState<Record<string, boolean>>({
    item_2: true, // Mark a couple of items initially for realism (e.g., they have gasa at home)
  });

  const [activeSection, setActiveSection] = useState<'protocols' | 'calculator'>('protocols');
  const [childWeight, setChildWeight] = useState<number | ''>(12);
  const [weightUnit, setWeightUnit] = useState<'KG' | 'LB'>('KG');
  const [selectedMed, setSelectedMed] = useState<string>('paracetamol');
  const [selectedPresentation, setSelectedPresentation] = useState<string>('susp_120_5');

  const handleMedChange = (medId: string) => {
    setSelectedMed(medId);
    const med = MEDICATION_CONFIGS.find(m => m.id === medId);
    if (med && med.presentations.length > 0) {
      setSelectedPresentation(med.presentations[0].id);
    }
  };

  const activeMedication = useMemo(() => {
    return MEDICATION_CONFIGS.find(m => m.id === selectedMed) || MEDICATION_CONFIGS[0];
  }, [selectedMed]);

  const activePresentation = useMemo(() => {
    return activeMedication.presentations.find(p => p.id === selectedPresentation) || activeMedication.presentations[0];
  }, [activeMedication, selectedPresentation]);

  const calculationResult = useMemo(() => {
    if (childWeight === '' || isNaN(Number(childWeight)) || Number(childWeight) <= 0) {
      return {
        dose: 0,
        explanation: 'Ingrese un peso válido para calcular la dosis exacta.',
        maxDaily: 'N/A'
      };
    }
    const weightKg = weightUnit === 'LB' ? Number(childWeight) / 2.20462 : Number(childWeight);
    return activePresentation.calculate(weightKg);
  }, [childWeight, weightUnit, activePresentation]);

  const matchedStoreProducts = useMemo(() => {
    return products.filter(p => {
      const nameLower = p.name.toLowerCase();
      const descLower = p.description.toLowerCase();
      const searchKeyword = activeMedication.searchKeyword;
      return nameLower.includes(searchKeyword) || descLower.includes(searchKeyword);
    }).slice(0, 3);
  }, [activeMedication, products]);

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

  // Handle direct cart adding with visual confirmation feedback
  const handleAddProduct = (product: Product) => {
    onAddToCart(product, 'UNIT');
    setAddedItemsMap(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedItemsMap(prev => ({ ...prev, [product.id]: false }));
    }, 2000);
  };

  // Toggle checklist item
  const toggleChecklistItem = (itemId: string) => {
    setCheckedChecklistItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const IconComponent = currentProtocol.icon;

  return (
    <div className="bg-slate-50 min-h-screen pt-4 pb-24 px-4 md:px-8">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* --- HEADER DE LA GUÍA --- */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-600 shrink-0 shadow-inner">
              <Heart size={28} className="fill-emerald-100 animate-pulse" />
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full inline-block">
                Manual de Respuesta Rápida
              </span>
              <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight mt-1.5">
                Primeros Auxilios e Incidentes Domésticos
              </h2>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Aprende a actuar de inmediato ante emergencias y equipa tu botiquín ideal de forma manual, segura y sin inteligencia artificial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start md:self-auto">
            <div className="bg-rose-50 border border-rose-100 px-4 py-2.5 rounded-2xl flex items-center gap-2 text-rose-700">
              <PhoneCall size={16} className="animate-bounce" />
              <div className="text-left">
                <p className="text-[9px] font-black uppercase text-rose-500 tracking-wider">Línea Nacional</p>
                <p className="text-xs font-black font-mono">Emergencias: 911</p>
              </div>
            </div>
            
            {onClose && (
              <button 
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-black text-xs transition-colors shadow-xs"
              >
                Volver a la Tienda
              </button>
            )}
          </div>
        </div>

        {/* --- SECCIÓN DE TABS --- */}
        <div className="flex bg-white p-1 rounded-2xl border border-slate-100 max-w-md shadow-xs">
          <button
            onClick={() => setActiveSection('protocols')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeSection === 'protocols'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            Guías de Respuesta Rápida
          </button>
          <button
            onClick={() => setActiveSection('calculator')}
            className={`flex-1 py-3 text-xs font-black rounded-xl transition-all ${
              activeSection === 'calculator'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
            }`}
          >
            Calculadora de Dosis Infantil
          </button>
        </div>

        {activeSection === 'protocols' ? (
          <>
            {/* --- INCIDENT SELECTOR BUTTONS (GRID) --- */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {FIRST_AID_PROTOCOLS.map((protocol) => {
                const ItemIcon = protocol.icon;
                const isSelected = selectedIncidentId === protocol.id;

                return (
                  <button
                    key={protocol.id}
                    onClick={() => {
                      setSelectedIncidentId(protocol.id);
                      setActiveStepIndex(0); // Reset step progress
                    }}
                    className={`p-4 rounded-2xl border text-left transition-all duration-300 flex flex-col justify-between h-28 relative overflow-hidden group ${
                      isSelected 
                        ? 'bg-slate-900 border-slate-900 text-white shadow-lg -translate-y-1' 
                        : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200 hover:shadow-xs'
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all ${
                      isSelected ? 'bg-white/10 text-white' : protocol.colorClass
                    }`}>
                      <ItemIcon size={20} />
                    </div>
                    <div>
                      <h3 className="text-xs font-black tracking-tight mt-2">{protocol.title}</h3>
                      <span className={`text-[9px] font-bold block mt-0.5 ${
                        isSelected ? 'text-slate-300' : 'text-slate-400'
                      }`}>Ver guía rápida</span>
                    </div>
                    
                    {/* Subtle background decoration */}
                    <div className={`absolute -right-3 -bottom-3 opacity-5 group-hover:scale-110 transition-transform ${
                      isSelected ? 'text-white' : 'text-slate-700'
                    }`}>
                      <ItemIcon size={72} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* --- PROTOCOL DETAILS & RECOMMENDED KITS GRID --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* MAIN COLUMN: PROTOCOL PROTOCOL STEPS */}
              <div className="lg:col-span-8 space-y-6">
                
                <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
                  
                  {/* Header inside manual */}
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                    <div className={`h-11 w-11 rounded-2xl flex items-center justify-center ${currentProtocol.colorClass}`}>
                      <IconComponent size={22} />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                        Protocolo: {currentProtocol.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-semibold mt-0.5">{currentProtocol.shortDesc}</p>
                    </div>
                  </div>

                  {/* Step-by-Step interactive process with progress and animations */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                        Instrucciones de Acción Rápida (Paso a Paso)
                      </span>
                      <div className="flex gap-1.5">
                        {currentProtocol.steps.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setActiveStepIndex(idx)}
                            className={`h-2.5 rounded-full transition-all duration-300 ${
                              idx === activeStepIndex ? 'w-8 bg-slate-900' : 'w-2.5 bg-slate-200'
                            }`}
                            title={`Paso ${idx + 1}`}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Main Action Window with transitions */}
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={`${selectedIncidentId}_step_${activeStepIndex}`}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex gap-4 items-start"
                      >
                        <div className="h-9 w-9 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                          0{activeStepIndex + 1}
                        </div>
                        <div className="space-y-1.5">
                          <h4 className="text-xs font-black text-slate-800">
                            {currentProtocol.steps[activeStepIndex].title.toUpperCase()}
                          </h4>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed">
                            {currentProtocol.steps[activeStepIndex].description}
                          </p>
                        </div>
                      </motion.div>
                    </AnimatePresence>

                    {/* Step quick buttons */}
                    <div className="grid grid-cols-3 gap-2">
                      {currentProtocol.steps.map((step, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveStepIndex(idx)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            idx === activeStepIndex
                              ? 'border-slate-800 bg-slate-50 text-slate-900 font-bold shadow-xs'
                              : 'border-slate-100 bg-white text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          <span className="text-[9px] font-black uppercase tracking-wider block">Paso {idx + 1}</span>
                          <span className="text-[10px] font-bold line-clamp-1 mt-0.5">{step.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Warning box: What NOT to do */}
                  <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-100 space-y-3">
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest block flex items-center gap-1.5">
                      <ShieldAlert size={14} /> ¡Atención! Qué NO hacer bajo ninguna circunstancia
                    </span>
                    <ul className="space-y-2">
                      {currentProtocol.dontDo.map((dont, idx) => (
                        <li key={idx} className="text-xs font-semibold text-rose-700/90 flex gap-2 items-start">
                          <span className="text-rose-500 mt-0.5">•</span>
                          <span>{dont}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* When to go to emergency / doctor */}
                  <div className="bg-amber-50/50 p-5 rounded-2xl border border-amber-100 space-y-3">
                    <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest block flex items-center gap-1.5">
                      <Info size={14} /> Cuándo buscar asistencia médica profesional
                    </span>
                    <ul className="space-y-2">
                      {currentProtocol.whenToCallDoc.map((when, idx) => (
                        <li key={idx} className="text-xs font-semibold text-amber-800/90 flex gap-2 items-start">
                          <span className="text-amber-500 mt-0.5">•</span>
                          <span>{when}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

              </div>

              {/* SIDE COLUMN: RECOMMENDED PHARMACY PRODUCTS FOR THIS INCIDENT */}
              <div className="lg:col-span-4 space-y-6">
                
                {/* MATCHED INVENTORY SECTION */}
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                  <div>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block">
                      Equipamiento Sugerido
                    </span>
                    <h4 className="text-xs font-black text-slate-800 mt-1.5 uppercase">Botiquín para {currentProtocol.title}</h4>
                    <p className="text-[10.5px] text-slate-400 font-semibold mt-0.5">
                      Productos reales en almacén que sirven para tratar este incidente doméstico:
                    </p>
                  </div>

                  {recommendedProducts.length === 0 ? (
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 text-center space-y-2">
                      <Archive size={24} className="mx-auto text-slate-300" />
                      <p className="text-[10px] font-semibold text-slate-500">No encontramos productos listos con estas características en stock.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recommendedProducts.map((prod) => {
                        const isAdded = addedItemsMap[prod.id];
                        const isLowStock = prod.stock <= 5;

                        return (
                          <div 
                            key={prod.id} 
                            className="bg-slate-50/50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between gap-3 hover:border-slate-200 transition-colors"
                          >
                            <div className="flex gap-2">
                              <img 
                                src={prod.image} 
                                alt={prod.name} 
                                className="h-10 w-10 rounded-lg bg-white border border-slate-100 object-cover shrink-0"
                                referrerPolicy="no-referrer"
                              />
                              <div>
                                <h5 className="text-[11.5px] font-black text-slate-800 line-clamp-1">{prod.name}</h5>
                                <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1 py-0.2 rounded-md uppercase">
                                  {prod.category}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
                              <div>
                                <span className="text-[10.5px] font-black font-mono text-slate-700">${prod.price.toFixed(2)}</span>
                                {prod.stock === 0 ? (
                                  <span className="text-[9px] text-rose-500 font-bold block">Agotado</span>
                                ) : isLowStock ? (
                                  <span className="text-[9px] text-amber-500 font-bold block">Poco stock ({prod.stock})</span>
                                ) : (
                                  <span className="text-[9px] text-emerald-600 font-bold block">En stock</span>
                                )}
                              </div>

                              <button
                                onClick={() => handleAddProduct(prod)}
                                disabled={prod.stock === 0 || isAdded}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 shadow-xs ${
                                  prod.stock === 0
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : isAdded
                                    ? 'bg-emerald-600 text-white'
                                    : 'bg-slate-900 hover:bg-slate-800 text-white'
                                }`}
                              >
                                {isAdded ? (
                                  <>
                                    <Check size={11} /> ¡Añadido!
                                  </>
                                ) : (
                                  <>
                                    <ShoppingCart size={11} /> Añadir
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* GENERAL BASIC EMERGENCY KIT CHECKLIST */}
                <div className="bg-slate-900 text-white p-5 rounded-[2rem] border border-slate-800 shadow-md space-y-4 relative overflow-hidden">
                  <div className="space-y-1 relative z-10">
                    <span className="text-[9px] font-black text-amber-400 bg-white/10 px-2 py-0.5 rounded-full uppercase tracking-wider block w-fit">
                      Autodiagnóstico de Botiquín
                    </span>
                    <h4 className="text-xs font-black uppercase tracking-tight text-white mt-1.5">Completa tu Botiquín Básico</h4>
                    <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                      Verifica qué elementos esenciales tienes en casa y equipa los que te hacen falta:
                    </p>
                  </div>

                  {/* Checklist list */}
                  <div className="space-y-2.5 relative z-10">
                    {checklistInventoryMatches.map((item) => {
                      const isChecked = checkedChecklistItems[item.id];
                      
                      return (
                        <div 
                          key={item.id}
                          className="flex items-center justify-between gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors group"
                        >
                          <button 
                            type="button"
                            onClick={() => toggleChecklistItem(item.id)}
                            className="flex items-center gap-2.5 text-left text-[11px] font-bold text-slate-100"
                          >
                            {isChecked ? (
                              <CheckSquare size={15} className="text-emerald-400 shrink-0" />
                            ) : (
                              <Square size={15} className="text-slate-500 shrink-0 group-hover:text-slate-300" />
                            )}
                            <span className={isChecked ? 'line-through text-slate-400 font-medium' : ''}>
                              {item.name}
                            </span>
                          </button>

                          {/* Buy missing button if matched in catalog */}
                          {!isChecked && item.matchedProduct && (
                            <button
                              onClick={() => handleAddProduct(item.matchedProduct!)}
                              className="px-2 py-1 rounded bg-teal-500 hover:bg-teal-400 text-slate-950 text-[9px] font-black transition-all flex items-center gap-1 shrink-0 shadow-sm"
                              title="Comprar repuesto oficial"
                            >
                              <Plus size={10} /> Añadir
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Progress counter */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-black text-slate-300 relative z-10">
                    <span>Tu nivel de preparación:</span>
                    <span className="text-teal-400 font-mono">
                      {Object.values(checkedChecklistItems).filter(Boolean).length} / {BOTIQUIN_CHECKLIST_ITEMS.length} Listos
                    </span>
                  </div>

                  {/* Decorative cross symbol */}
                  <div className="absolute -right-6 -bottom-6 text-white/5 pointer-events-none">
                    <Plus size={100} strokeWidth={6} />
                  </div>
                </div>

              </div>

            </div>
          </>
        ) : (
          /* --- CALCULADORA TAB --- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: PARAMETERS FORM */}
            <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                <div className="h-11 w-11 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                  <Calculator size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">
                    Parámetros de Dosificación
                  </h3>
                  <p className="text-xs text-slate-400 font-semibold mt-0.5">
                    Configure el peso del paciente y el medicamento prescrito
                  </p>
                </div>
              </div>

              {/* WEIGHT INPUT WITH UNIT SWITCHER */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Peso del Infante o Niño
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      max="100"
                      value={childWeight}
                      onChange={(e) => {
                        const val = e.target.value;
                        setChildWeight(val === '' ? '' : Number(val));
                      }}
                      placeholder="Ej. 12"
                      className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-xl px-4 py-3 text-sm font-bold text-slate-800 transition-all placeholder:text-slate-300 animate-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-slate-400">
                      <Baby size={16} className="text-slate-300" />
                    </div>
                  </div>

                  <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-100 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        if (weightUnit === 'LB' && childWeight !== '') {
                          setChildWeight(Math.round((Number(childWeight) / 2.20462) * 10) / 10);
                        }
                        setWeightUnit('KG');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                        weightUnit === 'KG'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      KG
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (weightUnit === 'KG' && childWeight !== '') {
                          setChildWeight(Math.round((Number(childWeight) * 2.20462) * 10) / 10);
                        }
                        setWeightUnit('LB');
                      }}
                      className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black tracking-wider transition-all ${
                        weightUnit === 'LB'
                          ? 'bg-white text-slate-800 shadow-xs'
                          : 'text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      LB
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-slate-400 font-medium">
                  {weightUnit === 'KG' ? 'El cálculo se basará en kilogramos.' : 'Se convertirá automáticamente a kilogramos (1 kg ≈ 2.2 lb) para aplicar la fórmula estándar.'}
                </p>
              </div>

              {/* MEDICATION SELECTOR */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Medicamento Común de Venta Libre
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {MEDICATION_CONFIGS.map((med) => {
                    const isSelected = selectedMed === med.id;
                    return (
                      <button
                        key={med.id}
                        type="button"
                        onClick={() => handleMedChange(med.id)}
                        className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? 'border-teal-500 bg-teal-50/30 ring-1 ring-teal-500/30'
                            : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <span className={`text-[9px] font-black uppercase tracking-wider block ${
                          isSelected ? 'text-teal-600' : 'text-slate-400'
                        }`}>
                          {med.category}
                        </span>
                        <span className="text-xs font-black text-slate-800 mt-1">
                          {med.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* PRESENTATION SELECTOR */}
              <div className="space-y-2.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
                  Presentación y Concentración Disponible
                </label>
                <div className="relative">
                  <select
                    value={selectedPresentation}
                    onChange={(e) => setSelectedPresentation(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none rounded-xl px-4 py-3 text-xs font-bold text-slate-800 transition-all appearance-none cursor-pointer"
                  >
                    {activeMedication.presentations.map((pres) => (
                      <option key={pres.id} value={pres.id}>
                        {pres.label} ({pres.concentrationText})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 font-mono text-[9px]">
                    ▼
                  </div>
                </div>
              </div>

              {/* MEDICAL NOTE */}
              <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-100 text-[11px] text-amber-800 font-semibold space-y-1">
                <span className="font-black text-amber-900 uppercase block tracking-wider">⚠ RECOMENDACIÓN CRÍTICA</span>
                <p className="leading-relaxed">
                  Las dosis calculadas aquí son estimaciones matemáticas basadas en guías clínicas estándar. Siempre verifique la jeringa o vaso dosificador del empaque oficial. Ante dudas, fiebre persistente o malestar severo, acuda de inmediato a su pediatra de cabecera.
                </p>
              </div>
            </div>

            {/* RIGHT COLUMN: CALCULATION RESULTS CARD */}
            <div className="lg:col-span-5 space-y-6">
              
              <div className="bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] border border-slate-800 shadow-md space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 text-white/5 pointer-events-none">
                  <Calculator size={150} strokeWidth={1} />
                </div>

                <div className="space-y-1 relative z-10">
                  <span className="text-[9px] font-black text-teal-300 bg-teal-900/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider block w-fit">
                    Resultado del Cálculo
                  </span>
                  <h4 className="text-sm font-black uppercase tracking-tight text-slate-100 mt-2">Dosis Recomendada por Toma</h4>
                  <p className="text-[10px] text-slate-300 font-medium leading-relaxed">
                    Ajustado con base en el peso de <span className="font-mono text-teal-300 font-bold">{childWeight || '0'} {weightUnit}</span>.
                  </p>
                </div>

                {/* DOSE CONTAINER */}
                <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center relative z-10">
                  {childWeight === '' || childWeight <= 0 ? (
                    <div className="py-4">
                      <p className="text-xs text-slate-400 font-semibold">Ingrese el peso en la izquierda para ver la dosis calculada.</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl md:text-5xl font-black font-mono text-teal-400 tracking-tight block">
                        {calculationResult.dose} <span className="text-xl md:text-2.5xl font-sans uppercase font-bold text-white">{activePresentation.doseUnit}</span>
                      </span>
                      <span className="text-[10px] text-slate-300 font-bold uppercase tracking-wider block mt-2">
                        {activeMedication.name}
                      </span>
                      <span className="text-[10.5px] text-slate-400 font-medium block mt-1.5 leading-relaxed bg-white/5 py-1 px-3 rounded-lg w-fit mx-auto">
                        {activePresentation.label}
                      </span>
                    </div>
                  )}
                </div>

                {/* CALCULATION EXPLANATION AND FREQUENCY */}
                <div className="space-y-4 relative z-10">
                  <div className="flex items-start gap-2 text-xs">
                    <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center shrink-0 text-teal-400">
                      <Info size={12} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Cómo se calcula</span>
                      <p className="text-[11px] font-medium text-slate-200 mt-0.5">{calculationResult.explanation}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-xs">
                    <div className="h-5 w-5 rounded bg-white/10 flex items-center justify-center shrink-0 text-teal-400">
                      <Calendar size={12} />
                    </div>
                    <div>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Frecuencia y Límite Diario</span>
                      <p className="text-[11px] font-medium text-slate-200 mt-0.5">
                        Intervalo sugerido: <span className="font-bold text-teal-300">
                          {selectedMed === 'paracetamol' ? 'Cada 4 a 6 horas' : selectedMed === 'ibuprofeno' ? 'Cada 6 a 8 horas' : 'Cada 24 horas (Una vez al día)'}
                        </span>.
                      </p>
                      <p className="text-[10.5px] font-bold text-rose-300 mt-1">
                        Dosis máxima: {calculationResult.maxDaily}
                      </p>
                    </div>
                  </div>
                </div>

                {/* SYRINGE DYNAMIC GAUGE */}
                {childWeight !== '' && childWeight > 0 && (
                  <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-2 relative z-10">
                    <div className="flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-wider">
                      <span>Referencia Visual en Jeringa/Medida</span>
                      <span className="font-mono text-teal-300 font-bold">{calculationResult.dose} {activePresentation.doseUnit}</span>
                    </div>
                    {/* Syringe body */}
                    <div className="h-7 bg-white/10 rounded-lg relative overflow-hidden flex items-center">
                      {/* Fluid filling anim */}
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ 
                          width: `${Math.min(100, (calculationResult.dose / (activePresentation.doseUnit === 'gotas' ? 50 : 15)) * 100)}%` 
                        }}
                        transition={{ duration: 0.4 }}
                        className="h-full bg-teal-500/40 rounded-l-lg"
                      />
                      {/* Metric lines */}
                      <div className="absolute inset-0 flex justify-between px-4 pointer-events-none opacity-30">
                        {[...Array(6)].map((_, idx) => (
                          <div key={idx} className="h-full w-[1px] bg-white flex flex-col justify-between">
                            <span className="h-1 bg-white"></span>
                            <span className="h-1 bg-white"></span>
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-slate-200 pointer-events-none">
                        Medida aproximada ({activePresentation.doseUnit === 'gotas' ? 'escala 50 gotas' : 'escala 15 mL'})
                      </div>
                    </div>
                  </div>
                )}

                {/* WARNING BOX FOR MEDICATION */}
                <div className="bg-rose-950/40 border border-rose-900/50 p-4 rounded-xl text-[11px] text-rose-200 space-y-1 relative z-10">
                  <span className="font-black text-rose-300 uppercase block tracking-wider">⚠ Advertencia de Seguridad</span>
                  <p className="leading-relaxed font-semibold">
                    {activeMedication.warning}
                  </p>
                </div>

                {/* ADMINISTRATION TIP */}
                <div className="bg-blue-950/40 border border-blue-900/50 p-4 rounded-xl text-[11px] text-blue-200 space-y-1 relative z-10">
                  <span className="font-black text-blue-300 uppercase block tracking-wider">💡 Consejo Práctico</span>
                  <p className="leading-relaxed font-semibold">
                    {activeMedication.administrationTip}
                  </p>
                </div>
              </div>

              {/* MATCHED SHOP PRODUCTS */}
              {matchedStoreProducts.length > 0 && (
                <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-3">
                  <div>
                    <span className="text-[10px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2.5 py-0.5 rounded-full inline-block">
                      Comprar en Farmacia Vitalis
                    </span>
                    <h5 className="text-xs font-black text-slate-800 mt-1.5 uppercase">Medicamentos Disponibles</h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                      Adquiera presentaciones pediátricas oficiales directo de nuestro almacén:
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {matchedStoreProducts.map((prod) => {
                      const isAdded = addedItemsMap[prod.id];
                      const isAdultMed = !prod.name.toLowerCase().includes('pediátr') && 
                                         !prod.name.toLowerCase().includes('infant') && 
                                         !prod.name.toLowerCase().includes('jarabe') &&
                                         !prod.name.toLowerCase().includes('gotas');
                      
                      return (
                        <div 
                          key={prod.id}
                          className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 flex items-center justify-between gap-3 hover:border-slate-200 transition-colors"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="h-9 w-9 rounded-lg bg-white border border-slate-100 object-cover shrink-0"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h6 className="text-[11px] font-black text-slate-800 line-clamp-1">{prod.name}</h6>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[9px] font-black font-mono text-slate-600">${prod.price.toFixed(2)}</span>
                                {isAdultMed && (
                                  <span className="text-[8px] bg-amber-50 text-amber-700 px-1.5 py-0.2 rounded font-black uppercase border border-amber-100 block w-fit">
                                    Apto Adultos
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleAddProduct(prod)}
                            disabled={prod.stock === 0 || isAdded}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all flex items-center gap-1 shadow-xs ${
                              prod.stock === 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-slate-900 hover:bg-slate-800 text-white'
                            }`}
                          >
                            {isAdded ? <Check size={10} /> : <ShoppingCart size={10} />}
                            {isAdded ? 'Añadido' : 'Añadir'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default FirstAidGuide;
