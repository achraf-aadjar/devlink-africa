import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'accent' | 'offered' | 'wanted' | 'demo' | 'success' | 'warning'

// Fond teinté à 10 % et texte plein de la même famille : lisible dans les
// deux thèmes, puisque `success`, `info`… changent de valeur avec le thème.
const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-200 text-ink-700',
  accent: 'bg-accent-100 text-accent-800',
  offered: 'bg-success/10 text-success ring-1 ring-inset ring-success/20',
  wanted: 'bg-info/10 text-info ring-1 ring-inset ring-info/20',
  demo: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/25',
  success: 'bg-success/10 text-success ring-1 ring-inset ring-success/20',
  warning: 'bg-warning/10 text-warning ring-1 ring-inset ring-warning/25',
}

export default function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
