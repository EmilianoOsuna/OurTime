# Plan de Migración: Chat a Asistente de IA (OurTime)

Este plan detalla los pasos para eliminar el chat en tiempo real actual y reemplazarlo por un asistente de Inteligencia Artificial enfocado en dar sugerencias de planes, citas y actividades a distancia para los miembros de la historia.

---

## Fase 1: Cambios en la Base de Datos (Supabase)

Actualmente, la tabla `messages` requiere un `sender_id` que sea un usuario válido (`auth.users`). La IA no es un usuario real, por lo que debemos adaptar la estructura.

1. **Modificar la tabla `messages`**:
   - Ejecutar una migración SQL para hacer que `sender_id` sea opcional o añadir un identificador de rol.
   - **Ejemplo SQL:**
     ```sql
     ALTER TABLE messages ALTER COLUMN sender_id DROP NOT NULL;
     ALTER TABLE messages ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'ai'));
     ```
2. **Actualizar Políticas (RLS)**:
   - Permitir inserciones si el `role = 'ai'` (esto usualmente lo hará el servidor, así que con la Service Role Key bastará, pero hay que asegurar que la vista de mensajes sí traiga los mensajes de la IA).

## Fase 2: Crear el Backend del Asistente (Supabase Edge Functions)

Para interactuar con la IA de forma segura (sin exponer API Keys en el cliente), crearemos una función en el servidor.

1. **Crear Edge Function `ai-chat`**:
   - Crear una nueva función en `supabase/functions/ai-chat/index.ts`.
   - Configurar variables de entorno (ej. `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` o `GEMINI_API_KEY`).
2. **Lógica de la Función**:
   - Recibir la petición del cliente con el texto del usuario y el `story_id`.
   - (Opcional pero recomendado) Obtener contexto adicional de la base de datos: leer la tabla `stories` para saber si es pareja, familia o amigos, y leer planes anteriores de la tabla `plans`.
   - Insertar el mensaje del usuario en `messages`.
   - Llamar al LLM con un **Prompt de Sistema** claro: *"Eres el asistente de OurTime. Tu objetivo es sugerir planes para parejas/amigos. Da ideas creativas, restaurantes locales si te dicen dónde están, o ideas de citas virtuales si están a distancia."*
   - Insertar la respuesta de la IA en `messages` con `role = 'ai'` y `sender_id = null`.
   - Devolver la respuesta al cliente.

## Fase 3: Modificaciones en el Frontend (React)

1. **Limpieza del Realtime (`src/pages/Chat.tsx`)**:
   - Eliminar `supabase.channel(...)`. Ya no necesitamos websockets para recibir mensajes del compañero.
   - Remover la lógica que marca los mensajes como "leídos" (`read_at`) y eliminar las notificaciones push (`sendPushToStoryMembers`) enviadas al chatear.
2. **Rediseñar la interfaz del Chat (`Chat.tsx`)**:
   - Cambiar el título superior de "El nombre del compañero" a **"Asistente OurTime"** o **"Ideas de Planes"**.
   - Cambiar el avatar del compañero por un icono estilizado de IA (quizás un logo de OurTime animado o estrellas mágicas).
   - Modificar las burbujas de mensaje para que las respuestas de la IA tengan un diseño distintivo (por ejemplo, el color `--blue` o con un borde degradado sutil).
3. **Flujo de Envío (Request-Response)**:
   - Al enviar, en lugar de insertar directamente en la base de datos, llamar a la Edge Function:
     ```typescript
     setLoading(true);
     await supabase.functions.invoke('ai-chat', { body: { text, story_id: activeStoryId } });
     // Volver a hacer fetch de los mensajes o agregar la respuesta al estado local
     setLoading(false);
     ```
   - Añadir un indicador de "Escribiendo..." mientras se espera la respuesta de la Edge Function.
4. **Simplificar `AppShell.tsx`**:
   - Quitar la validación de notificaciones/badges rojos en el icono del chat del menú inferior.

## Fase 4: Opciones de Experiencia de Usuario (Opcional)
- **Mensajes Predefinidos (Chips)**: Al abrir el chat en blanco, mostrar botones rápidos como *"Ideas para aniversario"*, *"Juegos a distancia"*, *"Restaurantes románticos cerca de mi"*.
- **Integración con Planes**: Lograr que si la IA sugiere un plan, retorne algún JSON estructurado que el frontend pueda renderizar con un botón de *"Añadir a nuestros Planes"*.

---

**Nota para Claude/Agentes:** 
Al implementar esto, asegurarse de correr las migraciones de SQL requeridas, generar la Edge Function localmente para probar y remover el estado innecesario en React para no dejar código "fantasma" de la versión anterior del chat.
