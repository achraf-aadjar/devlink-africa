import Button from './Button'
import Icon from '../icons/Icon'
import { useI18n } from '../../i18n/useI18n'

/** État « erreur » : message clair, signalé par sa couleur et son pictogramme, et bouton de réessai. */
export default function ErrorState({
  message,
  onRetry,
}: {
  /** Déjà traduit. Par défaut, un message générique. */
  message?: string
  onRetry?: () => void
}) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col items-start gap-3 rounded-card bg-danger/[0.06] p-5 ring-1 ring-inset ring-danger/30 sm:flex-row sm:items-center sm:gap-4">
      <Icon name="warning" size={20} className="shrink-0 text-danger" />
      <div className="flex-1">
        <p role="alert" className="text-sm font-medium text-ink-900">
          {message ?? t("Une erreur s'est produite. Vérifiez votre connexion puis réessayez.")}
        </p>
      </div>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry} className="shrink-0">
          {t('Réessayer')}
        </Button>
      )}
    </div>
  )
}
