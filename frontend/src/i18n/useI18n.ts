import { useContext } from 'react'
import { I18nContext } from './context'

/** `const { t, tn, lang, setLang } = useI18n()` */
export function useI18n() {
  return useContext(I18nContext)
}
