import { useState } from 'react'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { PresenceDot } from '../components/ui/PresenceDot'
import { CatMedallion } from '../components/ui/CatMedallion'
import { useCurrency, CURRENCIES, type CurrencyKey } from '../context/CurrencyContext'
import { fmtDate, fmtDateShort } from '../lib/chapterUtils'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import type { PlanType, PersonDisplay } from '../lib/supabase'

interface Tx { id: string; type: 'ingreso' | 'gasto'; amount: number }

function daysTogether(since: string) {
  return Math.floor((Date.now() - new Date(since + 'T00:00:00').getTime()) / 86400000)
}

export function ProfileScreen({ plans, transactions, memories, onClose, onGoToFinance, onOpenPlan, partner, coupleCode }: {
  plans: PlanType[]
  transactions: Tx[]
  memories: { id: string }[]
  onClose: () => void
  onGoToFinance: () => void
  onOpenPlan: (p: PlanType) => void
  partner: PersonDisplay | null
  coupleCode: string | null
}) {
  const { profile, user, signOut, refreshProfile } = useAuth()
  const { currency, setCurrency, fmt } = useCurrency()

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [editAnniversary, setEditAnniversary] = useState(profile?.anniversary_date || '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)

  const lived = plans.filter(p => p.status === 'completado').length
  const favs = plans.filter(p => p.status === 'completado').slice(0, 3)
  const income = transactions.filter(t => t.type === 'ingreso').reduce((s, t) => s + t.amount, 0)
  const spent = transactions.filter(t => t.type === 'gasto').reduce((s, t) => s + t.amount, 0)
  const since = profile?.anniversary_date || ''
  const days = since ? daysTogether(since) : null

  const me: PersonDisplay = {
    name: profile?.full_name || 'Tú',
    initial: (profile?.full_name?.[0] || 'T').toUpperCase(),
    color: '#0474BA',
    avatar_url: profile?.avatar_url,
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `avatars/${user.id}.${ext}`
      const { error: upErr } = await supabase.storage.from('Fotos').upload(path, file, { upsert: true })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id)
      await refreshProfile()
    } catch (e: any) {
      alert('Error subiendo foto: ' + e.message)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const saveProfile = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase.from('profiles').update({
        full_name: editName.trim() || null,
        anniversary_date: editAnniversary || null,
      }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setEditing(false)
    } catch (e: any) {
      alert('Error: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const copyCode = () => {
    if (!coupleCode) return
    navigator.clipboard.writeText(coupleCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 1800)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95, background: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both',
    }}>
      {/* Header */}
      <div style={{
        paddingTop: 56, paddingBottom: 14, paddingLeft: 22, paddingRight: 18,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        flexShrink: 0, borderBottom: '1px solid var(--line-soft)', background: 'var(--paper)',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 5 }}>Quiénes son</div>
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>Su perfil</h1>
        </div>
        <button onClick={onClose} style={{
          width: 42, height: 42, borderRadius: '50%', border: 'none',
          background: 'var(--card)', cursor: 'pointer', color: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--sh-sm)', flexShrink: 0,
        }}>
          <Icon name="chevD" size={22} />
        </button>
      </div>

      <div className="ot-scroll" style={{ flex: 1, paddingBottom: 40 }}>

        {/* Couple hero */}
        <div style={{ padding: '20px 22px 0' }}>
          <div className="card" style={{ padding: '26px 20px 20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
              width: 260, height: 180, borderRadius: '50%',
              background: 'radial-gradient(ellipse, var(--orange-tint) 0%, transparent 70%)',
              pointerEvents: 'none',
            }} />
            <div style={{ position: 'relative' }}>
              {/* Avatars */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                {partner && (
                  <div style={{ position: 'relative' }}>
                    <Avatar person={partner} size={68} />
                    <span style={{ position: 'absolute', bottom: 1, right: 1 }}><PresenceDot size={13} /></span>
                  </div>
                )}
                {/* My avatar — tappable */}
                <div style={{ marginLeft: partner ? -18 : 0, zIndex: 1 }}>
                  <input id="avatar-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                  <button onClick={() => document.getElementById('avatar-file')?.click()}
                    style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', position: 'relative', display: 'block' }}>
                    <Avatar person={me} size={68} />
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: uploadingAvatar ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.18)',
                      transition: 'background .2s',
                    }}>
                      {uploadingAvatar
                        ? <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2.5px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                        : <Icon name="camera" size={15} style={{ color: '#fff' }} />
                      }
                    </div>
                  </button>
                </div>
              </div>

              <h2 className="display" style={{ fontSize: 24, margin: '0 0 4px' }}>
                {me.name}{partner ? ` & ${partner.name}` : ''}
              </h2>
              {since && <div style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}>Juntos desde {fmtDate(since)}</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 18, borderTop: '1px solid var(--line)' }}>
                {[
                  { value: days ?? '—', label: 'días' },
                  { value: lived,       label: 'capítulos' },
                  { value: memories.length, label: 'recuerdos' },
                ].map(({ value, label }) => (
                  <div key={label} style={{ flex: 1 }}>
                    <div className="display" style={{ fontSize: 30, color: 'var(--orange-deep)', lineHeight: 1 }}>{value}</div>
                    <div className="eyebrow" style={{ fontSize: 9.5, marginTop: 5 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Edit profile */}
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="eyebrow">Tu información</div>
            {!editing && (
              <button onClick={() => { setEditName(profile?.full_name || ''); setEditAnniversary(profile?.anniversary_date || ''); setEditing(true) }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: 'var(--orange)', padding: 0 }}>
                Editar
              </button>
            )}
          </div>
          {editing ? (
            <div className="card" style={{ padding: 18 }}>
              <label className="field-label">Tu nombre</label>
              <input className="field" value={editName} onChange={e => setEditName(e.target.value)}
                placeholder="Tu nombre" style={{ marginBottom: 16 }} autoFocus />
              <label className="field-label">Aniversario</label>
              <input className="field" type="date" value={editAnniversary} onChange={e => setEditAnniversary(e.target.value)} />
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <button onClick={() => setEditing(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                <button onClick={saveProfile} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                  {saving ? '…' : 'Guardar'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card" style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Row label="Nombre" value={me.name} />
              {since
                ? <Row label="Aniversario" value={fmtDate(since)} />
                : <div style={{ fontSize: 13.5, color: 'var(--ink-faint)', fontStyle: 'italic' }}>
                    Añade la fecha de vuestro aniversario
                  </div>
              }
            </div>
          )}
        </div>

        {/* Per-person cards */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Cada uno de ustedes</div>
          <div style={{ display: 'flex', gap: 12 }}>
            {([{ person: me, isMe: true }, ...(partner ? [{ person: partner, isMe: false }] : [])] as const).map(({ person, isMe }) => (
              <div key={String(isMe)} className="card" style={{ flex: 1, padding: '18px 14px', textAlign: 'center' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 11 }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar person={person} size={54} />
                    {!isMe && <span style={{ position: 'absolute', bottom: 0, right: 0 }}><PresenceDot size={10} /></span>}
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 15.5, marginBottom: 2 }}>{person.name}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 14 }}>{isMe ? 'Tú' : 'Tu pareja'}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { icon: 'feather', label: 'Capítulos', val: plans.length },
                    { icon: 'image',   label: 'Recuerdos', val: memories.length },
                  ].map(r => (
                    <div key={r.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      fontSize: 13, padding: '8px 10px', background: 'var(--card-2)', borderRadius: 10,
                    }}>
                      <span style={{ color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name={r.icon} size={13} />{r.label}
                      </span>
                      <span style={{ fontWeight: 700 }}>{r.val}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Finance summary */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Fondo común</div>
          <button onClick={() => { onClose(); onGoToFinance() }} className="card" style={{
            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBF6EE', flexShrink: 0 }}>
              <Icon name="wallet" size={21} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Nuestras cuentas</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                Saldo:{' '}
                <span style={{ fontWeight: 700, color: (income - spent) >= 0 ? 'var(--done)' : 'var(--orange-deep)' }}>
                  {fmt(income - spent)}
                </span>
              </div>
            </div>
            <Icon name="chevR" size={18} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
          </button>
        </div>

        {/* Favourite chapters */}
        {favs.length > 0 && (
          <div style={{ padding: '18px 22px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 12 }}>Capítulos vividos</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {favs.map(p => (
                <button key={p.id} onClick={() => { onClose(); onOpenPlan(p) }} className="card" style={{
                  width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                  display: 'flex', alignItems: 'center', gap: 13, padding: '13px 15px',
                }}>
                  <CatMedallion cat={p.type} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, lineHeight: 1.2 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 3 }}>
                      {fmtDateShort(p.plan_date)} · {new Date(p.plan_date + 'T00:00:00').getFullYear()}
                    </div>
                  </div>
                  <Icon name="checkCircle" size={16} style={{ color: 'var(--done)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Currency */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>Divisa</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {(Object.entries(CURRENCIES) as [CurrencyKey, { symbol: string; name: string }][]).map(([k, c], i, arr) => (
              <button key={k} onClick={() => setCurrency(k)} style={{
                width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 14, padding: '13px 18px', textAlign: 'left', color: 'var(--ink)',
                borderBottom: i < arr.length - 1 ? '1px solid var(--line-soft)' : 'none',
              }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0, fontSize: 15, fontWeight: 700,
                  background: currency === k ? 'var(--ink)' : 'var(--card-2)',
                  color: currency === k ? '#FBF6EE' : 'var(--ink-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s',
                }}>{c.symbol}</div>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
                {currency === k && <Icon name="check" size={16} stroke={2.5} style={{ color: 'var(--done)' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* App settings */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>App</div>
          <div className="card" style={{ overflow: 'hidden' }}>
            {/* Código de pareja */}
            <button onClick={copyCode} style={{
              width: '100%', border: 'none', background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', textAlign: 'left', color: 'var(--ink)',
              borderBottom: '1px solid var(--line-soft)',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--card-2)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                <Icon name="users" size={17} />
              </div>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>Código de pareja</span>
              <span style={{
                fontSize: 13, fontWeight: 700, letterSpacing: '0.05em',
                fontFamily: 'var(--font-display)',
                color: codeCopied ? 'var(--done)' : 'var(--orange-deep)',
              }}>
                {codeCopied ? '¡Copiado!' : (coupleCode || '—')}
              </span>
              <Icon name={codeCopied ? 'check' : 'copy'} size={15} style={{ color: 'var(--ink-faint)' }} />
            </button>
            {/* Notificaciones */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', color: 'var(--ink)',
            }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'var(--card-2)', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-soft)' }}>
                <Icon name="bell" size={17} />
              </div>
              <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>Notificaciones</span>
              <span style={{ fontSize: 13, color: 'var(--ink-faint)' }}>Activadas</span>
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div style={{ padding: '18px 22px 0' }}>
          <button onClick={signOut} style={{
            width: '100%', border: '1.5px solid var(--line)', background: 'transparent', cursor: 'pointer',
            borderRadius: 16, padding: '14px 18px', fontSize: 15, fontWeight: 600,
            color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            fontFamily: 'var(--font-ui)',
          }}>
            <Icon name="x" size={17} /> Cerrar sesión
          </button>
        </div>

        {/* Footer */}
        <div style={{ padding: '24px 22px 0', textAlign: 'center' }}>
          <div className="serif-i" style={{ fontSize: 18, color: 'var(--ink-faint)', marginBottom: 4 }}>OurTime</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Su historia, siempre</div>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
      <span style={{ color: 'var(--ink-soft)' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  )
}
