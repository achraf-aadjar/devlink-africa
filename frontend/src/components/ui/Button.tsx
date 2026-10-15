import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'
import Spinner from './Spinner'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  children: ReactNode
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
      className={buttonClasses(variant, size, className)}
    >
      {loading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}
