import { motion } from 'framer-motion'

interface SegOpt { value: string; label: string }

export function Segmented({ labels, selected, onChange, options, value, style = {}, layoutId = 'seg-pill' }: {
  labels?: string[]
  selected?: number
  onChange: (i: number) => void
  options?: SegOpt[]
  value?: string
  style?: React.CSSProperties
  /** Único por instancia visible a la vez; evita que la pill "salte" entre dos Segmented montados juntos. */
  layoutId?: string
}) {
  const items = options
    ? options.map(o => ({ label: o.label, active: o.value === value, idx: -1 }))
    : labels
      ? labels.map((l, i) => ({ label: l, active: i === selected, idx: i }))
      : []

  return (
    <div style={{
      display: 'flex', background: 'var(--card-2)', borderRadius: 999,
      padding: 4, boxShadow: 'inset 0 0 0 1px var(--line)', position: 'relative', ...style,
    }}>
      {items.map((item, i) => {
        const on = item.active
        return (
          <button key={i} onClick={() => onChange(item.idx >= 0 ? item.idx : i)} style={{
            flex: 1, border: 'none', cursor: 'pointer', position: 'relative', zIndex: 1,
            background: 'transparent',
            color: on ? 'var(--ink)' : 'var(--ink-soft)',
            borderRadius: 999, padding: '9px 8px', fontFamily: 'var(--font-ui)',
            fontWeight: on ? 700 : 600, fontSize: 14, transition: 'color .2s',
            WebkitTapHighlightColor: 'transparent',
          }}>
            {on && (
              <motion.div layoutId={layoutId} style={{
                position: 'absolute', inset: 0, background: 'var(--card)',
                borderRadius: 999, boxShadow: 'var(--sh-sm)', zIndex: -1
              }} transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }} />
            )}
            <span style={{ position: 'relative', zIndex: 1 }}>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
