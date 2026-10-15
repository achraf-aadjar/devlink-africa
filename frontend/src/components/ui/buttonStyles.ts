import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTS: Record<ButtonVariant, string> = {
  // Même bleu que la navbar et l'accueil. #1f6feb porte du blanc à 4,6:1 ;
  // au survol on fonce (et on allume le halo) plutôt que d'éclaircir, pour
  // garder le contraste.
  primary:
    'bg-brand text-white shadow-glow hover:bg-brand-hover disabled:bg-ink-200 disabled:text-ink-600 disabled:shadow-none',
  secondary: 'bg-veil/[0.06] text-ink-900 ring-1 ring-inset ring-veil/10 hover:bg-veil/10',
  ghost: 'text-ink-700 hover:bg-veil/[0.06] hover:text-ink-900',
  danger: 'bg-red-600 text-white hover:bg-red-700',
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
    'inline-flex items-center justify-center gap-2 rounded-full font-medium transition',
    'disabled:cursor-not-allowed disabled:opacity-70',
    VARIANTS[variant],
    SIZES[size],
    className,
  )
}
