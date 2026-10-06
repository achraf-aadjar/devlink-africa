import type { ReactNode } from 'react'
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
    <Card className="flex flex-col items-center gap-2 py-10 text-center">
      <h2 className="text-lg font-semibold text-ink-800">{title}</h2>
      <p className="max-w-md text-sm text-ink-600">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </Card>
  )
}
