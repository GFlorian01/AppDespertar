'use client'

import { useState, useEffect } from 'react'
import {
  collection, addDoc, updateDoc, deleteDoc,
  doc, query, where, onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function useRoutines() {
  const { user } = useAuth()
  const [routines, setRoutines] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'routines'), where('userId', '==', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      setRoutines(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return unsub
  }, [user])

  const addRoutine    = async (data) => addDoc(collection(db, 'routines'), { ...data, userId: user.uid, createdAt: serverTimestamp() })
  const updateRoutine = async (id, data) => updateDoc(doc(db, 'routines', id), data)
  const deleteRoutine = async (id) => deleteDoc(doc(db, 'routines', id))

  return { routines, loading, addRoutine, updateRoutine, deleteRoutine }
}
