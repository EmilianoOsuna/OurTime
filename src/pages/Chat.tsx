import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui/Icon'
import { useConfirm } from '../components/ui/ConfirmDialog'
import ReactMarkdown, { defaultUrlTransform } from 'react-markdown'
import { getCachedLocation, requestLocationPermission } from '../lib/native'
import type { MessageType } from '../lib/supabase'

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return 'Ayer'
  if (now.getTime() - d.getTime() < 7 * 86400000) return d.toLocaleDateString('es-ES', { weekday: 'short' })
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function shouldShowDate(msgs: MessageType[], idx: number): boolean {
  if (idx === 0) return true
  const prev = msgs[idx - 1]
  const curr = msgs[idx]
  if (!prev || !curr) return true
  return new Date(prev.created_at).toDateString() !== new Date(curr.created_at).toDateString()
}

function fmtDateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const dStr = d.toDateString()
  const nowStr = now.toDateString()
  if (dStr === nowStr) return 'Hoy'
  const yesterday = new Date(now); yesterday.setDate(yesterday.getDate() - 1)
  if (dStr === yesterday.toDateString()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

const QUICK_PROMPTS = [
  'Ideas para una cita este finde',
  'Juegos para jugar a distancia',
  'Plan barato para hoy',
  'Ideas para un aniversario',
]

function AiAvatar({ size = 30, drenched = false }: { size?: number; drenched?: boolean }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.4,
      background: drenched ? 'rgba(255,255,255,0.2)' : 'color-mix(in srgb, var(--blue) 18%, transparent)',
      color: drenched ? '#fff' : 'var(--blue)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    }}>
      <Icon name="sparkle" size={size * 0.55} />
    </div>
  )
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 7, marginTop: 4 }}>
      <div style={{ width: 30, alignSelf: 'flex-end' }}><AiAvatar /></div>
      <div style={{
        padding: '13px 16px', borderRadius: '6px 18px 18px 18px',
        background: 'var(--card)', boxShadow: 'var(--sh-sm)',
        display: 'flex', gap: 5, alignItems: 'center',
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--blue)',
            opacity: 0.6, animation: `pulse 1s ease-in-out ${i * 0.18}s infinite alternate`,
          }} />
        ))}
      </div>
    </div>
  )
}

interface MessageItemProps {
  msg: MessageType
  isAi: boolean
  showDate: boolean
  nextSame: boolean
  prevSame: boolean
  br: string
}

// Los links map: del modelo traen espacios ("map:Pujol, CDMX") y CommonMark no
// acepta destinos con espacios, así que el link no se parseaba y salía como
// texto plano. Se codifica el destino para que ReactMarkdown lo convierta en <a>.
function encodeMapLinks(text: string): string {
  return text.replace(/\]\(map:([^)]*)\)/g, (_m, place: string) => `](map:${encodeURIComponent(place.trim())})`)
}

// react-markdown descarta protocolos desconocidos como map: por seguridad;
// se permite explícitamente solo ese y el resto pasa por el filtro estándar.
function mapUrlTransform(url: string): string {
  return url.startsWith('map:') ? url : defaultUrlTransform(url)
}

