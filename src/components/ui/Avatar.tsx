import React, { useEffect, useState } from 'react'
import { imageUrl } from '../../lib/supabase'
import { Icon } from './Icon'

interface Person {
  name: string
  initial: string
  color: string
  avatar_url?: string | null
  accessory?: string | null
}

export function Avatar({ person, size = 40, ring = true, style = {} }: {
  person: Person
  size?: number
  ring?: boolean
  style?: React.CSSProperties
}) {
  const [failed, setFailed] = useState(false)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setFailed(false), [person.avatar_url])
  const shadow = ring ? '0 0 0 2px rgba(255,255,255,0.6)' : 'none'

  const renderAccessory = () => {
    if (!person.accessory || person.accessory === 'none') return null
    
    const padding = Math.max(4, size * 0.1)
    const outerSize = size + padding * 2
    const frameStyle: React.CSSProperties = {
      position: 'absolute', top: -padding, left: -padding,
      width: outerSize, height: outerSize, borderRadius: '50%',
      pointerEvents: 'none', zIndex: 2,
    }

    if (person.accessory === 'neon') {
      frameStyle.boxShadow = '0 0 10px var(--orange), inset 0 0 6px var(--orange)'
      frameStyle.border = '1.5px solid var(--orange)'
    } else if (person.accessory === 'dashed') {
      frameStyle.border = '2px dashed var(--orange)'
      frameStyle.animation = 'spin 12s linear infinite'
    } else if (person.accessory === 'double') {
      frameStyle.border = '3px double var(--orange)'
    } else if (person.accessory === 'orbit') {
      frameStyle.border = '1.5px solid var(--line-strong)'
      return (
        <div style={frameStyle}>
          <div style={{ 
            position: 'absolute', top: -4, left: outerSize / 2 - 4, width: 8, height: 8, 
            borderRadius: '50%', background: 'var(--orange)', boxShadow: '0 0 6px var(--orange)',
            animation: 'spin 4s linear infinite', transformOrigin: `4px ${outerSize / 2 + 4}px`
          }} />
        </div>
      )
    } else {
      // fallback to old icon style for crown, star, etc if they still exist in db
      const sizePx = Math.max(12, size * 0.35)
      return (
        <div style={{
          position: 'absolute', top: -sizePx*0.4, right: -sizePx*0.3,
          background: 'var(--paper)', borderRadius: '50%', padding: sizePx*0.15,
          boxShadow: 'var(--sh-sm)', zIndex: 2,
          color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon name={person.accessory} size={sizePx} />
        </div>
      )
    }
    return <div style={frameStyle} />
  }

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0, ...style }}>
      {person.avatar_url && !failed ? (
        <div style={{
          width: size, height: size, borderRadius: '50%',
          overflow: 'hidden', flexShrink: 0, boxShadow: shadow,
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
      ) : (
        <div className="avatar" style={{
          width: size, height: size, background: person.color,
          fontSize: size * 0.46,
          boxShadow: ring ? `inset 0 0 0 2px rgba(255,255,255,0.55)` : 'none',
        }}>{person.initial}</div>
      )}
      {renderAccessory()}
    </div>
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
