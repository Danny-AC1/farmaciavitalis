
import { getAiClient } from './gemini.client';
import { Product } from '../types';

export const createAssistantChat = (products: Product[]) => {
  try {
    const ai = getAiClient();
    const productContext = products.map(p => `- ${p.name}: $${p.price}`).join('\n');
    const systemInstruction = `Eres Vitalis Asistent. Conoces este inventario: ${productContext}. Sé amable y breve.`;

    return (ai as any).chats.create({
      model: 'gemini-flash-latest',
      config: { systemInstruction },
    });
  } catch (error) {
    console.error("Error creating assistant chat:", error);
    return null;
  }
};
