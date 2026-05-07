
import { getAiClient } from './gemini.client';
import { Product } from '../types';

export const createAssistantChat = (products: Product[]) => {
  try {
    const ai = getAiClient();
    const productContext = products.slice(0, 50).map(p => `- ${p.name}: $${p.price}`).join('\n');
    const systemInstruction = `Eres Vitalis Asistent. Estos son algunos productos: ${productContext}. Sé amable y breve. No des consejos médicos profundos.`;

    return (ai as any).chats.create({
      model: 'gemini-1.5-flash-8b',
      config: { 
        systemInstruction,
        maxOutputTokens: 300 
      },
    });
  } catch (error) {
    console.error("Error creating assistant chat:", error);
    return null;
  }
};
