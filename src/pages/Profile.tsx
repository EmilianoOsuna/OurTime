import { useState, useEffect } from 'react'
import { Icon } from '../components/ui/Icon'
import { EditAction } from '../components/ui/EditAction'
import { Avatar } from '../components/ui/Avatar'
import { compressToWebP } from '../lib/imageUtils'
import { PresenceDot } from '../components/ui/PresenceDot'
import { useCurrency, CURRENCIES, type CurrencyKey } from '../context/CurrencyContext'
import { fmtDate } from '../lib/chapterUtils'
import { DatePicker } from '../components/ui/DatePicker'
import { useAuth } from '../context/AuthContext'
import { supabase, nativeRedirectUrl } from '../lib/supabase'
import { Browser, isNative } from '../lib/native'
import type { PlanType, PersonDisplay, StoryType } from '../lib/supabase'
import { useToast } from '../context/ToastContext'
import { useConfirm } from '../components/ui/ConfirmDialog'
import { connectGoogleCalendarWithCode, sendTestPushNotification, testGoogleCalendarConnection, usePushNotifications } from '../lib/usePushNotifications'
import { requestGoogleCalendarCode } from '../lib/googleWeb'
import { useEntitlement } from '../lib/useEntitlement'
import { paywallEnabled } from '../lib/stripe'
import { openPaywall } from '../lib/paywall'

const CAT_COLOR: Record<string, string> = {
  pareja:  'var(--cat-pareja)',
  amigos:  'var(--cat-amigos)',
  familia: 'var(--cat-familia)',
  otro:    'var(--cat-otro)',
}
const CAT_ICON: Record<string, string> = {
  pareja: 'heartFill', amigos: 'users', familia: 'home', otro: 'tag',
}
const CAT_LABEL: Record<string, string> = {
  pareja: 'Pareja', amigos: 'Amigos', familia: 'Familia', otro: 'Otro',
}

interface StoryMember {
  userId: string
  name: string
  avatar_url: string | null
  isMe: boolean
  role: string | null
  joinedAt: string | null
  permissionLevel: string
}

