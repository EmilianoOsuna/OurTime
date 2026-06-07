interface SegOpt { value: string; label: string }

export function Segmented({ labels, selected, onChange, options, value, style = {} }: {
  labels?: string[]
  selected?: number
  onChange: (i: number) => void
  options?: SegOpt[]
  value?: string
  style?: React.CSSProperties
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
            background: on ? 'var(--card)' : 'transparent',
            color: on ? 'var(--ink)' : 'var(--ink-soft)',
            boxShadow: on ? 'var(--sh-sm)' : 'none',
            borderRadius: 999, padding: '9px 8px', fontFamily: 'var(--font-ui)',
            fontWeight: on ? 700 : 600, fontSize: 14, transition: 'all .2s',
          }}>{item.label}</button>
        )
      })}
    </div>
  )
}
