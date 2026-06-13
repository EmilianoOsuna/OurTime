import React, { useState } from 'react'
import { Icon } from './Icon'

interface LightboxProps {
  url: string
  memoryId?: string
  onDelete?: (id: string, url: string) => Promise<void>
  onClose: () => void
}

export function Lightbox({ url, memoryId, onDelete, onClose }: LightboxProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!memoryId || !onDelete) return
    setDeleting(true)
    try {
      await onDelete(memoryId, url)
      onClose()
    } catch (err: any) {
      console.error('Error deleting memory:', err)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 110, background: 'rgba(0,0,0,0.9)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', animation: 'fadeIn .2s both'
    }}>
      
      {/* Top action bar */}
      <div style={{
        position: 'absolute', top: 56, left: 18, right: 18, zIndex: 120,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', pointerEvents: 'auto'
      }}>
        {/* Delete button (only if memoryId is provided) */}
        {memoryId && onDelete ? (
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)} style={{
                width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)',
                cursor: 'pointer', color: '#ff4d4d', display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
              }}>
                <Icon name="trash" size={20} />
              </button>
            ) : (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)',
                padding: '4px 8px 4px 12px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)'
              }}>
                <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>¿Eliminar?</span>
                <button onClick={handleDelete} disabled={deleting} style={{
                  border: 'none', background: '#ff4d4d', color: '#fff', padding: '4px 10px', borderRadius: 12,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer'
                }}>
                  {deleting ? '...' : 'Sí'}
                </button>
                <button onClick={() => setConfirmDelete(false)} style={{
                  border: 'none', background: 'transparent', color: '#fff', padding: '4px 8px',
                  fontSize: 12, fontWeight: 600, cursor: 'pointer'
                }}>
                  No
                </button>
              </div>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Close button */}
        <button onClick={onClose} style={{
          width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,0.15)',
          cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
        }}>
          <Icon name="x" size={20} />
        </button>
      </div>

      {/* Image container */}
      <div style={{
        maxWidth: '92vw', maxHeight: '80vh', borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5)', pointerEvents: 'auto'
      }} onClick={e => e.stopPropagation()}>
        <img src={url} alt="" decoding="async"
          onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
          style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block', opacity: 0, transition: 'opacity 0.3s' }} />
      </div>
    </div>
  )
}
