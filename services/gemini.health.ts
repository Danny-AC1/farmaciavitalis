
import { GoogleGenAI, Type } from "@google/genai";

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
