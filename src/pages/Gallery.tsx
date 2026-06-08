import { useState } from 'react'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { fmtDateShort } from '../lib/chapterUtils'
import type { PersonDisplay } from '../lib/supabase'

interface Memory {
  id: string
  image_url: string
  caption: string | null
  created_at: string
  plan_id?: string | null
}

function CircBtn({ icon, onClick }: { icon: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      width: 42, height: 42, borderRadius: '50%', border: 'none',
      background: 'var(--card)', boxShadow: 'var(--sh-sm)', cursor: 'pointer',
      color: 'var(--ink)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Icon name={icon} size={19} />
    </button>
  )
}

function MemoryCard({ m, onOpen, delay, me }: { m: Memory; onOpen: () => void; delay: number; me: PersonDisplay }) {
  const ratio = 1.3 + (parseInt(m.id.slice(-1), 16) % 3) * 0.3
  return (
    <button onClick={onOpen} className="anim-up" style={{
      border: 'none', cursor: 'pointer', padding: 0,
      borderRadius: 16, overflow: 'hidden', background: 'var(--card)',
      boxShadow: 'var(--sh-sm)', animationDelay: delay + 's', display: 'block', width: '100%',
    }}>
      <div style={{ width: '100%', aspectRatio: '1 / ' + ratio.toFixed(1), position: 'relative', overflow: 'hidden' }}>
        <img src={m.image_url} alt="" loading="lazy" decoding="async"
          onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            opacity: 0, transition: 'opacity 0.4s' }} />
      </div>
      <div style={{ padding: '10px 12px 12px', textAlign: 'left' }}>
        {m.caption && (
          <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.25 }}>{m.caption}</div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: m.caption ? 6 : 0 }}>
          <Avatar person={me} size={17} />
          <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
            {fmtDateShort(m.created_at.slice(0, 10))}
          </span>
        </div>
      </div>
    </button>
  )
}

export default function Gallery({ memories, setMemories, onImageClick, me }: {
  memories: Memory[]
  setMemories: (m: Memory[]) => void
  onImageClick: (url: string) => void
  me: PersonDisplay
}) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('all')
  const [searchOpen, setSearchOpen] = useState(false)

  const filtered = memories.filter(m => {
    if (filter === 'caption' && !m.caption) return false
    if (q.trim() && !(m.caption ?? '').toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  })

  const cols: Memory[][] = [[], []]
  filtered.forEach((m, i) => cols[i % 2].push(m))

  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Sus momentos</div>
            <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Recuerdos</h1>
          </div>
          <CircBtn
            icon={searchOpen ? 'x' : 'search'}
            onClick={() => { setSearchOpen(s => !s); setQ('') }}
          />
        </div>

        {searchOpen && (
          <div className="anim-up" style={{ marginTop: 14, position: 'relative' }}>
            <Icon name="search" size={18} style={{
              position: 'absolute', left: 14, top: 15, color: 'var(--ink-faint)',
            }} />
            <input
              className="field"
              autoFocus
              placeholder="Busca un recuerdo…"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{ paddingLeft: 42 }}
            />
          </div>
        )}

        {/* Filter chips */}
        <div style={{
          display: 'flex', gap: 8, overflowX: 'auto',
          padding: '16px 0 4px', margin: '0 -22px', paddingLeft: 22, paddingRight: 22,
        }} className="ot-scroll">
          <button
            onClick={() => setFilter('all')}
            className={'chip' + (filter === 'all' ? ' active' : '')}
            style={{ flexShrink: 0 }}
          >Todos</button>
          <button
            onClick={() => setFilter('caption')}
            className={'chip' + (filter === 'caption' ? ' active' : '')}
            style={{ flexShrink: 0 }}
          >♥ Con pie de foto</button>
        </div>
      </div>

      {/* Masonry grid */}
      {filtered.length ? (
        <div style={{ display: 'flex', gap: 10, padding: '14px 18px 0' }}>
          {cols.map((col, ci) => (
            <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.map((m, i) => (
                <MemoryCard key={m.id} m={m} onOpen={() => onImageClick(m.image_url)} delay={i * 0.04} me={me} />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 30px' }}>
          <div style={{
            width: 80, height: 80, borderRadius: 24, background: 'var(--blue-tint)',
            color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
          }}>
            <Icon name={q ? 'search' : 'image'} size={36} />
          </div>
          <div className="display" style={{ fontSize: 22, marginBottom: 6 }}>
            {q ? 'Sin coincidencias' : 'Aún no hay recuerdos'}
          </div>
          <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
            {q
              ? `No encontramos nada para "${q}". Prueba otra palabra.`
              : 'Cada foto que suban aparecerá aquí, ordenada por capítulos.'}
          </div>
        </div>
      )}
    </div>
  )
}
