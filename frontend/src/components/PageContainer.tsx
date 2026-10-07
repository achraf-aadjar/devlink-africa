import type { ReactNode } from 'react'
import { cn } from '../lib/cn'

/**
 * Largeur de lecture standard, utilisée par la quasi-totalité des écrans.
 *
 * `<main>` dans Layout.tsx ne contraint plus la largeur : ce sont les pages qui
 * décident. La plupart veulent cette largeur de confort pour le texte ; une
 * bannière ou un fond de section veut au contraire toucher les bords de
 * l'écran. Cette séparation est ce qui permet à la page d'accueil d'avoir une
 * vraie bannière pleine largeur sans que chaque autre écran y pense.
 *
 * `size="wide"` sert aux écrans à grille dense (résultats de recherche, pays,
 * projets, tableau de bord) : sur un grand écran, une largeur de lecture de
 * texte laisse une grille de cartes avec deux immenses bandes vides de chaque
 * côté. `wide` donne à ces grilles la place de s'étaler avant de replier sur
 * une colonne vide — voir `WidePage.tsx`.
 *
 * Important : aucun padding vertical par défaut ici. `cn()` ne fusionne pas les
 * classes Tailwind (pas de tailwind-merge) — si ce composant posait `py-8` par
 * défaut, un appelant passant `py-3` ne l'emporterait pas forcément, puisque
 * Tailwind génère son CSS par ordre alphabétique de classe et non par ordre
 * d'apparition dans le JSX. Chaque appelant précise donc son propre `py-*`.
 */
const SIZES = {
  default: 'max-w-7xl',
  wide: 'max-w-[90rem]',
}

export default function PageContainer({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode
  className?: string
  size?: keyof typeof SIZES
}) {
  return <div className={cn('mx-auto w-full px-4 sm:px-6', SIZES[size], className)}>{children}</div>
}