export function ProfileScreen({ plans, onClose, onGoToFinance, storyCode, isAdmin = false, onEditStory }: {
  plans: PlanType[]
  onClose: () => void
  onGoToFinance: () => void
  storyCode: string | null
  isAdmin?: boolean
  onEditStory?: (s: StoryType) => void
}) {
  const { profile, user, signOut, refreshProfile, refreshStories, stories, activeStoryId, setActiveStoryId } = useAuth()
  const entitlement = useEntitlement(activeStoryId)
  const { currency, setCurrency, fmt } = useCurrency()
  const { push: toast } = useToast()
  const confirm = useConfirm()

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [editBirthday, setEditBirthday] = useState(profile?.birthday || '')
  const [editNickname, setEditNickname] = useState(profile?.nickname || '')
  const [editAccessory, setEditAccessory] = useState(profile?.accessory || '')
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [codeCopied, setCodeCopied] = useState(false)
  const [joinCode, setJoinCode] = useState('')
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState('')
  const [joinSuccess, setJoinSuccess] = useState(false)
  const [members, setMembers] = useState<StoryMember[]>([])
  const [editingRole, setEditingRole] = useState(false)
  const [roleInput, setRoleInput] = useState('')
  const [savingRole, setSavingRole] = useState(false)
  const [selectedMember, setSelectedMember] = useState<StoryMember | null>(null)
  const [joinedStoryId, setJoinedStoryId] = useState<string | null>(null)
  const [joinedStoryName, setJoinedStoryName] = useState('')
  const [newRole, setNewRole] = useState('')
  const [savingNewRole, setSavingNewRole] = useState(false)

  const activeStory = stories.find(s => s.id === activeStoryId) ?? null
  const spent = plans.reduce((s, p) => s + (p.actual_amount ?? 0), 0)
  const budget = activeStory?.budget ?? null
  const storyStartDate = activeStory?.start_date || ''

  const me: PersonDisplay = {
    name: profile?.full_name || 'Tú',
    initial: (profile?.full_name?.[0] || 'T').toUpperCase(),
    color: '#0474BA',
    avatar_url: profile?.avatar_url,
    accessory: profile?.accessory,
  }

  useEffect(() => {
    if (!activeStoryId || !user) return
    supabase.from('story_members')
      .select('user_id, role, joined_at, permission_level, profiles(full_name, avatar_url)')
      .eq('story_id', activeStoryId)
      .then(({ data }) => {
        if (!data) return
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: StoryMember[] = data.map((m: any) => ({
          userId: m.user_id,
          name: m.profiles?.full_name || 'Miembro',
          avatar_url: m.profiles?.avatar_url || null,
          isMe: m.user_id === user.id,
          role: m.role || null,
          joinedAt: m.joined_at || null,
          permissionLevel: m.permission_level || 'member',
        }))
        setMembers(list)
        const me = list.find(m => m.isMe)
        if (me) setRoleInput(me.role || '')
      })
  }, [activeStoryId, user])

  const toggleMemberPermission = async (target: StoryMember) => {
    if (!activeStoryId || !user) return
    // Roles y permisos por miembro son un beneficio del plan Familia.
    if (paywallEnabled && !entitlement.limits.roles) { openPaywall('roles'); return }
    const newLevel = target.permissionLevel === 'admin' ? 'member' : 'admin'
    await supabase.from('story_members')
      .update({ permission_level: newLevel })
      .eq('story_id', activeStoryId)
      .eq('user_id', target.userId)
    setMembers(ms => ms.map(m => m.userId === target.userId ? { ...m, permissionLevel: newLevel } : m))
    setSelectedMember(prev => prev ? { ...prev, permissionLevel: newLevel } : null)
  }

  const expelMember = async (target: StoryMember) => {
    if (!activeStoryId) return
    const ok = await confirm({
      title: 'Expulsar de la historia',
      body: `¿Estás seguro de que quieres expulsar a ${target.name} de esta historia? Perderá acceso inmediato a todos los momentos, recuerdos y chats.`,
      danger: true,
      confirmLabel: 'Expulsar',
    })
    if (!ok) return

    try {
      const { error } = await supabase.from('story_members')
        .delete()
        .eq('story_id', activeStoryId)
        .eq('user_id', target.userId)
      if (error) throw error

      setMembers(ms => ms.filter(m => m.userId !== target.userId))
      setSelectedMember(null)
      toast({ icon: 'trash', eyebrow: 'Miembro', title: 'Miembro expulsado', body: `${target.name} ya no forma parte de la historia.` })
    } catch (e: unknown) {
      toast({ icon: 'x', title: 'Error', body: e instanceof Error ? e.message : String(e) })
    }
  }

  const saveRole = async () => {
    if (!activeStoryId || !user) return
    setSavingRole(true)
    await supabase.from('story_members')
      .update({ role: roleInput.trim() || null })
      .eq('story_id', activeStoryId)
      .eq('user_id', user.id)
    setMembers(ms => ms.map(m => m.isMe ? { ...m, role: roleInput.trim() || null } : m))
    setSavingRole(false)
    setEditingRole(false)
  }

  const googleAvatarUrl = (user?.user_metadata?.avatar_url as string | undefined)
                       ?? (user?.user_metadata?.picture as string | undefined)
                       ?? null

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setUploadingAvatar(true)
    try {
      const webp = await compressToWebP(file, 400, 0.85)
      const path = `avatars/${user.id}.webp`
      const { error: upErr } = await supabase.storage.from('Fotos').upload(path, webp, { upsert: true, contentType: 'image/webp' })
      if (upErr) throw upErr
      const { data: { publicUrl } } = supabase.storage.from('Fotos').getPublicUrl(path)
      const url = publicUrl + '?t=' + Date.now()
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id)
      await refreshProfile()
    } catch (e: unknown) {
      toast({ icon: 'x', title: 'Error subiendo foto', body: e instanceof Error ? e.message : String(e) })
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const useGoogleAvatar = async () => {
    if (!user || !googleAvatarUrl) return
    setUploadingAvatar(true)
    try {
      await supabase.from('profiles').update({ avatar_url: googleAvatarUrl }).eq('id', user.id)
      await refreshProfile()
      toast({ icon: 'check', title: 'Foto actualizada', body: 'Usando tu foto de Google' })
    } catch (e: unknown) {
      toast({ icon: 'x', title: 'Error', body: e instanceof Error ? e.message : String(e) })
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
        birthday: editBirthday || null,
        nickname: editNickname.trim() || null,
        accessory: editAccessory || null,
      }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setEditing(false)
    } catch (e: unknown) {
      toast({ icon: 'x', title: 'Error', body: e instanceof Error ? e.message : String(e) })
    } finally {
      setSaving(false)
    }
  }

  const copyCode = () => {
    if (!storyCode) return
    navigator.clipboard.writeText(storyCode)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 1800)
  }

  const handleJoinStory = async () => {
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoining(true)
    setJoinError('')
    try {
      const { data: newStoryId, error } = await supabase.rpc('join_story_by_invite_code', { p_invite_code: code })
      if (error) throw error
      await refreshStories()
      setJoinSuccess(true)
      setJoinCode('')
      setTimeout(() => setJoinSuccess(false), 2500)
      // Switch to the newly joined story and prompt for role
      if (newStoryId) {
        setActiveStoryId(newStoryId)
        const { data: storyData } = await supabase
          .from('stories').select('id, name').eq('id', newStoryId).single()
        if (storyData) {
          setJoinedStoryId(storyData.id)
          setJoinedStoryName(storyData.name)
        }
      }
    } catch (e: unknown) {
      const msg: string = (e instanceof Error ? e.message : String(e)) || 'Código inválido'
      setJoinError(msg.includes('MEMBER_CAP_REACHED')
        ? 'Esta Historia alcanzó su límite de miembros. Pide al administrador que active el plan Familia.'
        : msg)
    } finally {
      setJoining(false)
    }
  }

  const saveNewRole = async () => {
    if (!joinedStoryId || !user) return
    setSavingNewRole(true)
    await supabase.from('story_members')
      .update({ role: newRole.trim() || null })
      .eq('story_id', joinedStoryId)
      .eq('user_id', user.id)
    setSavingNewRole(false)
    setJoinedStoryId(null)
    setNewRole('')
    // Refresh members if this is the active story
    if (joinedStoryId === activeStoryId) {
      const { data } = await supabase.from('story_members')
        .select('user_id, role, joined_at, permission_level, profiles(full_name, avatar_url)')
        .eq('story_id', activeStoryId)
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const list: StoryMember[] = data.map((m: any) => ({
          userId: m.user_id,
          name: m.profiles?.full_name || 'Miembro',
          avatar_url: m.profiles?.avatar_url || null,
          isMe: m.user_id === user.id,
          role: m.role || null,
          joinedAt: m.joined_at || null,
          permissionLevel: m.permission_level || 'member',
        }))
        setMembers(list)
      }
    }
  }

  const storyColor = activeStory ? (CAT_COLOR[activeStory.category] || 'var(--orange)') : 'var(--orange)'

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 95, background: 'var(--paper)',
      display: 'flex', flexDirection: 'column',
      animation: 'sheetUp .42s cubic-bezier(.2,.9,.2,1) both',
    }}>
      {/* Header — bloque drenched masivo */}
      <div style={{
        paddingTop: 'max(env(safe-area-inset-top), 40px)', paddingBottom: 60, paddingLeft: 22, paddingRight: 22,
        position: 'relative', flexShrink: 0,
        background: 'var(--hero-bg)', color: 'var(--hero-text)',
        borderRadius: '0 0 34px 34px',
        textAlign: 'center',
      }}>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="display" style={{ fontSize: 44, margin: '0 0 6px', color: 'var(--hero-text)', lineHeight: 1 }}>
            {me.name}
          </h1>
          <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--hero-soft)' }}>
            {profile?.nickname || 'Explorador'}
          </div>
        </div>

        <button data-testid="profile-close-btn" onClick={onClose} style={{
          position: 'absolute', top: 'max(env(safe-area-inset-top), 40px)', right: 18, width: 42, height: 42,
          borderRadius: '50%', border: 'none', background: 'var(--card)', boxShadow: 'var(--sh-sm)',
          cursor: 'pointer', color: 'var(--ink)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 10,
        }}>
          <Icon name="chevD" size={22} />
        </button>

        {/* Floating Avatar */}
        <div style={{ position: 'absolute', bottom: -50, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <input id="avatar-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
          <button onClick={() => document.getElementById('avatar-file')?.click()}
            style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', position: 'relative', display: 'block' }}>
            <div style={{ borderRadius: '50%', padding: 4, background: 'var(--paper)', boxShadow: 'var(--sh-md)' }}>
              <Avatar person={me} size={92} />
            </div>
            <div style={{
              position: 'absolute', inset: 4, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: uploadingAvatar ? 'rgba(0,0,0,0.45)' : 'transparent',
            }}>
              {uploadingAvatar && <div style={{ width: 20, height: 20, borderRadius: '50%', border: '3px solid var(--paper)', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />}
            </div>
            <div style={{
              position: 'absolute', bottom: 0, right: 0, width: 30, height: 30,
              borderRadius: '50%', background: 'var(--blue)', border: '3px solid var(--paper)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff'
            }}>
              <Icon name="camera" size={13} stroke={2.5} />
            </div>
          </button>
        </div>
      </div>

      <div className="ot-scroll" style={{ flex: 1, paddingBottom: 40, paddingTop: 60 }}>

        {/* ── SECCIÓN: ESTA HISTORIA ── */}
        {activeStory && (
          <div style={{ padding: '20px 22px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="eyebrow">Esta Historia</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {onEditStory && (
                  <EditAction label={isAdmin ? 'Editar' : 'Opciones'} onClick={() => onEditStory(activeStory)} />
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '18px 18px 16px' }}>
              {/* Story name + category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: storyColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={CAT_ICON[activeStory.category] || 'tag'} size={22} style={{ color: 'var(--paper)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 17, lineHeight: 1.2, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeStory.name}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                    {CAT_LABEL[activeStory.category] || activeStory.category}
                  </div>
                </div>
              </div>

              {/* Members */}
              {members.length > 0 && (
                <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 14, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', fontFamily: 'var(--font-ui)',
                      textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Miembros · {members.length}
                    </div>
                    {!editingRole && (
                      <EditAction onClick={() => setEditingRole(true)} />
                    )}
                  </div>
                  {editingRole && (
                    <div style={{ marginBottom: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        className="field"
                        placeholder="Tu rol en esta historia…"
                        value={roleInput}
                        onChange={e => setRoleInput(e.target.value)}
                        autoFocus
                        style={{ flex: 1 }}
                        maxLength={32}
                      />
                      <button onClick={saveRole} disabled={savingRole} className="btn btn-primary"
                        style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 12, fontSize: 13 }}>
                        {savingRole ? '…' : <Icon name="check" size={15} />}
                      </button>
                      <button onClick={() => setEditingRole(false)} style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        color: 'var(--ink-faint)', padding: 6, flexShrink: 0,
                      }}>
                        <Icon name="x" size={15} />
                      </button>
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    {members.map(m => (
                      <button key={m.userId}
                        onClick={() => !m.isMe && setSelectedMember(m)}
                        style={{
                          border: 'none', background: 'transparent', cursor: m.isMe ? 'default' : 'pointer',
                          padding: 0, display: 'flex', alignItems: 'center', gap: 9, textAlign: 'left',
                        }}>
                        <div style={{ position: 'relative' }}>
                          <Avatar
                            person={{ name: m.name, initial: m.name[0]?.toUpperCase() || '?', color: m.isMe ? '#0474BA' : '#F17720', avatar_url: m.avatar_url }}
                            size={40}
                          />
                          {m.permissionLevel === 'admin' && (
                            <span style={{
                              position: 'absolute', bottom: -2, right: -2,
                              width: 14, height: 14, borderRadius: '50%',
                              background: 'var(--orange)', border: '2px solid var(--card)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Icon name="shield" size={7} style={{ color: 'var(--paper)' }} />
                            </span>
                          )}
                          {!m.isMe && m.permissionLevel !== 'admin' && (
                            <span style={{ position: 'absolute', bottom: 0, right: 0 }}>
                              <PresenceDot size={10} />
                            </span>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 13.5, fontWeight: 700 }}>{m.name}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                            {m.isMe
                              ? (m.role || (m.permissionLevel === 'admin' ? 'Admin' : 'Tú'))
                              : (m.role || (m.permissionLevel === 'admin' ? 'Admin' : 'Miembro'))}
                          </div>
                        </div>
                        {!m.isMe && <Icon name="chevR" size={13} style={{ color: 'var(--ink-faint)', marginLeft: 2 }} />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Story start date */}
              {storyStartDate && (
                <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 12, marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-faint)', fontFamily: 'var(--font-ui)',
                    textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    Desde
                  </div>
                  <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>{fmtDate(storyStartDate)}</div>
                </div>
              )}

              {/* Invite code */}
              <button onClick={copyCode} style={{
                width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
                background: 'var(--card-2)', borderRadius: 12, padding: '11px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <Icon name="share" size={16} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--ink-faint)', fontFamily: 'var(--font-ui)',
                    textTransform: 'uppercase', letterSpacing: '0.05em' }}>Código de invitación</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 15, fontWeight: 700, letterSpacing: '0.12em',
                    color: codeCopied ? 'var(--done)' : storyColor, marginTop: 1 }}>
                    {codeCopied ? '¡Copiado!' : (storyCode || activeStory.invite_code).toUpperCase()}
                  </div>
                </div>
                <Icon name={codeCopied ? 'check' : 'copy'} size={15} style={{ color: 'var(--ink-faint)' }} />
              </button>
            </div>
          </div>
        )}

        {/* ── SECCIÓN: TU PERFIL ── */}
        <div style={{ padding: '18px 22px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span className="eyebrow">Tu perfil</span>
            {!editing && (
              <EditAction onClick={() => { setEditName(profile?.full_name || ''); setEditBirthday(profile?.birthday || ''); setEditNickname(profile?.nickname || ''); setEditAccessory(profile?.accessory || ''); setEditing(true) }} />
            )}
          </div>

          <div className="card" style={{ padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: editing ? 16 : 0 }}>
              {/* Avatar */}
              {/* Datos (el avatar ahora está arriba) */}
              <div style={{ flex: 1 }}>
                {googleAvatarUrl && googleAvatarUrl !== profile?.avatar_url && (
                  <button onClick={useGoogleAvatar} disabled={uploadingAvatar} style={{
                    marginBottom: 10, border: 'none', background: 'var(--card-2)', borderRadius: 8,
                    padding: '6px 10px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center',
                    gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--blue)',
                    fontFamily: 'var(--font-ui)',
                  }}>
                    <Icon name="googleCal" size={13} style={{ color: 'var(--blue)' }} /> Usar foto de Google
                  </button>
                )}

              {!editing && (
                <div>
                  {profile?.birthday
                    ? <div style={{ fontSize: 14, color: 'var(--ink-soft)' }}>Cumpleaños: <strong>{fmtDate(profile.birthday)}</strong></div>
                    : <div style={{ fontSize: 14, color: 'var(--ink-faint)' }}>Sin cumpleaños configurado</div>
                  }
                </div>
              )}
              </div>
            </div>

            {editing && (
              <>
                <label className="field-label">Tu nombre</label>
                <input className="field" value={editName} onChange={e => setEditName(e.target.value)}
                  placeholder="Tu nombre" style={{ marginBottom: 14 }} autoFocus />
                <label className="field-label">Apodo (opcional)</label>
                <input className="field" value={editNickname} onChange={e => setEditNickname(e.target.value)}
                  placeholder="Tu apodo" style={{ marginBottom: 14 }} />
                <DatePicker label="Cumpleaños" value={editBirthday} onChange={setEditBirthday} />
                <label className="field-label" style={{ marginTop: 20 }}>Borde de perfil</label>
                <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                  {['none', 'neon', 'dashed', 'double', 'orbit'].map(acc => {
                    const on = editAccessory === acc || (acc === 'none' && !editAccessory)
                    
                    const previewStyle: React.CSSProperties = { width: 22, height: 22, borderRadius: '50%' }
                    if (acc === 'neon') {
                      previewStyle.boxShadow = '0 0 6px var(--orange), inset 0 0 4px var(--orange)'
                      previewStyle.border = '1px solid var(--orange)'
                    } else if (acc === 'dashed') {
                      previewStyle.border = '2px dashed var(--orange)'
                    } else if (acc === 'double') {
                      previewStyle.border = '3px double var(--orange)'
                    } else if (acc === 'orbit') {
                      previewStyle.border = '1.5px solid var(--line-strong)'
                    }
                    
                    return (
                      <button key={acc} onClick={() => setEditAccessory(acc)} style={{
                        width: 44, height: 44, borderRadius: 12, border: on ? '2px solid var(--orange)' : '2px solid var(--line)',
                        background: on ? 'var(--orange-tint)' : 'var(--card-2)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: on ? 'var(--orange-deep)' : 'var(--ink-soft)',
                      }}>
                        {acc === 'none' ? (
                          <span style={{fontSize: 12, fontWeight: 700}}>Nada</span>
                        ) : (
                          <div style={{ position: 'relative' }}>
                            <div style={previewStyle} />
                            {acc === 'orbit' && (
                              <div style={{
                                position: 'absolute', top: -2, left: 11 - 2.5, width: 5, height: 5,
                                borderRadius: '50%', background: 'var(--orange)', boxShadow: '0 0 4px var(--orange)'
                              }} />
                            )}
                          </div>
                        )}
                      </button>
                    )
                  })}
                </div>
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button onClick={() => setEditing(false)} className="btn btn-ghost" style={{ flex: 1 }}>Cancelar</button>
                  <button onClick={saveProfile} className="btn btn-primary" style={{ flex: 1 }} disabled={saving}>
                    {saving ? '…' : 'Guardar'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── SECCIÓN: UNIRSE A HISTORIA ── */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Unirse a una Historia</div>
          <div className="card" style={{ padding: '14px 16px' }}>
            <div style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, marginBottom: 12 }}>
              ¿Tienes un código de invitación? Úsalo para unirte.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <input
                className="field"
                placeholder="Código (ej. AB12CD)"
                value={joinCode}
                onChange={e => { setJoinCode(e.target.value.toUpperCase()); setJoinError('') }}
                style={{ flex: 1, letterSpacing: '0.08em', fontWeight: 700, textTransform: 'uppercase' }}
                maxLength={8}
              />
              <button onClick={handleJoinStory} disabled={!joinCode.trim() || joining}
                className="btn btn-primary" style={{ flexShrink: 0, padding: '12px 16px', borderRadius: 12 }}>
                {joining ? '…' : <Icon name="arrowR" size={17} />}
              </button>
            </div>
            {joinError && (
              <div style={{ fontSize: 12.5, color: 'var(--orange-deep)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="x" size={13} /> {joinError}
              </div>
            )}
            {joinSuccess && (
              <div style={{ fontSize: 12.5, color: 'var(--done)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <Icon name="checkCircle" size={13} /> ¡Te uniste a la historia!
              </div>
            )}
            {joinedStoryId && (
              <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--card-2)', borderRadius: 14,
                border: '1.5px solid var(--line)' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>
                  ¿Cuál es tu rol en «{joinedStoryName}»?
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginBottom: 10 }}>
                  Ej: Papá, Mamá, Hermano/a, Amigo/a…
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="field"
                    placeholder="Tu rol (opcional)"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                    autoFocus
                    style={{ flex: 1 }}
                    maxLength={32}
                    onKeyDown={e => e.key === 'Enter' && saveNewRole()}
                  />
                  <button onClick={saveNewRole} disabled={savingNewRole}
                    className="btn btn-primary"
                    style={{ flexShrink: 0, padding: '10px 14px', borderRadius: 12, fontSize: 13 }}>
                    {savingNewRole ? '…' : <Icon name="check" size={15} />}
                  </button>
                  <button onClick={() => { setJoinedStoryId(null); setNewRole('') }}
                    style={{ border: 'none', background: 'transparent', cursor: 'pointer',
                      color: 'var(--ink-faint)', padding: 6, flexShrink: 0 }}>
                    <Icon name="x" size={15} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── SECCIÓN: RESUMEN FINANCIERO ── */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Fondo común</div>
          <button onClick={() => { onClose(); onGoToFinance() }} className="card" style={{
            width: '100%', border: 'none', cursor: 'pointer', textAlign: 'left',
            padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14,
          }}>
            <div style={{ width: 46, height: 46, borderRadius: 14, background: 'var(--ink)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--paper)', flexShrink: 0 }}>
              <Icon name="wallet" size={21} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Presupuesto</div>
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 2 }}>
                {budget !== null
                  ? <>Saldo: <span style={{ fontWeight: 700, color: (budget - spent) >= 0 ? 'var(--done)' : 'var(--orange-deep)' }}>{fmt(budget - spent)}</span></>
                  : <>Gastado: <span style={{ fontWeight: 700 }}>{fmt(spent)}</span></>
                }
              </div>
            </div>
            <Icon name="chevR" size={18} style={{ color: 'var(--ink-faint)', flexShrink: 0 }} />
          </button>
        </div>

        {/* ── SECCIÓN: DIVISA ── */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Divisa</div>
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
                  color: currency === k ? 'var(--paper)' : 'var(--ink-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .18s',
                }}>{c.symbol}</div>
                <span style={{ flex: 1, fontSize: 14.5, fontWeight: 600 }}>{c.name}</span>
                {currency === k && <Icon name="check" size={16} stroke={2.5} style={{ color: 'var(--done)' }} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── SECCIÓN: SUSCRIPCIÓN ── */}
        {paywallEnabled && (
          <div style={{ padding: '18px 22px 0' }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>Suscripción</div>
            <button
              onClick={() => openPaywall('generic')}
              className="ot-card"
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: 16,
                cursor: 'pointer', textAlign: 'left', border: entitlement.isPro ? '1px solid var(--line)' : '1.5px solid var(--orange)' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: 'var(--orange-tint)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--orange)' }}>
                <Icon name="sparkle" size={19} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {entitlement.isPro
                    ? `Plan ${entitlement.plan === 'familia' ? 'Familia' : 'Duo'} activo`
                    : 'Mejora esta Historia'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>
                  {entitlement.isPro
                    ? (entitlement.cancelAtPeriodEnd ? 'Se cancelará al final del periodo' : 'Gestiona tu suscripción')
                    : 'Fotos y momentos ilimitados, y más'}
                </div>
              </div>
              <Icon name="chevR" size={18} style={{ color: 'var(--ink-faint)' }} />
            </button>
          </div>
        )}

        {/* ── SECCIÓN: APP ── */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Integraciones</div>
          <PushNotificationsSection />
          <GoogleCalendarSection />
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

        <div style={{ padding: '24px 22px 0', textAlign: 'center' }}>
          <div className="serif-i" style={{ fontSize: 18, color: 'var(--ink-faint)', marginBottom: 4 }}>OurTime</div>
          <div style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>Su historia, siempre</div>
        </div>
      </div>

      {/* ── Mini-perfil de miembro ── */}
      {selectedMember && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div onClick={() => setSelectedMember(null)} style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)',
            animation: 'fadeIn .18s both',
          }} />
          <div style={{
            position: 'relative', background: 'var(--card)',
            borderRadius: 'var(--r-md) var(--r-md) 0 0', padding: '24px 22px 40px',
            animation: 'sheetUp .32s cubic-bezier(.2,.9,.2,1) both',
          }}>
            <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--line)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <Avatar
                person={{ name: selectedMember.name, initial: selectedMember.name[0]?.toUpperCase() || '?', color: '#F17720', avatar_url: selectedMember.avatar_url }}
                size={60}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{selectedMember.name}</div>
                <div style={{ fontSize: 13, color: 'var(--ink-faint)', marginTop: 3 }}>
                  {selectedMember.role || 'Miembro de la historia'}
                </div>
              </div>
            </div>
            {selectedMember.joinedAt && (
              <div style={{ fontSize: 13, color: 'var(--ink-soft)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Icon name="calendar" size={14} />
                Se unió el {new Date(selectedMember.joinedAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                flex: 1, padding: '8px 12px', borderRadius: 10,
                background: selectedMember.permissionLevel === 'admin' ? 'var(--orange-tint)' : 'var(--card-2)',
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <Icon name="shield" size={13} style={{ color: selectedMember.permissionLevel === 'admin' ? 'var(--orange-deep)' : 'var(--ink-faint)' }} />
                <span style={{ fontSize: 12.5, fontWeight: 600, color: selectedMember.permissionLevel === 'admin' ? 'var(--orange-deep)' : 'var(--ink-faint)' }}>
                  {selectedMember.permissionLevel === 'admin' ? 'Administrador' : 'Miembro'}
                </span>
              </div>
              {isAdmin && (
                <button onClick={() => toggleMemberPermission(selectedMember)} style={{
                  border: '1.5px solid var(--line)', background: 'var(--card)', borderRadius: 10,
                  padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)',
                  cursor: 'pointer', fontFamily: 'var(--font-ui)', flexShrink: 0,
                }}>
                  {selectedMember.permissionLevel === 'admin' ? 'Degradar' : 'Promover'}
                </button>
              )}
            </div>
            {isAdmin && (
              <button onClick={() => expelMember(selectedMember)} style={{
                marginTop: 12, width: '100%', border: 'none', background: 'var(--card-2)',
                color: 'var(--orange-deep)', borderRadius: 14, padding: '13px', fontFamily: 'var(--font-ui)',
                fontWeight: 700, fontSize: 14.5, cursor: 'pointer', display: 'flex',
                alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                <Icon name="trash" size={16} />
                Expulsar de la Historia
              </button>
            )}
            <button onClick={() => setSelectedMember(null)} style={{
              marginTop: 16, width: '100%', border: '1.5px solid var(--line)', background: 'transparent',
              borderRadius: 14, padding: '13px', fontFamily: 'var(--font-ui)', fontWeight: 600,
              fontSize: 14.5, color: 'var(--ink-soft)', cursor: 'pointer',
            }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

const GCAL_SCOPE = 'https://www.googleapis.com/auth/calendar.events'

function PushNotificationsSection() {
  const { push: toast } = useToast()
  const { enabled, permission, loading, enable } = usePushNotifications()
  const [testing, setTesting] = useState(false)

  const activate = async () => {
    try {
      const ok = await enable()
      toast(ok
        ? { icon: 'check', title: 'Notificaciones activadas', body: 'Este dispositivo ya puede recibir avisos.' }
        : { icon: 'x', title: 'Permiso no concedido', body: 'Activa las notificaciones desde los ajustes del dispositivo.' })
    } catch (error) {
      toast({ icon: 'x', title: 'No se pudieron activar', body: error instanceof Error ? error.message : 'Inténtalo de nuevo.' })
    }
  }

  const testNotification = async () => {
    setTesting(true)
    try {
      await sendTestPushNotification()
      toast({ icon: 'check', title: 'Prueba enviada', body: 'La notificación debe aparecer en unos segundos.' })
    } catch (error) {
      toast({ icon: 'x', title: 'Falló la prueba', body: error instanceof Error ? error.message : 'No se pudo enviar.' })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: enabled ? 'var(--orange-tint)' : 'var(--card-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="bell" size={20} style={{ color: enabled ? 'var(--orange-deep)' : 'var(--ink-faint)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>Notificaciones push</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
          {enabled ? 'Activadas en este dispositivo' : permission === 'denied' ? 'Bloqueadas en los ajustes' : 'Recibe avisos de nuevos momentos y mensajes'}
        </div>
      </div>
      {!enabled ? (
        <button onClick={activate} disabled={loading || permission === 'unsupported'} style={{
          border: 'none', background: 'var(--orange)', borderRadius: 10, padding: '8px 12px',
          fontSize: 12.5, fontWeight: 700, color: 'var(--paper)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
          opacity: loading || permission === 'unsupported' ? 0.6 : 1,
        }}>
          {loading ? '…' : 'Activar'}
        </button>
      ) : (
        <button onClick={testNotification} disabled={testing} style={{
          border: '1px solid var(--line)', background: 'var(--card-2)', borderRadius: 10, padding: '8px 12px',
          fontSize: 12.5, fontWeight: 700, color: 'var(--ink)', cursor: 'pointer', fontFamily: 'var(--font-ui)',
          opacity: testing ? 0.6 : 1,
        }}>
          {testing ? '…' : 'Probar'}
        </button>
      )}
    </div>
  )
}

function GoogleCalendarSection() {
  const { user, activeStoryId } = useAuth()
  const { limits } = useEntitlement(activeStoryId)
  const { push: toast } = useToast()
  const [connected, setConnected] = useState(false)
  const [, setGcalLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!user) return
    const refreshConnection = async () => {
      const [{ data: profileData }, { data: tokenData }] = await Promise.all([
        supabase.from('profiles').select('google_calendar_enabled').eq('id', user.id).single(),
        supabase.from('user_secrets').select('value').eq('user_id', user.id).eq('name', 'google_calendar_token').maybeSingle(),
      ])
      setConnected(Boolean(profileData?.google_calendar_enabled && tokenData?.value))
      setGcalLoading(false)
      setSyncing(false)
    }
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') void refreshConnection()
    }
    void refreshConnection()
    window.addEventListener('focus', refreshConnection)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      window.removeEventListener('focus', refreshConnection)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [user])

  const connect = async () => {
    // Google Calendar es un beneficio de pago (Duo/Familia).
    if (paywallEnabled && !limits.googleCalendar) { openPaywall('calendar'); return }
    setSyncing(true)
    if (!isNative) {
      try {
        const { code, redirectUri } = await requestGoogleCalendarCode(GCAL_SCOPE)
        await connectGoogleCalendarWithCode(code, redirectUri)
        setConnected(true)
        toast({ icon: 'check', title: 'Google Calendar conectado', body: 'Ya puedes sincronizar momentos con tu calendario.' })
      } catch (error) {
        toast({ icon: 'x', title: 'Error al conectar', body: error instanceof Error ? error.message : 'No se pudo conectar Google Calendar.' })
      } finally {
        setSyncing(false)
      }
      return
    }

    const googleAlreadyLinked = user?.identities?.some(identity => identity.provider === 'google')
    const oauthOptions = {
      scopes: GCAL_SCOPE,
      redirectTo: nativeRedirectUrl,
      queryParams: { access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true' },
      skipBrowserRedirect: true,
    }
    const { data, error } = googleAlreadyLinked
      ? await supabase.auth.signInWithOAuth({ provider: 'google', options: oauthOptions })
      : await supabase.auth.linkIdentity({ provider: 'google', options: oauthOptions })
    if (!error && data.url) await Browser.open({ url: data.url })
    if (error) { toast({ icon: 'x', title: 'Error al conectar', body: error.message }); setSyncing(false) }
    // On success this redirects to Google — no further code runs here
  }

  const disconnect = async () => {
    if (!user) return
    await Promise.all([
      supabase.from('profiles').update({ google_calendar_enabled: false }).eq('id', user.id),
      supabase.from('user_secrets').delete().eq('user_id', user.id).like('name', 'google_calendar_%'),
    ])
    setConnected(false)
  }

  const testConnection = async () => {
    setSyncing(true)
    try {
      const result = await testGoogleCalendarConnection() as Record<string, unknown> | null
      toast({ icon: 'check', title: 'Google Calendar conectado', body: result?.calendar ? `Calendario: ${String(result.calendar)}` : 'La conexión funciona correctamente.' })
    } catch (error) {
      if (error instanceof Error && error.message.includes('Desconecta y vuelve a conectar')) {
        setConnected(false)
      }
      toast({ icon: 'x', title: 'Falló Google Calendar', body: error instanceof Error ? error.message : 'No se pudo validar la conexión.' })
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: connected ? 'var(--blue-tint)' : 'var(--card-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="googleCal" size={22} style={{ color: connected ? 'var(--blue)' : 'var(--ink-faint)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>Google Calendar</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
          {connected ? 'Conectado — los nuevos momentos se añadirán' : 'Sincroniza tus momentos con Google Calendar'}
        </div>
      </div>
      {connected ? (
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button onClick={testConnection} disabled={syncing} style={{
            border: '1.5px solid var(--blue)', background: 'transparent', borderRadius: 10,
            padding: '8px 10px', fontSize: 12.5, fontWeight: 700, color: 'var(--blue)',
            cursor: 'pointer', fontFamily: 'var(--font-ui)', opacity: syncing ? 0.6 : 1,
          }}>
            {syncing ? '…' : 'Probar'}
          </button>
          <button onClick={disconnect} style={{
            border: '1.5px solid var(--line)', background: 'transparent', borderRadius: 10,
            padding: '8px 10px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)',
            cursor: 'pointer', fontFamily: 'var(--font-ui)',
          }}>
            Desconectar
          </button>
        </div>
      ) : (
        <button onClick={connect} disabled={syncing} style={{
          border: 'none', background: 'var(--blue)', borderRadius: 10,
          padding: '8px 12px', fontSize: 12.5, fontWeight: 700, color: 'var(--paper)',
          cursor: 'pointer', fontFamily: 'var(--font-ui)', flexShrink: 0,
          opacity: syncing ? 0.7 : 1,
        }}>
          {syncing ? '…' : 'Conectar'}
        </button>
      )}
    </div>
  )
}
