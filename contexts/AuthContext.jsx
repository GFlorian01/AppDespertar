'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, updateProfile } from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider)
  const logout          = () => signOut(auth)

  const updateUserProfile = async (displayName, photoURL) => {
    const updates = { displayName }
    if (photoURL) updates.photoURL = photoURL
    await updateProfile(auth.currentUser, updates)
    // Force re-render: spread own props from the mutated Firebase user object
    setUser(prev => ({
      ...prev,
      displayName,
      ...(photoURL && { photoURL }),
    }))
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
