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
  const d = new Date(iso.slice(0,10) + 'T00:00:00Z')
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`
}
export function fmtDate(iso: string) {
  const d = new Date(iso.slice(0,10) + 'T00:00:00Z')
  return `${d.getUTCDate()} ${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
export function countdown(iso: string) {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const parts = iso.split('-').map(Number)
  const y = parts[0] ?? 0
  const m = parts[1] ?? 1
  const d = parts[2] ?? 1
  const target = new Date(y, m - 1, d)
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000)
  if (diff < 0) return 'pasado'
  if (diff === 0) return 'hoy'
  if (diff === 1) return 'mañana'
  return `en ${diff} días`
}
export function eur(n: number) {
  return '€' + n.toLocaleString('es-ES')
}
