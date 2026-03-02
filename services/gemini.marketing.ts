
import { GoogleGenAI } from "@google/genai";
import { Product } from '../types';

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
