import Skeleton from './Skeleton'

/** État « chargement » : squelettes visibles et annonce pour les lecteurs d'écran. */
export default function LoadingState({
  rows = 3,
  label = 'Chargement…',
}: {
  rows?: number
  label?: string
}) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  )
}
