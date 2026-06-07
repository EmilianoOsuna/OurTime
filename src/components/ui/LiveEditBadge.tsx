export function LiveEditBadge({ inline = false }: { inline?: boolean }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 7,
      position: inline ? 'static' : 'absolute', bottom: 12, left: 14,
      background: inline ? 'var(--orange-tint)' : 'rgba(255,252,247,0.92)',
      borderRadius: 999, padding: '5px 11px', fontSize: 12, fontWeight: 600, color: 'var(--orange-deep)',
      boxShadow: inline ? 'none' : 'var(--sh-sm)',
    }}>
      <div className="avatar" style={{ width: 18, height: 18, background: '#F17720',
        fontSize: 9, boxShadow: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: '50%', fontFamily: 'var(--font-display)', fontStyle: 'italic', color: '#fff',
      }}>L</div>
      <span>Lucía está editando</span>
      <span style={{ display: 'flex', gap: 2 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{ width: 3, height: 3, borderRadius: '50%',
            background: 'var(--orange)', animation: `pulse 1s ${i * 0.18}s infinite` }} />
        ))}
      </span>
    </div>
  )
}
