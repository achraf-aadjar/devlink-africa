import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'
import { setApiLanguage } from '../lib/api'
import { I18nContext } from './context'
import { type Language, LANGUAGES, translate, translatePlural, type Vars } from './translate'

const STORAGE_KEY = 'devlink.lang'

/** Langue mémorisée, sinon celle du navigateur, sinon le français. */
function initialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && (LANGUAGES as string[]).includes(stored)) return stored as Language
  } catch {
    // Stockage indisponible (navigation privée, réglages) : on s'en passe.
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('en')
    ? 'en'
    : 'fr'
}

export default function I18nProvider({
  children,
  initial,
}: {
  children: ReactNode
  /** Langue imposée (tests). Sinon : mémorisée, ou celle du navigateur. */
  initial?: Language
}) {
  const [lang, setLangState] = useState<Language>(() => initial ?? initialLanguage())

  // L'API rédige quelques phrases (raisons d'un match) : elle suit la même langue.
  // Réglé pendant le rendu, pour que les premiers appels partent déjà dans la bonne.
  setApiLanguage(lang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Préférence non mémorisée : elle vaut pour la session en cours.
    }
  }, [])

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t: (text: string, vars?: Vars) => translate(lang, text, vars),
      tn: (count: number, one: string, other: string, vars?: Vars) =>
        translatePlural(lang, count, one, other, vars),
    }),
    [lang, setLang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}
