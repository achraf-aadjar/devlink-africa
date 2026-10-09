import { createContext } from 'react'
import { type Language, translate, translatePlural, type Vars } from './translate'

export interface I18n {
  lang: Language
  setLang: (lang: Language) => void
  t: (text: string, vars?: Vars) => string
  /** `tn(nombre, singulier, pluriel)` : choisit la forme selon la langue ; `{n}` vaut le nombre. */
  tn: (count: number, one: string, other: string, vars?: Vars) => string
}

/** Valeur par défaut : français, sans fournisseur (composants rendus seuls en test). */
export const I18nContext = createContext<I18n>({
  lang: 'fr',
  setLang: () => {},
  t: (text, vars) => translate('fr', text, vars),
  tn: (count, one, other, vars) => translatePlural('fr', count, one, other, vars),
})
