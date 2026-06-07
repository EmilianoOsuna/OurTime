import React from 'react'

interface Props {
  onClose: () => void
  children: React.ReactNode
  maxHeight?: string
}

export const BottomSheet: React.FC<Props> = ({ onClose, children, maxHeight = '92%' }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 150, display: 'flex',
    flexDirection: 'column', justifyContent: 'flex-end' }}>
    {/* backdrop */}
    <div onClick={onClose} style={{ position: 'absolute', inset: 0,
      background: 'rgba(33,29,24,0.42)', animation: 'fadeIn .25s both',
      backdropFilter: 'blur(2px)' }} />
    {/* sheet */}
    <div style={{ position: 'relative', background: 'var(--paper)',
      borderRadius: '28px 28px 0 0', boxShadow: '0 -10px 40px rgba(33,29,24,0.2)',
      maxHeight, animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both',
      display: 'flex', flexDirection: 'column', paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }}>
      {/* drag handle */}
      <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px', flexShrink: 0 }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: 'var(--line)' }} />
      </div>
      <div style={{ overflowY: 'auto', padding: '4px 22px 0' }}
        className="ot-scroll">
        {children}
      </div>
    </div>
  </div>
)
