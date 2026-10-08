import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

const VARIANTS: Record<Variant, string> = {
  // Même bleu que la navbar et l'accueil. #1f6feb porte du blanc à 4,6:1 ;
  // au survol on fonce (et on allume le halo) plutôt que d'éclaircir, pour
  // garder le contraste.
  primary:
    'bg-[#1f6feb] text-white shadow-glow hover:bg-[#1a5fd0] disabled:bg-ink-300 disabled:shadow-none',
  secondary:
    'border border-ink-300 bg-ink-100 text-ink-800 hover:border-accent-400/70 hover:bg-ink-200',
  ghost: 'text-ink-700 hover:bg-ink-200',
  danger: 'bg-red-600 text-white hover:bg-red-500',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}
