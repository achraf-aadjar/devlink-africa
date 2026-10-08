import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export default function Card({
  children,
  className,
  as: Tag = 'div',
  interactive = false,
  labelledBy,
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section' | 'li'
  /** Carte qui mène à une page de détail : légère élévation au survol. */
  interactive?: boolean
  /** Identifiant du titre qui nomme la carte : en fait une région pour les lecteurs d'écran. */
  labelledBy?: string
}) {
  return (
    <Tag
      aria-labelledby={labelledBy}
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
