'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useRoutines } from '@/hooks/useRoutines'
import { useExercises } from '@/hooks/useExercises'

const EMPTY = { name: '', description: '', exercises: [] }

export default function RutinasPage() {
  const { routines, loading, addRoutine, updateRoutine, deleteRoutine } = useRoutines()
  const { exercises } = useExercises()
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState(null)
  const [form,     setForm]     = useState(EMPTY)
  const [saving,   setSaving]   = useState(false)

  const openNew  = () => { setEditing(null); setForm(EMPTY); setShowForm(true) }
  const openEdit = (r) => { setEditing(r.id); setForm({ name: r.name, description: r.description || '', exercises: r.exercises || [] }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditing(null) }

  const addEx = (ex) => setForm(f => ({ ...f, exercises: [...f.exercises, { exerciseId: ex.id, exerciseName: ex.name, category: ex.category, videoUrl: ex.videoUrl, trimStart: ex.trimStart || 0, trimEnd: ex.trimEnd || ex.videoDuration || 0, sets: 3, reps: 10, restTime: 30 }] }))
  const updEx = (idx, field, val) => setForm(f => { const exs = [...f.exercises]; exs[idx] = { ...exs[idx], [field]: Number(val) }; return { ...f, exercises: exs } })
  const remEx = (idx) => setForm(f => ({ ...f, exercises: f.exercises.filter((_, i) => i !== idx) }))
  const moveEx = (idx, dir) => setForm(f => { const exs = [...f.exercises]; const to = idx + dir; if (to < 0 || to >= exs.length) return f; [exs[idx], exs[to]] = [exs[to], exs[idx]]; return { ...f, exercises: exs } })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || form.exercises.length === 0) return
    setSaving(true)
    try { editing ? await updateRoutine(editing, form) : await addRoutine(form); closeForm() }
    finally { setSaving(false) }
  }

  const handleDelete = async (r) => { if (!confirm(`¿Eliminar "${r.name}"?`)) return; await deleteRoutine(r.id) }

  const availableEx = exercises.filter(ex => !form.exercises.find(fe => fe.exerciseId === ex.id))

  return (
    <div className="animate-in">
      <div className="page-header">
        <h1 className="page-title">Rutinas</h1>
        <button className="btn btn-primary" onClick={openNew}><PlusIcon /> Nueva rutina</button>
      </div>

      {loading ? (
        <div className="routine-list">{[1,2].map(i => <div key={i} className="skeleton-card" style={{ height: 140 }} />)}</div>
      ) : routines.length === 0 ? (
        <div className="empty-state"><ListIcon size={48} /><p>No tienes rutinas. Crea una para empezar.</p></div>
      ) : (
        <div className="routine-list">
          {routines.map(r => (
            <div key={r.id} className="routine-card card">
              <div className="routine-card-main">
                <div className="routine-card-info">
                  <h3 className="routine-card-name">{r.name}</h3>
                  {r.description && <p className="routine-card-desc">{r.description}</p>}
                  <div className="routine-card-meta">
                    <span className="badge badge-accent">{r.exercises?.length || 0} ejercicios</span>
                    <span className="badge badge-sage">{r.exercises?.reduce((a,e)=>a+e.sets,0)||0} series totales</span>
                  </div>
                </div>
                <div className="routine-card-thumbs">
                  {r.exercises?.slice(0, 3).map((ex, i) => (
                    <div key={i} className="mini-thumb">
                      <video src={ex.videoUrl} muted playsInline className="mini-video"
                        onMouseEnter={e => e.target.play()}
                        onMouseLeave={e => { e.target.pause(); e.target.currentTime = ex.trimStart || 0 }} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="routine-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(r)}><EditIcon /> Editar</button>
                <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(r)}><TrashIcon /></button>
                <button className="btn btn-primary" onClick={() => router.push(`/sesion/${r.id}`)}><PlayIcon /> Iniciar sesión</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fullpanel">
          {/* ── Header ── */}
          <div className="fullpanel-header">
            <h2 className="modal-title">{editing ? 'Editar rutina' : 'Nueva rutina'}</h2>
            <button className="btn-icon" onClick={closeForm}><CloseIcon /></button>
          </div>

          <form onSubmit={handleSubmit} className="fullpanel-body">

            {/* ── Panel izquierdo: campos y acciones ── */}
            <div className="fullpanel-left">
              <div className="form-group">
                <label className="form-label">Nombre de la rutina</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Rutina mañanera de caderas" required />
              </div>
              <div className="form-group">
                <label className="form-label">Descripción (opcional)</label>
                <textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Notas sobre la rutina..." />
              </div>

              <div className="fullpanel-left-actions">
                <button type="button" className="btn btn-ghost" onClick={closeForm}>Cancelar</button>
                <button type="submit" className="btn btn-primary" disabled={saving || form.exercises.length === 0}>
                  {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear rutina'}
                </button>
              </div>
            </div>

            {/* ── Panel derecho: builder ── */}
            <div className="fullpanel-right">
              <div className="routine-builder-full">

                {/* Selector de ejercicios */}
                <div className="rpanel">
                  <p className="section-label">Ejercicios disponibles</p>
                  {availableEx.length === 0
                    ? <p className="picker-empty">Todos los ejercicios ya están en la rutina</p>
                    : <div className="picker-list">
                        {availableEx.map(ex => (
                          <button key={ex.id} type="button" className="picker-item" onClick={() => addEx(ex)}>
                            <div className="picker-thumb">
                              <video src={ex.videoUrl} muted playsInline className="picker-video"
                                onMouseEnter={e => e.target.play()}
                                onMouseLeave={e => { e.target.pause(); e.target.currentTime = ex.trimStart || 0 }} />
                            </div>
                            <span className="picker-name">{ex.name}</span>
                            <PlusIcon />
                          </button>
                        ))}
                      </div>
                  }
                </div>

                {/* Orden y configuración */}
                <div className="rpanel">
                  <p className="section-label">Rutina · {form.exercises.length} ejercicios</p>
                  {form.exercises.length === 0
                    ? <div className="order-empty"><span>← Selecciona ejercicios de la lista</span></div>
                    : <div className="order-list">
                        {form.exercises.map((ex, idx) => (
                          <div key={`${ex.exerciseId}-${idx}`} className="order-item">
                            <div className="order-item-header">
                              <span className="order-num">{idx + 1}</span>
                              <span className="order-name">{ex.exerciseName}</span>
                              <div className="order-actions">
                                <button type="button" className="btn-icon" onClick={() => moveEx(idx, -1)} disabled={idx === 0}><ChevronUp /></button>
                                <button type="button" className="btn-icon" onClick={() => moveEx(idx, 1)} disabled={idx === form.exercises.length - 1}><ChevronDown /></button>
                                <button type="button" className="btn-icon btn-icon-danger" onClick={() => remEx(idx)}><CloseIcon /></button>
                              </div>
                            </div>
                            <div className="order-item-params">
                              {[['sets', 'Series'], ['reps', 'Reps'], ['restTime', 'Descanso (s)']].map(([field, label]) => (
                                <label key={field} className="param-group">
                                  <span>{label}</span>
                                  <input type="number" min="1" max="300" value={ex[field]} onChange={e => updEx(idx, field, e.target.value)} />
                                </label>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>

              </div>
            </div>

          </form>
        </div>
      )}
    </div>
  )
}

const PlusIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
const CloseIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
const EditIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
const TrashIcon   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
const PlayIcon    = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
const ListIcon    = ({ size=24 }) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
const ChevronUp   = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15"/></svg>
const ChevronDown = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
