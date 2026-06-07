import { CAT_META } from '../../lib/chapterUtils'
import { Icon } from './Icon'

const CAT_ICON: Record<string, string> = {
  cena: 'utensils', viaje: 'plane', cine: 'film', cafe: 'coffee',
  regalo: 'gift', noche: 'moon', musica: 'music', ruta: 'mapRoute',
  salida: 'coffee', otro: 'tag',
}

export function CatMedallion({ cat, size = 46, active = true }: { cat: string; size?: number; active?: boolean }) {
  const c = CAT_META[cat]
  if (!c) return null
  const icon = CAT_ICON[cat] || 'tag'
  const blue = c.tone === 'blue'
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? (blue ? 'var(--blue)' : 'var(--orange)') : 'var(--card-2)',
      color: active ? '#fff' : 'var(--ink-faint)',
      boxShadow: active ? (blue ? '0 4px 12px rgba(4,116,186,0.3)' : '0 4px 12px rgba(241,119,32,0.3)') : 'inset 0 0 0 1.5px var(--line)',
      flexShrink: 0,
    }}>
      <Icon name={icon} size={size * 0.45} />
    </div>
  )
}
