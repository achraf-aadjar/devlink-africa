import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { ThemeContext, type Theme } from './context'

const STORAGE_KEY = 'devlink.theme'
const QUERY = '(prefers-color-scheme: dark)'

/** Choix mémorisé, sinon `null` : aucun choix explicite, on suit l'appareil. */
function storedTheme(): Theme | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored === 'light' || stored === 'dark' ? stored : null
  } catch {
    // Stockage indisponible (navigation privée, réglages) : on s'en passe.
    return null
  }
}

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(QUERY).matches
    : false
}

export default function ThemeProvider({
  children,
  initial,
}: {
  children: ReactNode
  /** Thème imposé (tests). Sinon : mémorisé, ou celui de l'appareil. */
  initial?: Theme
}) {
  // `null` : aucun choix explicite. L'attribut `data-theme` reste alors absent
  // (voir l'effet plus bas) et c'est `prefers-color-scheme` dans index.css qui
  // décide, en direct — exactement le comportement d'avant ce composant.
  const [preference, setPreference] = useState<Theme | null>(() => initial ?? storedTheme())
  const [systemDark, setSystemDark] = useState(systemPrefersDark)

  useEffect(() => {
    if (preference || typeof window.matchMedia !== 'function') return
    const media = window.matchMedia(QUERY)
    const onChange = () => setSystemDark(media.matches)
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [preference])

  const theme: Theme = preference ?? (systemDark ? 'dark' : 'light')

  useEffect(() => {
    if (preference) {
      document.documentElement.dataset.theme = preference
    } else {
      delete document.documentElement.dataset.theme
    }
  }, [preference])

  const setTheme = useCallback((next: Theme) => {
    setPreference(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Préférence non mémorisée : elle vaut pour la session en cours.
    }
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }, [theme, setTheme])

  const value = useMemo(() => ({ theme, setTheme, toggleTheme }), [theme, setTheme, toggleTheme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
