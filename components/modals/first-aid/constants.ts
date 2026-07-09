import { 
    Flame, 
    Droplet, 
    Bug, 
    Thermometer, 
    AlertTriangle 
  } from 'lucide-react';
  import { IncidentProtocol, KnownActiveIngredient, BotiquinChecklistItem } from './types';
  
  export const FIRST_AID_PROTOCOLS: IncidentProtocol[] = [
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
      recommendedKeywords: ['crema', 'gel', 'gasa', 'paracetamol', 'antiséptico', 'curita'],
      coherentMedications: [
        {
          name: 'Crema Regeneradora con Aloe Vera o Cicatrizante',
          purpose: 'Aliviar el ardor de inmediato, hidratar la barrera cutánea dañada y acelerar la recuperación de la epidermis.',
          dosageInstructions: 'Aplicar una capa ligera sobre la quemadura fría y limpia de 2 a 3 veces al día, sin frotar con fuerza.',
          caution: 'No usar en quemaduras abiertas de tercer grado o con ampollas rotas expuestas sin indicación médica.',
          productKeyword: 'crema'
        },
        {
          name: 'Paracetamol',
          purpose: 'Reducir el dolor punzante inicial y aliviar el malestar físico o escalofríos secundarios.',
          dosageInstructions: 'En niños, administrar 15 mg/kg por toma cada 6 horas. En adultos, de 500 mg a 1 g cada 6 u 8 horas.',
          caution: 'No duplicar dosis si se combina con otros medicamentos que contengan paracetamol activo.',
          productKeyword: 'paracetamol'
        },
        {
          name: 'Gasas Estériles Antiadherentes',
          purpose: 'Cubrir la lesión impidiendo la entrada de suciedad y el roce doloroso con la ropa.',
          dosageInstructions: 'Colocar con cuidado sobre la zona hidratada y asegurar en los bordes con cinta microporosa suave.',
          caution: 'Cambiar diariamente y humedecer previamente con solución salina si siente que se pegó a la piel.',
          productKeyword: 'gasa'
        }
      ]
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
      recommendedKeywords: ['alcohol', 'antiséptico', 'gasa', 'venda', 'esparadrapo', 'curita', 'algodón'],
      coherentMedications: [
        {
          name: 'Alcohol Isopropílico al 70% o Solución Antiséptica',
          purpose: 'Desinfectar la piel periférica sana de la herida y los implementos o pinzas que se vayan a utilizar.',
          dosageInstructions: 'Humedecer un algodón y dar toques suaves alrededor del borde de la lesión, sin tocar el interior del corte vivo.',
          caution: 'Evitar verter alcohol directamente en el interior de heridas profundas para evitar dolor extremo y muerte celular tisular.',
          productKeyword: 'alcohol'
        },
        {
          name: 'Pomada Cicatrizante o Protectora',
          purpose: 'Asegurar una cicatrización húmeda óptima y prevenir la colonización de gérmenes superficiales.',
          dosageInstructions: 'Aplicar una fina película con un aplicador estéril antes de cubrir con el apósito o curita.',
          caution: 'Evitar si la herida supura, tiene pus o muestra signos activos de infección severa.',
          productKeyword: 'crema'
        },
        {
          name: 'Curitas Adhesivas o Apósitos Rápido',
          purpose: 'Sellar raspaduras menores, aislando la herida del contacto directo con el polvo o contaminantes externos.',
          dosageInstructions: 'Colocar centrando la almohadilla estéril sobre la herida limpia y fijar bien los extremos adhesivos.',
          caution: 'Cambiar si se moja o ensucia. No dejar la misma curita aplicada por más de 24 horas consecutivas.',
          productKeyword: 'curita'
        }
      ]
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
      recommendedKeywords: ['crema', 'antialérgico', 'antihistamínico', 'calamina', 'alcohol'],
      coherentMedications: [
        {
          name: 'Crema con Calamina o Loción Antipruriginosa',
          purpose: 'Aliviar de forma inmediata la picazón, disminuir el enrojecimiento y refrescar la piel inflamada.',
          dosageInstructions: 'Aplicar directamente en el punto de la picadura con un leve masaje hasta 3 o 4 veces al día.',
          caution: 'Exclusivo para uso externo. Mantener alejado de mucosas orales, oculares y genitales.',
          productKeyword: 'calamina'
        },
        {
          name: 'Antihistamínico Oral (Loratadina o Cetirizina)',
          purpose: 'Detener la liberación de histamina, controlando la hinchazón y previniendo el rascado compulsivo nocivo.',
          dosageInstructions: 'Niños mayores de 2 años: según peso/jarabe. Adultos: 1 tableta de Loratadina (10 mg) cada 24 horas.',
          caution: 'Puede producir somnolencia leve. Evitar el consumo de bebidas alcohólicas o sedantes simultáneos.',
          productKeyword: 'antihistamínico'
        },
        {
          name: 'Ibuprofeno Suspensión',
          purpose: 'Controlar el dolor agudo punzante e inflamación muscular que provocan picaduras de avispas o abejas.',
          dosageInstructions: 'Dosis pediátrica de 10 mg/kg cada 8 horas de preferencia acompañado de leche o algún alimento.',
          caution: 'No emplear en lactantes menores de 6 meses o pacientes con historial de úlceras digestivas.',
          productKeyword: 'ibuprofeno'
        }
      ]
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
      recommendedKeywords: ['paracetamol', 'termómetro', 'ibuprofeno', 'suero', 'hidratación'],
      coherentMedications: [
        {
          name: 'Paracetamol (Acetaminofén) Jarabe o Gotas',
          purpose: 'Disminuir la temperatura central corporal y aligerar el malestar muscular, dolor de cabeza o decaimiento general.',
          dosageInstructions: 'Administrar 15 mg por cada kilogramo de peso corporal vía oral, cada 6 horas (máximo 5 tomas en 24h).',
          caution: 'Es el antifebril más seguro para lactantes, pero respete estrictamente los intervalos para cuidar el hígado.',
          productKeyword: 'paracetamol'
        },
        {
          name: 'Ibuprofeno Suspensión Infantil',
          purpose: 'Alternativa antipirética de mayor duración para fiebres persistentes, aportando también un potente efecto antiinflamatorio.',
          dosageInstructions: 'Administrar de 10 mg por cada kilogramo de peso corporal vía oral, cada 8 horas (máximo 3-4 tomas en 24h).',
          caution: 'No usar en menores de 6 meses o con sospecha de deshidratación severa. Dar con un poco de comida.',
          productKeyword: 'ibuprofeno'
        },
        {
          name: 'Suero de Rehidratación Oral (Electrolitos)',
          purpose: 'Evitar el colapso por deshidratación debido al sudor excesivo, hiperventilación y aceleración metabólica.',
          dosageInstructions: 'Ofrecer pequeños sorbos frescos de suero oral de forma regular y constante a lo largo del día.',
          caution: 'Evitar agua pura en grandes volúmenes rápidos si el niño rechaza los líquidos, ya que puede inducir náuseas.',
          productKeyword: 'suero'
        }
      ]
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
      recommendedKeywords: ['suero', 'hidratación', 'carbón', 'protector gástrico', 'agua'],
      coherentMedications: [
        {
          name: 'Suero de Rehidratación Oral (Electrolitos)',
          purpose: 'Reponer fluidos vitales en caso de intoxicación alimentaria leve que cause vómitos o diarrea aguda.',
          dosageInstructions: 'Fraccionar la toma: 50 a 100 mL de suero frío administrados lentamente con cuchara tras cada evacuación o vómito.',
          caution: 'No detiene la diarrea bacteriana (lo cual es un mecanismo de defensa), pero mantiene los órganos hidratados.',
          productKeyword: 'suero'
        },
        {
          name: 'Carbón Activado Pediátrico / Adulto',
          purpose: 'Adsorber e inactivar toxinas químicas u orgánicas en el estómago antes de que pasen al flujo sanguíneo.',
          dosageInstructions: 'Disolver el polvo en agua según la dosis estricta indicada por el centro toxicológico o médico de guardia.',
          caution: '¡Prohibido su uso casero sin autorización! Inútil en ingesta de alcohol, ácidos corrosivos o combustibles.',
          productKeyword: 'carbón'
        }
      ]
    }
  ];
  
  export const BOTIQUIN_CHECKLIST_ITEMS: BotiquinChecklistItem[] = [
    { id: 'item_1', name: 'Alcohol Antiséptico (70%)', category: 'Desinfectantes', keyword: 'alcohol' },
    { id: 'item_2', name: 'Gasas Estériles', category: 'Material de Cura', keyword: 'gasa' },
    { id: 'item_3', name: 'Termómetro Clínico', category: 'Medición', keyword: 'termómetro' },
    { id: 'item_4', name: 'Paracetamol / Analgésico', category: 'Medicamentos', keyword: 'paracetamol' },
    { id: 'item_5', name: 'Esparadrapo o Cinta Médica', category: 'Material de Cura', keyword: 'esparadrapo' },
    { id: 'item_6', name: 'Vendas Elásticas', category: 'Material de Cura', keyword: 'venda' },
    { id: 'item_7', name: 'Suero de Rehidratación Oral', category: 'Hidratación', keyword: 'suero' }
  ];
  
  export const KNOWN_INGREDIENTS: KnownActiveIngredient[] = [
    {
      name: 'Paracetamol (Acetaminofén)',
      id: 'paracetamol',
      category: 'Analgésico / Antipirético',
      searchKeys: ['paracetamol', 'acetaminofen', 'acetaminofén'],
      defaultConcentrationMg: 120,
      defaultConcentrationMl: 5,
      defaultDosageMgKg: 15,
      doseUnit: 'mL',
      frequencyHours: 6,
      maxDailyDoses: 5,
      warning: 'No administrar más de 5 veces al día. Dejar pasar al menos 4 a 6 horas entre cada dosis. El uso excesivo de paracetamol puede causar daños graves al hígado.',
      administrationTip: 'La presentación en gotas es exclusiva para bebés pequeños; para niños mayores de 2 años se prefiere la suspensión en jarabe con jeringa dosificadora.'
    },
    {
      name: 'Ibuprofeno Infantil',
      id: 'ibuprofeno',
      category: 'Antiinflamatorio / Analgésico',
      searchKeys: ['ibuprofeno', 'ibuprofen'],
      defaultConcentrationMg: 100,
      defaultConcentrationMl: 5,
      defaultDosageMgKg: 10,
      doseUnit: 'mL',
      frequencyHours: 8,
      maxDailyDoses: 4,
      warning: 'No usar en menores de 6 meses de edad sin indicación médica expresa. Administrar siempre acompañado de alimentos para proteger el estómago del niño.',
      administrationTip: 'El intervalo recomendado es de cada 6 a 8 horas. No exceder de 4 dosis en 24 horas.'
    },
    {
      name: 'Amoxicilina',
      id: 'amoxicilina',
      category: 'Antibiótico',
      searchKeys: ['amoxicilina', 'amoxil', 'antibiotico', 'amoxicilin'],
      defaultConcentrationMg: 250,
      defaultConcentrationMl: 5,
      defaultDosageMgKg: 15,
      doseUnit: 'mL',
      frequencyHours: 8,
      maxDailyDoses: 3,
      warning: 'Este medicamento requiere receta médica estricta y supervisión pediátrica. Complete el ciclo completo del tratamiento incluso si los síntomas desaparecen.',
      administrationTip: 'Se puede mezclar con leche, jugos o compotas. No olvide agitar muy bien la suspensión líquida reconstituida antes de dosificar.'
    },
    {
      name: 'Loratadina Jarabe',
      id: 'loratadina',
      category: 'Antihistamínico (Alergias)',
      searchKeys: ['loratadina', 'loratadine'],
      defaultConcentrationMg: 5,
      defaultConcentrationMl: 5,
      defaultDosageMgKg: 0.2,
      doseUnit: 'mL',
      frequencyHours: 24,
      maxDailyDoses: 1,
      warning: 'Uso recomendado a partir de los 2 años. Solo se administra una vez al día. No provoca somnolencia severa en la mayoría de los casos.',
      administrationTip: 'Ideal para el alivio de rinitis alérgica, estornudos y picazón por picaduras de insectos.'
    },
    {
      name: 'Cetirizina Gotas/Jarabe',
      id: 'cetirizina',
      category: 'Antihistamínico (Alergias)',
      searchKeys: ['cetirizina', 'cetirizine', 'alergias'],
      defaultConcentrationMg: 5,
      defaultConcentrationMl: 5,
      defaultDosageMgKg: 0.25,
      doseUnit: 'mL',
      frequencyHours: 12,
      maxDailyDoses: 2,
      warning: 'Uso en menores de 2 años requiere estricta supervisión del pediatra. Puede causar somnolencia leve en algunos niños.',
      administrationTip: 'Alivia rápidamente síntomas de alergias respiratorias, urticaria y prurito en general.'
    },
    {
      name: 'Salbutamol Jarabe',
      id: 'salbutamol',
      category: 'Broncodilatador (Asma)',
      searchKeys: ['salbutamol', 'ventolin', 'albuterol'],
      defaultConcentrationMg: 2,
      defaultConcentrationMl: 5,
      defaultDosageMgKg: 0.1,
      doseUnit: 'mL',
      frequencyHours: 8,
      maxDailyDoses: 3,
      warning: 'El jarabe de salbutamol puede generar temblor y aceleración del ritmo cardíaco (taquicardia). Utilizar únicamente bajo recomendación y control estricto del pediatra.',
      administrationTip: 'En crisis bronquiales obstructivas, las guías clínicas internacionales de pediatría prefieren el uso de inhaladores con aerocámara sobre el jarabe oral.'
    },
    {
      name: 'Metoclopramida Jarabe',
      id: 'metoclopramida',
      category: 'Antiemético (Náuseas/Vómito)',
      searchKeys: ['metoclopramida', 'primperan', 'vomito', 'nauseas'],
      defaultConcentrationMg: 5,
      defaultConcentrationMl: 5,
      defaultDosageMgKg: 0.1,
      doseUnit: 'mL',
      frequencyHours: 8,
      maxDailyDoses: 3,
      warning: '¡PRECAUCIÓN EXTREMA! Su uso en niños puede desencadenar reacciones extrapiramidales (espasmos musculares severos, movimientos involuntarios de cuello/cara). Use con extrema precaución y solo si es indicado.',
      administrationTip: 'Administrar bajo estricta indicación médica. Si el menor presenta temblores o rigidez, suspenda su uso de inmediato.'
    }
  ];
  