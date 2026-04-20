
import { Type } from "@google/genai";
import { Product, Order, Bundle } from '../types';
import { getAiClient } from './gemini.client';

export const suggestSymptomBundles = async (products: Product[]): Promise<Partial<Bundle>[]> => {
    try {
        const ai = getAiClient();
        const inventory = products.map(p => `${p.id}: ${p.name} (${p.description}) - $${p.price}`).join('\n');
        const prompt = `Actúa como un estratega de marketing farmacéutico. 
        Analiza este inventario y sugiere 3 COMBOS basados en SINTOMATOLOGÍA (ej: Combo Gripe, Kit Primeros Auxilios, Pack Digestivo).
        
        INVENTARIO:
        ${inventory}
        
        REGLAS:
        1. Cada combo debe tener entre 2 y 3 productos.
        2. El precio del combo debe ser un 10-15% menor a la suma de los individuales.
        3. Devuelve un array JSON de objetos con: name, description, productIds (array de IDs), price, category.
        
        Responde SOLO el JSON.`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
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
                }
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
            .map(p => `${p.id}: ${p.name} ($${p.price})`);

        const prompt = `El cliente está comprando "${baseProduct.name}" ($${baseProduct.price}).
        Sugiere un COMBO UPGRADE agregando UN producto adicional que complemente perfectamente al principal.
        
        CANDIDATOS:
        ${candidates.join('\n')}
        
        REGLAS:
        1. El combo debe llamarse "Tratamiento Completo ${baseProduct.name}" o algo similar.
        2. El precio total debe ser atractivo (ej: base + adicional - 10%).
        3. Responde SOLO JSON: { name, description, productIds: [baseId, extraId], price }.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
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
                }
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
        const history = orders.slice(-50).map(o => o.items.map(i => i.name).join(', ')).join('\n');
        
        const prompt = `Analiza este historial de pedidos recientes y detecta patrones de compra (productos que se compran juntos).
        Sugiere 2 COMBOS PREDICTIVOS basados en estos datos.
        
        HISTORIAL:
        ${history}
        
        INVENTARIO DISPONIBLE (IDs):
        ${products.map(p => `${p.id}: ${p.name}`).join('\n')}
        
        Responde SOLO JSON: [{ name, description, productIds, price, category: "Predictivo" }]`;

        const response = await ai.models.generateContent({
            model: 'gemini-flash-latest',
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
                }
            }
        });
        return JSON.parse(response.text || "[]");
    } catch (e) {
        return [];
    }
};
