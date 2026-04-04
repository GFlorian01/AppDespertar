'use client'

import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

const CLOUD  = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD
const PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET

export function useExercises() {
  const { user } = useAuth()
  const [exercises, setExercises] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!user) return

    // Two local stores that live inside the effect closure
    const store = { own: [], pub: [] }

    const merge = () => {
      const map = new Map()
      store.own.forEach(e => map.set(e.id, e))               // own exercises (priority)
      store.pub.forEach(e => { if (!map.has(e.id)) map.set(e.id, e) }) // public from others
      setExercises([...map.values()])
      setLoading(false)
    }

    // 1) User's own exercises (all visibility)
    const ownQ = query(collection(db, 'exercises'), where('userId', '==', user.uid))
    const unsubOwn = onSnapshot(ownQ, snap => {
      store.own = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      merge()
    })

    // 2) Exercises shared by others (isPublic === true)
    const pubQ = query(collection(db, 'exercises'), where('isPublic', '==', true))
    const unsubPub = onSnapshot(pubQ, snap => {
      store.pub = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      merge()
    })

    return () => { unsubOwn(); unsubPub() }
  }, [user])

  const uploadVideo = (file, onProgress) => {
    return new Promise((resolve, reject) => {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', PRESET)
      formData.append('folder', `despertar/videos/${user.uid}`)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', `https://api.cloudinary.com/v1_1/${CLOUD}/video/upload`)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100))
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          const data = JSON.parse(xhr.responseText)
          resolve({ url: data.secure_url, publicId: data.public_id })
        } else { reject(new Error('Error al subir el video')) }
      }
      xhr.onerror = () => reject(new Error('Error de red'))
      xhr.send(formData)
    })
  }

  const addExercise    = async (data) => addDoc(collection(db, 'exercises'), { ...data, userId: user.uid, createdAt: serverTimestamp() })
  const updateExercise = async (id, data) => updateDoc(doc(db, 'exercises', id), data)
  const deleteExercise = async (exercise) => deleteDoc(doc(db, 'exercises', exercise.id))

  return { exercises, loading, addExercise, updateExercise, deleteExercise, uploadVideo }
}
