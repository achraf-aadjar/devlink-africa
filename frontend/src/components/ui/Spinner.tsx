import { cn } from '../../lib/cn'

/** Indicateur d'attente. Décoratif : le texte d'état est porté par le parent. */
export default function Spinner({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={cn('animate-spin', className ?? 'h-5 w-5')}
      fill="none"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="4" />
      <path
        d="M22 12a10 10 0 0 0-10-10"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinecap="round"
      />
    </svg>
  )
}
