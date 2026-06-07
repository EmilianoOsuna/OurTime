import React from 'react'

export function PresenceDot({ size = 9, color = 'var(--done)' }: { size?: number; color?: string }) {
  return (
    <span style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        animation: 'pulseRing 1.8s ease-out infinite' }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color,
        boxShadow: '0 0 0 2px var(--card)' }} />
    </span>
  )
}
