import { Badge } from './ui'
import { useI18n } from '../i18n/useI18n'

/**
 * Étiquette des données de démonstration.
 *
 * Exigence du règlement (règle 7) : les profils fictifs doivent être
 * visiblement signalés dans l'interface, pas seulement en base. Dans une
 * liste, `compact` écrit seulement « Démo » (le libellé complet reste lu par
 * les lecteurs d'écran et affiché au survol) : la mention reste visible sur
 * chaque ligne sans couvrir la page de la même phrase.
 */
export default function DemoBadge({
  isDemo,
  compact = false,
}: {
  isDemo: boolean
  compact?: boolean
}) {
  const { t } = useI18n()
  if (!isDemo) return null
  if (!compact) return <Badge tone="demo">{t('Profil de démonstration')}</Badge>
  return (
    <span title={t('Profil de démonstration')} className="inline-flex">
      <Badge tone="demo">
        <span aria-hidden="true">{t('Démo')}</span>
        <span className="sr-only">{t('Profil de démonstration')}</span>
      </Badge>
    </span>
  )
}
