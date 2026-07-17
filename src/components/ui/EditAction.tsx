import { Icon } from './Icon'

interface Props {
  label?: string
  onClick: () => void
  disabled?: boolean
  color?: string
  tone?: 'default' | 'onDark'
}

export function EditAction({ label = 'Editar', onClick, disabled = false, color = 'var(--orange)', tone = 'default' }: Props) {
  const onDark = tone === 'onDark'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        minHeight: 34,
        border: onDark ? 'none' : '1px solid var(--line)',
        borderRadius: 999,
        background: onDark ? '#fff' : 'var(--card-2)',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 13,
        fontWeight: 600,
        color: onDark ? '#211D18' : color,
        fontFamily: 'var(--font-ui)',
        padding: '6px 10px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        opacity: disabled ? 0.55 : 1,
      }}
    >
      <Icon name="edit" size={13} />
      {label}
    </button>
  )
}
