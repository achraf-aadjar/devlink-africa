/**
 * Couleurs des deux séries, validées pour notre surface sombre (#161b22) avec
 * le script de la palette : écart daltonien ΔE 26,8, contraste ≥ 3:1. Elles ne
 * servent qu'aux barres ; les textes gardent les couleurs de texte du thème.
 */
export const SERIES = {
  wanted: { color: '#d95926', label: 'Veulent l’apprendre' },
  offered: { color: '#3987e5', label: 'La proposent' },
} as const

/** « 1 personne veut l'apprendre », « 3 la proposent » : le nombre accorde le verbe. */
export function wantedText(count: number): string {
  return count > 1 ? `${count} veulent l’apprendre` : `${count} veut l’apprendre`
}

export function offeredText(count: number): string {
  return count > 1 ? `${count} la proposent` : `${count} la propose`
}
