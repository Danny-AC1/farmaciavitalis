/**
 * Motor de Búsqueda Inteligente y Tolerante a Fallos (Fuzzy Search Farmacéutico)
 * Farmacia Vitalis
 * 
 * Capacidades:
 * 1. Normalización estricta: eliminación de tildes (á->a), diéresis (ü->u) y caracteres especiales.
 * 2. Normalización fonética en español médico:
 *    - c/s/z -> s (ej: parasetamol -> paracetamol, setirisina -> cetirizina)
 *    - b/v -> b (ej: ivuprofeno -> ibuprofeno)
 *    - ph -> f (ej: pharmacare -> farmacare)
 *    - h muda -> ignorada (ej: omeprasol -> homeprazol)
 *    - y/ll -> i (ej: cloranfenicol, diclofenaco)
 * 3. Algoritmo de Distancia de Edición (Levenshtein con Damerau para transposiciones).
 * 4. Búsqueda multicampo ponderada (Nombre > Principio Activo > Categoría/Keywords > Código de Barras).
 * 5. Sistema de Scoring para ordenar por máxima relevancia.
 */

import { Product } from '../types';

/**
 * Remueve tildes, acentos y convierte a minúsculas
 */
export function normalizeText(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes
    .replace(/[^a-z0-9\s]/g, ' ')   // Convierte símbolos a espacios
    .replace(/\s+/g, ' ')            // Colapsa múltiples espacios
    .trim();
}

/**
 * Normalización fonética para pronunciación en español de medicamentos
 */
export function normalizePhonetics(text: string | null | undefined): string {
  if (!text) return '';
  let str = normalizeText(text);

  // Equivalencias fonéticas
  str = str.replace(/ph/g, 'f');
  str = str.replace(/qu/g, 'k');
  str = str.replace(/q/g, 'k');
  str = str.replace(/k/g, 'k');
  str = str.replace(/c(?=[eiy])/g, 's'); // c suave -> s
  str = str.replace(/c(?=[aou])/g, 'k'); // c fuerte -> k
  str = str.replace(/z/g, 's');          // z -> s
  str = str.replace(/v/g, 'b');          // v -> b
  str = str.replace(/ll/g, 'y');
  str = str.replace(/h/g, '');           // h muda
  str = str.replace(/x/g, 's');          // x -> s (apronax, amoxicilina)
  str = str.replace(/w/g, 'u');
  
  // Colapsar letras dobles (ej: pp -> p, mm -> m, ss -> s)
  str = str.replace(/(.)\1+/g, '$1');

  return str.trim();
}

/**
 * Calcula la distancia Damerau-Levenshtein (soporta inserciones, eliminaciones, sustituciones y transposiciones)
 */
export function calculateLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const al = a.length;
  const bl = b.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let min = Math.min(
        matrix[i - 1][j] + 1,      // Eliminación
        matrix[i][j - 1] + 1,      // Inserción
        matrix[i - 1][j - 1] + cost // Sustitución
      );

      // Transposición (dos letras invertidas ej: "paarcetamol" o "ipubrofeno")
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        min = Math.min(min, matrix[i - 2][j - 2] + 1);
      }

      matrix[i][j] = min;
    }
  }

  return matrix[al][bl];
}

/**
 * Evalúa si una palabra del usuario coincide con una palabra objetivo mediante coincidencia difusa
 */
function isFuzzyWordMatch(queryWord: string, targetWord: string): boolean {
  if (!queryWord || !targetWord) return false;
  if (targetWord.includes(queryWord) || queryWord.includes(targetWord)) return true;

  // Si la palabra es muy corta (menos de 3 letras), requerimos match exacto
  if (queryWord.length < 3) {
    return targetWord.startsWith(queryWord);
  }

  // Tolerancia según longitud de la palabra
  const maxDistance = queryWord.length >= 7 ? 2 : 1;
  const dist = calculateLevenshteinDistance(queryWord, targetWord);
  if (dist <= maxDistance) return true;

  // Comparación fonética
  const phonQuery = normalizePhonetics(queryWord);
  const phonTarget = normalizePhonetics(targetWord);
  if (phonTarget.includes(phonQuery) || phonQuery.includes(phonTarget)) return true;

  const phonDist = calculateLevenshteinDistance(phonQuery, phonTarget);
  return phonDist <= maxDistance;
}

export interface ScoredProduct {
  product: Product;
  score: number;
  matchReason?: 'EXACT' | 'PREFIX' | 'CONTAINS' | 'PHONETIC' | 'FUZZY';
}

/**
 * Evalúa la similitud y relevancia de un producto contra una consulta de búsqueda
 * Mayor puntaje = mayor relevancia (Aparece primero)
 */
