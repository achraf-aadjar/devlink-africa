import { Badge } from './ui'

/**
 * Étiquette des données de démonstration.
 *
 * Exigence du règlement (règle 7) : les profils fictifs doivent être
 * visiblement signalés dans l'interface, pas seulement en base.
 */
export default function DemoBadge({ isDemo }: { isDemo: boolean }) {
  if (!isDemo) return null
  return <Badge tone="demo">Profil de démonstration</Badge>
}
