import { cn } from '../../lib/cn'

/** Bloc de chargement. Le conteneur porte le rôle d'état (voir LoadingState). */
export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn('animate-pulse rounded-card bg-veil/[0.07]', className)}
    />
  )
}
