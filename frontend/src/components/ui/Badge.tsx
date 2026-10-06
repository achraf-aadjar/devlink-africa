import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'accent' | 'offered' | 'wanted' | 'demo' | 'success' | 'warning'

const TONES: Record<Tone, string> = {
  neutral: 'bg-ink-100 text-ink-700',
  accent: 'bg-accent-100 text-accent-800',
  offered: 'bg-emerald-100 text-emerald-900',
  wanted: 'bg-sky-100 text-sky-900',
  demo: 'bg-amber-100 text-amber-900',
  success: 'bg-emerald-100 text-emerald-900',
  warning: 'bg-amber-100 text-amber-900',
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
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
