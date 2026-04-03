'use client'

import { useState, useEffect } from 'react'
import {
  collection, addDoc, query, where,
  onSnapshot, serverTimestamp
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'

export function useSessions() {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    const q = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid)
    )
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }))
      docs.sort((a, b) => {
        const ta = a.startTime?.toMillis?.() ?? 0
        const tb = b.startTime?.toMillis?.() ?? 0
        return tb - ta
      })
      setSessions(docs)
      setLoading(false)
    })
    return unsub
  }, [user])

  const saveSession = async (data) =>
    addDoc(collection(db, 'sessions'), { ...data, userId: user.uid, startTime: serverTimestamp() })

  return { sessions, loading, saveSession }
}
