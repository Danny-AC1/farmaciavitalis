
import { GoogleGenAI, Type } from "@google/genai";
import { Product, MissedSale, SearchLog } from '../types';

export interface SubstitutionResult {
    generics: Product[];
    therapeuticAlternatives: {
        product: Product;
        reason: string;
    }[];
}

export const suggestSubstitutes = async (missingProduct: string, allProducts: Product[]): Promise<SubstitutionResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const inventory = allProducts
            .filter(p => p.stock > 0)
            .map(p => `${p.id}: ${p.name} (${p.description}) - $${p.price}`)
            .join('\n');

        const prompt = `Actúa como un experto farmacéutico clínico. 
        El cliente busca: "${missingProduct}", pero NO hay stock.
        Analiza el inventario disponible y sugiere alternativas.
        
        INVENTARIO DISPONIBLE:
        ${inventory}
        
        REGLAS:
        1. "generics": Productos con el MISMO principio activo pero diferente marca.
        2. "therapeuticAlternatives": Diferente principio activo pero MISMA función terapéutica. Explica brevemente por qué sirve (ej: "Mismo efecto analgésico").
        3. Devuelve un objeto JSON con: generics (array de IDs), therapeuticAlternatives (array de objetos { id, reason }).
        
        Responde SOLO el JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        generics: { type: Type.ARRAY, items: { type: Type.STRING } },
                        therapeuticAlternatives: { 
                            type: Type.ARRAY, 
                            items: { 
                                type: Type.OBJECT,
                                properties: {
                                    id: { type: Type.STRING },
                                    reason: { type: Type.STRING }
                                },
                                required: ["id", "reason"]
                            }
                        }
                    },
                    required: ["generics", "therapeuticAlternatives"]
                }
            }
        });

        const raw = JSON.parse(response.text || "{}");
        
        return {
            generics: allProducts.filter(p => raw.generics.includes(p.id)),
            therapeuticAlternatives: (raw.therapeuticAlternatives || []).map((alt: any) => ({
                product: allProducts.find(p => p.id === alt.id),
                reason: alt.reason
            })).filter((alt: any) => alt.product !== undefined)
        };
    } catch (e) {
        console.error("Error sugiriendo sustitutos:", e);
        return { generics: [], therapeuticAlternatives: [] };
    }
};

export const analyzeMarketOpportunities = async (missedSales: MissedSale[], searchLogs: SearchLog[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const data = `
        VENTAS PERDIDAS (Falta de stock):
        ${missedSales.map(m => `- ${m.term} (${m.count} veces)`).join('\n')}
        
        BÚSQUEDAS FRECUENTES:
        ${searchLogs.map(s => `- ${s.term} (${s.count} veces)`).join('\n')}
        `;

        const prompt = `Actúa como un consultor de negocios farmacéuticos de alto nivel.
        Analiza estos datos de demanda insatisfecha y búsquedas de clientes.
        Genera un informe ejecutivo de "Estudio de Oportunidades" que incluya:
        1. Top 3 productos que DEBES comprar (alta demanda sin stock).
        2. Nuevos nichos detectados (búsquedas de cosas que no vendes).
        3. Recomendación estratégica de precios o promociones.
        
        DATOS:
        ${data}
        
        Responde en formato Markdown profesional con emojis.`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
            contents: prompt
        });

        return response.text || "No hay suficientes datos para un análisis profundo aún.";
    } catch (e) {
        return "Error al generar el estudio de mercado.";
    }
};
