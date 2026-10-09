/**
 * Couleurs des avatars à initiales, partagées entre l'avatar et le schéma d'un
 * cercle : une même personne garde la même teinte partout dans l'interface.
 * Teintes unies et assez foncées pour porter des initiales blanches (≥ 4,5:1).
 */
const PALETTE = ['#2a6496', '#6f42c1', '#2e7d32', '#a94442', '#8a6d3b', '#31708f']

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
