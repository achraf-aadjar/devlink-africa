import { cn } from '../lib/cn'

/**
 * Pastille ronde aux initiales, à la place d'une photo de profil (le produit
 * n'en stocke pas). La teinte dépend du nom : une même personne garde toujours
 * la même couleur, et deux personnes voisines dans une liste se distinguent.
 */
const GRADIENTS = [
  'from-[#1f6feb] to-[#79c0ff]',
  'from-[#8957e5] to-[#d2a8ff]',
  'from-[#1a7f64] to-[#56d4bc]',
  'from-[#bf4b8a] to-[#f778ba]',
  'from-[#9e6a03] to-[#e3b341]',
  'from-[#0969da] to-[#a371f7]',
]

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  const first = parts[0][0]
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

function hash(text: string): number {
  let value = 0
  for (const char of text) value = (value * 31 + char.charCodeAt(0)) >>> 0
  return value
}

export default function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  const gradient = GRADIENTS[hash(name) % GRADIENTS.length]

  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white ring-2 ring-white/10',
        gradient,
        className,
      )}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
    >
      {initials(name)}
    </span>
  )
}
