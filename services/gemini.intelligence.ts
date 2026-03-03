
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
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined");
        }
        const ai = new GoogleGenAI({ apiKey });
        
        const inventory = allProducts
            .filter(p => p.stock > 0)
            .map(p => `ID: ${p.id} | Nombre: ${p.name} | Cat: ${p.category} | Desc: ${p.description}`)
            .join('\n');

        const prompt = `Actúa como un Farmacéutico Clínico experto con acceso al inventario de Farmacia Vitalis.
        
        CONTEXTO:
        El cliente busca un producto que NO tenemos en stock o no existe en el catálogo: "${missingProduct}".
        Tu misión es encontrar las mejores alternativas disponibles en nuestro inventario.

        INVENTARIO DISPONIBLE (Solo productos con stock):
        ${inventory}
        
        TAREAS:
        1. Identifica el principio activo y la familia terapéutica de "${missingProduct}".
        2. Busca en el INVENTARIO productos que tengan el MISMO principio activo (Genéricos/Bioequivalentes). Agrégalos a "generics".
        3. Busca productos que, aunque tengan distinto principio activo, pertenezcan a la MISMA FAMILIA TERAPÉUTICA y sirvan para lo mismo. Agrégalos a "therapeuticAlternatives".
        
        REGLAS CRÍTICAS:
        - Si el cliente busca una marca (ej: Ampibex), sugiere el genérico (ej: Ampicilina) en la sección "generics".
        - En "therapeuticAlternatives", explica de forma muy breve y profesional por qué es una buena opción (ej: "Misma familia de penicilinas, espectro similar").
        - Si no encuentras nada que sea realmente seguro sugerir, deja los arrays vacíos.
        - Devuelve EXCLUSIVAMENTE el formato JSON solicitado.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
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
    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not defined");
        }
        const ai = new GoogleGenAI({ apiKey });
        
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
            model: 'gemini-3-flash-preview',
            contents: prompt
        });

        return response.text || "No hay suficientes datos para un análisis profundo aún.";
    } catch (e) {
        return "Error al generar el estudio de mercado.";
    }
};
