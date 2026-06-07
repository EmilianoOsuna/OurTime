import React from 'react'

const COLORS = ['#F17720','#0474BA','#2E7D5B','#F4B740','#D75E12']

export const Confetti: React.FC<{ show: boolean }> = ({ show }) => {
  if (!show) return null
  const pieces = Array.from({ length: 36 })
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 300 }}>
      {pieces.map((_, i) => {
        const left = (i / 36) * 100 + Math.sin(i) * 8
        const delay = (i * 0.03)
        const dur = 1.6 + (i % 5) * 0.2
        const sz = 6 + (i % 4) * 2
        const col = COLORS[i % COLORS.length]
        const round = i % 2 === 0
        return (
          <span key={i} style={{
            position: 'absolute', top: -12, left: `${left}%`,
            width: sz, height: round ? sz : sz * 0.5,
            background: col, borderRadius: round ? '50%' : 2,
            animation: `confettiFall ${dur}s ${delay}s cubic-bezier(.2,.6,.4,1) forwards`,
          }} />
        )
      })}
    </div>
  )
}
