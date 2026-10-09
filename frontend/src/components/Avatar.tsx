import { avatarColor, initials } from '../lib/avatarColors'
import { cn } from '../lib/cn'

/**
 * Carré aux initiales, à la place d'une photo de profil (le produit n'en
 * stocke pas). La teinte dépend du nom : une même personne garde toujours
 * la même couleur, et deux personnes voisines dans une liste se distinguent.
 */
export default function Avatar({
  name,
  size = 40,
  className,
}: {
  name: string
  size?: number
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-[3px] font-bold text-white',
        className,
      )}
      style={{
        width: size,
        height: size,
        fontSize: Math.round(size * 0.38),
        backgroundColor: avatarColor(name),
      }}
    >
      {initials(name)}
    </span>
  )
}
