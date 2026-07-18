// Utilidades de color para el acento por historia.
// El acento puede ser cualquier hex elegido por el usuario, así que la tinta
// que va encima (bloques drenched) y el acento usado como texto sobre papel
// se calculan por contraste, nunca se asumen.

export type Rgb = [number, number, number]

export function parseHex(hex: string): Rgb | null {
  const raw = hex.replace('#', '').trim()
  const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw
  if (!/^[0-9a-fA-F]{6}$/.test(full)) return null
  return [0, 2, 4].map(i => parseInt(full.slice(i, i + 2), 16)) as Rgb
}

export function isHexColor(hex: string | null | undefined): hex is string {
  return !!hex && parseHex(hex) !== null
}

function channel(v: number): number {
  const c = v / 255
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

export function luminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrast(l1: number, l2: number): number {
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1]
  return (hi + 0.05) / (lo + 0.05)
}

function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [0, 1, 2].map(i => Math.round(a[i]! + (b[i]! - a[i]!) * t)) as Rgb
}

function toHex(rgb: Rgb): string {
  return '#' + rgb.map(v => v.toString(16).padStart(2, '0')).join('')
}

// Tinta del hero drenched: elige oscuro o claro según cuál contrasta más con el acento
export function heroInk(hex: string): { text: string; soft: string } {
  const rgb = parseHex(hex)
  const L = rgb ? luminance(rgb) : 0.35
  const contrastDark = (L + 0.05) / 0.0631 // vs #2A1505
  const contrastWhite = 1.05 / (L + 0.05)  // vs blanco cálido
  return contrastDark >= contrastWhite
    ? { text: '#2A1505', soft: 'rgba(42,21,5,0.66)' }
    : { text: '#FFF9F4', soft: 'rgba(255,249,244,0.85)' }
}

// Fondos de referencia: el más desfavorable de cada modo (papel en claro,
// card-2 en oscuro) para que el resultado sirva en cualquier superficie.
const LIGHT_BG = luminance([244, 239, 227]) // --paper
const DARK_BG = luminance([39, 39, 42])     // --card-2
const INK: Rgb = [33, 29, 24]               // --ink claro
const WARM_WHITE: Rgb = [255, 249, 244]

// Acento legible como texto/icono sobre papel o tarjeta (≥4.5:1).
// Acerca el acento a la tinta (o al blanco cálido en oscuro) solo lo necesario,
// conservando el matiz elegido.
export function accentInk(hex: string, dark: boolean): string {
  const rgb = parseHex(hex)
  if (!rgb) return dark ? '#F98130' : '#9A4C0F'
  const bg = dark ? DARK_BG : LIGHT_BG
  const target = dark ? WARM_WHITE : INK
  let out = rgb
  for (let t = 0; t <= 1.0001; t += 0.05) {
    out = mixRgb(rgb, target, t)
    if (contrast(luminance(out), bg) >= 4.5) break
  }
  return toHex(out)
}
