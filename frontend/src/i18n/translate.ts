import { EN } from './en'

export type Language = 'fr' | 'en'
export const LANGUAGES: Language[] = ['fr', 'en']

export type Vars = Record<string, string | number>

/**
 * Traduit un texte français. Le français est la langue source : il sert de
 * clé, et reste affiché tel quel si une traduction manque (jamais d'écran vide).
 * `{nom}` est remplacé par `vars.nom`.
 *
 * Un même mot français peut demander deux traductions : « Pays » est
 * « Country » sous un champ, « Countries » dans le menu. On précise alors le
 * contexte après une barre verticale, `t('Pays|menu')` ; il n'est jamais affiché.
 */
export function translate(lang: Language, text: string, vars?: Vars): string {
  const french = text.includes('|') ? text.slice(0, text.indexOf('|')) : text
  const base = lang === 'en' ? (EN[text] ?? french) : french
  if (!vars) return base
  return base.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

/**
 * Accord en nombre. Le français met au singulier 0 et 1 (« 0 projet »),
 * l'anglais seulement 1 (« 0 projects »). `{n}` vaut `count`.
 */
export function translatePlural(
  lang: Language,
  count: number,
  one: string,
  other: string,
  vars?: Vars,
): string {
  const singular = lang === 'en' ? count === 1 : Math.abs(count) < 2
  return translate(lang, singular ? one : other, { n: count, ...vars })
}

/**
 * Marque un texte à traduire là où on ne peut pas encore appeler `t` (tableaux
 * de constantes). Ne fait rien : c'est le composant qui traduit au rendu. Sert
 * au test d'exhaustivité, qui repère les textes à traduire par `t(` et `msg(`.
 */
export const msg = (text: string) => text
