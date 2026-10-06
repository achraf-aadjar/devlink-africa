import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export default function Card({
  children,
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  className?: string
  as?: 'div' | 'article' | 'section' | 'li'
}) {
  return (
    <Tag className={cn('rounded-card border border-ink-200 bg-white p-5 shadow-card', className)}>
      {children}
    </Tag>
  )
}
