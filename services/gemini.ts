import { GoogleGenAI, Chat } from "@google/genai";
import { Product } from '../types';

// Helper to generate a description for a new product
export const generateProductDescription = async (productName: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found");
    return "Descripción no disponible (API Key faltante).";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escribe una descripción corta, atractiva y profesional para vender el siguiente producto farmacéutico: "${productName}". Máximo 2 oraciones. En español.`,
    });
    
    return response.text || "No se pudo generar la descripción.";
  } catch (error) {
    console.error("Error generating description:", error);
    return "Error al generar la descripción.";
  }
};

// Virtual Assistant Logic
export const createAssistantChat = (products: Product[]): Chat | null => {
  if (!process.env.API_KEY) return null;

  const productContext = products.map(p => 
    `- ${p.name} (${p.category}): $${p.price}. Stock: ${p.stock}. Desc: ${p.description}`
  ).join('\n');

  const systemInstruction = `
    Eres "VitalBot", el asistente virtual farmacéutico de la farmacia "Vitales".
    Tu objetivo es ayudar a los clientes con información sobre productos y recomendaciones básicas.
    
    REGLAS IMPORTANTES:
    1. INVENTARIO: Solo recomiendas productos que están en la siguiente lista. Si no está en la lista, di que no lo tenemos.
    2. SEGURIDAD: NO eres médico. Para síntomas graves o recetas, recomienda ir al doctor. Usa frases como "Te sugeriría...", "Este producto suele usarse para...".
    3. TONO: Amable, profesional y empático.
    4. RESPUESTAS: Cortas y concisas (máximo 3 oraciones salvo que pidan detalles).
    5. DETALLES: Si te preguntan "para qué sirve", explica basándote en la descripción o conocimiento general farmacéutico.

    LISTA DE PRODUCTOS DISPONIBLES EN TIENDA:
    ${productContext}
  `;

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemInstruction,
      },
    });
    return chat;
  } catch (error) {
    console.error("Error creating chat:", error);
    return null;
  }
};