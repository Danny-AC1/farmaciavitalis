
import { GoogleGenAI, Type } from "@google/genai";
import { Product } from '../types';

// --- BÚSQUEDA POR SÍNTOMAS ---
export const searchProductsBySymptoms = async (symptom: string, products: Product[]): Promise<string[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const inventory = products.map(p => `${p.id}: ${p.name} (${p.description})`).join('\n');
        const prompt = `Actúa como un farmacéutico experto. El cliente describe este síntoma: "${symptom}".
        Analiza el siguiente inventario y devuelve un array JSON con los IDs de los productos que mejor resuelvan ese síntoma.
        INVENTARIO:
        ${inventory}
        Responde SOLO el array JSON de strings. Si ninguno sirve, responde [].`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Error en búsqueda por síntomas:", e);
        return [];
    }
};

// --- VENTA CRUZADA INTELIGENTE ---
export const getCrossSellSuggestion = async (targetProduct: Product, allProducts: Product[]): Promise<{product: Product | undefined, reason: string}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const candidates = allProducts
            .filter(p => p.id !== targetProduct.id && p.stock > 0)
            .map(p => `${p.id}: ${p.name} ($${p.price})`);

        if (candidates.length === 0) return { product: undefined, reason: "" };

        const prompt = `Un cliente está comprando "${targetProduct.name}" (${targetProduct.category}).
        CANDIDATOS:
        ${candidates.join('\n')}
        Elige EL MEJOR producto complementario. Responde SOLO JSON:
        { "suggestedId": "id", "reason": "Frase corta persuasiva" }`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        suggestedId: { type: Type.STRING },
                        reason: { type: Type.STRING }
                    },
                    required: ["suggestedId", "reason"]
                }
            }
        });

        const result = JSON.parse(response.text || "{}");
        if (result.suggestedId && result.suggestedId !== "null") {
            const suggestedProduct = allProducts.find(p => p.id === result.suggestedId);
            return { product: suggestedProduct, reason: result.reason };
        }
        return { product: undefined, reason: "" };
    } catch (e) {
        return { product: undefined, reason: "" };
    }
};

// --- GENERADOR DE DESCRIPCIONES MEJORADO (PUNTO 5) ---
export const generateProductDescription = async (
    productName: string, 
    category: string, 
    tone: 'CLINICO' | 'PERSUASIVO' | 'CERCANO' = 'PERSUASIVO'
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const toneInstructions = {
    CLINICO: "Enfoque técnico, basado en evidencia, resalta componentes y farmacocinética de forma seria.",
    PERSUASIVO: "Enfoque de ventas, resalta el alivio rápido, la conveniencia y por qué es la mejor opción.",
    CERCANO: "Enfoque amable y familiar, ideal para cuidado personal o bebés, usa lenguaje sencillo y reconfortante."
  };

  const prompt = `Actúa como un Senior Pharmaceutical Copywriter para Farmacia Vitalis.
  PRODUCTO: "${productName}"
  CATEGORÍA: "${category}"
  TONO REQUERIDO: ${toneInstructions[tone]}

  REGLAS DE ORO:
  1. No inventes dosis médicas específicas.
  2. Empieza con el beneficio más potente.
  3. Menciona para qué malestar es ideal basándote en el nombre.
  4. Mantén la longitud bajo 200 caracteres para que luzca bien en el catálogo.
  5. Idioma: Español.

  Estructura esperada: [Beneficio de impacto] + [Uso recomendado] + [Cierre de confianza].`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text?.trim() || "No se pudo generar la descripción.";
  } catch (error: any) {
    console.error(error);
    return "Error generando descripción.";
  }
};

export const generateSocialPost = async (product: Product, platform: 'INSTAGRAM' | 'WHATSAPP'): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = platform === 'INSTAGRAM'
    ? `Post Instagram para: "${product.name}". Emojis, hashtags, comercial.`
    : `WhatsApp difusión para: "${product.name}". Amable y directo.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Error generando post.";
  } catch (error) {
    return "Error generando post.";
  }
};

export const createAssistantChat = (products: Product[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const productContext = products.map(p => `- ${p.name}: $${p.price}`).join('\n');
  const systemInstruction = `Eres Vitalis Asistent. Conoces este inventario: ${productContext}. Sé amable y breve.`;

  try {
    return ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction },
    });
  } catch (error) {
    return null;
  }
};

export const checkInteractions = async (productNames: string[]): Promise<{safe: boolean, message: string}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    if (productNames.length < 2) return { safe: true, message: "" };
    try {
        const prompt = `Analiza interacciones entre: ${productNames.join(', ')}. Responde JSON {safe, message}.`;
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: { safe: { type: Type.BOOLEAN }, message: { type: Type.STRING } },
                    required: ["safe", "message"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { safe: true, message: "" };
    }
};
