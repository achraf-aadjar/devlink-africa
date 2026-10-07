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
        'rounded-card border border-ink-200 bg-white p-5 shadow-card',
        interactive && 'transition-shadow duration-150 hover:border-accent-200 hover:shadow-lg',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
