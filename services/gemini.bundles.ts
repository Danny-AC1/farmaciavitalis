
import { Type } from "@google/genai";
import { Product, Order, Bundle } from '../types';
import { getAiClient } from './gemini.client';

export const suggestSymptomBundles = async (products: Product[]): Promise<Partial<Bundle>[]> => {
    try {
        const ai = getAiClient();
        // Limit context for bundles
        const inventory = products.slice(0, 30).map(p => `${p.id}: ${p.name}`).join('\n');
        const prompt = `Sugiere 3 combos de salud (Gripe, Digestivo, etc) usando estos IDs:
        ${inventory}
        Responde array JSON: [{name, description, productIds, price, category}]. Precio 10% descuento.`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-8b',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            productIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                            price: { type: Type.NUMBER },
                            category: { type: Type.STRING }
                        },
                        required: ["name", "description", "productIds", "price", "category"]
                    }
                },
                maxOutputTokens: 600
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        console.error("Error sugiriendo combos:", e);
        return [];
    }
};

export const suggestUpgradeBundle = async (baseProduct: Product, allProducts: Product[]): Promise<Partial<Bundle> | null> => {
    try {
        const ai = getAiClient();
        const candidates = allProducts
            .filter(p => p.id !== baseProduct.id && p.stock > 0)
            .slice(0, 20)
            .map(p => `${p.id}: ${p.name}`);

        const prompt = `Cliente compra "${baseProduct.name}".
        CANDIDATOS:
        ${candidates.join('\n')}
        Sugiere COMBO UPGRADE (base + 1 extra). Responde JSON: { name, description, productIds: [baseId, extraId], price }.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-8b',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        description: { type: Type.STRING },
                        productIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        price: { type: Type.NUMBER }
                    },
                    required: ["name", "description", "productIds", "price"]
                },
                maxOutputTokens: 250
            }
        });
        return JSON.parse(response.text || "null");
    } catch (e) {
        return null;
    }
};

export const analyzePredictiveBundles = async (orders: Order[], products: Product[]): Promise<Partial<Bundle>[]> => {
    try {
        const ai = getAiClient();
        // Simplificar historial para la IA
        const history = orders.slice(-20).map(o => o.items.slice(0, 3).map(i => i.name).join(', ')).join('\n');
        
        const prompt = `Analiza patrones de compra y sugiere 2 COMBOS PREDICTIVOS.
        HISTORIAL:
        ${history}
        DISPONIBLES:
        ${products.slice(0, 30).map(p => `${p.id}: ${p.name}`).join('\n')}
        Responde array JSON: [{ name, description, productIds, price, category: "Predictivo" }]`;

        const response = await ai.models.generateContent({
            model: 'gemini-1.5-flash-8b',
            contents: prompt,
            config: { 
                responseMimeType: 'application/json',
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            name: { type: Type.STRING },
                            description: { type: Type.STRING },
                            productIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                            price: { type: Type.NUMBER },
                            category: { type: Type.STRING }
                        },
                        required: ["name", "description", "productIds", "price", "category"]
                    }
                },
                maxOutputTokens: 500
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
};
