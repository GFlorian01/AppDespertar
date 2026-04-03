'use client'

import { useState } from 'react'
import { useExercises } from '@/hooks/useExercises'
import VideoTrimmer from '@/components/exercises/VideoTrimmer'

const CATEGORIES = [
  { value: 'estiramiento', label: 'Estiramiento', color: 'accent' },
  { value: 'cadera',       label: 'Cadera',        color: 'sage' },
  { value: 'elasticidad',  label: 'Elasticidad',   color: 'yellow' },
  { value: 'postura',      label: 'Postura',        color: 'danger' },
]
const EMPTY = { name: '', category: 'estiramiento', description: '', unilateral: false, videoUrl: '', publicId: '', videoDuration: 0, trimStart: 0, trimEnd: 0 }

export default function EjerciciosPage() {
  const { exercises, loading, addExercise, updateExercise, deleteExercise, uploadVideo } = useExercises()
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [uploadProgress, setUploadProgress] = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [filter,   setFilter]   = useState('all')

  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (ex) => { setEditing(ex.id); setForm({ name: ex.name, category: ex.category, description: ex.description || '', unilateral: ex.unilateral || false, videoUrl: ex.videoUrl, publicId: ex.publicId || '', videoDuration: ex.videoDuration || 0, trimStart: ex.trimStart || 0, trimEnd: ex.trimEnd || ex.videoDuration || 0 }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null); setUploadProgress(null) }

  const handleFileChange = async (e) => {
    const file = e.target.files[0]; if (!file) return
    const localUrl = URL.createObjectURL(file)
    const vid = document.createElement('video')
    vid.src = localUrl
    vid.onloadedmetadata = async () => {
      const dur = vid.duration
      setForm(f => ({ ...f, videoDuration: dur, trimStart: 0, trimEnd: dur, videoUrl: localUrl }))
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

  const handleDelete = async (ex) => {
    if (!confirm(`¿Eliminar "${ex.name}"?`)) return
    await deleteExercise(ex)
  }

  const filtered = filter === 'all' ? exercises : exercises.filter(e => e.category === filter)

  return (
    <>
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Ejercicios</h1>
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Nuevo ejercicio</button>
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todos</button>
        {CATEGORIES.map(c => (
          <button key={c.value} className={`filter-tab ${filter === c.value ? 'active' : ''}`} onClick={() => setFilter(c.value)}>{c.label}</button>
        ))}
      </div>

      {loading ? (
        <div className="loading-grid">{[1,2,3].map(i => <div key={i} className="skeleton-card" style={{ height: 280 }} />)}</div>
      ) : filtered.length === 0 ? (
        <div className="empty-state"><VideoIcon size={48} /><p>No hay ejercicios todavía.</p></div>
      ) : (
        <div className="exercise-grid">
          {filtered.map(ex => <ExCard key={ex.id} exercise={ex} onEdit={openEdit} onDelete={handleDelete} />)}
        </div>
      )}

    </div>
    {showForm && (
      <div className="fullpanel">

            {/* ── Header ── */}
            <div className="fullpanel-header">
              <h2 className="modal-title">{editing ? 'Editar ejercicio' : 'Nuevo ejercicio'}</h2>
              <button className="btn-icon" onClick={closeForm}><CloseIcon /></button>
            </div>

            <form onSubmit={handleSubmit} className="fullpanel-body">

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

                <label className="unilateral-toggle">
                  <input
                    type="checkbox"
                    checked={form.unilateral}
                    onChange={e => setForm(f => ({ ...f, unilateral: e.target.checked }))}
                  />
                  <span className="unilateral-box">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </span>
                  <span className="unilateral-label">
                    Ejercicio unilateral
                    <small>Se realiza por cada lado (izquierdo / derecho)</small>
                  </span>
                </label>

                <div className="fullpanel-left-actions">
                  <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
                  <button type="submit" className="btn btn-primary" disabled={saving || uploadProgress !== null || !form.videoUrl}>
                    {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Agregar ejercicio'}
                  </button>
                </div>
              </div>

              {/* ── Panel derecho: video único ── */}
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

                {/* Estado 1: sin video */}
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

                {/* Estado 2: subiendo */}
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

                {/* Estado 3: video listo → trimmer ocupa todo el panel */}
                {form.videoUrl && form.videoDuration > 0 && uploadProgress === null && (
                  <div className="ex-trimmer-wrap">
                    <VideoTrimmer
                      videoUrl={form.videoUrl}
                      duration={form.videoDuration}
                      trimStart={form.trimStart}
                      trimEnd={form.trimEnd}
                      onChange={({ trimStart, trimEnd }) => setForm(f => ({ ...f, trimStart, trimEnd }))}
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

function ExCard({ exercise, onEdit, onDelete }) {
  const cat = CATEGORIES.find(c => c.value === exercise.category)
  const dur = (exercise.trimEnd || 0) - (exercise.trimStart || 0)
  return (
    <div className="exercise-card card animate-in">
      <div className="exercise-thumb">
        <video src={exercise.videoUrl} className="thumb-video" muted loop playsInline
          onMouseEnter={e => e.target.play()}
          onMouseLeave={e => { e.target.pause(); e.target.currentTime = exercise.trimStart || 0 }} />
        <div className={`badge badge-${cat?.color || 'accent'} ex-badge`}>{cat?.label}</div>
        {dur > 0 && <div className="thumb-duration">{Math.round(dur)}s</div>}
      </div>
      <div className="exercise-card-body">
        <h3 className="exercise-name">{exercise.name}</h3>
        {exercise.unilateral && <span className="badge-unilateral">↔ Por lado</span>}
        {exercise.description && <p className="exercise-desc">{exercise.description}</p>}
        <div className="exercise-card-actions">
          <button className="btn-icon" onClick={() => onEdit(exercise)}><EditIcon /></button>
          <button className="btn-icon btn-icon-danger" onClick={() => onDelete(exercise)}><TrashIcon /></button>
        </div>
      </div>
    </div>
  )
}

const PlusIcon   = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const CloseIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const EditIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const TrashIcon  = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const UploadIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></svg>
const CheckIcon  = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
const VideoIcon  = ({ size=24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>
