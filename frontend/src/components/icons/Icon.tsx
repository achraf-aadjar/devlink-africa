import type { SVGProps } from 'react'
import { cn } from '../../lib/cn'
import { PATHS, type IconName } from './paths'

export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'children'> {
  name: IconName
  /** Taille en pixels. 20 par défaut : s'accorde au texte de 14 px. */
  size?: number
  /**
   * Nom accessible. Sans lui, l'icône est décorative et masquée aux lecteurs
   * d'écran : c'est le cas le plus fréquent, l'icône accompagnant un libellé.
   */
  label?: string
}

/**
 * Icône du jeu de DevLink Africa. Les tracés vivent dans `paths.ts`.
 *
 * Le trait suit `currentColor` : une icône prend donc la couleur du texte qui
 * l'entoure, sans réglage. C'est ce qui permet de la poser dans un bouton
 * principal, un lien ou un message d'erreur sans y penser.
 */
export default function Icon({ name, size = 20, label, className, ...rest }: IconProps) {
  return (
    <svg
      {...rest}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      // Une icône sans nom est décorative : on la masque aux lecteurs d'écran,
      // sinon elle serait annoncée deux fois avec le libellé qu'elle accompagne.
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      className={cn('shrink-0', className)}
    >
      <path d={PATHS[name]} />
    </svg>
  )
}

export type { IconName }
