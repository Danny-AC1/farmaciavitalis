import { GoogleGenAI, Chat } from "@google/genai";
import { Product } from '../types';

// Helper to generate a description for a new product
export const generateProductDescription = async (productName: string): Promise<string> => {
  if (!process.env.API_KEY) {
    console.warn("API Key not found in environment variables (process.env.API_KEY).");
    return "Descripción no disponible (Falta Configuración de API Key).";
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escribe una descripción corta, atractiva y profesional para vender el siguiente producto farmacéutico: "${productName}". Máximo 2 oraciones. En español.`,
    });
    
    return response.text || "No se pudo generar la descripción.";
  } catch (error: any) {
    console.error("Error generating description:", error);
    const msg = error.message || error.toString();
    if (msg.includes("401") || msg.includes("403")) {
        return "Error: API Key inválida o expirada.";
    }
    return "Error al conectar con la IA.";
  }
};

// Virtual Assistant Logic
export const createAssistantChat = (products: Product[]): Chat | null => {
  if (!process.env.API_KEY) {
      console.warn("Assistant disabled: Missing API Key");
      return null;
  }

  const productContext = products.length > 0 ? products.map(p => 
    `- ${p.name} (${p.category}): $${p.price}. Stock: ${p.stock}. Desc: ${p.description}`
  ).join('\n') : "No hay productos disponibles por el momento.";

  const systemInstruction = `
    Eres "Vitalis Asistent", el asistente virtual farmacéutico de la farmacia "Vitalis".
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
    console.error("Error creating chat session:", error);
    return null;
  }
};