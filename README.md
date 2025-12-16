# Farmacia Vitalis 💊

Aplicación de catálogo farmacéutico con IA integrada.

## 🔐 Configuración de Seguridad (API Key)

Para que la Inteligencia Artificial (Búsqueda por síntomas, Asistente, etc.) funcione, necesitas una API Key de Google Gemini.

**IMPORTANTE:** Nunca subas tu API Key a GitHub.

### Pasos para configurar:

1. **Generar Clave:** Ve a [Google AI Studio](https://aistudio.google.com/app/apikey) y crea una clave nueva.
2. **Crear archivo local:**
   - Crea un archivo llamado `.env` en la raíz del proyecto.
   - Pega tu clave con el siguiente formato:
     ```env
     VITE_API_KEY=Tu_Clave_Empieza_Con_AIzaSy...
     ```
3. **Ejecutar proyecto:**
   ```bash
   npm run dev
   ```

### Solución de Problemas (Error 403/404)

Si recibes errores de API:

1. Asegúrate de que tu clave esté habilitada en Google Cloud Console.
2. Verifica que no hayas subido el archivo `.env` al repositorio. Si lo hiciste, Google revoca la clave automáticamente.
3. Genera una nueva clave y repite los pasos.
