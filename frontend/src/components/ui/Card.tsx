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
  /** Carte qui mène à une page de détail : la bordure fonce au survol. */
  interactive?: boolean
  /** Identifiant du titre qui nomme la carte : en fait une région pour les lecteurs d'écran. */
  labelledBy?: string
}) {
  return (
    <Tag
      aria-labelledby={labelledBy}
      className={cn(
        'surface p-5',
        interactive && 'transition-colors hover:border-ink-400',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
