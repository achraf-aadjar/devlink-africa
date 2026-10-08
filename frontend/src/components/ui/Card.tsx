import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export default function Card({
  children,
  className,
  as: Tag = 'div',
  interactive = false,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section' | 'li'
  /** Carte qui mène à une page de détail : légère élévation au survol. */
  interactive?: boolean
}) {
  return (
    <Tag
      className={cn(
        'rounded-card border border-ink-200 bg-ink-100 p-5 shadow-card',
        interactive &&
          'transition duration-200 hover:-translate-y-0.5 hover:border-accent-400/60 hover:shadow-glow-soft',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
