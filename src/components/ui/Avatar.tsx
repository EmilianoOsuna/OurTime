import React, { useEffect, useState } from 'react'
import { imageUrl } from '../../lib/supabase'

interface Person {
  name: string
  initial: string
  color: string
  avatar_url?: string | null
}

export function Avatar({ person, size = 40, ring = true, style = {} }: {
  person: Person
  size?: number
  ring?: boolean
  style?: React.CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [person.avatar_url])
  const shadow = ring ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none'
  if (person.avatar_url && !failed) {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        overflow: 'hidden', flexShrink: 0, boxShadow: shadow, ...style,
      }}>
        <img
          src={imageUrl(person.avatar_url, size * 2) ?? ''}
          alt={person.name}
          loading="eager"
          decoding="async"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block',
            background: person.color }}
        />
      </div>
    )
  }
  return (
    <div className="avatar" style={{
      width: size, height: size, background: person.color,
      fontSize: size * 0.46,
      boxShadow: ring ? `inset 0 0 0 2px rgba(255,255,255,0.55)` : 'none',
      ...style,
    }}>{person.initial}</div>
  )
}

export function CoupleAvatars({ me, partner, size = 34, gap = -10 }: {
  me: Person
  partner: Person
  size?: number
  gap?: number
}) {
  return (
    <div style={{ display: 'flex' }}>
      <Avatar person={partner} size={size} />
      <div style={{ marginLeft: gap }}><Avatar person={me} size={size} /></div>
    </div>
  )
}
