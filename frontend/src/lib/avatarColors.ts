/**
 * Couleurs des avatars à initiales, partagées entre l'avatar et le schéma d'un
 * cercle : une même personne garde la même teinte partout dans l'interface.
 *
 * Des aimants pleins, comme sur un tableau tactique : chaque teinte porte des
 * initiales blanches à au moins 4,8:1, dans les deux thèmes.
 */
const PALETTE: string[] = [
  '#1a4fc0', // bleu
  '#c24d12', // orange
  '#2d3036', // encre
  '#0e6b63', // sarcelle
  '#17703a', // vert
  '#7a4a00', // ocre
  '#8a2d4e', // grenat
]

function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

/** Couleur d'une personne : stable d'une page à l'autre, car tirée de son nom. */
export function avatarColor(name: string): string {
  return PALETTE[hash(name) % PALETTE.length]
}

/** Initiales du prénom et du nom ; « ? » sans nom. */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}
