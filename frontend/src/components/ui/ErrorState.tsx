import Button from './Button'
import Card from './Card'

/** État « erreur » : message clair en français et bouton de réessai. */
export default function ErrorState({
  message = "Une erreur s'est produite. Vérifiez votre connexion puis réessayez.",
  onRetry,
}: {
  message?: string
  onRetry?: () => void
}) {
  return (
    <Card className="flex flex-col items-center gap-3 py-8 text-center">
      <p role="alert" className="text-sm text-ink-700">
        {message}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Réessayer
        </Button>
      )}
    </Card>
  )
}
