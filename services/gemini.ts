import { GoogleGenAI, Chat } from "@google/genai";
import { Product } from '../types';

// Helper robusto para obtener la API Key en entorno Vite
const getApiKey = (): string | null => {
  let key = '';

  // NOTA: Vite reemplaza 'process.env.API_KEY' con el string literal en tiempo de compilación.
  // No debemos comprobar 'typeof process' aquí porque en el navegador process no existe,
  // pero el reemplazo de string SÍ ocurre.
  try {
    // @ts-ignore
    if (import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      key = import.meta.env.VITE_API_KEY;
    } else if (process.env.API_KEY) {
      key = process.env.API_KEY;
    } else {
        // Fallback final
        // @ts-ignore
        key = import.meta.env.API_KEY || '';
    }
  } catch (e) {
    console.debug("Error leyendo variables de entorno", e);
  }

  if (!key) return null;

  // LIMPIEZA AGRESIVA:
  // A veces las claves vienen como '"AIza..."' (con comillas literales) desde Vercel/env.
  // Eliminamos comillas simples y dobles del inicio y final.
  key = key.trim();
  key = key.replace(/^["']|["']$/g, '');

  // Log de depuración seguro (solo muestra los primeros 6 caracteres)
  if (key.length > 10) {
      console.log(`🔑 API Key detectada: ${key.substring(0, 6)}...${key.substring(key.length - 4)} (Longitud: ${key.length})`);
  } else {
      console.warn("⚠️ API Key detectada pero parece muy corta o inválida.");
  }

  // Validaciones básicas
  if (key === '' || key.includes('undefined') || key.includes('tu_clave')) {
    return null;
  }

  return key;
};

// Helper to generate a description for a new product
export const generateProductDescription = async (productName: string): Promise<string> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    return "Error: Falta configurar la API Key (VITE_API_KEY) en el archivo .env o Vercel.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Escribe una descripción corta, atractiva y profesional para vender el siguiente producto farmacéutico: "${productName}". Máximo 2 oraciones. En español.`,
    });
    
    return response.text || "No se pudo generar la descripción.";
  } catch (error: any) {
    console.error("Error generating description:", error);
    const msg = error.message || error.toString();
    if (msg.includes("401") || msg.includes("403")) {
        return "Error 403: API Key rechazada. Verifica en Google Cloud Console que la 'Google Generative AI API' esté habilitada.";
    }
    if (msg.includes("404")) {
        return "Error 404: Modelo no encontrado. Tu clave podría no tener acceso a gemini-2.5-flash.";
    }
    return "Error de conexión con IA.";
  }
};

export const generateSocialPost = async (product: Product, platform: 'INSTAGRAM' | 'WHATSAPP'): Promise<string> => {
  const apiKey = getApiKey();
  if (!apiKey) return "Error: Falta API Key.";

  const prompt = platform === 'INSTAGRAM'
    ? `Actúa como un experto en Marketing Digital para la farmacia "Vitalis". Crea un caption de Instagram/Facebook atractivo para el producto: "${product.name}" (Precio: $${product.price}). 
       La descripción del producto es: "${product.description}".
       Requisitos:
       1. Usa emojis médicos y alegres.
       2. Destaca el beneficio principal.
       3. Incluye un llamado a la acción para pedir a domicilio en Machalilla.
       4. Agrega 5 hashtags relevantes (#FarmaciaVitalis #Salud #Machalilla...).`
    : `Actúa como un vendedor amable de la farmacia "Vitalis". Crea un mensaje corto para lista de difusión de WhatsApp ofreciendo: "${product.name}" a $${product.price}.
       Requisitos:
       1. Saludo breve y amigable.
       2. Emoji llamativo al inicio.
       3. Menciona que tenemos envíos a domicilio.
       4. Sin hashtags.`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "No se pudo generar el post.";
  } catch (error) {
    console.error(error);
    return "Error generando el post.";
  }
};

// Virtual Assistant Logic
export const createAssistantChat = (products: Product[]): Chat | null => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
      console.warn("Assistant disabled: Missing or Invalid API Key");
      return null;
  }

  const productContext = products.length > 0 ? products.map(p => 
    `- ${p.name} (${p.category}): $${p.price}. Stock: ${p.stock}. Desc: ${p.description}`
  ).join('\n') : "No hay productos disponibles por el momento.";

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
    const ai = new GoogleGenAI({ apiKey });
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

export const checkInteractions = async (productNames: string[]): Promise<{safe: boolean, message: string}> => {
    const apiKey = getApiKey();
    if (!apiKey || productNames.length < 2) return { safe: true, message: "" };

    try {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Actúa como farmacéutico senior. Analiza si existe alguna INTERACCIÓN PELIGROSA O PRECAUCIÓN IMPORTANTE al combinar estos productos:
        ${productNames.join(', ')}
        
        Responde SOLO en este formato JSON:
        { "safe": true/false, "message": "Mensaje corto de advertencia (máx 15 palabras) si no es seguro, o string vacío si es seguro." }
        
        Si son vitaminas o productos de aseo, asume safe: true. Solo alerta interacciones farmacológicas reales (ej: Alcohol + Antibiótico).`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' }
        });
        
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        console.error(e);
        return { safe: true, message: "" };
    }
};