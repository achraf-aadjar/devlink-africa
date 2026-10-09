import { Badge } from './ui'
import { useI18n } from '../i18n/useI18n'

/**
 * Étiquette des données de démonstration.
 *
 * Exigence du règlement (règle 7) : les profils fictifs doivent être
 * visiblement signalés dans l'interface, pas seulement en base.
 */
export default function DemoBadge({ isDemo }: { isDemo: boolean }) {
  const { t } = useI18n()
  if (!isDemo) return null
  return <Badge tone="demo">{t('Profil de démonstration')}</Badge>
}
