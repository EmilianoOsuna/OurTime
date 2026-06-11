import React, { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

export function Sheet({ onClose, children, height = 'auto', pad = true }: {
  onClose: () => void
  children: React.ReactNode
  height?: string
  pad?: boolean
}) {
  const y = useMotionValue(0)
  const backdropOpacity = useTransform(y, [0, 500], [1, 0])
  const sheetRef = useRef<HTMLDivElement>(null)
  const state = useRef({
    startY: 0, startScroll: 0, dragging: false,
    lastY: 0, lastTime: 0, velocity: 0,
  })

  const onPointerDown = (e: React.PointerEvent) => {
    state.current.startY = e.clientY
    state.current.startScroll = sheetRef.current?.scrollTop ?? 0
    state.current.dragging = false
    state.current.lastY = e.clientY
    state.current.lastTime = performance.now()
    state.current.velocity = 0
  }

  const onPointerMove = (e: React.PointerEvent) => {
    const el = sheetRef.current
    if (!el) return
    const dy = e.clientY - state.current.startY
    const newScroll = state.current.startScroll - dy

    if (state.current.dragging) {
      e.preventDefault()
      const raw = dy - state.current.startScroll
      const resisted = raw > 200 ? 200 + (raw - 200) * 0.25 : Math.max(0, raw)
      y.set(resisted)
      const now = performance.now()
      if (now - state.current.lastTime > 20) {
        state.current.velocity = (e.clientY - state.current.lastY) / (now - state.current.lastTime) * 1000
        state.current.lastY = e.clientY
        state.current.lastTime = now
      }
      return
    }

    if (newScroll <= 0) {
      state.current.dragging = true
      el.style.overflowY = 'hidden'
      e.preventDefault()
      const resisted = -newScroll > 200 ? 200 + (-newScroll - 200) * 0.25 : Math.max(0, -newScroll)
      y.set(resisted)
      return
    }

    el.scrollTop = newScroll
  }

  const onPointerUp = () => {
    const el = sheetRef.current
    if (state.current.dragging) {
      const vy = Math.min(Math.max(state.current.velocity, -3000), 3000)
      if (y.get() > 120 || vy > 800) {
        const h = window.innerHeight
        animate(y, h, {
          type: 'spring', damping: 30, stiffness: 250, mass: 0.8,
          velocity: vy,
        }).then(() => onClose())
      } else {
        animate(y, 0, {
          type: 'spring', damping: 35, stiffness: 300, mass: 0.6,
          velocity: vy,
        })
      }
      if (el) el.style.overflowY = ''
    }
    state.current.dragging = false
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, pointerEvents: 'none', display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <motion.div
        onClick={() => {
          const h = window.innerHeight
          animate(y, h, { type: 'spring', damping: 30, stiffness: 250, mass: 0.8 }).then(() => onClose())
        }}
        style={{ position: 'absolute', inset: 0, opacity: backdropOpacity, pointerEvents: 'auto',
          background: 'rgba(33,29,24,0.42)', }}
      />
      <motion.div
        ref={sheetRef}
        style={{ y, position: 'relative', pointerEvents: 'auto', background: 'var(--paper)',
          borderRadius: '28px 28px 0 0', boxShadow: '0 -10px 40px rgba(33,29,24,0.2)',
          maxHeight: '92%', height, overflowY: 'auto', display: 'flex', flexDirection: 'column',
          paddingBottom: 24, touchAction: 'none', willChange: 'transform' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--line)' }} />
        </div>
        <div style={{ padding: pad ? '4px 22px 0' : 0 }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
