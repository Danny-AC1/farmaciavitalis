# Farmacia Vitalis 💊

Aplicación de catálogo farmacéutico con IA integrada.

## 🔐 Configuración de Seguridad (API Key)

Para que la Inteligencia Artificial (Búsqueda por síntomas, Asistente, etc.) funcione, necesitas una API Key de Google Gemini.

**IMPORTANTE:** Nunca subas tu API Key a GitHub. El archivo `.env` está en la lista de ignorados para protegerte.

### Pasos para configurar:

1. **Generar Clave:**
   Ve a [Google AI Studio](https://aistudio.google.com/app/apikey) y crea una clave nueva.

2. **Configurar entorno local:**

   - Copia el archivo `.env.example` y renómbralo a `.env`:
     ```bash
     cp .env.example .env
     ```
   - Abre el nuevo archivo `.env` y pega tu clave:
     ```env
     VITE_API_KEY=AIzaSy...TuClaveReal
     ```

3. **Ejecutar proyecto:**
   ```bash
   npm run dev
   ```

### 🚨 Si recibes errores de "API Key Expuesta" o "Error 403"

Si Google detecta que subiste tu clave a GitHub, la bloqueará automáticamente.

1. Ejecuta en tu terminal: `git rm --cached .env`
2. Genera una **nueva clave** en Google AI Studio.
3. Pon la nueva clave en tu archivo `.env`.
