'use client'

import { useState } from 'react'
import { useExercises } from '@/hooks/useExercises'
import { useAuth } from '@/contexts/AuthContext'
import VideoTrimmer from '@/components/exercises/VideoTrimmer'
import TrimmedVideo from '@/components/exercises/TrimmedVideo'
import { PlusIcon, CloseIcon, EditIcon, TrashIcon } from '@/components/Icons'

const CATEGORIES = [
  { value: 'estiramiento', label: 'Estiramiento', color: 'accent' },
  { value: 'cadera',       label: 'Cadera',        color: 'sage' },
  { value: 'elasticidad',  label: 'Elasticidad',   color: 'yellow' },
  { value: 'postura',      label: 'Postura',        color: 'danger' },
]
const EMPTY = { name: '', category: 'estiramiento', description: '', unilateral: false, isPublic: false, videoUrl: '', publicId: '', videoDuration: 0, trimStart: 0, trimEnd: 0, cropAspect: 'original', cropX: 0, cropY: 0, cropW: 1, cropH: 1 }

export default function EjerciciosPage() {
  const { user } = useAuth()
  const { exercises, loading, addExercise, updateExercise, deleteExercise, uploadVideo } = useExercises()
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [filter,   setFilter]   = useState('all')

  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (ex) => {
    setEditing(ex.id)
    setForm({
      name: ex.name, category: ex.category, description: ex.description || '',
      unilateral: ex.unilateral || false, isPublic: ex.isPublic || false,
      videoUrl: ex.videoUrl, publicId: ex.publicId || '',
      videoDuration: ex.videoDuration || 0,
      trimStart: ex.trimStart || 0, trimEnd: ex.trimEnd || ex.videoDuration || 0,
      cropAspect: ex.cropAspect || 'original', cropX: ex.cropX ?? 0, cropY: ex.cropY ?? 0, cropW: ex.cropW ?? 1, cropH: ex.cropH ?? 1,
    })
    setShowForm(true)
  }
  const closeForm = () => { setShowForm(false); setEditing(null); setUploadProgress(null) }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const localUrl = URL.createObjectURL(file)
    const vid = document.createElement('video')
    vid.src = localUrl
    vid.onloadedmetadata = async () => {
      const dur = vid.duration
      setForm(f => ({ ...f, videoDuration: dur, trimStart: 0, trimEnd: dur, videoUrl: localUrl, cropAspect: 'original', cropX: 0, cropY: 0, cropW: 1, cropH: 1 }))
      URL.revokeObjectURL(localUrl)
      try {
        const { url, publicId } = await uploadVideo(file, setUploadProgress)
        setForm(f => ({ ...f, videoUrl: url, publicId }))
        setUploadProgress(null)
      } catch { setUploadProgress(null) }
    }
    vid.load()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || !form.videoUrl) return
    setSaving(true)
    try {
      editing ? await updateExercise(editing, form) : await addExercise(form)
      closeForm()
    } finally { setSaving(false) }
  }

  // Save this exercise but keep the uploaded video loaded, so another clip can be
  // cut from it right away without re-uploading the same file
  const handleSaveAndContinue = async () => {
    if (!form.name.trim() || !form.videoUrl) return
    setSaving(true)
    try {
      await addExercise(form)
      setForm(f => ({
        ...EMPTY,
        category: f.category, isPublic: f.isPublic,
        videoUrl: f.videoUrl, publicId: f.publicId, videoDuration: f.videoDuration,
        trimEnd: f.videoDuration,
      }))
    } finally { setSaving(false) }
  }

  const handleDelete = async (ex) => {
    if (!confirm(`¿Eliminar "${ex.name}"?`)) return
    await deleteExercise(ex)
  }

  // Filter: category AND optionally origin
  const [origin, setOrigin] = useState('all') // 'all' | 'mine' | 'shared'

  const filtered = exercises.filter(e => {
    const catOk    = filter === 'all' || e.category === filter
    const isOwn    = e.userId === user?.uid
    const originOk = origin === 'all' || (origin === 'mine' && isOwn) || (origin === 'shared' && !isOwn && e.isPublic)
    return catOk && originOk
  })

  return (
    <>
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Ejercicios</h1>
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Nuevo ejercicio</button>
      </div>

      {/* Origin tabs */}
      <div className="filter-tabs" style={{ marginBottom: 8 }}>
        <button className={`filter-tab ${origin === 'all'    ? 'active' : ''}`} onClick={() => setOrigin('all')}>Todos</button>
        <button className={`filter-tab ${origin === 'shared' ? 'active' : ''}`} onClick={() => setOrigin('shared')}>Biblioteca compartida</button>
        <button className={`filter-tab ${origin === 'mine'   ? 'active' : ''}`} onClick={() => setOrigin('mine')}>Mis ejercicios</button>
      </div>

      {/* Category tabs */}
      <div className="filter-tabs">
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas las categorías</button>
        {CATEGORIES.map(c => (
          <button key={c.value} className={`filter-tab ${filter === c.value ? 'active' : ''}`} onClick={() => setFilter(c.value)}>{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-grid">{[1,2,3].map(i => <div key={i} className="skeleton-card" style={{ height: 280 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <VideoIcon size={48} />
          {origin === 'mine' ? (
            <>
              <p>Aún no tienes ejercicios propios.</p>
              <p className="empty-hint">Puedes crear los tuyos o usar los de la <button className="link-btn" onClick={() => setOrigin('shared')}>biblioteca compartida</button>.</p>
            </>
          ) : origin === 'shared' ? (
            <p>No hay ejercicios compartidos disponibles todavía.</p>
          ) : exercises.length === 0 ? (
            <>
              <p>No hay ejercicios todavía.</p>
              <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Crear tu primer ejercicio</button>
            </>
          ) : (
            <p>No hay ejercicios en esta categoría.</p>
          )}
        </div>
      ) : (
        <div className="exercise-grid">
          {filtered.map(ex => (
            <ExCard
              key={ex.id}
              exercise={ex}
              isOwn={ex.userId === user?.uid}
              onEdit={ex.userId === user?.uid ? openEdit : null}
              onDelete={ex.userId === user?.uid ? handleDelete : null}
            />
          ))}
        </div>
      )}

    </div>

    {showForm && (
      <div className="fullpanel">

        <div className="fullpanel-header">
          <h2 className="modal-title">{editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h2>
          <button className="btn-icon" onClick={closeForm}><CloseIcon /></button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={e => { if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') e.preventDefault() }}
          className="fullpanel-body"
        >

          {/* ── Panel izquierdo: campos ── */}
          <div className="ex-form-fields">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nombre</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Apertura de caderas" required />
              </div>
              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Descripción (opcional)</label>
              <textarea className="form-input" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Notas sobre el ejercicio..." />
            </div>

            {/* Unilateral */}
            <label className="unilateral-toggle">
              <input type="checkbox" checked={form.unilateral} onChange={e => setForm(f => ({ ...f, unilateral: e.target.checked }))} />
              <span className="unilateral-box">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span className="unilateral-label">
                Ejercicio unilateral
                <small>Se realiza por cada lado (izquierdo / derecho)</small>
              </span>
            </label>

            {/* Compartir */}
            <label className="unilateral-toggle share-toggle">
              <input type="checkbox" checked={form.isPublic} onChange={e => setForm(f => ({ ...f, isPublic: e.target.checked }))} />
              <span className="unilateral-box share-box">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </span>
              <span className="unilateral-label">
                Compartir con todos
                <small>Visible en la biblioteca de todos los usuarios</small>
              </span>
            </label>

            <div className="fullpanel-left-actions">
              <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
              {!editing && (
                <button type="button" className="btn btn-ghost" onClick={handleSaveAndContinue} disabled={saving || uploadProgress !== null || !form.videoUrl || !form.name.trim()}>
                  Guardar y cortar otro
                </button>
              )}
              <button type="submit" className="btn btn-primary" disabled={saving || uploadProgress !== null || !form.videoUrl}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar ejercicio'}
              </button>
            </div>
          </div>

          {/* ── Panel derecho: video ── */}
          <div className="fullpanel-right ex-form-video">
            <div className="ex-video-label-row">
              <span className="form-label">Video del ejercicio</span>
              {form.videoUrl && (
                <label className="ex-replace-btn">
                  <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                  <UploadIcon /> Cambiar video
                </label>
              )}
            </div>

            {!form.videoUrl && uploadProgress === null && (
              <label className="video-upload-area ex-upload-full">
                <input type="file" accept="video/*" onChange={handleFileChange} style={{ display: 'none' }} />
                <span className="upload-placeholder">
                  <UploadIcon />
                  Seleccionar video
                  <small>Desde tu galería o cámara</small>
                </span>
              </label>
            )}

            {uploadProgress !== null && (
              <div className="ex-upload-progress-full">
                <UploadIcon />
                <p>Subiendo video...</p>
                <div className="progress-bar" style={{ width: '100%' }}>
                  <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                </div>
                <span className="ex-progress-pct">{uploadProgress}%</span>
              </div>
            )}

            {form.videoUrl && form.videoDuration > 0 && uploadProgress === null && (
              <div className="ex-trimmer-wrap">
                <VideoTrimmer
                  videoUrl={form.videoUrl}
                  duration={form.videoDuration}
                  trimStart={form.trimStart}
                  trimEnd={form.trimEnd}
                  onChange={({ trimStart, trimEnd }) => setForm(f => ({ ...f, trimStart, trimEnd }))}
                  cropAspect={form.cropAspect}
                  cropX={form.cropX}
                  cropY={form.cropY}
                  cropW={form.cropW}
                  cropH={form.cropH}
                  onCropChange={({ cropAspect, cropX, cropY, cropW, cropH }) => setForm(f => ({ ...f, cropAspect, cropX, cropY, cropW, cropH }))}
                />
              </div>
            )}
          </div>

        </form>
      </div>
    )}
    </>
  )
}

/* ── Exercise card ── */
function ExCard({ exercise, isOwn, onEdit, onDelete }) {
  const cat = CATEGORIES.find(c => c.value === exercise.category)
  const dur = (exercise.trimEnd || 0) - (exercise.trimStart || 0)
  return (
    <div className="exercise-card card animate-in">
      <div className="exercise-thumb">
        <TrimmedVideo
          src={exercise.videoUrl}
          trimStart={exercise.trimStart || 0}
          trimEnd={exercise.trimEnd || exercise.videoDuration || 0}
          cropAspect={exercise.cropAspect} cropX={exercise.cropX} cropY={exercise.cropY} cropW={exercise.cropW} cropH={exercise.cropH}
          className="thumb-video"
        />
        <div className={`badge badge-${cat?.color || 'accent'} ex-badge`}>{cat?.label}</div>
        {dur > 0 && <div className="thumb-duration">{Math.round(dur)}s</div>}
        {exercise.isPublic && (
          <div className={`ex-shared-badge ${isOwn ? 'ex-shared-own' : ''}`}>
            <ShareIcon /> {isOwn ? 'Compartido por ti' : 'Biblioteca'}
          </div>
        )}
      </div>
      <div className="exercise-card-body">
        <h3 className="exercise-name">{exercise.name}</h3>
        {exercise.unilateral && <span className="badge-unilateral">↔ Por lado</span>}
        {exercise.description && <p className="exercise-desc">{exercise.description}</p>}
        <div className="exercise-card-actions">
          {onEdit   && <button className="btn-icon" onClick={() => onEdit(exercise)}><EditIcon /></button>}
          {onDelete && <button className="btn-icon btn-icon-danger" onClick={() => onDelete(exercise)}><TrashIcon /></button>}
        </div>
      </div>
    </div>
  )
}

const UploadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
const VideoIcon  = ({ size=24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
const ShareIcon  = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
