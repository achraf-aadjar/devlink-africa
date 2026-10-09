/**
 * Couleurs des avatars à initiales, partagées entre l'avatar et le schéma d'un
 * cercle : une même personne garde la même teinte partout dans l'interface.
 */
const PALETTE: Array<{ from: string; to: string }> = [
  { from: '#1f6feb', to: '#79c0ff' },
  { from: '#8957e5', to: '#d2a8ff' },
  { from: '#1a7f64', to: '#56d4bc' },
  { from: '#bf4b8a', to: '#f778ba' },
  { from: '#9e6a03', to: '#e3b341' },
  { from: '#0969da', to: '#a371f7' },
]

function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

/** Dégradé d'une personne : stable d'une page à l'autre, car tiré de son nom. */
export function avatarColors(name: string): { from: string; to: string } {
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
