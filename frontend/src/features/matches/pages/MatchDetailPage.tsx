import { useState } from 'react'
import Avatar from '../../../components/Avatar'
import { Link, useParams } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import { Button, Card, ErrorState, LoadingState } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { countryFlag } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { getMatch, sendFeedback } from '../api/matches'
import MatchSentence from '../../ai/components/MatchSentence'
import ExchangeRequestModal from '../components/ExchangeRequestModal'
import MatchExplanation from '../components/MatchExplanation'

export default function MatchDetailPage() {
  const { id } = useParams<{ id: string }>()
  const matchId = Number(id)
  const { data, loading, error, reload } = useQuery(() => getMatch(matchId), [matchId])

  const [modalOpen, setModalOpen] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)

  async function handleFeedback(isRelevant: boolean) {
    setFeedbackError(null)
    try {
      await sendFeedback(matchId, { is_relevant: isRelevant })
      setNotice('Merci, votre avis est enregistré.')
      reload()
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'duplicate_feedback') {
        setFeedbackError('Vous avez déjà donné votre avis sur ce match.')
      } else {
        setFeedbackError("Votre avis n'a pas pu être enregistré. Réessayez.")
      }
    }
  }

  if (loading) {
    return <LoadingState rows={4} label="Chargement du match…" />
  }

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <div className="flex flex-col gap-4">
        <ErrorState
          message={
            notFound
              ? "Ce match n'existe pas, ou il ne vous concerne pas."
              : "Le match n'a pas pu être chargé."
          }
          onRetry={notFound ? undefined : reload}
        />
        <Link to="/matchs" className="text-sm font-medium text-accent-700 hover:underline">
          Revenir à mes matchs
        </Link>
      </div>
    )
  }

  if (!data) return null

  const partnerName = data.user.full_name || 'Cette personne'

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label="Fil d'Ariane">
        <Link to="/matchs" className="text-sm text-ink-600 hover:text-accent-700 hover:underline">
          ← Mes matchs
        </Link>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Avatar name={partnerName} size={80} className="mb-4 shadow-glow" />
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">{partnerName}</h1>
          <p className="mt-1 text-sm text-ink-600">
            {data.user.country && (
              <span className="mr-1" aria-hidden="true">
                {countryFlag(data.user.country)}
              </span>
            )}
            {data.user.country || 'Pays non renseigné'}
          </p>
          <div className="mt-2 flex gap-2">
            <DemoBadge isDemo={data.user.is_demo} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link to={`/developpeurs/${data.user.id}`}>
            <Button variant="secondary">Voir le profil</Button>
          </Link>
          <Button onClick={() => setModalOpen(true)}>Proposer un échange</Button>
        </div>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-lg bg-emerald-950/50 px-4 py-3 text-sm text-emerald-300"
        >
          {notice}
        </p>
      )}

      <MatchSentence matchId={matchId} />

      <MatchExplanation
        explanation={data.explanation}
        score={data.score}
        partnerName={partnerName}
      />

      <Card>
        <h2 className="font-semibold text-ink-900">Cette proposition vous paraît-elle utile ?</h2>
        <p className="mt-1 text-sm text-ink-600">
          Votre réponse nous aide à améliorer les propositions. Elle ne modifie pas ce score.
        </p>

        {data.my_feedback ? (
          <p className="mt-3 text-sm text-ink-700">
            Vous avez répondu :{' '}
            <strong>{data.my_feedback.is_relevant ? 'utile' : 'pas utile'}</strong>.
          </p>
        ) : (
          <div className="mt-3 flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => handleFeedback(true)}>
              Utile
            </Button>
            <Button size="sm" variant="ghost" onClick={() => handleFeedback(false)}>
              Pas utile
            </Button>
          </div>
        )}

        {feedbackError && (
          <p role="alert" className="mt-2 text-sm text-red-400">
            {feedbackError}
          </p>
        )}
      </Card>

      <ExchangeRequestModal
        matchId={matchId}
        partnerName={partnerName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSent={() => setNotice('Votre demande a été envoyée.')}
      />
    </section>
  )
}
