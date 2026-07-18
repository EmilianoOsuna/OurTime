import { useState, useEffect, useCallback, useRef } from 'react'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { fmtDateShort } from '../lib/chapterUtils'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { PersonDisplay, AlbumType, MemoryType } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../components/ui/ConfirmDialog'

type Memory = MemoryType

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
      contentVisibility: 'auto', containIntrinsicSize: 220,
    }}>
      <div style={{ width: '100%', aspectRatio: '1 / ' + ratio.toFixed(1), position: 'relative', overflow: 'hidden' }}>
        <img src={m.image_url} alt="" loading="lazy" decoding="async"
          onLoad={e => { (e.target as HTMLImageElement).style.opacity = '1' }}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            objectPosition: `${m.position_x ?? 50}% ${m.position_y ?? 50}%`,
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
          <div className="ph" style={{ width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="image" size={30} style={{ color: 'var(--orange)', opacity: 0.5 }} />
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

function useColCount() {
  const get = () => window.innerWidth >= 1200 ? 4 : window.innerWidth >= 768 ? 3 : 2
  const [cols, setCols] = useState(get)
  useEffect(() => {
    const fn = () => setCols(get())
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return cols
}

export default function Gallery({ memories, setMemories, onImageClick, me }: {
  memories: Memory[]
  setMemories: (m: Memory[]) => void
  onImageClick: (m: Memory) => void
  me: PersonDisplay
}) {
  const { activeStoryId } = useAuth()
  const { push: toast } = useToast()
  const confirm = useConfirm()
  const [view, setView] = useState<'albums' | 'all'>('all')
  const [albums, setAlbums] = useState<AlbumType[]>([])
  const [activeAlbumId, setActiveAlbumId] = useState<string | null>(null)
  const [creatingAlbum, setCreatingAlbum] = useState(false)
  const [newAlbumName, setNewAlbumName] = useState('')
  const [savingAlbum, setSavingAlbum] = useState(false)
  const [q, setQ] = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerSelected, setPickerSelected] = useState<Set<string>>(new Set())
  const [assigningPhotos, setAssigningPhotos] = useState(false)
  const mounted = useRef(true)
  useEffect(() => { return () => { mounted.current = false } }, [])

  useEffect(() => {
    if (!activeStoryId) return
    supabase.from('albums').select('*').eq('story_id', activeStoryId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => { if (mounted.current && data) setAlbums(data as AlbumType[]) })
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
    } catch (e: unknown) { toast({ icon: 'x', title: 'Error', body: e instanceof Error ? e.message : String(e) }) }
    finally { setSavingAlbum(false) }
  }

  const deleteAlbum = async (albumId: string) => {
    const ok = await confirm({ title: 'Eliminar álbum', body: 'Las fotos se conservan.', danger: true, confirmLabel: 'Eliminar' })
    if (!ok) return
    await supabase.from('albums').delete().eq('id', albumId)
    setAlbums(prev => prev.filter(a => a.id !== albumId))
    if (activeAlbumId === albumId) setActiveAlbumId(null)
  }

  const togglePickerSelection = (id: string) => {
    setPickerSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const assignSelectedToAlbum = async () => {
    if (!activeAlbumId || pickerSelected.size === 0) return
    setAssigningPhotos(true)
    try {
      const ids = Array.from(pickerSelected)
      await supabase.from('memories').update({ album_id: activeAlbumId }).in('id', ids)
      setMemories(memories.map(m => ids.includes(m.id) ? { ...m, album_id: activeAlbumId } : m))
      setPickerSelected(new Set())
      setPickerOpen(false)
    } catch (e: unknown) { toast({ icon: 'x', title: 'Error', body: e instanceof Error ? e.message : String(e) }) }
    finally { setAssigningPhotos(false) }
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

  const colCount = useColCount()
  const makeCols = useCallback((arr: Memory[]) => {
    const cols: Memory[][] = Array.from({ length: colCount }, () => [])
    arr.forEach((m, i) => cols[i % colCount]!.push(m))
    return cols
  }, [colCount])

  // ── Album detail view ──
  if (activeAlbumId !== null) {
    const album = albums.find(a => a.id === activeAlbumId)
    const cols = makeCols(albumMemories)
    const availableForPicker = memories.filter(m => m.album_id !== activeAlbumId)
    const pickerCols = makeCols(availableForPicker)
    return (
      <div className="page-enter" style={{ paddingBottom: 130, paddingTop: 'max(env(safe-area-inset-top), 32px)' }}>
        <div style={{ padding: '0 22px 0' }}>
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
            <button onClick={() => { setPickerSelected(new Set()); setPickerOpen(true) }}
              style={{ border: 'none', background: 'var(--orange-tint)', cursor: 'pointer',
                width: 38, height: 38, borderRadius: '50%', color: 'var(--orange-deep)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="plus" size={20} stroke={2.3} />
            </button>
            <button onClick={() => deleteAlbum(activeAlbumId)}
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
                  <MemoryCard key={m.id} m={m} onOpen={() => onImageClick(m)} delay={i * 0.04} me={me} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 30px', color: 'var(--ink-faint)' }}>
            <Icon name="image" size={40} style={{ opacity: 0.25, marginBottom: 12 }} />
            <div style={{ fontSize: 15, fontWeight: 600 }}>Este álbum está vacío</div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              Toca <strong>+</strong> para añadir fotos existentes
            </div>
          </div>
        )}

        {/* Photo picker sheet */}
        {pickerOpen && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 90, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)', animation: 'fadeIn .2s both' }} onClick={() => setPickerOpen(false)} />
            <div style={{ position: 'relative', background: 'var(--card)', borderRadius: '24px 24px 0 0',
              padding: '20px 20px 0', animation: 'sheetUp .38s cubic-bezier(.2,.9,.2,1) both',
              maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 16px', flexShrink: 0 }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexShrink: 0 }}>
                <div>
                  <div className="eyebrow" style={{ marginBottom: 2 }}>Añadir al álbum</div>
                  <h2 className="display" style={{ fontSize: 20, margin: 0 }}>
                    {pickerSelected.size > 0 ? `${pickerSelected.size} seleccionada${pickerSelected.size > 1 ? 's' : ''}` : 'Selecciona fotos'}
                  </h2>
                </div>
                <button onClick={() => setPickerOpen(false)} style={{ border: 'none', background: 'var(--card-2)',
                  cursor: 'pointer', width: 34, height: 34, borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-faint)', flexShrink: 0 }}>
                  <Icon name="x" size={17} />
                </button>
              </div>
              {availableForPicker.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--ink-faint)' }}>
                  <Icon name="image" size={36} style={{ opacity: 0.25, marginBottom: 10 }} />
                  <div style={{ fontSize: 14 }}>No hay más fotos disponibles</div>
                </div>
              ) : (
                <div style={{ overflowY: 'auto', flex: 1, paddingBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {pickerCols.map((col, ci) => (
                      <div key={ci} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {col.map(m => (
                          <button key={m.id} onClick={() => togglePickerSelection(m.id)} style={{
                            border: 'none', padding: 0, cursor: 'pointer', borderRadius: 12,
                            overflow: 'hidden', position: 'relative', display: 'block', width: '100%',
                            boxShadow: pickerSelected.has(m.id) ? '0 0 0 3px var(--orange)' : '0 0 0 3px transparent',
                            transition: 'boxShadow .15s',
                          }}>
                            <img src={m.image_url} alt="" loading="lazy" style={{
                              width: '100%', aspectRatio: '1', objectFit: 'cover', display: 'block',
                              objectPosition: `${m.position_x ?? 50}% ${m.position_y ?? 50}%` }} />
                            {pickerSelected.has(m.id) && (
                              <div style={{ position: 'absolute', top: 6, right: 6, width: 22, height: 22,
                                borderRadius: '50%', background: 'var(--orange)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="check" size={13} style={{ color: '#fff' }} stroke={2.5} />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ padding: '12px 0 40px', flexShrink: 0, borderTop: '1px solid var(--line)' }}>
                <button className="btn btn-primary btn-block" disabled={pickerSelected.size === 0 || assigningPhotos}
                  onClick={assignSelectedToAlbum}>
                  <Icon name="check" size={17} />
                  {assigningPhotos ? 'Añadiendo…' : `Añadir ${pickerSelected.size > 0 ? pickerSelected.size : ''} foto${pickerSelected.size !== 1 ? 's' : ''}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Main view ──
  return (
    <div className="page-enter" style={{ paddingBottom: 130, paddingTop: 'max(env(safe-area-inset-top), 32px)' }}>
      {/* Header - Drenched Block */}
      <div style={{ 
        margin: 'calc(-1 * max(env(safe-area-inset-top), 32px)) 0 24px 0',
        padding: 'max(env(safe-area-inset-top), 32px) 22px 28px',
        background: 'var(--hero-bg)',
        color: 'var(--hero-text)',
        borderRadius: '0 0 34px 34px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div className="eyebrow" style={{ marginBottom: 7, color: 'var(--hero-soft)' }}>Sus momentos</div>
            <h1 className="display" style={{ fontSize: 44, margin: 0 }}>Recuerdos</h1>
            <span className="squiggle" aria-hidden="true" style={{ color: 'currentColor', width: 92, marginTop: 12 }} />
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
      </div>

      <div style={{ padding: '0 22px 0' }}>

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
              <div style={{ width: 72, height: 72, borderRadius: 22, background: 'var(--orange-tint)',
                color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Icon name="image" size={34} />
              </div>
              <div className="display" style={{ fontSize: 24, marginBottom: 6 }}>¡Cero álbumes!</div>
              <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Agrupa sus mejores fotos en colecciones y no pierdas ni un solo detalle.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {albums.map(album => (
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
                  <MemoryCard key={m.id} m={m} onOpen={() => onImageClick(m)} delay={i * 0.04} me={me} />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 30px' }}>
            <div style={{ width: 80, height: 80, borderRadius: 24, background: 'var(--orange-tint)',
              color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icon name={q ? 'search' : 'image'} size={36} />
            </div>
            <div className="display" style={{ fontSize: 26, marginBottom: 6 }}>
              {q ? '¡Ups, no está aquí!' : '¡Qué silencio visual!'}
            </div>
            <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>
              {q
                ? `No encontramos nada para "${q}". Intenta con otra palabra mágica.`
                : 'Es hora de documentar sus aventuras. Pulsa el botón + y sube la primera.'}
            </div>
          </div>
        )
      )}
    </div>
  )
}
