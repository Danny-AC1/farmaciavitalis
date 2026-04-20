
import { GoogleGenAI } from "@google/genai";

let aiInstance: GoogleGenAI | null = null;

export const getAiClient = (): GoogleGenAI => {
  if (!aiInstance) {
    // Intentar obtener la clave de múltiples fuentes posibles en orden de prioridad
    const apiKey = 
      process.env.GEMINI_API_KEY || 
      process.env.VITE_GEMINI_API_KEY || 
      process.env.API_KEY || 
      process.env.VITE_API_KEY ||
      (import.meta.env as any).VITE_GEMINI_API_KEY ||
      (import.meta.env as any).VITE_API_KEY ||
      (window as any).GEMINI_API_KEY;

    if (!apiKey || apiKey === "undefined" || apiKey === "null" || apiKey === "") {
      const errorMsg = "La clave de API de Gemini no está configurada en el servidor/entorno. Por favor, asegúrate de haberla agregado en la configuración del proyecto.";
      console.error("CRITICAL: " + errorMsg);
      throw new Error(errorMsg);
    }

    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
};
