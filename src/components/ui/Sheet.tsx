import React from 'react'

export function Sheet({ onClose, children, height = 'auto', pad = true }: {
  onClose: () => void
  children: React.ReactNode
  height?: string
  pad?: boolean
}) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 95, display: 'flex', flexDirection: 'column',
      justifyContent: 'flex-end' }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(33,29,24,0.42)',
        animation: 'fadeIn .25s both', backdropFilter: 'blur(2px)' }} />
      <div style={{ position: 'relative', background: 'var(--paper)', borderRadius: '28px 28px 0 0',
        boxShadow: '0 -10px 40px rgba(33,29,24,0.2)', maxHeight: '92%', height,
        animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both', display: 'flex', flexDirection: 'column',
        paddingBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
          <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--line)' }} />
        </div>
        <div className="ot-scroll" style={{ padding: pad ? '4px 22px 0' : 0 }}>{children}</div>
      </div>
    </div>
  )
}
