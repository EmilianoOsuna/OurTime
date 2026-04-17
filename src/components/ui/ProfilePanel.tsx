import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Camera, LogOut, Calendar, User, Loader2, Check, Heart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

interface ProfilePanelProps {
  isOpen: boolean
  onClose: () => void
}

const ProfilePanel: React.FC<ProfilePanelProps> = ({ isOpen, onClose }) => {
  const { user, profile, signOut, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState('')
  const [anniversaryDate, setAnniversaryDate] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [saved, setSaved] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync form state when profile loads
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '')
      setAnniversaryDate(profile.anniversary_date || '')
      setAvatarUrl(profile.avatar_url || null)
    }
  }, [profile])

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setUploadingPhoto(true)
    try {
      const ext = file.name.split('.').pop()
      const filePath = `avatars/${user.id}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('Fotos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage.from('Fotos').getPublicUrl(filePath)
      const newUrl = urlData.publicUrl + '?t=' + Date.now()
      setAvatarUrl(newUrl)
    } catch (err: any) {
      console.error(err)
      alert('Error al subir foto: ' + err.message)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          anniversary_date: anniversaryDate || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) throw error

      await refreshProfile()
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err: any) {
      console.error(err)
      alert('Error al guardar: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    onClose()
    await signOut()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9990]"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 40 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-surface-lowest z-[9991] shadow-2xl flex flex-col"
            style={{ paddingTop: 'env(safe-area-inset-top)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/20">
              <div>
                <h2 className="text-xl font-extrabold text-on-surface">Mi Perfil</h2>
                <p className="text-xs text-on-surface/50 font-medium mt-0.5">Tu presencia en nuestra historia</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full text-on-surface/50 hover:text-on-surface hover:bg-surface-low transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

              {/* Avatar */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-primary/10 border-4 border-white shadow-xl">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-primary">
                        <User size={36} />
                      </div>
                    )}
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                        <Loader2 size={24} className="animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 transition-colors"
                  >
                    <Camera size={14} />
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                <p className="text-sm text-on-surface/50 font-medium">{user?.email}</p>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface/50 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Tu Nombre
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="¿Cómo te llamas?"
                  className="w-full bg-surface rounded-xl border border-outline-variant/20 px-4 py-3 text-on-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Anniversary Date */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-on-surface/50 uppercase tracking-widest flex items-center gap-2">
                  <Heart size={12} className="text-red-400" /> Fecha de Aniversario
                </label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface/30" />
                  <input
                    type="date"
                    value={anniversaryDate}
                    onChange={e => setAnniversaryDate(e.target.value)}
                    className="w-full bg-surface rounded-xl border border-outline-variant/20 pl-10 pr-4 py-3 text-on-surface font-semibold focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
                <p className="text-xs text-on-surface/40 font-medium pl-1">
                  Esta fecha se usará en el contador del Dashboard.
                </p>
              </div>

            </div>

            {/* Footer Actions */}
            <div className="px-6 py-5 border-t border-outline-variant/20 space-y-3"
              style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
            >
              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-white transition-all ${
                  saved
                    ? 'bg-green-500'
                    : 'bg-primary hover:bg-primary/90 active:scale-95'
                }`}
              >
                {saving ? (
                  <><Loader2 size={18} className="animate-spin" /> Guardando...</>
                ) : saved ? (
                  <><Check size={18} /> ¡Guardado!</>
                ) : (
                  'Guardar Cambios'
                )}
              </button>

              {/* Sign Out */}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-red-500 border border-red-200 hover:bg-red-50 transition-colors"
              >
                <LogOut size={16} />
                Cerrar Sesión
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ProfilePanel
