import { ButtonLink, EmptyState } from '../components/ui'
import { useI18n } from '../i18n/useI18n'

export default function NotFoundPage() {
  const { t } = useI18n()
  return (
    <EmptyState
      title={t('Page introuvable')}
      description={t("Cette page n'existe pas ou a été déplacée.")}
      action={<ButtonLink to="/">{t("Retour à l'accueil")}</ButtonLink>}
    />
  )
}
