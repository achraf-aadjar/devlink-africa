import { useState } from 'react'
import SkillBadge from '../../../components/SkillBadge'
import { Button, Card, Textarea } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import type { SkillKind, SkillLevel } from '../../../lib/types'
import { extractSkills, type SkillSuggestion } from '../api/ai'
import { useAIStatus } from '../hooks/useAIStatus'
import AIUnavailableNotice from './AIUnavailableNotice'

/**
 * « Remplir depuis un texte » (DL-42, DL-44).
 *
 * L'IA propose, l'utilisateur valide : **rien n'est ajouté sans un clic**.
 * Si l'IA est indisponible, ce bloc disparaît et le formulaire classique reste
 * le seul chemin, inchangé.
 */
export default function SkillExtractor({
  onAccept,
}: {
  onAccept: (kind: SkillKind, skillId: number, level: SkillLevel) => Promise<void> | void
}) {
  const { t } = useI18n()
  const { enabled, loading: checking } = useAIStatus()
  const [text, setText] = useState('')
  const [working, setWorking] = useState(false)
  const [unavailable, setUnavailable] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offered, setOffered] = useState<SkillSuggestion[]>([])
  const [wanted, setWanted] = useState<SkillSuggestion[]>([])
  const [done, setDone] = useState(false)

  if (checking || !enabled) return null

  async function handleExtract(event: React.FormEvent) {
    event.preventDefault()
    setWorking(true)
    setError(null)
    setUnavailable(false)
    setDone(false)
    try {
      const result = await extractSkills(text.trim())
      setOffered(result.suggestions.offered)
      setWanted(result.suggestions.wanted)
      setDone(true)
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 503) {
        setUnavailable(true)
      } else if (cause instanceof ApiError) {
        setError(cause.fieldError('text') ?? cause.message)
      } else {
        setError(t('Impossible de contacter le serveur.'))
      }
    } finally {
      setWorking(false)
    }
  }

  async function accept(kind: SkillKind, suggestion: SkillSuggestion) {
    await onAccept(kind, suggestion.skill, suggestion.level ?? 'INTERMEDIATE')
    if (kind === 'OFFERED') {
      setOffered((list) => list.filter((item) => item.skill !== suggestion.skill))
    } else {
      setWanted((list) => list.filter((item) => item.skill !== suggestion.skill))
    }
  }

  const nothingFound = done && offered.length === 0 && wanted.length === 0

  return (
    <Card className="flex flex-col gap-4 border-accent-200 bg-accent-50">
      <div>
        <h2 className="font-semibold text-ink-900">{t('Remplir depuis un texte')}</h2>
        <p className="mt-1 text-sm text-ink-700">
          {t(
            'Décrivez votre parcours en quelques phrases : nous vous proposerons des compétences à ajouter. Vous gardez la main sur ce qui est enregistré.',
          )}
        </p>
      </div>

      <form onSubmit={handleExtract} noValidate className="flex flex-col gap-3">
        <Textarea
          label={t('Votre parcours')}
          value={text}
          error={error ?? undefined}
          maxLength={4000}
          placeholder={t(
            'Exemple : je fais du Django depuis trois ans et je veux apprendre Flutter.',
          )}
          onChange={(event) => setText(event.target.value)}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={working} disabled={text.trim().length < 20}>
            {t('Proposer des compétences')}
          </Button>
        </div>
      </form>

      {unavailable && <AIUnavailableNotice />}

      {nothingFound && (
        <p role="status" className="text-sm text-ink-700">
          {t('Aucune compétence reconnue dans ce texte. Ajoutez-les directement ci-dessous.')}
        </p>
      )}

      {offered.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-800">
            {t('Compétences que vous semblez maîtriser')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {offered.map((suggestion) => (
              <li key={suggestion.skill}>
                <button
                  type="button"
                  onClick={() => accept('OFFERED', suggestion)}
                  className="rounded focus-visible:ring-2"
                  aria-label={t('Ajouter {skill} à ce que je sais faire', {
                    skill: suggestion.name,
                  })}
                >
                  <SkillBadge
                    name={`+ ${suggestion.name}`}
                    kind="OFFERED"
                    level={suggestion.level}
                  />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {wanted.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-medium text-ink-800">
            {t('Compétences que vous semblez chercher')}
          </h3>
          <ul className="flex flex-wrap gap-2">
            {wanted.map((suggestion) => (
              <li key={suggestion.skill}>
                <button
                  type="button"
                  onClick={() => accept('WANTED', suggestion)}
                  className="rounded focus-visible:ring-2"
                  aria-label={t('Ajouter {skill} à ce que je veux apprendre', {
                    skill: suggestion.name,
                  })}
                >
                  <SkillBadge name={`+ ${suggestion.name}`} kind="WANTED" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {(offered.length > 0 || wanted.length > 0) && (
        <p className="text-xs text-ink-600">
          {t("Cliquez sur une proposition pour l'ajouter. Rien n'est enregistré avant votre clic.")}
        </p>
      )}
    </Card>
  )
}
