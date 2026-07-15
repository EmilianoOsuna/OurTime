---
name: OurTime
description: App de relaciones compartidas y recuerdos
colors:
  primary: "#F17720"
  secondary: "#0474BA"
  neutral-bg: "#F4EEE4"
  neutral-ink: "#211D18"
typography:
  display:
    fontFamily: "'Newsreader', Georgia, serif"
    fontWeight: 500
    lineHeight: 1.02
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontWeight: 400
rounded:
  sm: "14px"
  md: "22px"
  lg: "30px"
  full: "999px"
spacing:
  sm: "8px"
  md: "16px"
components:
  button-primary:
    backgroundColor: "{colors.neutral-ink}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.full}"
    padding: "15px 24px"
  button-orange:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
    padding: "15px 24px"
  card:
    backgroundColor: "#FFFCF7"
    rounded: "{rounded.md}"
---

# Design System: OurTime

## 1. Overview

**Creative North Star: "El Álbum de Conexiones"**

El diseño visual de OurTime evoca un entorno íntimo, vivo y táctil, priorizando la conexión humana. Aprovechando una base de colores "papel y tinta" cálidos, se contrasta con acentos vibrantes que dan vida a la interfaz. A diferencia de un sistema de bases de datos o de una red social pública, esta aplicación se siente cálida, minimalista y viva, con capas flotantes modernas. Se rechaza explícitamente cualquier estética estéril, corporativa o excesivamente utilitaria.

**Key Characteristics:**
- Estilo editorial con un toque moderno y acogedor.
- Calidez en el contraste (fondos tipo papel contra tintas oscuras).
- Superficies flotantes y efectos cristalinos suaves para diferenciar capas.
- Interacciones táctiles, amigables y fluidas.

## 2. Colors

La paleta evoca un libro de recuerdos moderno, combinando neutrales cálidos de fondo con acentos emocionales y vivos.

### Primary
- **Naranja Atardecer** (#F17720): El color clave de la experiencia y de las interacciones orientadas a la relación de pareja. Transmite energía, calidez y vida.

### Secondary
- **Azul Océano** (#0474BA): Usado como color complementario, para categorizaciones (ej. amigos) o acciones de estabilidad y calma.

### Neutral
- **Papel** (#F4EEE4): El fondo principal de la aplicación, aportando una base cálida y descansada para la lectura.
- **Tinta** (#211D18): El color principal de texto y elementos de alto contraste (como el botón primario).

### Named Rules
**The Warm Base Rule.** Los fondos nunca deben ser blanco o gris puro. Siempre deben tener un tinte cálido (crema o papel) para mantener la sensación íntima y acogedora.

## 3. Typography

**Display Font:** Newsreader (with Georgia, serif)
**Body Font:** Hanken Grotesk (with system-ui, sans-serif)

**Character:** Una combinación editorial clásica con una legibilidad moderna. El serif aporta elegancia y un tono nostálgico, mientras que el sans-serif asegura claridad en la interfaz de uso diario.

### Hierarchy
- **Display** (500, -0.01em, 1.02): Encabezados principales, títulos de historias o capítulos. Aporta la personalidad "editorial".
- **Headline** (400, italic, 0.8): Usado para numerales o marcadores de capítulos, agregando elegancia.
- **Body** (400): Texto general, chats, y descripciones. Diseñado para alta legibilidad en pantallas largas.
- **Label** (700, 11px, 0.18em uppercase): "Eyebrows" o etiquetas de metadatos, muy espaciadas para dar ritmo y jerarquía.

## 4. Elevation

El sistema utiliza sombras suaves combinadas con superficies difuminadas (`backdrop-filter: blur`) para lograr una sensación de elementos flotando sobre la base.

### Shadow Vocabulary
- **sh-sm** (`0 1px 2px rgba(60,40,20,0.05), 0 2px 8px rgba(60,40,20,0.04)`): Sombras base para tarjetas y botones suaves.
- **sh-md** (`0 2px 6px rgba(60,40,20,0.06), 0 12px 28px rgba(60,40,20,0.08)`): Botones primarios y elementos elevados que requieren atención.
- **sh-lg**: Reservado para islas flotantes de navegación o modales importantes.
- **Glass Surfaces**: Usadas en la barra de navegación y modales para mantener el contexto debajo visible.

### Named Rules
**The Floating Layers Rule.** La interfaz debe sentirse flotante y en capas, usando transparencias y "cristales" suaves para diferenciar el contenido del contexto en lugar de líneas rígidas.

## 5. Components

Los elementos interactivos son táctiles, suaves y amigables, promoviendo la interacción cómoda en cualquier dispositivo.

### Buttons
- **Shape:** Completamente redondeados (999px).
- **Primary:** Tinta sobre Papel (`#211D18`), acolchados (15px 24px) y con sombra `sh-md`.
- **Hover / Focus:** Cuentan con un sutil efecto de escala (`scale(0.965)` en `:active`) haciéndolos sentir físicos.
- **Orange / Blue variants:** Tienen sombras teñidas de su propio color para un efecto luminoso.

### Cards / Containers
- **Corner Style:** Suaves pero definidos (22px radius).
- **Background:** Blanco roto ligeramente más claro que el papel (`#FFFCF7`).
- **Shadow Strategy:** Utilizan `sh-sm` para separarse sutilmente del fondo de papel.

### Inputs / Fields
- **Style:** Sin bordes duros, fondo sutil (`#FBF6EE`), radio de 14px y una sutil sombra interior.
- **Focus:** Cambian su sombra interior a Naranja Atardecer para dar retroalimentación clara.

### Chips
- **Style:** Cápsulas suaves y amigables, usadas para selección y filtrado.

## 6. Do's and Don'ts

### Do:
- **Do** usar siempre fondos cálidos tintados para mantener la intimidad del "Refugio Cálido".
- **Do** dar amplio espacio y `padding` a los elementos para mantener el minimalismo.
- **Do** usar la tipografía serif (`Newsreader`) en los títulos para mantener el tono "Álbum de Conexiones".

### Don't:
- **Don't** usar colores estériles, rígidos o "grises tecnológicos" que lo hagan sentir como una app de banco corporativa o de gestión de bases de datos.
- **Don't** crear interfaces ruidosas que parezcan redes sociales públicas; el foco está en la privacidad.
- **Don't** abusar de los bordes duros de 1px (borders laterales o outlines fuertes) que interrumpan la sensación suave y táctil de las tarjetas.
