import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'accent' | 'offered' | 'wanted' | 'demo' | 'success' | 'warning'

// Étiquettes d'aimant : fond teinté et texte plein de la même famille,
// lisibles dans les deux thèmes. L'offre (« Je sais faire ») est bleue, la
// demande (« Je veux apprendre ») orange, comme sur le tableau et dans
// l'observatoire.
const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-200 text-ink-700',
  accent: 'bg-accent-50 text-accent-800 ring-1 ring-inset ring-accent-600/20',
  offered: 'bg-accent-50 text-accent-800 ring-1 ring-inset ring-accent-600/25',
  wanted: 'bg-demand/10 text-demand ring-1 ring-inset ring-demand/25',
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
        'inline-flex w-fit items-center rounded px-2 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
