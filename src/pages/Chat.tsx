import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui/Icon'
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

function AiAvatar({ size = 30 }: { size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: size * 0.4,
      background: 'color-mix(in srgb, var(--blue) 18%, transparent)',
      color: 'var(--blue)',
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

interface Props {
  storyName?: string
  onBack: () => void
}

export default function Chat({ storyName, onBack }: Props) {
  const { activeStoryId } = useAuth()
  const [messages, setMessages] = useState<MessageType[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const tempSeq = useRef(0)

  const mounted = useRef(true)
  useEffect(() => { return () => { mounted.current = false } }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 50)
  }, [])

  useEffect(() => {
    if (!activeStoryId) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true)
    setMessages([])
    supabase.from('messages').select('*')
      .eq('story_id', activeStoryId)
      .order('created_at', { ascending: true })
      .limit(50)
      .then(({ data }) => {
        if (!mounted.current) return
        if (data) setMessages(data as MessageType[])
        setLoading(false)
        scrollToBottom('instant' as ScrollBehavior)
      })
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

    const { data, error } = await supabase.functions.invoke('ai-chat', {
      body: { text: trimmed, story_id: activeStoryId },
    })

    if (!mounted.current) return
    if (error || data?.error || !data?.aiMessage) {
      // Revertir el optimista y devolver el texto al input
      setMessages(prev => prev.filter(m => m.id !== tempId))
      setText(trimmed)
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
        padding: 'calc(env(safe-area-inset-top, 0px) + 12px) 14px 12px',
        background: 'var(--card)',
        borderBottom: '1px solid var(--line)',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: 'var(--sh-sm)',
      }}>
        <button onClick={onBack} style={{
          width: 38, height: 38, borderRadius: '50%', border: 'none',
          background: 'var(--card-2)', cursor: 'pointer', color: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon name="chevL" size={20} />
        </button>

        <AiAvatar size={40} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 15.5, lineHeight: 1.1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>Asistente OurTime</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {storyName ? `Ideas de planes para ${storyName}` : 'Ideas de planes'}
          </div>
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
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 8, maxWidth: 320 }}>
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
            <div key={msg.id}>
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
                marginTop: !prevSame && !showDate && idx > 0 ? 4 : 0,
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
                    {msg.text}
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
