import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import ScoreRing from '../../../components/ScoreRing'
import { Badge, Button, Card, ErrorState, LoadingState } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { EXCHANGE_TYPE_LABELS } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import { getDashboard } from '../api/dashboard'
import OnboardingChecklist from '../components/OnboardingChecklist'

export default function DashboardPage() {
  const { t, tn } = useI18n()
  const { user } = useAuth()
  const { data, loading, error, reload } = useQuery(() => getDashboard(), [])

  if (loading) {
    return <LoadingState rows={4} label={t('Chargement de votre tableau de bord…')} />
  }
  if (error) return <ErrorState onRetry={reload} />
  if (!data) return null

  const firstName = user?.full_name ? user.full_name.split(' ')[0] : ''

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
          {firstName ? t('Bonjour {name}', { name: firstName }) : t('Bonjour')}
        </h1>
        <p className="mt-1 text-sm text-ink-600">{t("Voici où vous en êtes aujourd'hui.")}</p>
      </header>

      <OnboardingChecklist data={data} />

      {/* Compteurs posés à plat, séparés par de fins traits : pas de boîtes. */}
      <dl className="grid grid-cols-3 divide-x divide-white/[0.08] py-2">
        {[
          { value: data.counters.matches, label: tn(data.counters.matches, 'match', 'matchs') },
          { value: data.counters.offered_skills, label: t('compétence(s) proposée(s)') },
          { value: data.counters.wanted_skills, label: t('à apprendre') },
        ].map((counter) => (
          <div key={counter.label} className="flex flex-col items-center gap-1 px-2 text-center">
            <dt className="order-2 text-sm text-ink-600">{counter.label}</dt>
            <dd className="text-gradient text-4xl font-bold tabular-nums sm:text-5xl">
              {counter.value}
            </dd>
          </div>
        ))}
      </dl>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink-900">{t('Développeurs recommandés')}</h2>
          <Link to="/matchs" className="text-sm font-medium text-accent-700 hover:underline">
            {t('Tout voir')}
          </Link>
        </div>

        {data.recommended_matches.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink-600">
              {t("Aucun match pour l'instant. Déclarez vos compétences pour en recevoir.")}
            </p>
            <Link to="/competences">
              <Button size="sm">{t('Ajouter mes compétences')}</Button>
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-1">
            {data.recommended_matches.map((match) => (
              <li
                key={match.id}
                className="-mx-3 flex items-center gap-4 rounded-2xl px-3 py-2.5 transition hover:bg-white/[0.04]"
              >
                <Avatar name={match.user.full_name || t('Développeur')} size={44} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/matchs/${match.id}`}
                    className="font-medium text-ink-900 hover:text-accent-700 hover:underline"
                  >
                    {match.user.full_name || t('Développeur')}
                  </Link>
                  {match.reasons[0] && (
                    <p className="truncate text-sm text-ink-600">{match.reasons[0]}</p>
                  )}
                </div>
                <ScoreRing score={match.score} size={44} stroke={4} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink-900">{t('Échanges en attente')}</h2>
            <Link to="/echanges" className="text-sm font-medium text-accent-700 hover:underline">
              {t('Tout voir')}
            </Link>
          </div>
          <p className="mb-3 text-sm text-ink-600">
            {t('{received} reçue(s) · {sent} envoyée(s)', {
              received: data.pending_exchanges.received,
              sent: data.pending_exchanges.sent,
            })}
          </p>
          {data.pending_exchanges.items.length === 0 ? (
            <p className="text-sm text-ink-500">{t('Rien en attente.')}</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.pending_exchanges.items.map((exchange) => (
                <li key={exchange.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-ink-700">
                    {t('{type} avec {name}', {
                      type: t(EXCHANGE_TYPE_LABELS[exchange.type]),
                      name: exchange.requester.full_name,
                    })}
                  </span>
                  <Badge tone="warning">{t('En attente')}</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink-900">{t('Demandes sur mes projets')}</h2>
            <Link to="/projets" className="text-sm font-medium text-accent-700 hover:underline">
              {t('Mes projets')}
            </Link>
          </div>
          {data.pending_join_requests.count === 0 ? (
            <p className="text-sm text-ink-500">{t('Aucune demande en attente.')}</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.pending_join_requests.items.map((request) => (
                <li key={request.id}>
                  <Link
                    to={`/projets/${request.project}`}
                    className="text-ink-700 hover:text-accent-700 hover:underline"
                  >
                    {t('{name} souhaite rejoindre un de vos projets', {
                      name: request.applicant.full_name,
                    })}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {data.my_projects.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">{t('Mes projets')}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {data.my_projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3">
                <Link
                  to={`/projets/${project.id}`}
                  className="text-ink-900 hover:text-accent-700 hover:underline"
                >
                  {project.title}
                </Link>
                {project.join_requests_count > 0 && (
                  <Badge tone="warning">
                    {tn(project.join_requests_count, '{n} demande', '{n} demandes')}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}
