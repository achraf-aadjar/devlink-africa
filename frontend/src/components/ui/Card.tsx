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
        'surface p-6',
        interactive &&
          'transition duration-300 hover:-translate-y-1 hover:shadow-glow-soft hover:ring-accent-400/40',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
