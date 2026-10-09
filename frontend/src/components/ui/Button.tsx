import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import Spinner from './Spinner'

type Variant = 'primary' | 'secondary' | 'success' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  children: ReactNode
}

// Les styles sont dans index.css (`.btn`, `.btn-primary`…), pour qu'un lien
// puisse ressembler à un bouton sans passer par ce composant.
const VARIANTS: Record<Variant, string> = {
  primary: 'btn-primary',
  secondary: '',
  success: 'btn-success',
  ghost: 'btn-link',
  danger: 'btn-danger',
}

const SIZES: Record<Size, string> = {
  sm: 'btn-sm',
  md: '',
  lg: 'btn-lg',
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
      className={cn('btn', VARIANTS[variant], SIZES[size], className)}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}
