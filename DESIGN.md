---
name: OurTime
description: App de relaciones compartidas y recuerdos
colors:
  primary: "#F17720"
  secondary: "#0474BA"
  green: "#2E7D5B"
  sun: "#F3BC3F"
  neutral-bg: "#F4EFE3"
  neutral-ink: "#211D18"
typography:
  display:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontWeight: 600
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  body:
    fontFamily: "'Hanken Grotesk', system-ui, sans-serif"
    fontWeight: 400
rounded:
  sm: "16px"
  md: "26px"
  lg: "34px"
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
    backgroundColor: "#FFFFFF"
    rounded: "{rounded.md}"
---

# Design System: OurTime — v3 "Vivo"

## 1. Overview

**Creative North Star: "Su historia, a todo color"**

Look & feel inspirado en mindmarket.com: una sola sans con tracking apretado, crema cálido de base, tarjetas blancas puras, y bloques de color saturado ("drenched blocks") como acentos emocionales. La app se siente viva, cálida y directa — nada estéril ni corporativo. La firma de la marca es el subrayado ondulado (`.squiggle`) bajo los títulos principales.

**Key Characteristics:**
- Una sola familia tipográfica (Hanken Grotesk) diferenciada por peso y tracking, no por familia.
- Bloques drenched: superficies bañadas por completo en un color (acento de la historia, azul, verde, amarillo) con tinta de alto contraste encima.
- Píldoras por todas partes: nav, chips, botones e iconos circulares.
- Radios generosos (16/26/34px) y sombras suaves.

## 2. Colors

### Primary
- **Naranja Atardecer** (#F17720): acento por defecto. Cada historia puede sustituirlo vía `theme_color`; todo lo que usa `var(--orange)` y `var(--hero-*)` se retiñe automáticamente.

### Supporting blocks
- **Azul Océano** (#0474BA): bloques informativos y categoría amigos.
- **Verde** (#2E7D5B, `--done`): estados completados y bloques de "momentos".
- **Sol** (#F3BC3F, `--sun`): bloques de apoyo (header de Perfil). Su tinta es fija y oscura (`--sun-ink` #2E2005) porque el amarillo es claro en ambos modos.

### Neutral
- **Papel** (#F4EFE3): fondo principal, crema cálido.
- **Tarjeta** (#FFFFFF): blanco puro sobre el crema — el contraste papel/tarjeta es parte del look.
- **Tinta** (#211D18): texto y botón primario.

### Named Rules
**The Drenched Block Rule.** Un bloque de color se pinta completo: fondo saturado + tinta elegida por contraste (`heroInk()` en AppShell para acentos arbitrarios). Nunca texto de color sobre fondo de color parecido.
**The Vars Rule.** Siempre `var(--*)`, nunca hex directos: el dark mode y el acento por historia dependen de ello.

## 3. Typography

**Única familia:** Hanken Grotesk (system-ui fallback). No hay serif ni itálicas.

### Hierarchy
- **Display** (600, -0.035em, 1.02): títulos grandes. La personalidad viene del peso y el tracking apretado.
- **Chapter numerals** (700, -0.04em, 0.8): numerales de capítulos.
- **Body** (400): texto general.
- **Eyebrow** (600, 13px, -0.01em, sentence case): etiquetas de sección. Ya NO van en mayúsculas espaciadas.

### La firma
`.squiggle`: subrayado ondulado (CSS mask + `currentColor`), se usa con moderación — título del home y hero de Auth.

## 4. Elevation

Sombras suaves cálidas (`--sh-sm/md/lg`). La nav inferior es una **píldora blanca sólida** (`.ot-glass-nav`, sin `backdrop-filter` — más barato de pintar). Los blur de cristal quedan solo para overlays donde el contexto importa.

## 5. Components

### Buttons
- Completamente redondeados (999px), efecto físico `scale(0.965)` en `:active`.
- Primary: tinta sobre papel. Orange/Blue: sombra teñida de su color.
- Sobre bloques drenched: píldora blanca con tinta oscura (`EditAction tone="onDark"`).

### Cards
- Blanco puro, radio 26px, `sh-sm`. Hero cards (`.hero-card`): bañadas en `var(--hero-bg)` con `--hero-text`/`--hero-soft`.
- Stat cards estilo mindmarket: bloque de color pleno con número display gigante (contador de días del home, presupuesto de Finanzas).

### Inputs
- Sin bordes duros, fondo `--card-2`, radio 16px, focus en acento.

### Iconos
- Chips de icono circulares (999px); sobre bloques drenched van en blanco `rgba(255,255,255,0.92)` con el icono del color del bloque.

## 6. Do's and Don'ts

### Do:
- **Do** bañar secciones completas en color (headers, hero cards, quick links) — el color es protagonista, no decoración.
- **Do** usar `--hero-*` para cualquier superficie teñida del acento (respeta `theme_color` por historia).
- **Do** mantener el squiggle escaso para que siga siendo firma.

### Don't:
- **Don't** usar serif, itálicas o mayúsculas espaciadas — son del sistema v2, ya retirado.
- **Don't** hardcodear colores ni asumir que la tinta del hero es oscura: con acentos oscuros (ej. navy) la tinta es blanca cálida.
- **Don't** añadir `backdrop-filter` a superficies nuevas sin justificación de rendimiento.
