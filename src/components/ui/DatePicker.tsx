import { useState } from 'react'
import { Icon } from './Icon'

const DIAS  = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
               'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

type Mode = 'days' | 'months' | 'years'

function parseSafe(v: string) {
  if (!v) return new Date()
  const d = new Date(v.slice(0,10) + 'T00:00:00Z')
  return isNaN(d.getTime()) ? new Date() : d
}

export function DatePicker({ value, onChange, label, minDate }: {
  value: string
  onChange: (v: string) => void
  label?: string
  minDate?: string
}) {
  const todayStr = new Date().toISOString().slice(0, 10)
  const ref = parseSafe(value || todayStr)
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<Mode>('days')
  const [ym, setYm] = useState({ y: ref.getUTCFullYear(), m: ref.getUTCMonth() })

  const firstDay    = new Date(ym.y, ym.m, 1)
  const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1
  const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)

  const toStr = (d: number) =>
    `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const displayVal = value
    ? new Date(value.slice(0,10) + 'T00:00:00Z').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
    : 'Seleccionar fecha'

  const prevMonth = () => setYm(({ y, m }) => m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 })
  const nextMonth = () => setYm(({ y, m }) => m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 })

  // Year range for year picker (current decade ±4)
  const yearBase = Math.floor(ym.y / 10) * 10 - 1
  const years = Array.from({ length: 12 }, (_, i) => yearBase + i)

  const openPicker = () => { setOpen(true); setMode('days') }

  return (
    <div>
      {label && (
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--ink-soft)',
          textTransform: 'uppercase', letterSpacing: '.07em', marginBottom: 8 }}>
          {label}
        </label>
      )}

      {/* Trigger */}
      <button type="button" onClick={() => open ? setOpen(false) : openPicker()} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
        padding: '11px 14px', borderRadius: 14, border: '1.5px solid var(--line)',
        background: 'var(--card-2)', cursor: 'pointer', textAlign: 'left',
        fontSize: 15, color: value ? 'var(--ink)' : 'var(--ink-faint)', fontFamily: 'var(--font-ui)',
        boxSizing: 'border-box',
      }}>
        <Icon name="calendar" size={17} style={{ color: 'var(--orange)', flexShrink: 0 }} />
        <span style={{ flex: 1 }}>{displayVal}</span>
        <Icon name={open ? 'chevD' : 'chevR'} size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
      </button>

      {/* Calendar dropdown */}
      {open && (
        <div className="card" style={{
          marginTop: 8, padding: '14px 10px 16px', boxShadow: 'var(--sh-md)',
          animation: 'anim-up .2s both',
        }}>
          {/* ── Month nav header ── */}
          {mode === 'days' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <button type="button" onClick={prevMonth} style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--card-2)', cursor: 'pointer', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="chevL" size={17} />
                </button>
                <button type="button" onClick={() => setMode('months')} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                  color: 'var(--ink)', padding: '4px 10px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {MESES[ym.m]} {ym.y}
                  <Icon name="chevD" size={13} style={{ color: 'var(--ink-faint)' }} />
                </button>
                <button type="button" onClick={nextMonth} style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--card-2)', cursor: 'pointer', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="chevR" size={17} />
                </button>
              </div>

              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 6 }}>
                {DIAS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 10.5, fontWeight: 700,
                    color: 'var(--ink-faint)', paddingBottom: 4, textTransform: 'uppercase', letterSpacing: '.04em' }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px 0' }}>
                {cells.map((d, i) => {
                  if (!d) return <div key={i} />
                  const str = toStr(d)
                  const isSelected = str === value
                  const isToday    = str === todayStr
                  const disabled   = minDate ? str < minDate : false
                  return (
                    <button key={i} type="button"
                      disabled={disabled}
                      onClick={() => { onChange(str); setOpen(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        height: 36, width: '100%', border: 'none', cursor: disabled ? 'default' : 'pointer',
                        borderRadius: 8, fontSize: 14,
                        background: isSelected ? 'var(--orange)' : 'transparent',
                        color: disabled ? 'var(--ink-faint)' : isSelected ? '#fff' : isToday ? 'var(--orange)' : 'var(--ink)',
                        fontWeight: isSelected || isToday ? 700 : 400,
                        boxShadow: isToday && !isSelected ? 'inset 0 0 0 1.5px var(--orange)' : 'none',
                        opacity: disabled ? 0.35 : 1,
                        fontFamily: 'var(--font-ui)',
                      }}>
                      {d}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Month picker ── */}
          {mode === 'months' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button type="button" onClick={() => setYm(v => ({ ...v, y: v.y - 1 }))} style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--card-2)', cursor: 'pointer', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="chevL" size={17} />
                </button>
                <button type="button" onClick={() => setMode('years')} style={{
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
                  color: 'var(--ink)', padding: '4px 10px', borderRadius: 8,
                  display: 'flex', alignItems: 'center', gap: 4,
                }}>
                  {ym.y}
                  <Icon name="chevD" size={13} style={{ color: 'var(--ink-faint)' }} />
                </button>
                <button type="button" onClick={() => setYm(v => ({ ...v, y: v.y + 1 }))} style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--card-2)', cursor: 'pointer', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="chevR" size={17} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {MESES.map((mes, idx) => {
                  const isSelected = idx === ym.m && ym.y === parseSafe(value || todayStr).getUTCFullYear()
                  const isCurrent  = idx === new Date().getMonth() && ym.y === new Date().getFullYear()
                  return (
                    <button key={mes} type="button" onClick={() => { setYm(v => ({ ...v, m: idx })); setMode('days') }}
                      style={{
                        border: 'none', borderRadius: 10, padding: '10px 4px',
                        background: isSelected ? 'var(--orange)' : 'transparent',
                        color: isSelected ? '#fff' : isCurrent ? 'var(--orange)' : 'var(--ink)',
                        fontWeight: isSelected || isCurrent ? 700 : 400,
                        cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13.5,
                        boxShadow: isCurrent && !isSelected ? 'inset 0 0 0 1.5px var(--orange)' : 'none',
                      }}>
                      {mes.slice(0, 3)}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {/* ── Year picker ── */}
          {mode === 'years' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <button type="button" onClick={() => setYm(v => ({ ...v, y: v.y - 12 }))} style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--card-2)', cursor: 'pointer', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="chevL" size={17} />
                </button>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, color: 'var(--ink-soft)' }}>
                  {years[0]} – {years[years.length - 1]}
                </span>
                <button type="button" onClick={() => setYm(v => ({ ...v, y: v.y + 12 }))} style={{
                  width: 34, height: 34, borderRadius: '50%', border: 'none',
                  background: 'var(--card-2)', cursor: 'pointer', color: 'var(--ink)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon name="chevR" size={17} />
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                {years.map(yr => {
                  const isSelected = yr === ym.y
                  const isCurrent  = yr === new Date().getFullYear()
                  return (
                    <button key={yr} type="button" onClick={() => { setYm(v => ({ ...v, y: yr })); setMode('months') }}
                      style={{
                        border: 'none', borderRadius: 10, padding: '10px 4px',
                        background: isSelected ? 'var(--orange)' : 'transparent',
                        color: isSelected ? '#fff' : isCurrent ? 'var(--orange)' : 'var(--ink)',
                        fontWeight: isSelected || isCurrent ? 700 : 400,
                        cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: 13.5,
                        boxShadow: isCurrent && !isSelected ? 'inset 0 0 0 1.5px var(--orange)' : 'none',
                      }}>
                      {yr}
                    </button>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
