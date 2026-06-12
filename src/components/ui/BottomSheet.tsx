import React, { useRef } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'framer-motion'

interface Props {
  onClose: () => void
  children: React.ReactNode
  maxHeight?: string
}

export const BottomSheet: React.FC<Props> = ({ onClose, children, maxHeight = '92%' }) => {
  const y = useMotionValue(0)
  const backdropOpacity = useTransform(y, [0, 500], [1, 0])
  const scrollRef = useRef<HTMLDivElement>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const state = useRef({
    pointerId: -1, startY: 0, startScroll: 0, dragging: false,
    lastY: 0, lastTime: 0, velocity: 0,
  })

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') return
    state.current.pointerId = e.pointerId
    e.currentTarget.setPointerCapture(e.pointerId)
    state.current.startY = e.clientY
    state.current.startScroll = scrollRef.current?.scrollTop ?? 0
    state.current.dragging = false
    state.current.lastY = e.clientY
    state.current.lastTime = performance.now()
    state.current.velocity = 0
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (state.current.pointerId !== e.pointerId) return
    const el = scrollRef.current
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

  const finishGesture = (e: React.PointerEvent, cancelled = false) => {
    if (state.current.pointerId !== e.pointerId) return
    const el = scrollRef.current
    if (state.current.dragging && !cancelled) {
      if (y.get() > 120 || Math.min(Math.max(state.current.velocity, -3000), 3000) > 800) {
        if (rootRef.current) rootRef.current.style.visibility = 'hidden'
        onClose()
      } else {
        animate(y, 0, {
          type: 'spring', damping: 35, stiffness: 300, mass: 0.6,
          velocity: Math.min(Math.max(state.current.velocity, -3000), 3000),
        })
      }
      if (el) el.style.overflowY = ''
    }
    if (cancelled) y.set(0)
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    state.current.pointerId = -1
    state.current.dragging = false
  }

  return (
    <div ref={rootRef} data-testid="bottom-sheet-root" style={{ position: 'fixed', inset: 0, zIndex: 150, pointerEvents: 'none', display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <motion.div
        data-testid="bottom-sheet-panel"
        onClick={() => {
          if (rootRef.current) rootRef.current.style.visibility = 'hidden'
          onClose()
        }}
        style={{ position: 'absolute', inset: 0, opacity: backdropOpacity, pointerEvents: 'auto',
          background: 'rgba(33,29,24,0.42)', }}
      />
      <motion.div
        style={{ y, position: 'relative', pointerEvents: 'auto', background: 'var(--paper)',
          borderRadius: '28px 28px 0 0', boxShadow: '0 -10px 40px rgba(33,29,24,0.2)',
          maxHeight, display: 'flex', flexDirection: 'column',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
          willChange: 'transform' }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0,
          touchAction: 'none' }}
          data-testid="bottom-sheet-handle"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishGesture}
          onPointerCancel={e => finishGesture(e, true)}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--line)' }} />
        </div>
        <div ref={scrollRef}
          style={{ overflowY: 'auto', padding: '4px 22px 0', touchAction: 'none' }}
          className="ot-scroll"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={finishGesture}
          onPointerCancel={e => finishGesture(e, true)}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