const MemoizedMessageItem = memo(function MessageItem({ msg, isAi, showDate, nextSame, prevSame, br }: MessageItemProps) {
  return (
    <div>
      {showDate && (
        <div style={{ textAlign: 'center', margin: '14px 0 10px', fontSize: 11, fontWeight: 700,
          color: 'var(--ink-faint)', fontFamily: 'var(--font-ui)',
          textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          {fmtDateLabel(msg.created_at)}
        </div>
      )}
      <div style={{
        display: 'flex', flexDirection: isAi ? 'row' : 'row-reverse',
        alignItems: 'flex-end', gap: 7,
        marginBottom: nextSame ? 2 : 10,
        marginTop: !prevSame && !showDate ? 4 : 0,
      }}>
        {isAi && (
          <div style={{ width: 30, flexShrink: 0, alignSelf: 'flex-end' }}>
            {!nextSame && <AiAvatar />}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column',
          alignItems: isAi ? 'flex-start' : 'flex-end', maxWidth: '78%' }}>
          <div style={{
            padding: '10px 14px',
            borderRadius: br,
            background: isAi ? 'var(--card)' : 'var(--orange)',
            color: isAi ? 'var(--ink)' : '#fff',
            boxShadow: isAi ? 'var(--sh-sm)' : 'none',
            border: isAi ? '1px solid color-mix(in srgb, var(--blue) 25%, transparent)' : 'none',
            fontSize: 15, lineHeight: 1.45,
            wordBreak: 'break-word', whiteSpace: 'pre-wrap',
          }}>
            {isAi ? (
              <div className="md-chat-content">
                <ReactMarkdown
                  urlTransform={mapUrlTransform}
                  components={{
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    a: ({ node, ...props }) => {
                      if (props.href?.startsWith('map:')) {
                        const place = decodeURIComponent(props.href.replace('map:', '')).trim()
                        return (
                          <a href={`https://maps.google.com/?q=${encodeURIComponent(place)}`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginTop: 12, marginBottom: 8, borderRadius: 16, border: '1px solid var(--line)', background: 'var(--paper)', textDecoration: 'none', color: 'inherit', boxShadow: 'var(--sh-sm)' }}>
                            <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
                              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <Icon name="sparkle" size={20} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place}</div>
                                <div style={{ fontSize: 13, color: 'var(--blue)', marginTop: 2 }}>Abrir en Mapas</div>
                              </div>
                            </div>
                          </a>
                        )
                      }
                      return <a {...props} style={{ color: 'var(--blue)', textDecoration: 'underline' }} target="_blank" rel="noopener noreferrer" />
                    }
                  }}
                >
                  {encodeMapLinks(msg.text)}
                </ReactMarkdown>
              </div>
            ) : (
              msg.text
            )}
          </div>
          {!nextSame && (
            <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 3 }}>
              {fmtTime(msg.created_at)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

interface Props {
  storyName?: string
  onBack: () => void
}

export default function Chat({ storyName, onBack }: Props) {
  const { activeStoryId } = useAuth()
  const confirm = useConfirm()
  const [messages, setMessages] = useState<MessageType[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const tempSeq = useRef(0)

  const mounted = useRef(true)
  useEffect(() => { 
    mounted.current = true
    return () => { mounted.current = false } 
  }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 50)
  }, [])

  // Reset al cambiar de historia: durante el render, no dentro del efecto
  // (evita los renders en cascada que marca react-hooks/set-state-in-effect)
  const [loadedStoryId, setLoadedStoryId] = useState(activeStoryId)
  if (loadedStoryId !== activeStoryId) {
    setLoadedStoryId(activeStoryId)
    setMessages([])
    setLoading(true)
  }

  useEffect(() => {
    if (!activeStoryId) return

    // Iniciar búsqueda de GPS en segundo plano al montar el chat
    getCachedLocation()

    let cancelled = false
    supabase.from('messages').select('*')
      .eq('story_id', activeStoryId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (cancelled) return
        if (data) setMessages(data as MessageType[])
        setLoading(false)
        scrollToBottom('instant' as ScrollBehavior)
      })
    return () => { cancelled = true }
  }, [activeStoryId, scrollToBottom])

  const send = async (raw?: string) => {
    const trimmed = (raw ?? text).trim()
    if (!trimmed || !activeStoryId || sending) return
    setSending(true)
    setText('')

    // Mensaje optimista mientras responde la IA
    tempSeq.current += 1
    const tempId = 'temp-' + tempSeq.current
    const optimistic: MessageType = {
      id: tempId, story_id: activeStoryId, sender_id: 'me',
      text: trimmed, created_at: new Date().toISOString(), read_at: null, role: 'user',
    }
    setMessages(prev => [...prev, optimistic])
    scrollToBottom()

    // ── Obtener ubicación del caché sin bloquear la UI ──
    const locationContext = await getCachedLocation()

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { text: trimmed, story_id: activeStoryId, location: locationContext },
    })

    if (!mounted.current) return
    if (error || data?.error || !data?.aiMessage) {
      console.error('Edge function error:', error, data)
      let err: string = data?.error || error?.message || 'Error desconocido'
      if (!data?.error && error) {
        // FunctionsHttpError trae la respuesta original en context; leerla para
        // mostrar el mensaje real (p.ej. el aviso de límite por hora del 429)
        // en lugar de "non-2xx status code".
        try {
          const body = await (error as { context?: Response }).context?.json()
          if (body?.error) err = body.error
        } catch { /* respuesta sin JSON: se queda error.message */ }
      }

      // Mostrar el error usando el diseño de la app en lugar de un feo alert() nativo
      confirm({
        title: 'Error de Conexión',
        body: `Hubo un problema al contactar a la IA: ${err}. Revisa tu conexión o las claves API.`,
        confirmLabel: 'Entendido',
        cancelLabel: 'Cerrar',
        danger: true
      })

      if (data?.userMessage) {
        // El mensaje sí quedó guardado y solo falló la IA: conservarlo para
        // no perderlo ni duplicarlo si el usuario reintenta.
        setMessages(prev => prev.map(m => (m.id === tempId ? data.userMessage as MessageType : m)))
      } else {
        // No llegó a guardarse: revertir el optimista y devolver el texto al input
        setMessages(prev => prev.filter(m => m.id !== tempId))
        setText(trimmed)
      }
    } else {
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempId),
        data.userMessage as MessageType,
        data.aiMessage as MessageType,
      ])
      scrollToBottom()
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      background: 'var(--paper)',
      minHeight: '100dvh', height: '100dvh',
    }}>
      {/* ── Header ── */}
      <div style={{
        flexShrink: 0,
        padding: 'calc(max(env(safe-area-inset-top), 32px) + 4px) 14px 16px',
        background: 'var(--hero-bg)',
        color: 'var(--hero-text)',
        display: 'flex', alignItems: 'center', gap: 12,
        borderRadius: '0 0 34px 34px',
        position: 'relative', zIndex: 11,
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: 'var(--card)', cursor: 'pointer', color: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          boxShadow: 'var(--sh-sm)',
        }}>
          <Icon name="chevL" size={20} />
        </button>

        <div style={{ width: 42, height: 42, borderRadius: 16, background: 'var(--card)', color: 'var(--hero-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: 'var(--sh-sm)' }}>
          <Icon name="sparkle" size={24} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="display" style={{
            fontSize: 22, lineHeight: 1.1, color: 'var(--hero-text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>Asistente IA</div>
          {storyName && <div style={{ fontSize: 13, color: 'var(--hero-soft)', marginTop: 2 }}>{storyName}</div>}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="ot-scroll" style={{
        flex: 1, minHeight: 0, overflowY: 'auto',
        padding: '14px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {loading && (
          <div aria-label="Cargando mensajes" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 10, paddingBottom: 12 }}>
            {[58, 72, 46, 66].map((width, index) => (
              <div key={width} style={{
                width: `${width}%`, height: index === 1 ? 58 : 42, borderRadius: 18,
                alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end',
                background: index % 2 === 0 ? 'var(--card)' : 'var(--orange-tint)',
                opacity: 0.7, animation: `pulse 1.4s ease-in-out ${index * 0.08}s infinite alternate`,
              }} />
            ))}
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, color: 'var(--ink-faint)', paddingBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 22,
              background: 'color-mix(in srgb, var(--blue) 15%, transparent)',
              color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkle" size={30} />
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink-soft)', marginTop: 4 }}>
              ¿Qué hacemos hoy?
            </div>
            <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 230, lineHeight: 1.5 }}>
              Pídeme ideas de citas, planes y actividades para compartir.
            </div>
            
            <button onClick={async () => {
              const ok = await requestLocationPermission()
              if (ok) {
                await getCachedLocation()
                confirm({ title: 'GPS Activado', body: 'Ahora la IA usará tu ubicación para sugerir lugares reales cercanos a ti.', cancelLabel: 'Cerrar', danger: false })
              }
            }} style={{ background: 'transparent', border: '1px solid var(--line)', padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600, color: 'var(--ink-soft)', marginTop: 4, cursor: 'pointer' }}>
              📍 Activar sugerencias locales
            </button>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 12, maxWidth: 320 }}>
              {QUICK_PROMPTS.map(p => (
                <button key={p} onClick={() => send(p)} disabled={sending} style={{
                  border: '1.5px solid var(--line)', borderRadius: 999, padding: '8px 14px',
                  background: 'var(--card)', color: 'var(--ink)', cursor: 'pointer',
                  fontFamily: 'var(--font-ui)', fontSize: 12.5, fontWeight: 600,
                }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isAi = msg.role === 'ai'
          const showDate = shouldShowDate(messages, idx)
          const prev = idx > 0 ? messages[idx - 1] : null
          const next = idx < messages.length - 1 ? messages[idx + 1] : null
          const prevSame = !!(prev && (prev.role === 'ai') === isAi && !shouldShowDate(messages, idx))
          const nextSame = !!(next && (next.role === 'ai') === isAi && !shouldShowDate(messages, idx + 1))

          // Border-radius: tail corner (bottom-right for me, bottom-left for the AI) rounds down when last in group
          const br = !isAi
            ? (nextSame ? '18px 6px 6px 18px' : '18px 6px 18px 18px')
            : (nextSame ? '6px 18px 18px 6px' : '6px 18px 18px 18px')

          return (
            <MemoizedMessageItem
              key={msg.id}
              msg={msg}
              isAi={isAi}
              showDate={showDate}
              nextSame={nextSame}
              prevSame={prevSame}
              br={br}
            />
          )
        })}

        {sending && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      {/* ── Input ── */}
      <div style={{
        flexShrink: 0,
        padding: '10px 12px',
        paddingBottom: 'calc(10px + env(safe-area-inset-bottom, 0px))',
        borderTop: '1px solid var(--line)',
        background: 'var(--card)',
        display: 'flex', alignItems: 'flex-end', gap: 10,
      }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => {
            setText(e.target.value)
            // Auto-grow
            e.target.style.height = 'auto'
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
          }}
          onKeyDown={handleKey}
          placeholder="Pide una idea de plan…"
          rows={1}
          style={{
            flex: 1, border: '1.5px solid var(--line)', borderRadius: 22, padding: '10px 16px',
            fontFamily: 'var(--font-ui)', fontSize: 15, resize: 'none', outline: 'none',
            background: 'var(--paper)', color: 'var(--ink)', lineHeight: 1.4,
            maxHeight: 120, overflowY: 'auto', transition: 'border-color .15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--orange)')}
          onBlur={e => (e.target.style.borderColor = 'var(--line)')}
        />
        <button onClick={() => send()} disabled={!text.trim() || sending} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: text.trim() && !sending ? 'var(--orange)' : 'var(--card-2)',
          color: text.trim() && !sending ? '#fff' : 'var(--ink-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: text.trim() && !sending ? 'pointer' : 'default',
          transition: 'all .18s',
          boxShadow: text.trim() && !sending ? '0 3px 12px color-mix(in srgb, var(--orange) 45%, transparent)' : 'none',
          transform: text.trim() && !sending ? 'scale(1)' : 'scale(0.92)',
        }}>
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  )
}
