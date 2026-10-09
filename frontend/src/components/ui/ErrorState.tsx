import Button from './Button'
import Card from './Card'
import { useI18n } from '../../i18n/useI18n'

/** État « erreur » : message clair et bouton de réessai. */
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
    <Card className="flex flex-col items-center gap-3 py-8 text-center">
      <p role="alert" className="text-sm text-ink-700">
        {message ?? t("Une erreur s'est produite. Vérifiez votre connexion puis réessayez.")}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {t('Réessayer')}
        </Button>
      )}
    </Card>
  )
}
