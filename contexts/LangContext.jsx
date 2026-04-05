'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '@/lib/translations'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLangState] = useState('es')

  useEffect(() => {
    const saved = localStorage.getItem('despertar-lang')
    if (saved === 'es' || saved === 'en') setLangState(saved)
  }, [])

  const setLang = (l) => {
    setLangState(l)
    localStorage.setItem('despertar-lang', l)
  }

  const t = (key) => translations[lang]?.[key] ?? translations.es[key] ?? key

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
