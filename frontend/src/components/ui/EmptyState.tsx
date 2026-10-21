import type { ReactNode } from 'react'
import Icon, { type IconName } from '../icons/Icon'

/**
 * État « vide » : une ligne blanche de la feuille de match, en pointillés.
 * Le cahier des charges impose un message utile : on explique toujours quoi
 * faire ensuite, avec une action quand c'est possible.
 */
export default function EmptyState({
  title,
  description,
  action,
  icon = 'info',
}: {
  title: string
  description: string
  action?: ReactNode
  /** Pictogramme du sujet (match, échange, projet…), pour reconnaître l'écran. */
  icon?: IconName
}) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-card border border-dashed border-ink-400 bg-ink-100/60 p-6 sm:flex-row sm:items-center sm:gap-5">
      <span
        aria-hidden="true"
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink-200 text-ink-700"
      >
        <Icon name={icon} size={20} />
      </span>
      <div className="flex-1">
        <h2 className="text-base font-semibold text-ink-900">{title}</h2>
        <p className="mt-1 max-w-prose text-sm text-ink-600">{description}</p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
