import type { SVGProps } from 'react'
import { cn } from '../../lib/cn'

/**
 * Marque de DevLink Africa.
 *
 * Le symbole : deux anneaux qui se recouvrent, et leur intersection comme
 * troisième forme. C'est l'idée exacte du produit, la complémentarité
 * réciproque : ni l'un ni l'autre seul, mais ce qu'ils produisent ensemble.
 *
 * Pourquoi cette forme et pas un acacia ni un contour du continent : un cliché
 * visuel dit « Afrique » mais ne dit rien du produit, et vieillit mal. Une forme
 * géométrique abstraite reste lisible à 16 pixels, se décline en monochrome, et
 * ne ressemble à aucun logo existant.
 *
 * La couleur : l'anneau de gauche en bleu (notre accent), celui de droite en
 * clair. Deux acteurs différents, une zone commune. Les deux teintes
 * reprennent exactement accent-600 et ink-900 du thème sombre.
 */

export interface LogoProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  size?: number
  /**
   * `mono` utilise currentColor : pour une impression ou un fond coloré.
   * `light` : pour un fond clair (barre de navigation) — l'anneau droit passe
   * en quasi-noir, sinon il disparaît sur le blanc.
   */
  variant?: LogoVariant
}

type LogoVariant = 'color' | 'light' | 'mono'

const RIGHT_RING: Record<LogoVariant, string> = {
  color: 'rgb(var(--ink-900))',
  light: '#1f2328',
  mono: 'currentColor',
}

export function LogoMark({ size = 32, variant = 'color', className, ...rest }: LogoProps) {
  const left = variant === 'mono' ? 'currentColor' : '#4493f8'
  const right = RIGHT_RING[variant]

  return (
    <svg
      {...rest}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      role="img"
      aria-label="DevLink Africa"
      className={cn('shrink-0', className)}
    >
      {/*
        L'intersection en premier, donc sous les anneaux : ce que les deux
        produisent ensemble. Volontairement légère (opacité 0,22) — à pleine
        densité elle écrasait les anneaux et la marque devenait une tache.
      */}
      <path
        d="M24 12.3a12.5 12.5 0 0 0 0 23.4 12.5 12.5 0 0 0 0-23.4"
        fill={variant === 'mono' ? 'currentColor' : '#4493f8'}
        fillOpacity={0.22}
      />
      {/* Anneau gauche : celui qui apporte. */}
      <circle cx="19" cy="24" r="12.5" stroke={left} strokeWidth="3.5" />
      {/* Anneau droit : celui qui reçoit. */}
      <circle cx="29" cy="24" r="12.5" stroke={right} strokeWidth="3.5" />
    </svg>
  )
}

/**
 * Marque horizontale : le symbole suivi du nom.
 *
 * Le nom est composé en police système, à dessein : aucune police à charger,
 * donc aucune licence tierce à déclarer et aucun décalage de rendu au
 * chargement de la page.
 */
export function Logo({
  size = 28,
  variant = 'color',
  className,
}: {
  size?: number
  variant?: LogoVariant
  className?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} variant={variant} aria-hidden="true" />
      <span className="text-lg font-bold leading-none tracking-tight">
        DevLink{' '}
        <span
          className={cn(
            variant === 'color' && 'text-accent-600',
            variant === 'light' && 'text-paper-brand',
          )}
        >
          Africa
        </span>
      </span>
    </span>
  )
}

export default Logo
