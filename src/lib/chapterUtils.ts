export function toRoman(n: number): string {
  const map: [number, string][] = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
  let r = '', x = n
  for (const [v, s] of map) while (x >= v) { r += s; x -= v }
  return r
}

export const CAT_META: Record<string, { label: string; tone: 'orange' | 'blue' }> = {
  cena:   { label: 'Gastronomía', tone: 'orange' },
  viaje:  { label: 'Viaje',       tone: 'blue'   },
  cine:   { label: 'Cine & Series', tone: 'orange' },
  cafe:   { label: 'Café',        tone: 'orange' },
  regalo: { label: 'Regalo',      tone: 'blue'   },
  noche:  { label: 'Noche',       tone: 'blue'   },
  musica: { label: 'Música',      tone: 'orange' },
  ruta:   { label: 'Aventura',    tone: 'blue'   },
  salida: { label: 'Salida',      tone: 'orange' },
  otro:   { label: 'Otros',       tone: 'orange' },
}

const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
export function fmtDateShort(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]}`
}
export function fmtDate(iso: string) {
  const d = new Date(iso + 'T00:00:00')
  return `${d.getDate()} ${MESES[d.getMonth()]} ${d.getFullYear()}`
}
export function countdown(iso: string) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(iso.slice(0, 10) + 'T00:00:00')
  const d = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (d < 0) return 'pasado'
  if (d === 0) return 'hoy'
  if (d === 1) return 'mañana'
  if (d < 7) return `en ${d} días`
  if (d < 14) return 'en 1 semana'
  return `en ${Math.round(d / 7)} semanas`
}
export function eur(n: number) {
  return '€' + n.toLocaleString('es-ES')
}
