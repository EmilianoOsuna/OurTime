import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import type { MessageType, PersonDisplay } from '../lib/supabase'

function fmtTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  if (diffDays === 1) return 'Ayer'
  if (diffDays < 7) return d.toLocaleDateString('es-ES', { weekday: 'short' })
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function shouldShowDate(msgs: MessageType[], idx: number): boolean {
  if (idx === 0) return true
  const prev = new Date(msgs[idx - 1].created_at)
  const curr = new Date(msgs[idx].created_at)
  return prev.toDateString() !== curr.toDateString()
}

function fmtDateLabel(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000)
  if (diffDays === 0) return 'Hoy'
  if (diffDays === 1) return 'Ayer'
  return d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
}

interface Props {
  me: PersonDisplay
  partner: PersonDisplay | null
}

export default function Chat({ me, partner }: Props) {
  const { activeStoryId, user } = useAuth()
  const [messages, setMessages] = useState<MessageType[]>([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior }), 50)
  }, [])

  // Load + subscribe
  useEffect(() => {
    if (!activeStoryId) return
    setLoading(true)

    supabase.from('messages').select('*')
      .eq('story_id', activeStoryId)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data) setMessages(data as MessageType[])
        setLoading(false)
        scrollToBottom('instant' as ScrollBehavior)
      })

    const channel = supabase.channel('chat:' + activeStoryId)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `story_id=eq.${activeStoryId}` },
        payload => {
          setMessages(prev => [...prev, payload.new as MessageType])
          scrollToBottom()
        })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [activeStoryId, scrollToBottom])

  // Mark incoming messages as read
  useEffect(() => {
    if (!activeStoryId || !user || messages.length === 0) return
    const unread = messages.filter(m => m.sender_id !== user.id && !m.read_at)
    if (unread.length === 0) return
    supabase.from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('story_id', activeStoryId)
      .neq('sender_id', user.id)
      .is('read_at', null)
  }, [messages, activeStoryId, user])

  const send = async () => {
    const trimmed = text.trim()
    if (!trimmed || !activeStoryId || !user || sending) return
    setSending(true)
    setText('')
    const { error } = await supabase.from('messages').insert({
      story_id: activeStoryId,
      sender_id: user.id,
      text: trimmed,
    })
    if (error) setText(trimmed)
    setSending(false)
    inputRef.current?.focus()
  }

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '50vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid var(--orange)',
          borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh', background: 'var(--paper)',
      paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))' }}>
      {/* Header */}
      <div style={{ padding: '52px 22px 14px', flexShrink: 0, borderBottom: '1px solid var(--line)' }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>Su espacio</div>
        <h1 className="display" style={{ fontSize: 28, margin: 0 }}>Chat</h1>
      </div>

      {/* Messages */}
      <div className="ot-scroll" style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.length === 0 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, color: 'var(--ink-faint)', paddingBottom: 60 }}>
            <Icon name="chat" size={44} style={{ opacity: 0.25 }} />
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-soft)' }}>Empiecen a escribir</div>
            <div style={{ fontSize: 13.5, textAlign: 'center', maxWidth: 220 }}>Este es su espacio privado. Solo ustedes pueden leer esto.</div>
          </div>
        )}

        {messages.map((msg, idx) => {
          const isMe = msg.sender_id === user?.id
          const showDate = shouldShowDate(messages, idx)
          const person = isMe ? me : (partner ?? { name: 'Compañero', initial: 'C', color: '#F17720' })

          // Group consecutive messages from same sender
          const prevSame = idx > 0 && messages[idx - 1].sender_id === msg.sender_id && !shouldShowDate(messages, idx)
          const nextSame = idx < messages.length - 1 && messages[idx + 1].sender_id === msg.sender_id

          return (
            <div key={msg.id}>
              {showDate && (
                <div style={{ textAlign: 'center', margin: '12px 0 8px', fontSize: 11.5, fontWeight: 600,
                  color: 'var(--ink-faint)', fontFamily: 'var(--font-ui)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {fmtDateLabel(msg.created_at)}
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row',
                alignItems: 'flex-end', gap: 8, marginBottom: nextSame ? 2 : 10 }}>
                {/* Avatar — only on last message in a group */}
                <div style={{ width: 28, flexShrink: 0, visibility: (!nextSame) ? 'visible' : 'hidden' }}>
                  {!isMe && <Avatar person={person} size={28} />}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '72%' }}>
                  {/* Bubble */}
                  <div style={{
                    padding: '10px 14px',
                    borderRadius: isMe
                      ? (prevSame ? '18px 6px 6px 18px' : '18px 18px 6px 18px')
                      : (prevSame ? '6px 18px 18px 6px' : '18px 18px 18px 6px'),
                    ...(nextSame ? {} : { borderRadius: isMe ? '18px 18px 6px 18px' : '18px 18px 18px 6px' }),
                    background: isMe ? 'var(--orange)' : 'var(--card)',
                    color: isMe ? '#fff' : 'var(--ink)',
                    boxShadow: isMe ? 'none' : 'var(--sh-sm)',
                    fontSize: 15,
                    lineHeight: 1.45,
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap',
                  }}>
                    {msg.text}
                  </div>
                  {/* Time + read receipt — only last in group */}
                  {!nextSame && (
                    <div style={{ fontSize: 10.5, color: 'var(--ink-faint)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                      {fmtTime(msg.created_at)}
                      {isMe && msg.read_at && <Icon name="check" size={11} style={{ color: 'var(--blue)' }} />}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ flexShrink: 0, padding: '10px 12px 14px', borderTop: '1px solid var(--line)',
        background: 'var(--card)', display: 'flex', alignItems: 'flex-end', gap: 10 }}>
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe algo…"
          rows={1}
          style={{
            flex: 1, border: '1.5px solid var(--line)', borderRadius: 20, padding: '10px 16px',
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
          transition: 'all .18s', boxShadow: text.trim() ? '0 3px 10px rgba(241,119,32,0.35)' : 'none',
        }}>
          <Icon name="send" size={18} />
        </button>
      </div>
    </div>
  )
}
