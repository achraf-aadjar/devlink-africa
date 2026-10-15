import type { I18n } from '../../i18n/context'
import { msg } from '../../i18n/translate'

/**
 * Couleurs des deux séries : les deux aimants du tableau, orange pour la
 * demande, bleu pour l'offre, comme partout dans l'application. Valeurs du
 * thème courant, au moins 3:1 sur la feuille dans les deux thèmes ; le couple
 * bleu / orange reste distinct pour les daltoniens. Elles ne servent qu'aux
 * barres et aux pastilles de légende, jamais au texte.
 */
export const SERIES = {
  wanted: { color: 'rgb(var(--demand))', label: msg('Veulent l’apprendre') },
  offered: { color: 'rgb(var(--accent-500))', label: msg('La proposent') },
} as const

/** « 1 personne veut l'apprendre », « 3 la proposent » : le nombre accorde le verbe. */
export function wantedText(count: number, tn: I18n['tn']): string {
  return tn(count, '{n} veut l’apprendre', '{n} veulent l’apprendre')
}

export function offeredText(count: number, tn: I18n['tn']): string {
  return tn(count, '{n} la propose', '{n} la proposent')
}
