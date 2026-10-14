import { cn } from '../../lib/cn'

/**
 * Flèche au feutre du tableau tactique : un trait courbe à bouts ronds.
 * Verticale, elle se trace une fois à l'affichage (déjà tracée si l'appareil
 * réduit les animations) ; horizontale, elle est posée d'emblée.
 * Décorative : le sens de l'échange est toujours écrit à côté.
 *
 * Horizontale, elle s'étire sur toute la largeur de son conteneur ; la pointe
 * garde sa taille. Verticale, elle garde ses proportions. Pas de
 * `vector-effect` : il fausse la longueur normalisée dont le tracé a besoin.
 */
export default function MarkerArrow({
  direction = 'right',
  className,
  delay = 0,
}: {
  direction?: 'right' | 'left' | 'down' | 'up'
  /** Couleur par `text-*` (currentColor) et taille par `w-*` / `h-*`. */
  className?: string
  /** Décalage du tracé, en millisecondes, pour enchaîner plusieurs flèches. */
  delay?: number
}) {
  const stroke = {
    className: 'marker marker-draw animate-draw',
    strokeWidth: 3,
    pathLength: 1,
  }

  if (direction === 'down' || direction === 'up') {
    const down = direction === 'down'
    return (
      <svg aria-hidden="true" viewBox="0 0 24 80" className={cn('overflow-visible', className)}>
        <path
          {...stroke}
          d={down ? 'M12 4 C 4 26, 4 50, 12 70' : 'M12 76 C 20 54, 20 30, 12 10'}
          style={{ animationDelay: `${delay}ms` }}
        />
        <path
          {...stroke}
          d={down ? 'M3 60 L12 74 L21 60' : 'M3 20 L12 6 L21 20'}
          style={{ animationDelay: `${delay + 500}ms` }}
        />
      </svg>
    )
  }

  // Horizontale : déjà tracée, sans animation. Le tracé par pointillés est
  // fragile sur un chemin étiré (largeur variable) ; le cercle et les flèches
  // verticales gardent le leur.
  const flat = { className: 'marker', strokeWidth: 3 }
  const right = direction === 'right'
  const head = (
    <svg aria-hidden="true" viewBox="0 0 14 24" className="h-full w-3.5 shrink-0 overflow-visible">
      <path {...flat} d={right ? 'M2 4 L12 12 L2 20' : 'M12 4 L2 12 L12 20'} />
    </svg>
  )
  // Le conteneur extérieur reçoit l'affichage choisi par l'appelant (hidden,
  // sm:block…) ; la rangée intérieure reste toujours en flex, pour que le
  // trait prenne toute la largeur restante et que la pointe garde la sienne.
  return (
    <div aria-hidden="true" className={className}>
      <div className="flex h-full w-full items-center">
        {!right && head}
        <svg
          viewBox="0 0 200 24"
          preserveAspectRatio="none"
          className="-mx-px h-full min-w-0 flex-1 overflow-visible"
        >
          <path
            {...flat}
            vectorEffect="non-scaling-stroke"
            d={right ? 'M2 16 C 60 6, 140 6, 199 12' : 'M198 8 C 140 18, 60 18, 1 12'}
          />
        </svg>
        {right && head}
      </div>
    </div>
  )
}
