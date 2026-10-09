import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { msg } from '../../../i18n/translate'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import type { Circle } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import { getEndorsementCandidates } from '../../endorsements/api/endorsements'
import EndorsePanel from '../../endorsements/components/EndorsePanel'
import { answerCircle, getCircleSuggestions, listCircles, proposeCircle } from '../api/circles'
import CircleCard from '../components/CircleCard'
import { CIRCLES_CHANGED } from '../hooks/usePendingCircles'

const STEPS = [
  msg('Dev Match cherche des paires : vous apprenez à quelqu’un qui vous apprend en retour.'),
  msg(
    'Quand cette paire n’existe pas, l’échange peut circuler : vous apprenez à l’un, un autre vous apprend.',
  ),
  msg(
    'Chacun accepte. Une fois que tout le monde a dit oui, les contacts se débloquent pour tout le cercle.',
  ),
]

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4" aria-label={title}>
      <h2 className="text-xl font-semibold text-ink-900">{title}</h2>
      <ul className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">{children}</ul>
    </section>
  )
}

export default function CirclesPage() {
  const { t } = useI18n()
  const { user } = useAuth()
  const meId = user?.id
  const suggestions = useQuery(() => getCircleSuggestions(), [])
  const mine = useQuery(() => listCircles(), [])
  const candidates = useQuery(() => getEndorsementCandidates(), [])
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  async function run(circle: Circle, action: () => Promise<unknown>) {
    setBusyKey(circle.key)
    setActionError(null)
    try {
      await action()
      suggestions.reload()
      mine.reload()
      candidates.reload()
      window.dispatchEvent(new Event(CIRCLES_CHANGED))
    } catch (cause) {
      setActionError(
        cause instanceof ApiError && cause.message
          ? cause.message
          : t("L'action n'a pas pu être effectuée. Réessayez dans un instant."),
      )
    } finally {
      setBusyKey(null)
    }
  }

  const propose = (circle: Circle) =>
    run(circle, () => proposeCircle(circle.members.map((member) => member.id)))
  const answer = (circle: Circle, accept: boolean) =>
    run(circle, () => answerCircle(circle.id as number, accept ? 'ACCEPT' : 'DECLINE'))

  const loading = suggestions.loading || mine.loading
  const error = suggestions.error || mine.error
  const circles = mine.data?.results ?? []
  const invitations = circles.filter(
    (circle) =>
      circle.status === 'PROPOSED' &&
      circle.members.find((member) => member.id === meId)?.response === 'PENDING',
  )
  const others = circles.filter((circle) => !invitations.includes(circle))
  const possible = suggestions.data?.results ?? []
  const nothing = !loading && !error && circles.length === 0 && possible.length === 0

  /** Dans un cercle actif, la personne qui m'apprend quelque chose : je peux la valider. */
  const teacherCandidate = (circle: Circle) => {
    if (circle.status !== 'ACTIVE') return undefined
    const teacher = circle.arrows.find((arrow) => arrow.learner === meId)?.teacher
    return candidates.data?.results.find((candidate) => candidate.user.id === teacher)
  }

  const card = (circle: Circle) => {
    const candidate = teacherCandidate(circle)
    return (
      <CircleCard
        key={circle.id ?? circle.key}
        circle={circle}
        meId={meId}
        busy={busyKey === circle.key}
        onPropose={propose}
        onAnswer={answer}
      >
        {candidate && <EndorsePanel candidate={candidate} onChange={candidates.reload} />}
      </CircleCard>
    )
  }

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">{t("Cercles d'échange")}</h1>
        <p className="max-w-3xl text-ink-600">
          {t(
            "Quand aucune paire parfaite n'existe, l'échange peut circuler entre trois ou quatre personnes : chacun apprend à quelqu'un, et apprend de quelqu'un d'autre.",
          )}
        </p>
        <ol className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step} className="surface flex gap-3 p-4 text-sm text-ink-700">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1f6feb] text-xs font-bold text-white shadow-glow">
                {index + 1}
              </span>
              {t(step)}
            </li>
          ))}
        </ol>
      </header>

      {actionError && (
        <p role="alert" className="rounded-2xl bg-red-950/50 px-5 py-3 text-sm text-red-300">
          {actionError}
        </p>
      )}

      {loading && <LoadingState rows={2} label={t('Recherche de vos cercles…')} />}
      {error && (
        <ErrorState
          onRetry={() => {
            suggestions.reload()
            mine.reload()
          }}
        />
      )}

      {nothing && (
        <EmptyState
          title={t("Aucun cercle pour l'instant")}
          description={t(
            'Les cercles se forment à partir de ce que vous savez et de ce que vous voulez apprendre. Déclarez vos compétences : chaque nouvel inscrit peut fermer un cercle.',
          )}
          action={
            <Link to="/competences">
              <Button>{t('Ajouter mes compétences')}</Button>
            </Link>
          }
        />
      )}

      {invitations.length > 0 && (
        <Section title={t('Ils vous invitent dans leur cercle')}>{invitations.map(card)}</Section>
      )}
      {others.length > 0 && <Section title={t('Mes cercles')}>{others.map(card)}</Section>}
      {possible.length > 0 && (
        <Section title={t('Cercles possibles pour vous')}>{possible.map(card)}</Section>
      )}
    </section>
  )
}
