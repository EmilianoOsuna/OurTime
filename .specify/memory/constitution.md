<!--
  SYNC IMPACT REPORT — Constitución OurTime v1.0.0
  Version change: (template) → 1.0.0 (new constitution)
  Principles added: 5 (I. Mobile-First/PWA, II. Privacidad, III. UX Premium, IV. Simplicidad/YAGNI, V. Supabase-First)
  Sections added: Stack Tecnológico, Seguridad y Privacidad, UX/UI Design System, Performance, Manejo de Datos, Desarrollo y Workflow
  Sections removed: None (new file)
  Templates requiring updates: None (templates are generic, constitution values filled at plan-time)
  TODO: None
-->

# Constitución OurTime

## Principios Fundamentales

### I. Mobile-First / PWA
La aplicación debe ser completamente funcional como Progressive Web App. Esto implica: soporte offline con Service Workers, instalable en home screen, diseño responsive priorizando móvil (mobile-first), y carga progresiva de recursos. Toda feature nueva debe verificarse en viewport móvil antes que en desktop.

### II. Privacidad y Datos
OurTime maneja datos íntimos de pareja. Toda la información debe protegerse mediante Row Level Security (RLS) en Supabase, políticas de acceso mínimas por usuario, y validación en servidor. Nunca exponer datos de una pareja a otra. El almacenamiento de fotos debe usar buckets privados con políticas restringidas.

### III. UX Premium / Editorial
Cada interacción debe sentirse premium. Esto incluye: animaciones fluidas vía framer-motion, transiciones de página, micro-interacciones en botones y cards, diseño editorial con tipografía jerárquica, espaciado generoso, y atención al detalle visual. El componente `EditorialCard` es el bloque fundamental de la identidad visual.

### IV. Simplicidad (YAGNI)
No agregar complejidad antes de tiempo. Cada feature debe implementarse como MVP funcional antes de iterar. No añadir bibliotecas, componentes, o abstracciones hasta que sean estrictamente necesarias. Preferir código directo sobre patrones innecesarios. La claridad del código es prioridad sobre la "elegancia" arquitectónica.

### V. Supabase-First Backend
Supabase es la única fuente de backend. No agregar servidores, APIs, o bases de datos adicionales. Toda la lógica de negocio debe residir en: RLS policies para autorización, Database Functions para lógica compleja, Storage para archivos, y Realtime para actualizaciones en vivo. El esquema de base de datos es la fuente de verdad del modelo de datos.

## Stack Tecnológico (Mandatorio)

| Capa | Tecnología | Versión Mínima |
|------|-----------|----------------|
| Framework | React | 19.x |
| Lenguaje | TypeScript | 6.x |
| Build | Vite | 6.x |
| Estilos | TailwindCSS | 4.x |
| Animaciones | Framer Motion | 12.x |
| Backend | Supabase (JS Client) | 2.x |
| Iconos | Lucide React | 1.x |
| PWA | vite-plugin-pwa | 1.x |
| Ruteo | React Router DOM | 7.x |

Queda prohibido agregar: backend adicional (Express, Node server, etc.), CSS frameworks alternativos, librerías de UI completas (shadcn, Material UI, Chakra), o bibliotecas de animación diferentes a framer-motion.

## Seguridad y Privacidad

- **RLS Obligatorio**: Toda tabla en Supabase debe tener RLS habilitado con políticas que filtren por `couple_id` del usuario autenticado.
- **Buckets Privados**: Las imágenes de la galería deben almacenarse en buckets privados con políticas que solo permitan lectura/escritura al `couple_id` correspondiente.
- **Auth**: Usar exclusivamente Supabase Auth. No almacenar tokens manualmente. El `AuthContext` es la única fuente de verdad de sesión.
- **Validación**: Validar datos tanto en frontend como en RLS policies. Nunca confiar exclusivamente en el cliente.
- **Datos Sensibles**: Los campos como `anniversary_date`, transacciones financieras, y fotos personales deben tratarse como datos sensibles.

## UX/UI Design System

- **Componente Base**: `EditorialCard` es el bloque visual fundamental. Usarlo para tarjetas, secciones, y contenedores destacados.
- **Paleta**: Usar las variables CSS de Tailwind (primary, secondary, surface, outline, etc.). Mantener consistencia con el theme actual.
- **Tipografía**: Títulos en `font-extrabold tracking-tight`, cuerpo en `font-medium`. Usar jerarquía clara.
- **Animaciones**: Toda entrada de página debe usar `framer-motion` con `initial={{ opacity: 0, y: 20 }}` y `animate={{ opacity: 1, y: 0 }}`.
- **Micro-interacciones**: Botones deben tener `hover:scale-105 active:scale-95 transition-all`. Cards deben elevarse en hover.
- **Idioma**: UI en español. Fechas en formato `es-MX` o `es-ES`.

## Performance

- **Lazy Loading**: Las rutas deben cargarse con `React.lazy()` y `Suspense`.
- **Imágenes**: Optimizar imágenes antes de subir. Usar `loading="lazy"` en todas las `<img>`.
- **PWA**: El service worker debe cachear assets estáticos y permitir navegación offline básica.
- **Bundle**: Monitorear tamaño del bundle. Evitar imports masivos. Preferir imports específicos de lucide-react.
- **Animaciones**: Preferir `transform` y `opacity` para animaciones (compositor-friendly). Evitar animar `width`, `height`, o `top/left`.

## Manejo de Datos

- **Esquema Supabase**: Las tablas centrales son `couples`, `profiles`, `plans`, `memories`, `transactions`. No desviarse sin justificación documentada.
- **Tipos Compartidos**: Los tipos (`PlanType`, `MemoryType`, `TransactionType`, `CoupleType`) están definidos en `src/lib/supabase.ts`. Mantenerlos sincronizados con el esquema real de DB.
- **Relaciones**: Toda data pertenece a un `couple_id`. Las `memories` pueden opcionalmente vincularse a un `plan_id`.
- **Migrations**: Documentar cambios de esquema en scripts SQL dentro del proyecto. No modificar la DB directamente sin registro.

## Desarrollo y Workflow (SpecKit Flow)

1. **Analyze** (`/speckit.analyze`): Analizar la solicitud y determinar alcance.
2. **Clarify** (`/speckit.clarify`): Si hay ambigüedad, preguntar antes de proceder.
3. **Plan** (`/speckit.plan`): Generar plan de implementación con research, data model, y quickstart.
4. **Tasks** (`/speckit.tasks`): Desglosar en tareas atómicas organizadas por user stories.
5. **Implement** (`/speckit.implement`): Implementar tarea por tarea, verificando cada una.
6. **Checklist** (`/speckit.checklist`): Validar que la implementación cumple la spec.

Toda feature debe pasar por este flujo. No implementar directamente sin pasar por analyze/plan.

## Gobernanza

- Esta constitución está por encima de cualquier otra práctica o preferencia personal.
- Amendments requieren: documento de propuesta, aprobación, y plan de migración.
- Toda implementación debe verificar cumplimiento con esta constitución.
- La complejidad debe justificarse explícitamente cuando viole el principio de Simplicidad (YAGNI).
- Usar AGENTS.md para guía de desarrollo en tiempo real.

**Version**: 1.0.0 | **Ratificada**: 2026-06-07 | **Última Enmienda**: 2026-06-07
