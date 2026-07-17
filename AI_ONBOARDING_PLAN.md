# 🗺️ Plan de Implementación: Onboarding Inteligente y Contexto Local (OurTime)

Este documento traza la hoja de ruta técnica para transformar el Asistente de IA de un simple bot de respuestas a un **planificador experto, proactivo y altamente personalizado** que conoce la ubicación de los usuarios y cruza sus gustos.

---

## 📍 Fase 1: Contexto de Ubicación (Geolocalización)
Para que los planes tengan sentido logístico, la IA debe saber dónde están los usuarios.

### Frontend (`src/pages/Chat.tsx`)
1. **Captura de Ubicación:** Integrar el plugin de geolocalización (`@capacitor/geolocation` o `navigator.geolocation`).
2. **Payload:** En el momento de enviar un mensaje, adjuntar de forma transparente la ubicación actual en el body del request hacia la Edge Function.
   ```json
   {
     "text": "Idea para cenar",
     "story_id": "123",
     "location": { "lat": 19.4326, "lng": -99.1332 }
   }
   ```

### Backend (`ai-chat` Edge Function)
1. **Inyección en el Prompt:** Si se recibe la variable `location`, inyectarla directamente en el `system_instruction`:
   > *"Los usuarios se encuentran cerca de las coordenadas [LAT, LNG]. Si recomiendas restaurantes o lugares físicos, DEBEN ser reales y estar geográficamente cerca de esa ubicación."*

---

## 🧠 Fase 2: Base de Datos del "Story Profile"
Necesitamos un lugar donde almacenar de forma estructurada todo lo que la IA vaya aprendiendo de los usuarios.

### Migración SQL (`2026xxxx_ai_preferences.sql`)
1. Añadir columna `ai_preferences` (tipo `JSONB`) a la tabla `story_members` para guardar gustos, alergias y aversiones por individuo.
2. Añadir columna `onboarding_completed` (tipo `BOOLEAN`, default `false`) para saber si la IA ya les hizo la entrevista inicial.

---

## 💬 Fase 3: El Onboarding Conversacional (La Entrevista)
En lugar de un formulario aburrido, la IA debe presentarse e iniciar la conversación de forma orgánica.

### Frontend (`Chat.tsx`)
1. Si el usuario entra al chat y su `onboarding_completed` es `false`, la IA (o el frontend simulando a la IA) envía el primer mensaje automáticamente:
   > *"¡Hola! Soy su asistente de planes de OurTime. Para armarles las mejores citas, me gustaría conocerlos un poco. Cuéntenme, ¿son más de planes al aire libre o de quedarse en casa? ¿Tienen alguna restricción alimenticia?"*

---

## 🕵️ Fase 4: Extracción de Datos Inteligente (El Cerebro)
A medida que los usuarios chatean, debemos extraer sus gustos y guardarlos en el perfil de la base de datos de manera invisible.

### Nueva Arquitectura (Extracción asíncrona o Inline)
Existen dos opciones para implementar esto:
- **Opción A (Inline con Structured Outputs):** Usar la función de *Tool Calling* de Gemini. La IA responde al usuario, pero si detecta un gusto nuevo, llama internamente a una "herramienta" que guarda el dato en la BD antes de responder.
- **Opción B (Background Task):** Un proceso independiente lee el historial reciente del chat de forma programada y usa un modelo rápido para extraer un JSON con los gustos actualizados y reemplazar el campo `ai_preferences`.

**Estructura del JSON a extraer:**
```json
{
  "likes": ["comida italiana", "rock", "senderismo"],
  "dislikes": ["lugares ruidosos", "mariscos"],
  "constraints": ["presupuesto ajustado", "alergia al maní"]
}
```

---

## 🤝 Fase 5: Fusión de Perfiles en el Prompt
La magia final ocurre cuando un usuario pide un plan en el día a día.

### Modificación en `ai-chat` Edge Function
1. Al cargar la información de los miembros, extraer sus respectivos objetos `ai_preferences`.
2. Incluir esta "radiografía" en el contexto del LLM antes de que responda:
   > *"Contexto de la pareja: El Usuario A es vegetariano y le gusta el cine clásico. El Usuario B ama la comida italiana y no le gusta caminar mucho. Su presupuesto actual es ajustado. Sugiéreles un plan para hoy basándote estrictamente en sus gustos combinados."*

---

## 🎯 Próximos Pasos (Next Steps)
Para arrancar, puedes delegarle a un agente analista o desarrollador lo siguiente:
1. Crear y ejecutar la migración de base de datos para la columna `ai_preferences`.
2. Implementar la captura de Geolocalización en `Chat.tsx` y pasarla a la función `ai-chat`.
