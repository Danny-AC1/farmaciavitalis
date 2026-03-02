
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

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
