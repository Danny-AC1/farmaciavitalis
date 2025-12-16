import { GoogleGenAI, Chat } from "@google/genai";
import { Product } from '../types';

// Helper robusto para obtener la API Key en entorno Vite
const getApiKey = (): string | null => {
  let key = '';

  try {
    // @ts-ignore
    if (import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY;
    } else if (process.env.API_KEY) {
      key = process.env.API_KEY;
    } else {
        // Fallback final
        // @ts-ignore
        key = import.meta.env.API_KEY || '';
    }
  } catch (e) {
    console.debug("Error leyendo variables de entorno", e);
  }

  if (!key) {
      console.error("⛔ VITALIS ERROR: No se encontró la API KEY. Crea un archivo .env con VITE_API_KEY=...");
      return null;
  }

  // LIMPIEZA AGRESIVA:
  // Elimina comillas, espacios y caracteres invisibles que causan error 403
  key = key.trim().replace(/^["']|["']$/g, '').replace(/\s/g, '');

  if (key.length < 10 || key.includes('undefined') || key.includes('tu_clave')) {
    console.error("⛔ VITALIS ERROR: La API KEY parece inválida o es un placeholder.");
    return null;
  }

  return key;
};

// --- OPCIÓN 1: BÚSQUEDA POR SÍNTOMAS ---
export const searchProductsBySymptoms = async (symptom: string, products: Product[]): Promise<string[]> => {
    const apiKey = getApiKey();
    if (!apiKey) return [];

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Creamos un contexto ligero para no saturar el token limit
        const inventory = products.map(p => `${p.id}: ${p.name} (${p.description})`).join('\n');

        const prompt = `Actúa como un farmacéutico experto. El cliente describe este síntoma: "${symptom}".
        
        Analiza el siguiente inventario y devuelve un array JSON con los IDs de los productos que mejor resuelvan ese síntoma.
        Prioriza coincidencias médicas exactas.
        
        INVENTARIO:
        ${inventory}
        
        Responde SOLO el array JSON de strings (ej: ["1", "5"]). Si ninguno sirve, responde [].`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const text = response.text || "[]";
        return JSON.parse(text);
    } catch (e) {
        console.error("Error en búsqueda por síntomas:", e);
        return [];
    }
};

// --- OPCIÓN 5: VENTA CRUZADA INTELIGENTE ---
export const getCrossSellSuggestion = async (targetProduct: Product, allProducts: Product[]): Promise<{product: Product | undefined, reason: string}> => {
    const apiKey = getApiKey();
    if (!apiKey) return { product: undefined, reason: "" };

    try {
        const ai = new GoogleGenAI({ apiKey });
        
        // Filtrar el producto actual y reducir contexto
        const candidates = allProducts
            .filter(p => p.id !== targetProduct.id && p.stock > 0)
            .map(p => `${p.id}: ${p.name} ($${p.price})`);

        if (candidates.length === 0) return { product: undefined, reason: "" };

        const prompt = `Un cliente está comprando "${targetProduct.name}" (${targetProduct.category}).
        Descripción: ${targetProduct.description}.
        
        De la siguiente lista de productos candidatos, elige EL MEJOR producto complementario para hacer "Cross-Selling" (venta cruzada).
        Ejemplo: Si compra antibiótico, sugiere probióticos o agua. Si compra pañales, sugiere crema.
        
        CANDIDATOS:
        ${candidates.join('\n')}
        
        Responde SOLO un JSON con este formato:
        { "suggestedId": "id_del_producto", "reason": "Frase corta de marketing persuasivo (máx 10 palabras)" }
        
        Si no hay nada lógico, responde { "suggestedId": null, "reason": "" }.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });

        const result = JSON.parse(response.text || "{}");
        
        if (result.suggestedId) {
            const suggestedProduct = allProducts.find(p => p.id === result.suggestedId);
            return { product: suggestedProduct, reason: result.reason };
        }
        return { product: undefined, reason: "" };

    } catch (e) {
        console.error("Error en cross-sell:", e);
        return { product: undefined, reason: "" };
    }
};

// Helper to generate a description for a new product
export const generateProductDescription = async (productName: string): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: Falta API Key.";

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escribe una descripción corta, atractiva y profesional para vender el siguiente producto farmacéutico: "${productName}". Máximo 2 oraciones. En español.`,
    });
    return response.text || "No se pudo generar la descripción.";
  } catch (error: any) {
    console.error(error);
    return "Error generando descripción.";
  }
};

export const generateSocialPost = async (product: Product, platform: 'INSTAGRAM' | 'WHATSAPP'): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: Falta API Key.";

  const prompt = platform === 'INSTAGRAM'
    ? `Actúa como experto en Marketing. Post para Instagram del producto: "${product.name}" ($${product.price}). Desc: "${product.description}". Emojis, Hashtags, Llamado a la acción.`
    : `Mensaje de difusión WhatsApp corto para: "${product.name}" ($${product.price}). Amable, emojis, sin hashtags.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "Error generando post.";
  } catch (error) {
    console.error(error);
    return "Error generando post.";
  }
};

// Virtual Assistant Logic
export const createAssistantChat = (products: Product[]): Chat | null => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
      console.warn("Assistant disabled: Missing or Invalid API Key");
      return null;
  }

  const productContext = products.length > 0 ? products.map(p => 
    `- ${p.name} (${p.category}): $${p.price}. Stock: ${p.stock}.`
  ).join('\n') : "Inventario vacío.";

  const systemInstruction = `
    Eres "VitalBot", farmacéutico virtual de Farmacia Vitalis.
    INVENTARIO ACTUAL:
    ${productContext}
    
    REGLAS:
    1. Responde preguntas de salud básicas y recomienda productos DEL INVENTARIO.
    2. Si el producto no está, dilo amablemente.
    3. Respuestas cortas (max 3 oraciones).
    4. NO recetes medicamentos controlados, sugiere ir al médico.
  `;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return chat;
  } catch (error) {
    console.error("Error creating chat session:", error);
    return null;
  }
};

export const checkInteractions = async (productNames: string[]): Promise<{safe: boolean, message: string}> => {
    const apiKey = getApiKey();
    if (!apiKey || productNames.length < 2) return { safe: true, message: "" };

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Farmacéutico senior. Analiza interacciones peligrosas entre: ${productNames.join(', ')}.
        Responde JSON: { "safe": boolean, "message": "string corto (max 15 palabras) si hay riesgo, o vacío" }.
        Asume safe: true para vitaminas/aseo.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        return { safe: true, message: "" };
    }
};