import { useState, useEffect } from 'react'
import { Icon } from '../components/ui/Icon'
import { Avatar } from '../components/ui/Avatar'
import { compressToWebP } from '../lib/imageUtils'
import { PresenceDot } from '../components/ui/PresenceDot'
import { useCurrency, CURRENCIES, type CurrencyKey } from '../context/CurrencyContext'
import { fmtDate } from '../lib/chapterUtils'
import { DatePicker } from '../components/ui/DatePicker'
import { useAuth } from '../context/AuthContext'
import { supabase, nativeRedirectUrl } from '../lib/supabase'
import { isNative } from '../lib/native'
import type { PlanType, PersonDisplay, StoryType } from '../lib/supabase'
import { useToast } from '../context/ToastContext'

const CAT_COLOR: Record<string, string> = {
  pareja:  'var(--orange)',
  amigos:  'var(--blue)',
  familia: 'var(--done)',
  otro:    'var(--ink-faint)',
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
  const { currency, setCurrency, fmt } = useCurrency()
  const { push: toast } = useToast()

  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(profile?.full_name || '')
  const [editBirthday, setEditBirthday] = useState(profile?.birthday || '')
  const [editNickname, setEditNickname] = useState(profile?.nickname || '')
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
  }

  useEffect(() => {
    if (!activeStoryId || !user) return
    supabase.from('story_members')
      .select('user_id, role, joined_at, permission_level, profiles(full_name, avatar_url)')
      .eq('story_id', activeStoryId)
      .then(({ data }) => {
        if (!data) return
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
    const newLevel = target.permissionLevel === 'admin' ? 'member' : 'admin'
    await supabase.from('story_members')
      .update({ permission_level: newLevel })
      .eq('story_id', activeStoryId)
      .eq('user_id', target.userId)
    setMembers(ms => ms.map(m => m.userId === target.userId ? { ...m, permissionLevel: newLevel } : m))
    setSelectedMember(prev => prev ? { ...prev, permissionLevel: newLevel } : null)
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
    } catch (e: any) {
      toast({ icon: 'x', title: 'Error subiendo foto', body: e.message })
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
    } catch (e: any) {
      toast({ icon: 'x', title: 'Error', body: e.message })
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
      }).eq('id', user.id)
      if (error) throw error
      await refreshProfile()
      setEditing(false)
    } catch (e: any) {
      toast({ icon: 'x', title: 'Error', body: e.message })
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
    } catch (e: any) {
      setJoinError(e.message || 'Código inválido')
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
      {/* Header */}
      <div style={{
        paddingTop: 56, paddingBottom: 14, paddingLeft: 22, paddingRight: 18,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
        flexShrink: 0, borderBottom: '1px solid var(--line-soft)', background: 'var(--paper)',
      }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 5 }}>Configuración</div>
          <h1 className="display" style={{ fontSize: 28, margin: 0 }}>Perfil</h1>
        </div>
        <button data-testid="profile-close-btn" onClick={onClose} style={{
          width: 42, height: 42, borderRadius: '50%', border: 'none',
          background: 'var(--card)', cursor: 'pointer', color: 'var(--ink)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--sh-sm)', flexShrink: 0,
        }}>
          <Icon name="chevD" size={22} />
        </button>
      </div>

      <div className="ot-scroll" style={{ flex: 1, paddingBottom: 40 }}>

        {/* ── SECCIÓN: ESTA HISTORIA ── */}
        {activeStory && (
          <div style={{ padding: '20px 22px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span className="eyebrow">Esta Historia</span>
              <div style={{ display: 'flex', gap: 8 }}>
                {onEditStory && (
                  <button onClick={() => onEditStory(activeStory)} style={{
                    border: 'none', background: 'transparent', cursor: 'pointer',
                    fontSize: 13, fontWeight: 600, color: 'var(--orange)', fontFamily: 'var(--font-ui)',
                    padding: 0, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Icon name="edit" size={13} /> {isAdmin ? 'Editar' : 'Opciones'}
                  </button>
                )}
              </div>
            </div>

            <div className="card" style={{ padding: '18px 18px 16px' }}>
              {/* Story name + category */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 14, background: storyColor,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={CAT_ICON[activeStory.category] || 'tag'} size={22} style={{ color: '#fff' }} />
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
                      <button onClick={() => setEditingRole(true)} style={{
                        border: 'none', background: 'transparent', cursor: 'pointer',
                        fontSize: 12, fontWeight: 600, color: 'var(--orange)', fontFamily: 'var(--font-ui)', padding: 0,
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        <Icon name="edit" size={12} /> Mi rol
                      </button>
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
                              <Icon name="shield" size={7} style={{ color: '#fff' }} />
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
              <button onClick={() => { setEditName(profile?.full_name || ''); setEditBirthday(profile?.birthday || ''); setEditNickname(profile?.nickname || ''); setEditing(true) }}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  color: 'var(--orange)', padding: 0, fontFamily: 'var(--font-ui)' }}>
                Editar
              </button>
            )}
          </div>

          <div className="card" style={{ padding: '18px 18px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: editing ? 16 : 0 }}>
              {/* Avatar */}
              <div style={{ flexShrink: 0 }}>
                <input id="avatar-file" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                <button onClick={() => document.getElementById('avatar-file')?.click()}
                  style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer', position: 'relative', display: 'block' }}>
                  <Avatar person={me} size={60} />
                  <div style={{
                    position: 'absolute', inset: 0, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: uploadingAvatar ? 'rgba(0,0,0,0.45)' : 'rgba(0,0,0,0.18)',
                  }}>
                    {uploadingAvatar
                      ? <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #fff', borderTopColor: 'transparent', animation: 'spin 0.7s linear infinite' }} />
                      : <Icon name="camera" size={13} style={{ color: '#fff' }} />
                    }
                  </div>
                </button>
                {googleAvatarUrl && googleAvatarUrl !== profile?.avatar_url && (
                  <button onClick={useGoogleAvatar} disabled={uploadingAvatar} style={{
                    marginTop: 6, border: 'none', background: 'var(--card-2)', borderRadius: 8,
                    padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center',
                    gap: 4, fontSize: 10.5, fontWeight: 700, color: '#1976D2',
                    fontFamily: 'var(--font-ui)', whiteSpace: 'nowrap',
                  }}>
                    <Icon name="googleCal" size={11} style={{ color: '#1976D2' }} /> Google
                  </button>
                )}
              </div>

              {!editing && (
                <div>
                  <div style={{ fontWeight: 700, fontSize: 17 }}>
                    {me.name}{profile?.nickname ? ` · ${profile.nickname}` : ''}
                  </div>
                  {profile?.birthday
                    ? <div style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: 3 }}>Cumpleaños: {fmtDate(profile.birthday)}</div>
                    : <div style={{ fontSize: 13, color: 'var(--ink-faint)', fontStyle: 'italic', marginTop: 3 }}>Sin cumpleaños</div>
                  }
                </div>
              )}
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
              <div style={{ fontSize: 12.5, color: '#c0392b', marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
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

        {/* ── SECCIÓN: APP ── */}
        <div style={{ padding: '18px 22px 0' }}>
          <div className="eyebrow" style={{ marginBottom: 10 }}>Integraciones</div>
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
            borderRadius: '24px 24px 0 0', padding: '24px 22px 40px',
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

function GoogleCalendarSection() {
  const { user } = useAuth()
  const { push: toast } = useToast()
  const [connected, setConnected] = useState(false)
  const [, setGcalLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    if (!user) return
    ;(async () => {
      const { data } = await supabase.from('profiles').select('google_calendar_enabled').eq('id', user.id).single()
      if (data?.google_calendar_enabled) setConnected(true)
      setGcalLoading(false)
    })()
  }, [user])

  const connect = async () => {
    setSyncing(true)
    // linkIdentity adds Google to the existing account without creating a new user
    const { error } = await supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        scopes: GCAL_SCOPE,
        redirectTo: isNative ? nativeRedirectUrl : window.location.origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
    if (error) { toast({ icon: 'x', title: 'Error al conectar', body: error.message }); setSyncing(false) }
    // On success this redirects to Google — no further code runs here
  }

  const disconnect = async () => {
    if (!user) return
    await supabase.from('profiles').update({ google_calendar_enabled: false }).eq('id', user.id)
    setConnected(false)
  }

  return (
    <div className="card" style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: connected ? '#EBF5FB' : 'var(--card-2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Icon name="googleCal" size={22} style={{ color: connected ? '#1976D2' : 'var(--ink-faint)' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--ink)' }}>Google Calendar</div>
        <div style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 2 }}>
          {connected ? 'Conectado — los nuevos momentos se añadirán' : 'Sincroniza tus momentos con Google Calendar'}
        </div>
      </div>
      {connected ? (
        <button onClick={disconnect} style={{
          border: '1.5px solid var(--line)', background: 'transparent', borderRadius: 10,
          padding: '8px 12px', fontSize: 12.5, fontWeight: 600, color: 'var(--ink-soft)',
          cursor: 'pointer', fontFamily: 'var(--font-ui)', flexShrink: 0,
        }}>
          Desconectar
        </button>
      ) : (
        <button onClick={connect} disabled={syncing} style={{
          border: 'none', background: '#1976D2', borderRadius: 10,
          padding: '8px 12px', fontSize: 12.5, fontWeight: 700, color: '#fff',
          cursor: 'pointer', fontFamily: 'var(--font-ui)', flexShrink: 0,
          opacity: syncing ? 0.7 : 1,
        }}>
          {syncing ? '…' : 'Conectar'}
        </button>
      )}
    </div>
  )
}
