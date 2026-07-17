import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
    } catch (err: unknown) {
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
          <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', height: 44 }}>
            <AnimatePresence mode="wait">
              {!confirmDelete ? (
                <motion.button key="trash"
                  initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}
                  onClick={() => setConfirmDelete(true)} 
                  style={{
                    width: 44, height: 44, borderRadius: '50%', border: 'none', 
                    background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                    cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                  <Icon name="trash" size={20} />
                </motion.button>
              ) : (
                <motion.div key="confirm"
                  initial={{ opacity: 0, scale: 0.9, x: -10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: -10 }} transition={{ duration: 0.2 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.12)',
                    padding: '4px', borderRadius: 24, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)'
                  }}>
                  <button onClick={handleDelete} disabled={deleting} style={{
                    border: 'none', background: '#FF453A', color: '#fff', padding: '0 16px', height: 36, borderRadius: 20,
                    fontSize: 14, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    <Icon name="trash" size={15} />
                    {deleting ? '...' : 'Eliminar'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)} style={{
                    border: 'none', background: 'transparent', color: '#fff', width: 36, height: 36, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                  }}>
                    <Icon name="x" size={18} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <div />
        )}

        {/* Close button */}
        <button onClick={onClose} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', 
          background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
          cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
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
