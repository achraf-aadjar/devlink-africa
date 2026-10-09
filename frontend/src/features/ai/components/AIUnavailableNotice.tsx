import { useI18n } from '../../../i18n/useI18n'

/**
 * Message affiché quand une fonction d'IA ne répond pas (critère de DL-42).
 *
 * Le ton est important : ce n'est pas une panne du produit, et l'utilisateur
 * doit comprendre qu'il peut continuer normalement.
 */
export default function AIUnavailableNotice({
  message,
  fallback,
}: {
  /** Déjà traduit. */
  message?: string
  /** Déjà traduit. */
  fallback?: string
}) {
  const { t } = useI18n()
  return (
    <p role="status" className="rounded-lg bg-ink-100 px-4 py-3 text-sm text-ink-700">
      <span className="font-medium">
        {message ?? t("L'assistance par IA est momentanément indisponible.")}
      </span>{' '}
      {fallback ?? t('Vous pouvez continuer à remplir le formulaire vous-même.')}
    </p>
  )
}
