import { useState, useEffect } from 'react'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { fmtDateShort } from '../lib/chapterUtils'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { PersonDisplay, AlbumType } from '../lib/supabase'

interface Memory {
  id: string
  image_url: string
  caption: string | null
  created_at: string
  plan_id?: string | null
  album_id?: string | null
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

function AlbumCard({ album, coverUrl, count, onClick }: {
  album: AlbumType; coverUrl: string | null; count: number; onClick: () => void
}) {
  return (
    <button onClick={onClick} className="anim-up" style={{
      border: 'none', cursor: 'pointer', padding: 0,
      borderRadius: 18, overflow: 'hidden', background: 'var(--card)',
      boxShadow: 'var(--sh-sm)', display: 'block', width: '100%', textAlign: 'left',
    }}>
      <div style={{ width: '100%', aspectRatio: '1', position: 'relative', overflow: 'hidden' }}>
        {coverUrl ? (
          <img src={coverUrl} alt="" loading="lazy" decoding="async"
            onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0, transition: 'opacity 0.4s' }} />
        ) : (
          <div className="ph blue" style={{ width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image" size={30} style={{ color: 'var(--blue)', opacity: 0.5 }} />
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
          padding: '24px 12px 10px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            textTransform: 'uppercase', color: 'rgba(255,255,255,0.7)', marginBottom: 2 }}>
            {count} {count === 1 ? 'foto' : 'fotos'}
          </div>
        </div>
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{album.name}</div>
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
  const { activeStoryId } = useAuth()
  const [view, setView] = useState<'albums' | 'all'>('all')
  const [albums, setAlbums] = useState<AlbumType[]>([])
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [savingAlbum, setSavingAlbum] = useState(false)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('albums').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { if (data) setAlbums(data as AlbumType[]) })
  }, [activeStoryId])

  const createAlbum = async () => {
    if (!newAlbumName.trim() || !activeStoryId) return
    setSavingAlbum(true)
    try {
      const { data, error } = await supabase.from('albums')
        .insert({ story_id: activeStoryId, name: newAlbumName.trim() })
        .select().single()
      if (error) throw error
      if (data) setAlbums(prev => [data as AlbumType, ...prev])
      setNewAlbumName('')
      setCreatingAlbum(false)
    } catch (e: any) { alert(e.message) }
    finally { setSavingAlbum(false) }
  }

  const deleteAlbum = async (albumId: string) => {
    await supabase.from('albums').delete().eq('id', albumId)
    setAlbums(prev => prev.filter(a => a.id !== albumId))
    if (activeAlbumId === albumId) setActiveAlbumId(null)
  }

  const getCover = (albumId: string) =>
    memories.find(m => m.album_id === albumId)?.image_url ?? null

  const albumMemories = activeAlbumId
    ? memories.filter(m => m.album_id === activeAlbumId)
    : memories

  // "Todos" view filtered
  const filtered = memories.filter(m => {
    if (q.trim() && !(m.caption ?? '').toLowerCase().includes(q.trim().toLowerCase())) return false
    return true
  })

  const makeCols = (arr: Memory[]) => {
    const cols: Memory[][] = [[], []]
    arr.forEach((m, i) => cols[i % 2].push(m))
    return cols
  }

  // ── Album detail view ──
  if (activeAlbumId !== null) {
    const album = albums.find(a => a.id === activeAlbumId)
    const cols = makeCols(albumMemories)
    return (
      <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
        <div style={{ padding: '8px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <button onClick={() => setActiveAlbumId(null)} style={{
              border: 'none', background: 'var(--card)', cursor: 'pointer',
              width: 38, height: 38, borderRadius: '50%', boxShadow: 'var(--sh-sm)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink)', flexShrink: 0,
            }}>
              <Icon name="chevL" size={20} />
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="eyebrow" style={{ marginBottom: 2 }}>Álbum</div>
              <h1 className="display" style={{ fontSize: 26, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {album?.name ?? 'Álbum'}
              </h1>
            </div>
            <button onClick={() => { if (confirm('¿Eliminar este álbum? Las fotos se conservan.')) deleteAlbum(activeAlbumId) }}
              style={{ border: 'none', background: 'transparent', cursor: 'pointer',
                color: 'var(--ink-faint)', padding: 4 }}>
              <Icon name="trash" size={18} />
            </button>
          </div>
        </div>
        {albumMemories.length > 0 ? (
          <div style={{ display: 'flex', gap: 10, padding: '0 18px' }}>
            {cols.map((col, ci) => (
              <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.map((m, i) => (
                  <MemoryCard key={m.id} m={m} onOpen={() => onImageClick(m.image_url)} delay={i * 0.04} me={me} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 30px', color: 'var(--ink-faint)' }}>
            <Icon name="image" size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>Este álbum está vacío</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>Asigna fotos a este álbum desde el botón +</div>
          </div>
        )}
      </div>
    )
  }

  // ── Main view ──
  return (
    <div className="ot-scroll page-enter" style={{ paddingBottom: 130 }}>
      <div style={{ padding: '8px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7 }}>Sus momentos</div>
            <h1 className="display" style={{ fontSize: 32, margin: 0 }}>Recuerdos</h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {view === 'all' && (
              <CircBtn
                icon={searchOpen ? 'x' : 'search'}
                onClick={() => { setSearchOpen(s => !s); setQ('') }}
              />
            )}
          </div>
        </div>

        {searchOpen && view === 'all' && (
          <div className="anim-up" style={{ marginTop: 14, position: 'relative' }}>
            <Icon name="search" size={18} style={{ position: 'absolute', left: 14, top: 15, color: 'var(--ink-faint)' }} />
            <input className="field" autoFocus placeholder="Busca un recuerdo…" value={q}
              onChange={e => setQ(e.target.value)} style={{ paddingLeft: 42 }} />
          </div>
        )}

        {/* View toggle */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 4 }}>
          {(['albums', 'all'] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className={'chip' + (view === v ? ' active' : '')} style={{ flexShrink: 0 }}>
              {v === 'albums' ? <><Icon name="image" size={13} /> Álbumes</> : 'Todas las fotos'}
            </button>
          ))}
        </div>
      </div>

      {/* ── ALBUMS VIEW ── */}
      {view === 'albums' && (
        <div style={{ padding: '14px 18px 0' }}>
          {/* Create album inline */}
          {creatingAlbum ? (
            <div className="card anim-up" style={{ padding: '14px 16px', marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input className="field" autoFocus placeholder="Nombre del álbum" value={newAlbumName}
                onChange={e => setNewAlbumName(e.target.value)} style={{ flex: 1 }}
                onKeyDown={e => { if (e.key === 'Enter') createAlbum() }} />
              <button onClick={createAlbum} disabled={!newAlbumName.trim() || savingAlbum}
                className="btn btn-primary" style={{ padding: '12px 16px', borderRadius: 12, flexShrink: 0 }}>
                {savingAlbum ? '…' : <Icon name="check" size={17} />}
              </button>
              <button onClick={() => { setCreatingAlbum(false); setNewAlbumName('') }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-faint)', padding: 4 }}>
                <Icon name="x" size={17} />
              </button>
            </div>
          ) : (
            <button onClick={() => setCreatingAlbum(true)} style={{
              width: '100%', border: '1.5px dashed var(--line)', borderRadius: 18, background: 'transparent',
              padding: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              color: 'var(--ink-soft)', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: 14, marginBottom: 14,
              justifyContent: 'center',
            }}>
              <Icon name="plus" size={17} stroke={2.2} /> Nuevo álbum
            </button>
          )}

          {albums.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--blue-tint)',
                color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="image" size={34} />
              </div>
              <div className="display" style={{ fontSize: 20, marginBottom: 6 }}>Sin álbumes aún</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Crea un álbum para organizar sus recuerdos</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {albums.map((album, i) => (
                <AlbumCard
                  key={album.id}
                  album={album}
                  coverUrl={getCover(album.id)}
                  count={memories.filter(m => m.album_id === album.id).length}
                  onClick={() => setActiveAlbumId(album.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ALL PHOTOS VIEW ── */}
      {view === 'all' && (
        filtered.length > 0 ? (
          <div style={{ display: 'flex', gap: 10, padding: '14px 18px 0' }}>
            {makeCols(filtered).map((col, ci) => (
              <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.map((m, i) => (
                  <MemoryCard key={m.id} m={m} onOpen={() => onImageClick(m.image_url)} delay={i * 0.04} me={me} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--blue-tint)',
              color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icon name={q ? 'search' : 'image'} size={36} />
            </div>
            <div className="display" style={{ fontSize: 22, marginBottom: 6 }}>
              {q ? 'Sin coincidencias' : 'Aún no hay recuerdos'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              {q
                ? `No encontramos nada para "${q}". Prueba otra palabra.`
                : 'Cada foto que suban aparecerá aquí, ordenada por momentos.'}
            </div>
          </div>
        )
      )}
    </div>
  )
}
