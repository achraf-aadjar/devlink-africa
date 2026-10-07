import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * Motifs d'arrière-plan de DevLink Africa.
 *
 * Tous dessinés par nous, en SVG répétable : aucune image à charger, aucune
 * donnée graphique tierce, donc aucune licence à déclarer.
 *
 * Règle : un motif donne de la texture sans jamais concurrencer le texte posé
 * dessus. Concrètement, ça veut dire un contraste faible mais réel (on doit le
 * voir, pas seulement savoir qu'il est là), posé sur un fond qui a lui-même une
 * couleur propre — jamais sur de la transparence, sinon il devient invisible.
 */

/**
 * Trame d'anneaux entrelacés : le motif de la marque. Pensée pour habiller une
 * bannière pleine largeur, donc elle prend toute la hauteur et la largeur de
 * son conteneur — c'est à l'appelant de donner une hauteur au conteneur (une
 * bannière, pas un paragraphe).
 */
export function RingsPattern({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-accent-50', className)}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="dla-rings" width="96" height="96" patternUnits="userSpaceOnUse">
            <circle cx="34" cy="48" r="22" fill="none" stroke="#b24422" strokeWidth="1.5" />
            <circle cx="62" cy="48" r="22" fill="none" stroke="#b24422" strokeWidth="1.5" />
          </pattern>
          {/* Fondu du motif vers le bas : net en haut, s'efface où le texte
              est le plus dense, pour ne jamais gêner la lecture. */}
          <linearGradient id="dla-rings-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="65%" stopColor="white" stopOpacity="0.55" />
            <stop offset="100%" stopColor="white" stopOpacity="0.15" />
          </linearGradient>
          <mask id="dla-rings-mask">
            <rect width="100%" height="100%" fill="url(#dla-rings-fade)" />
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="url(#dla-rings)" mask="url(#dla-rings-mask)" />
      </svg>
      {children}
    </div>
  )
}

/**
 * Trame de losanges, inspirée des textiles tissés. Pour les en-têtes de section
 * qui doivent se détacher, comme celui du score d'un match.
 */
export function WeavePattern({
  children,
  className,
}: {
  children?: ReactNode
  className?: string
}) {
  return (
    <div className={cn('relative isolate overflow-hidden bg-accent-50', className)}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="dla-weave" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M16 2 30 16 16 30 2 16z" fill="none" stroke="#b24422" strokeWidth="1.2" />
            <path d="M16 10 22 16 16 22 10 16z" fill="#b24422" fillOpacity="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dla-weave)" opacity="0.16" />
      </svg>
      {children}
    </div>
  )
}

/**
 * Trame de points, discrète. Pour les cartes de projet : elle les distingue du
 * fond de page sans ajouter de bordure ni d'ombre.
 */
export function DotsPattern({ children, className }: { children?: ReactNode; className?: string }) {
  return (
    <div className={cn('relative isolate overflow-hidden', className)}>
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern id="dla-dots" width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="9" cy="9" r="1.3" fill="#5d564b" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dla-dots)" opacity="0.1" />
      </svg>
      {children}
    </div>
  )
}
