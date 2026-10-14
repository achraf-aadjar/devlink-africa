import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  // Bleu d'action : blanc dessus à 7,2:1 (5,5:1 en sombre). Au survol on
  // fonce plutôt que d'éclaircir, pour garder le contraste.
  primary: 'bg-brand text-white hover:bg-brand-hover disabled:bg-ink-200 disabled:text-ink-600',
  // Feuille blanche cernée d'encre : l'action secondaire reste visible au soleil.
  secondary:
    'bg-ink-100 text-ink-900 ring-1 ring-inset ring-veil/25 hover:bg-ink-200 hover:ring-veil/40',
  ghost: 'text-ink-700 hover:bg-veil/[0.06] hover:text-ink-900',
  danger: 'bg-danger-solid text-white hover:bg-danger-solid/90',
}

const SIZES: Record<ButtonSize, string> = {
  sm: 'px-4 py-1.5 text-sm [@media(pointer:coarse)]:min-h-11',
  md: 'px-5 py-2 text-sm [@media(pointer:coarse)]:min-h-11',
  lg: 'px-7 py-3 text-base [@media(pointer:coarse)]:min-h-11',
}

/** Classes d'un bouton, partagées avec ButtonLink (lien qui a l'air d'un bouton). */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string,
) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
    'disabled:cursor-not-allowed disabled:opacity-70',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
