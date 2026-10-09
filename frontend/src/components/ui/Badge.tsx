import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Tone = 'neutral' | 'accent' | 'offered' | 'wanted' | 'demo' | 'success' | 'warning'

// Teintes des messages de Bootstrap 3 (succès, information, avertissement) :
// texte foncé sur fond pâle, au moins 4,5:1.
const TONES: Record<Tone, string> = {
  neutral: 'border-ink-300 bg-ink-100 text-ink-700',
  accent: 'border-accent-200 bg-accent-50 text-accent-800',
  offered: 'border-[#d0e9c6] bg-[#dff0d8] text-[#3c763d]',
  wanted: 'border-[#bce8f1] bg-[#d9edf7] text-[#31708f]',
  demo: 'border-[#faebcc] bg-[#fcf8e3] text-[#8a6d3b]',
  success: 'border-[#d0e9c6] bg-[#dff0d8] text-[#3c763d]',
  warning: 'border-[#faebcc] bg-[#fcf8e3] text-[#8a6d3b]',
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
        'inline-flex w-fit items-center rounded-[3px] border px-1.5 py-px text-xs font-semibold',
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
