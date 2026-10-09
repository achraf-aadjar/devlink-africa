import { useState } from 'react'
import { Button } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { explainMatch } from '../api/ai'
import { useAIStatus } from '../hooks/useAIStatus'
import AIUnavailableNotice from './AIUnavailableNotice'

/**
 * Explication du match reformulée (DL-42, DL-47).
 *
 * **La répartition chiffrée reste affichée en permanence** : cette phrase vient
 * en plus, jamais à la place. C'est important pour la confiance : le calcul
 * reste vérifiable, l'IA ne fait que le raconter.
 */
export default function MatchSentence({ matchId }: { matchId: number }) {
  const { t } = useI18n()
  const { enabled, loading: checking } = useAIStatus()
  const [working, setWorking] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [sentence, setSentence] = useState<string | null>(null)

  if (checking || !enabled) return null

  async function handleClick() {
    setWorking(true)
    setUnavailable(false)
    try {
      const result = await explainMatch(matchId)
      setSentence(result.sentence)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 503) setUnavailable(true)
    } finally {
      setWorking(false)
    }
  }

  if (sentence) {
    return (
      <p role="status" className="alert alert-info">
        {sentence}
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" variant="ghost" size="sm" loading={working} onClick={handleClick}>
        {t('Résumer ce match en une phrase')}
      </Button>
      {unavailable && (
        <AIUnavailableNotice
          fallback={t("Les raisons détaillées ci-dessous disent déjà l'essentiel.")}
        />
      )}
    </div>
  )
}
