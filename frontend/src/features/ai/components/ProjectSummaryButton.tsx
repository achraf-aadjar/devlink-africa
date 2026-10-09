import { useState } from 'react'
import { Button } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { summarizeProject } from '../api/ai'
import { useAIStatus } from '../hooks/useAIStatus'
import AIUnavailableNotice from './AIUnavailableNotice'

/**
 * Résumé de projet proposé (DL-42, DL-46).
 *
 * Le propriétaire voit la proposition et décide de l'utiliser ou non : nous
 * n'écrasons jamais sa description sans un clic explicite.
 */
export default function ProjectSummaryButton({
  description,
  onUse,
}: {
  description: string
  onUse: (summary: string) => void
}) {
  const { t } = useI18n()
  const { enabled, loading: checking } = useAIStatus()
  const [working, setWorking] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [summary, setSummary] = useState<string | null>(null)

  if (checking || !enabled) return null
  // Sans texte à résumer, le bouton n'a pas de sens.
  if (description.trim().length < 50) return null

  async function handleClick() {
    setWorking(true)
    setUnavailable(false)
    try {
      const result = await summarizeProject(description.trim())
      setSummary(result.summary)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 503) setUnavailable(true)
    } finally {
      setWorking(false)
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded border border-ink-200 bg-ink-100 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-ink-700">
          {t("Besoin d'une présentation courte pour la carte ?")}
        </p>
        <Button type="button" variant="secondary" size="sm" loading={working} onClick={handleClick}>
          {t('Proposer un résumé')}
        </Button>
      </div>

      {unavailable && (
        <AIUnavailableNotice
          fallback={t('Rédigez votre présentation vous-même, elle sera sûrement meilleure.')}
        />
      )}

      {summary && (
        <div className="flex flex-col gap-2" role="status">
          <p className="rounded border border-ink-300 bg-white p-3 text-sm text-ink-800">
            {summary}
          </p>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => onUse(summary)}>
              {t('Utiliser ce texte')}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setSummary(null)}>
              {t('Ignorer')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
