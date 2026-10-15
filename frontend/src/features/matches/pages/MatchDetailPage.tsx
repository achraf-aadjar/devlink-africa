import { useState } from 'react'
import Icon from '../../../components/icons/Icon'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import DemoBadge from '../../../components/DemoBadge'
import ScorePlate from '../../../components/ScorePlate'
import { Button, ButtonLink, ErrorState, LoadingState } from '../../../components/ui'
import { useAuth } from '../../auth/hooks/useAuth'
import { localCountryName } from '../../../lib/countryName'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { countryFlag } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { getMatch, sendFeedback } from '../api/matches'
import MatchSentence from '../../ai/components/MatchSentence'
import ExchangeRequestModal from '../components/ExchangeRequestModal'
import MatchExplanation from '../components/MatchExplanation'

export default function MatchDetailPage() {
  const { t, lang } = useI18n()
  const { user } = useAuth()
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
      setNotice(t('Merci, votre avis est enregistré.'))
      reload()
    } catch (cause) {
      if (cause instanceof ApiError && cause.code === 'duplicate_feedback') {
        setFeedbackError(t('Vous avez déjà donné votre avis sur ce match.'))
      } else {
        setFeedbackError(t("Votre avis n'a pas pu être enregistré. Réessayez."))
      }
    }
  }

  if (loading) {
    return <LoadingState rows={4} label={t('Chargement du match…')} />
  }

  if (error) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <div className="flex flex-col gap-4">
        <ErrorState
          message={
            notFound
              ? t("Ce match n'existe pas, ou il ne vous concerne pas.")
              : t("Le match n'a pas pu être chargé.")
          }
          onRetry={notFound ? undefined : reload}
        />
        <Link to="/matchs" className="text-sm font-medium text-accent-700 hover:underline">
          {t('Revenir à mes matchs')}
        </Link>
      </div>
    )
  }

  if (!data) return null

  const partnerName = data.user.full_name || t('Cette personne')
  const myName = user?.full_name || t('Vous')
  const proposed = notice !== null && notice === t('Votre demande a été envoyée.')

  const feedback = (
    <div>
      <h2 className="text-sm font-semibold text-ink-900">
        {t('Cette proposition vous paraît-elle utile ?')}
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        {t('Votre réponse nous aide à améliorer les propositions. Elle ne modifie pas ce score.')}
      </p>

      {data.my_feedback ? (
        <p className="mt-3 text-sm text-ink-700">
          {t('Vous avez répondu :')}{' '}
          <strong>{data.my_feedback.is_relevant ? t('utile') : t('pas utile')}</strong>.
        </p>
      ) : (
        <div className="mt-3 flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => handleFeedback(true)}>
            {t('Utile')}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleFeedback(false)}>
            {t('Pas utile')}
          </Button>
        </div>
      )}

      {feedbackError && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {feedbackError}
        </p>
      )}
    </div>
  )

  return (
    <section className="flex flex-col gap-6 pb-24 lg:pb-0">
      <nav aria-label={t("Fil d'Ariane")}>
        <Link to="/matchs" className="text-sm text-ink-600 hover:text-accent-700 hover:underline">
          ← {t('Mes matchs')}
        </Link>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar name={partnerName} size={72} className="shrink-0" />
          <div className="min-w-0">
            <h1 className="page-title">{partnerName}</h1>
            <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-600">
              <span>
                {data.user.country && (
                  <span className="mr-1" aria-hidden="true">
                    {countryFlag(data.user.country)}
                  </span>
                )}
                {data.user.country
                  ? localCountryName(data.user.country, data.user.country, lang)
                  : t('Pays non renseigné')}
              </span>
              <DemoBadge isDemo={data.user.is_demo} />
            </p>
          </div>
        </div>
        {/* Le score, à côté du nom : la première chose qu'on lit, sur mobile aussi. */}
        <div className="flex items-center gap-3">
          <p className="max-w-[8rem] text-right font-display text-lg font-bold uppercase leading-tight text-ink-900">
            {t('Score de compatibilité')}
          </p>
          <ScorePlate score={data.score} size="lg" showMax />
        </div>
      </header>

      {notice && (
        <p
          role="status"
          className="rounded-card bg-success/10 px-4 py-3 text-sm font-medium text-success ring-1 ring-inset ring-success/25"
        >
          {notice}
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="flex min-w-0 flex-col gap-6">
          <MatchSentence matchId={matchId} />
          <MatchExplanation
            explanation={data.explanation}
            partnerName={partnerName}
            myName={myName}
          />
        </div>

        {/* Colonne d'action : le score, l'échange, l'avis. Collée en haut au
            défilement sur grand écran. */}
        <aside className="surface flex flex-col gap-5 p-5 lg:sticky lg:top-20">
          {/* Une seule paire de boutons : en bas de l'écran sur mobile (sous le
              pouce), dans la colonne sur grand écran. */}
          <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 border-t border-ink-300 bg-ink-100 px-4 py-3 shadow-lift lg:static lg:flex-col lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <Button
              className="flex-1 lg:flex-none"
              onClick={() => setModalOpen(true)}
              disabled={proposed}
            >
              {t('Proposer un échange')}
            </Button>
            <ButtonLink
              to={`/developpeurs/${data.user.id}`}
              variant="secondary"
              className="order-first shrink-0 lg:order-none"
            >
              {t('Voir le profil')}
            </ButtonLink>
          </div>
          <p className="flex gap-2 text-sm text-ink-600">
            <Icon name="info" size={18} className="mt-px shrink-0 text-ink-500" />
            {t(
              "Son contact ne s'affiche qu'une fois votre échange accepté. Le vôtre non plus n'est montré qu'à ce moment-là.",
            )}
          </p>
          <div className="border-t border-ink-200 pt-5">{feedback}</div>
        </aside>
      </div>

      <ExchangeRequestModal
        matchId={matchId}
        partnerName={partnerName}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSent={() => setNotice(t('Votre demande a été envoyée.'))}
        give={data.explanation.you_can_teach_them.map((skill) => skill.name)}
        receive={data.explanation.they_can_teach_you.map((skill) => skill.name)}
      />
    </section>
  )
}
