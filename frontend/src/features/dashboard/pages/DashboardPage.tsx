import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import ScorePlate from '../../../components/ScorePlate'
import { Badge, ButtonLink, ErrorState, LoadingState } from '../../../components/ui'
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

  const counters = [
    {
      value: data.counters.matches,
      label: tn(data.counters.matches, 'match', 'matchs'),
      tone: 'text-ink-900',
    },
    {
      value: data.counters.offered_skills,
      label: t('à enseigner'),
      tone: 'text-accent-700',
    },
    {
      value: data.counters.wanted_skills,
      label: t('à apprendre'),
      tone: 'text-demand',
    },
  ]

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <h1 className="page-title">
          {firstName ? t('Bonjour {name}', { name: firstName }) : t('Bonjour')}
        </h1>
        {/* La ligne de stats d'une feuille de match : des chiffres, pas des tuiles. */}
        <dl className="flex divide-x divide-ink-300">
          {counters.map((counter) => (
            <div
              key={counter.label}
              className="flex items-baseline gap-2 px-4 first:pl-0 last:pr-0"
            >
              <dt className="order-2 text-sm text-ink-600">{counter.label}</dt>
              <dd
                className={`font-display text-[2rem] font-bold leading-none tabular-nums ${counter.tone}`}
              >
                {counter.value}
              </dd>
            </div>
          ))}
        </dl>
      </header>

      <OnboardingChecklist data={data} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section aria-labelledby="recommandes" className="surface overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-ink-300 px-5 py-3.5">
            <h2 id="recommandes" className="sheet-title">
              {t('Développeurs recommandés')}
            </h2>
            <Link to="/matchs" className="text-sm font-semibold text-accent-700 hover:underline">
              {t('Tout voir')}
            </Link>
          </div>

          {data.recommended_matches.length === 0 ? (
            <div className="flex flex-col items-start gap-3 p-5">
              <p className="text-sm text-ink-600">
                {t("Aucun match pour l'instant. Déclarez vos compétences pour en recevoir.")}
              </p>
              <ButtonLink to="/competences" size="sm">
                {t('Ajouter mes compétences')}
              </ButtonLink>
            </div>
          ) : (
            <ul className="divide-y divide-ink-200">
              {data.recommended_matches.map((match) => (
                <li
                  key={match.id}
                  className="flex items-center gap-4 px-5 py-3 transition-colors hover:bg-ink-50"
                >
                  <ScorePlate score={match.score} size="sm" quiet={match.score < 50} />
                  <Avatar name={match.user.full_name || t('Développeur')} size={40} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/matchs/${match.id}`}
                      className="font-semibold text-ink-900 hover:text-accent-700 hover:underline"
                    >
                      {match.user.full_name || t('Développeur')}
                    </Link>
                    {match.reasons[0] && (
                      <p className="truncate text-sm text-ink-600">{match.reasons[0]}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="echanges-attente" className="surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="echanges-attente" className="sheet-title">
                {t('Échanges en attente')}
              </h2>
              <Link
                to="/echanges"
                className="text-sm font-semibold text-accent-700 hover:underline"
              >
                {t('Tout voir')}
              </Link>
            </div>
            <p className="mt-1 text-sm text-ink-600">
              {tn(data.pending_exchanges.received, '{n} reçue', '{n} reçues')} ·{' '}
              {tn(data.pending_exchanges.sent, '{n} envoyée', '{n} envoyées')}
            </p>
            {data.pending_exchanges.items.length === 0 ? (
              <p className="mt-3 text-sm text-ink-600">{t('Rien en attente.')}</p>
            ) : (
              <ul className="mt-3 flex flex-col divide-y divide-ink-200 text-sm">
                {data.pending_exchanges.items.map((exchange) => (
                  <li key={exchange.id} className="flex items-center justify-between gap-2 py-2">
                    <span className="truncate text-ink-800">
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
          </section>

          <section aria-labelledby="demandes-projets" className="surface p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 id="demandes-projets" className="sheet-title">
                {t('Demandes sur mes projets')}
              </h2>
              <Link to="/projets" className="text-sm font-semibold text-accent-700 hover:underline">
                {t('Mes projets')}
              </Link>
            </div>
            {data.pending_join_requests.count === 0 ? (
              <p className="mt-3 text-sm text-ink-600">{t('Aucune demande en attente.')}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2 text-sm">
                {data.pending_join_requests.items.map((request) => (
                  <li key={request.id}>
                    <Link
                      to={`/projets/${request.project}`}
                      className="text-ink-800 hover:text-accent-700 hover:underline"
                    >
                      {t('{name} souhaite rejoindre un de vos projets', {
                        name: request.applicant.full_name,
                      })}
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {data.my_projects.length > 0 && (
              <div className="mt-4 border-t border-ink-200 pt-4">
                <h3 className="text-sm font-semibold text-ink-900">{t('Mes projets')}</h3>
                <ul className="mt-2 flex flex-col gap-2 text-sm">
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
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}
