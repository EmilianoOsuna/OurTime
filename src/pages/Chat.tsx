import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { sendPushToStoryMembers } from '../lib/usePushNotifications'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import type { MessageType, PersonDisplay } from '../lib/supabase'

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

interface Props {
  me: PersonDisplay
  partner: PersonDisplay | null
  storyName?: string
  storyCoverUrl?: string | null
  onBack: () => void
}

export default function Chat({ me, partner, storyName, storyCoverUrl, onBack }: Props) {
  const { activeStoryId, user } = useAuth()
  const [messages, setMessages] = useState<MessageType[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<(PersonDisplay & { userId?: string })[]>([])
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const mounted = useRef(true)
  useEffect(() => { return () => { mounted.current = false } }, [])

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 50)
  }, [])

  useEffect(() => {
    if (!activeStoryId) return
    setLoading(true)
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

    supabase.from('story_members')
      .select('user_id, profiles(full_name, avatar_url)')
      .eq('story_id', activeStoryId)
      .then(({ data }) => {
        if (!mounted.current) return
        if (data) {
          setMembers(data.map((m: any) => ({
            userId: m.user_id,
            name: m.profiles?.full_name || 'Anónimo',
            initial: (m.profiles?.full_name?.[0] || '?').toUpperCase(),
            color: 'var(--orange)',
          })))
        }
      })

    const channel = supabase.channel('chat:' + activeStoryId)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `story_id=eq.${activeStoryId}` },
        payload => {
          if (!mounted.current) return
          setMessages(prev => [...prev, payload.new as MessageType])
          scrollToBottom()
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeStoryId, scrollToBottom])

  useEffect(() => {
    if (!activeStoryId || !user || messages.length === 0) return
    const unread = messages.filter(m => m.sender_id !== user.id && !m.read_at)
    if (unread.length === 0) return
    supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('story_id', activeStoryId)
      .neq('sender_id', user.id)
      .is('read_at', null)
      .then(undefined, console.error)
  }, [messages, activeStoryId, user])

  const send = async () => {
    const trimmed = text.trim()
    if (!trimmed || !activeStoryId || !user || sending) return
    setSending(true)
    setText('')
    const { error } = await supabase.from('messages').insert({
      story_id: activeStoryId, sender_id: user.id, text: trimmed,
    })
    if (error) {
      setText(trimmed)
    } else {
      sendPushToStoryMembers(
        activeStoryId, user.id,
        me.name || 'Nuevo mensaje',
        trimmed.length > 80 ? trimmed.slice(0, 80) + '…' : trimmed,
        '/?shortcut=chat'
      ).catch(console.error)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  const title = storyName || partner?.name || 'Chat'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10,
      display: 'flex', flexDirection: 'column',
      background: 'var(--paper)',
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

        <div style={{ position: 'relative', flexShrink: 0 }}>
          {storyCoverUrl ? (
            <img src={storyCoverUrl} alt="" style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--orange-tint)',
              color: 'var(--orange-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chat" size={20} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 700, fontSize: 15.5, lineHeight: 1.1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {members.filter(m => m.userId !== user?.id).map(m => m.name).join(', ') || 'Solo tú'}
          </div>
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="ot-scroll" style={{
        flex: 1, overflowY: 'auto',
        padding: '14px 14px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {loading && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', border: '3px solid var(--orange)',
              borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', gap: 10, color: 'var(--ink-faint)', paddingBottom: 40 }}>
            <div style={{ width: 64, height: 64, borderRadius: 22, background: 'var(--orange-tint)',
              color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="chat" size={30} />
            </div>
            <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--ink-soft)', marginTop: 4 }}>
              Empiecen a escribir
            </div>
            <div style={{ fontSize: 13, textAlign: 'center', maxWidth: 200, lineHeight: 1.5 }}>
              Este es su espacio privado. Solo ustedes pueden leer esto.
            </div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id
          const showDate = shouldShowDate(messages, idx)
          const person = isMe ? me : (partner ?? { name: 'Compañero', initial: 'C', color: 'var(--orange)' })
          const prev = idx > 0 ? messages[idx - 1] : null
          const next = idx < messages.length - 1 ? messages[idx + 1] : null
          const prevSame = !!(prev && prev.sender_id === msg.sender_id && !shouldShowDate(messages, idx))
          const nextSame = !!(next && next.sender_id === msg.sender_id && !shouldShowDate(messages, idx + 1))

          // Border-radius: tail corner (bottom-right for me, bottom-left for them) rounds down when last in group
          const br = isMe
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
                display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 7,
                marginBottom: nextSame ? 2 : 10,
                marginTop: !prevSame && !showDate && idx > 0 ? 4 : 0,
              }}>
                {/* Avatar placeholder — keeps alignment even when hidden */}
                <div style={{ width: 30, flexShrink: 0, alignSelf: 'flex-end' }}>
                  {!isMe && !nextSame && <Avatar person={person} size={30} />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '74%' }}>
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: br,
                    background: isMe ? 'var(--orange)' : 'var(--card)',
                    color: isMe ? '#fff' : 'var(--ink)',
                    boxShadow: isMe ? 'none' : 'var(--sh-sm)',
                    fontSize: 15, lineHeight: 1.45,
                    wordBreak: 'break-word', whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                  {!nextSame && (
                    <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 3,
                      display: 'flex', alignItems: 'center', gap: 4 }}>
                      {fmtTime(msg.created_at)}
                      {isMe && msg.read_at && <Icon name="check" size={11} style={{ color: 'var(--orange)' }} />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
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
          placeholder="Escribe algo…"
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
        <button onClick={send} disabled={!text.trim() || sending} style={{
          width: 44, height: 44, borderRadius: '50%', border: 'none', flexShrink: 0,
          background: text.trim() ? 'var(--orange)' : 'var(--card-2)',
          color: text.trim() ? '#fff' : 'var(--ink-faint)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: text.trim() ? 'pointer' : 'default',
          transition: 'all .18s',
          boxShadow: text.trim() ? '0 3px 12px color-mix(in srgb, var(--orange) 45%, transparent)' : 'none',
          transform: text.trim() ? 'scale(1)' : 'scale(0.92)',
        }}>
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  )
}
