import React, { useRef } from 'react'
import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { recoverNextClickAfterDrag } from '../../lib/recoverClickAfterDrag'

export function Sheet({ onClose, children, height = 'auto', pad = true }: {
  onClose: () => void
  children: React.ReactNode
  height?: string
  pad?: boolean
}) {
  const y = useMotionValue(0)
  const backdropOpacity = useTransform(y, [0, 500], [1, 0])
  const closing = useRef(false)
  const backdropRef = useRef<HTMLDivElement>(null)
  const sheetRef = useRef<HTMLDivElement>(null)
  const gesture = useRef({ startY: 0, lastY: 0, lastTime: 0, velocity: 0, dragging: false })

  const close = (afterDrag = false) => {
    if (closing.current) return
    closing.current = true
    if (afterDrag) recoverNextClickAfterDrag()
    if (backdropRef.current) backdropRef.current.style.pointerEvents = 'none'
    if (sheetRef.current) sheetRef.current.style.pointerEvents = 'none'
    animate(y, window.innerHeight, { duration: 0.2, ease: 'easeOut' }).then(onClose)
  }

  const onTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch || closing.current) return
    y.stop()
    gesture.current = {
      startY: touch.clientY,
      lastY: touch.clientY,
      lastTime: performance.now(),
      velocity: 0,
      dragging: false,
    }
  }

  const onTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    if (!touch || closing.current) return
    const dy = touch.clientY - gesture.current.startY
    if (dy <= 0) { y.set(0); return }
    gesture.current.dragging = true
    const resisted = dy > 200 ? 200 + (dy - 200) * 0.25 : dy
    y.set(resisted)
    const now = performance.now()
    if (now - gesture.current.lastTime > 20) {
      gesture.current.velocity = (touch.clientY - gesture.current.lastY) / (now - gesture.current.lastTime) * 1000
      gesture.current.lastY = touch.clientY
      gesture.current.lastTime = now
    }
  }

  const finishTouch = () => {
    if (!gesture.current.dragging || closing.current) return
    const shouldClose = y.get() > 120 || gesture.current.velocity > 800
    gesture.current.dragging = false
    if (shouldClose) close(true)
    else animate(y, 0, { type: 'spring', damping: 35, stiffness: 300, mass: 0.6 })
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, pointerEvents: 'none', display: 'flex',
      flexDirection: 'column', justifyContent: 'flex-end' }}>
      <motion.div
        ref={backdropRef}
        onClick={() => close()}
        style={{ position: 'absolute', inset: 0, opacity: backdropOpacity, pointerEvents: 'auto',
          background: 'rgba(33,29,24,0.42)' }}
      />
      <motion.div
        ref={sheetRef}
        style={{ y, position: 'relative', pointerEvents: 'auto', background: 'var(--paper)',
          borderRadius: '28px 28px 0 0', boxShadow: '0 -10px 40px rgba(33,29,24,0.2)',
          maxHeight: '92%', height, display: 'flex', flexDirection: 'column',
          paddingBottom: 24, willChange: 'transform' }}
      >
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={finishTouch}
          onTouchCancel={() => { gesture.current.dragging = false; y.set(0) }}
          style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 8px', flexShrink: 0,
            touchAction: 'none', cursor: 'grab' }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--line)' }} />
        </div>
        <div className="ot-scroll" style={{ padding: pad ? '0 22px' : 0, overflowY: 'auto', touchAction: 'pan-y' }}>
          {children}
        </div>
      </motion.div>
    </div>
  )
}
