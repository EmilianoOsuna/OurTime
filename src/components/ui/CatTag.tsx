import { CAT_META } from '../../lib/chapterUtils'
import { Icon } from './Icon'

const CAT_ICON: Record<string, string> = {
  cena: 'utensils', viaje: 'plane', cine: 'film', cafe: 'coffee',
  regalo: 'gift', noche: 'moon', musica: 'music', ruta: 'mapRoute',
  salida: 'coffee', otro: 'tag',
}

export function CatTag({ cat, subtle = false, style = {} }: { cat: string; subtle?: boolean; style?: React.CSSProperties }) {
  const c = CAT_META[cat]
  if (!c) return null
  const icon = CAT_ICON[cat] || 'tag'
  // Homologado al acento de la historia; fondo opaco (el tag vive también sobre fotos)
  // y --accent-ink garantiza lectura encima
  const tone = { bg: 'color-mix(in srgb, var(--orange) 14%, var(--card))', fg: 'var(--accent-ink)' }
  return (
    <span className="chip-tag" style={{
      background: subtle ? 'transparent' : tone.bg, color: tone.fg,
      display: 'inline-flex', alignItems: 'center', gap: 5,
      boxShadow: subtle ? 'inset 0 0 0 1px var(--line)' : 'none',
      ...style,
    }}>
      <Icon name={icon} size={13} />
      {c.label}
    </span>
  )
}
