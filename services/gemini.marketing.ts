
import { Product } from '../types';
import { getAiClient } from './gemini.client';

export const generateSocialPost = async (product: Product, platform: 'INSTAGRAM' | 'WHATSAPP'): Promise<string> => {
  const prompt = platform === 'INSTAGRAM'
    ? `Post Instagram para: "${product.name}". Emojis, hashtags, comercial.`
    : `WhatsApp difusión para: "${product.name}". Amable y directo.`;

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash-8b',
      contents: prompt,
      config: { maxOutputTokens: 250 }
    });
    return response.text || "Error generando post.";
  } catch (error) {
    console.error("Error en generateSocialPost:", error);
    return "Error generando post.";
  }
};
