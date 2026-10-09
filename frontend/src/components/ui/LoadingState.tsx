import Skeleton from './Skeleton'
import { useI18n } from '../../i18n/useI18n'

/** État « chargement » : squelettes visibles et annonce pour les lecteurs d'écran. */
export default function LoadingState({
  rows = 3,
  label,
}: {
  rows?: number
  /** Déjà traduit. */
  label?: string
}) {
  const { t } = useI18n()
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3">
      <span className="sr-only">{label ?? t('Chargement…')}</span>
      {Array.from({ length: rows }, (_, index) => (
        <Skeleton key={index} className="h-20 w-full" />
      ))}
    </div>
  )
}