export function scoreProductSearch(product: Product, rawQuery: string): ScoredProduct | null {
  const query = normalizeText(rawQuery);
  if (!query) return null;

  const phonQuery = normalizePhonetics(rawQuery);
  const queryWords = query.split(' ').filter(w => w.length > 0);

  // 1. Verificación por código de barras exacto (para lector de pistola POS)
  if (product.barcode && product.barcode.trim() === rawQuery.trim()) {
    return { product, score: 1000, matchReason: 'EXACT' };
  }

  const nameNorm = normalizeText(product.name);
  const namePhon = normalizePhonetics(product.name);
  const activeIngNorm = normalizeText(product.activeIngredient);
  const activeIngPhon = normalizePhonetics(product.activeIngredient);
  const catNorm = normalizeText(product.category);
  const descNorm = normalizeText(product.description);
  const kwNorm = normalizeText(product.keywords);

  let score = 0;

  // A. Coincidencias Exactas y Prefijos en el Nombre
  if (nameNorm === query) {
    score += 500;
  } else if (nameNorm.startsWith(query)) {
    score += 350;
  } else if (nameNorm.includes(query)) {
    score += 200;
  }

  // B. Coincidencia Fonética en el Nombre (ej: Parasetamol -> Paracetamol)
  if (namePhon === phonQuery) {
    score += 400;
  } else if (namePhon.startsWith(phonQuery)) {
    score += 280;
  } else if (namePhon.includes(phonQuery)) {
    score += 180;
  }

  // C. Principio Activo (Genérico)
  if (activeIngNorm) {
    if (activeIngNorm === query) {
      score += 380;
    } else if (activeIngNorm.startsWith(query)) {
      score += 260;
    } else if (activeIngNorm.includes(query)) {
      score += 160;
    } else if (activeIngPhon.includes(phonQuery)) {
      score += 150;
    }
  }

  // D. Categorías y Palabras Clave
  if (catNorm.includes(query)) score += 80;
  if (kwNorm.includes(query)) score += 90;
  if (descNorm.includes(query)) score += 40;

  // E. Evaluación Palabra por Palabra (Tokens)
  const nameWords = nameNorm.split(' ');
  const activeWords = activeIngNorm.split(' ');
  const allTargetWords = [...nameWords, ...activeWords, ...catNorm.split(' '), ...kwNorm.split(' ')];

  let matchedWordsCount = 0;

  for (let i = 0; i < queryWords.length; i++) {
    const qWord = queryWords[i];

    let wordMatched = false;

    // Buscar match en palabras del producto
    for (const tWord of allTargetWords) {
      if (!tWord) continue;

      if (tWord === qWord) {
        score += 60;
        wordMatched = true;
        break;
      } else if (tWord.startsWith(qWord)) {
        score += 40;
        wordMatched = true;
        break;
      } else if (isFuzzyWordMatch(qWord, tWord)) {
        score += 30;
        wordMatched = true;
        break;
      }
    }

    if (wordMatched) {
      matchedWordsCount++;
    }
  }

  // Si se ingresaron varias palabras, premiar si coinciden todas
  if (queryWords.length > 1 && matchedWordsCount === queryWords.length) {
    score += 100;
  }

  // Si no hubo coincidencia directa pero la distancia de Levenshtein global con el nombre es baja
  if (score === 0 && query.length >= 4) {
    const maxGlobalDist = query.length >= 8 ? 2 : 1;
    const dist = calculateLevenshteinDistance(query, nameNorm);
    if (dist <= maxGlobalDist) {
      score += 70;
    } else {
      const phonDist = calculateLevenshteinDistance(phonQuery, namePhon);
      if (phonDist <= maxGlobalDist) {
        score += 65;
      }
    }
  }

  if (score > 0) {
    // Bonificación por stock disponible (productos con stock tienen ligera prioridad de visualización)
    if (product.stock > 0) {
      score += 5;
    }
    return { product, score };
  }

  return null;
}

/**
 * Busca y ordena productos utilizando el motor inteligente
 * 
 * @param products Lista de productos de la base de datos
 * @param query Texto escrito por el usuario (soporta errores, tildes, fonética)
 * @param limit Límite opcional de resultados a retornar
 */
export function searchProductsIntelligent(
  products: Product[],
  query: string,
  limit?: number
): Product[] {
  if (!query || !query.trim()) {
    return limit ? products.slice(0, limit) : products;
  }

  const scoredList: ScoredProduct[] = [];

  for (const product of products) {
    const scored = scoreProductSearch(product, query);
    if (scored) {
      scoredList.push(scored);
    }
  }

  // Ordenar de mayor a menor relevancia
  scoredList.sort((a, b) => b.score - a.score);

  const results = scoredList.map(item => item.product);
  return typeof limit === 'number' ? results.slice(0, limit) : results;
}
