import Avatar from '../Avatar'
import { cn } from '../../lib/cn'

/**
 * Une personne posée sur le tableau : son aimant (avatar) et son nom écrit
 * dessous en capitales condensées, avec une précision facultative (ville,
 * pays, « vous »).
 */
export default function Magnet({
  name,
  caption,
  size = 64,
  className,
}: {
  name: string
  caption?: string
  size?: number
  className?: string
}) {
  return (
    <figure className={cn('flex w-28 flex-col items-center gap-2 text-center', className)}>
      <Avatar name={name} size={size} />
      <figcaption className="leading-tight">
        <span className="block font-display text-lg font-bold uppercase text-ink-900">{name}</span>
        {caption && <span className="block text-xs text-ink-600">{caption}</span>}
      </figcaption>
    </figure>
  )
}
