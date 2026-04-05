'use client'

import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLang } from '@/contexts/LangContext'

const CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET

export default function ProfileModal({ onClose }) {
  const { user, updateUserProfile } = useAuth()
  const { lang, setLang, t } = useLang()
  const [name,      setName]      = useState(user?.displayName || '')
  const [photo,     setPhoto]     = useState(user?.photoURL    || '')
  const [uploading, setUploading] = useState(false)
  const [saving,    setSaving]    = useState(false)
  const fileRef = useRef(null)

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', PRESET)
      formData.append('folder', `despertar/avatars/${user.uid}`)
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body: formData })
      const data = await res.json()
      setPhoto(data.secure_url)
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await updateUserProfile(name.trim(), photo || null)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-overlay" onClick={onClose}>
      <div className="profile-modal card" onClick={e => e.stopPropagation()}>

        <div className="profile-modal-header">
          <h3 className="profile-modal-title">{t('profile.title')}</h3>
          <button className="btn-icon" onClick={onClose}><CloseIcon /></button>
        </div>

        {/* Avatar */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrap" onClick={() => !uploading && fileRef.current?.click()}>
            {photo
              ? <img src={photo} alt="" className="profile-avatar-lg" />
              : <div className="profile-avatar-placeholder"><UserIcon /></div>
            }
            <div className="profile-avatar-overlay">
              {uploading ? <SpinIcon /> : <CameraIcon />}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoChange} style={{ display: 'none' }} />
          <span className="profile-avatar-hint">{uploading ? t('profile.uploading') : t('profile.photo')}</span>
        </div>

        {/* Nombre */}
        <div className="form-group">
          <label className="form-label">{t('profile.name')}</label>
          <input
            className="form-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('profile.name.ph')}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
          />
        </div>

        {/* Idioma / Language */}
        <div className="form-group">
          <label className="form-label">{t('profile.lang')}</label>
          <div className="lang-toggle">
            <button
              className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
              onClick={() => setLang('es')}
              type="button"
            >
              🇪🇸 {t('profile.lang.es')}
            </button>
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              type="button"
            >
              🇺🇸 {t('profile.lang.en')}
            </button>
          </div>
        </div>

        <div className="profile-modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>{t('profile.cancel')}</button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={saving || uploading || !name.trim()}
          >
            {saving ? t('profile.saving') : t('profile.save')}
          </button>
        </div>

      </div>
    </div>
  )
}

const CloseIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const CameraIcon = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
const UserIcon   = () => <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
const SpinIcon   = () => <svg className="profile-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
