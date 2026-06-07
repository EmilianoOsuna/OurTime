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
  const tone = c.tone === 'blue'
    ? { bg: 'var(--blue-tint)', fg: 'var(--blue-deep)' }
    : { bg: 'var(--orange-tint)', fg: 'var(--orange-deep)' }
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
