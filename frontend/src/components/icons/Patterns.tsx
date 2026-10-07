import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Motifs d'arrière-plan de DevLink Africa.
 *
 * Tous dessinés par nous, en SVG répétable : aucune image à charger, aucune
 * donnée graphique tierce, donc aucune licence à déclarer.
 *
 * Règle appliquée partout : un fond ne doit jamais se remarquer. S'il attire
 * l'œil, il nuit au texte posé dessus. D'où des opacités très basses (0,04 à
 * 0,10) et des motifs de grande maille.
 *
 * Les motifs reprennent le vocabulaire géométrique de la marque : des cercles
 * qui se recouvrent, et des trames régulières dans l'esprit d'un tissage.
 */

/**
 * Trame d'anneaux entrelacés, très discrète. Pour la page d'accueil : elle
 * donne de la matière au grand aplat de fond, sans jamais gêner la lecture.
 */
export function RingsPattern({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative isolate', className)}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="dla-rings" width="72" height="72" patternUnits="userSpaceOnUse">
            {/* Deux anneaux qui se recouvrent : le motif de la marque. */}
            <circle cx="26" cy="36" r="17" fill="none" stroke="#b24422" strokeWidth="1.2" />
            <circle cx="46" cy="36" r="17" fill="none" stroke="#b24422" strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dla-rings)" opacity="0.07" />
      </svg>
      {children}
    </div>
  )
}

/**
 * Trame de losanges, inspirée des textiles tissés. Pour les en-têtes de section
 * qui doivent se détacher, comme celui de Dev Match. Un peu plus présente que
 * la précédente, mais toujours en retrait du texte.
 */
export function WeavePattern({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="dla-weave" width="28" height="28" patternUnits="userSpaceOnUse">
            {/* Losanges alignés : la régularité fait le tissage. */}
            <path d="M14 2 26 14 14 26 2 14z" fill="none" stroke="#b24422" strokeWidth="1" />
            <path d="M14 9 19 14 14 19 9 14z" fill="#b24422" fillOpacity="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dla-weave)" opacity="0.1" />
      </svg>
      {children}
    </div>
  )
}

/**
 * Trame de points, presque imperceptible. Pour les cartes de projet : elle les
 * distingue du fond de page sans ajouter de bordure ni d'ombre.
 */
export function DotsPattern({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate', className)}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full"
        width="100%"
        height="100%"
      >
        <defs>
          <pattern id="dla-dots" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="8" cy="8" r="1" fill="#5d564b" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dla-dots)" opacity="0.06" />
      </svg>
      {children}
    </div>
  )
}
