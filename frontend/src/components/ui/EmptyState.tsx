import type { ReactNode } from 'react'
import Icon from '../icons/Icon'
import Card from './Card'

/**
 * État « vide ». Le cahier des charges impose un message utile : on explique
 * toujours quoi faire ensuite, avec une action quand c'est possible.
 */
export default function EmptyState({
  title,
  description,
  action,
}: {
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <Card className="flex flex-col items-center gap-2 border-dashed py-12 text-center">
      <span
        aria-hidden="true"
        className="mb-2 flex h-12 w-12 items-center justify-center rounded-full border border-accent-300/60 bg-accent-50 text-accent-700 shadow-glow"
      >
        <Icon name="info" size={22} />
      </span>
      <h2 className="text-lg font-semibold text-ink-800">{title}</h2>
      <p className="max-w-md text-sm text-ink-600">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}
