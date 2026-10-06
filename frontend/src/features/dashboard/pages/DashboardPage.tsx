import { Link } from 'react-router-dom'
import { Badge, Button, Card, ErrorState, LoadingState } from '../../../components/ui'
import { EXCHANGE_TYPE_LABELS } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import { getDashboard } from '../api/dashboard'

export default function DashboardPage() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useQuery(() => getDashboard(), [])

  if (loading) return <LoadingState rows={4} label="Chargement de votre tableau de bord…" />
  if (error) return <ErrorState onRetry={reload} />
  if (!data) return null

  const incomplete = data.profile_completeness < 100

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">
          Bonjour{user?.full_name ? ` ${user.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="mt-1 text-sm text-ink-600">Voici où vous en êtes aujourd'hui.</p>
      </header>

      {incomplete && (
        <Card className="flex flex-wrap items-center justify-between gap-4 bg-accent-50">
          <div>
            <p className="font-medium text-accent-900">
              Votre profil est complété à {data.profile_completeness} %
            </p>
            <p className="mt-0.5 text-sm text-accent-800">
              Un profil complet reçoit des propositions plus justes.
            </p>
          </div>
          <Link to="/profil">
            <Button size="sm">Compléter mon profil</Button>
          </Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="text-center">
          <p className="text-3xl font-bold tabular-nums text-accent-700">{data.counters.matches}</p>
          <p className="mt-1 text-sm text-ink-600">match{data.counters.matches > 1 ? 's' : ''}</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold tabular-nums text-accent-700">
            {data.counters.offered_skills}
          </p>
          <p className="mt-1 text-sm text-ink-600">compétence(s) proposée(s)</p>
        </Card>
        <Card className="text-center">
          <p className="text-3xl font-bold tabular-nums text-accent-700">
            {data.counters.wanted_skills}
          </p>
          <p className="mt-1 text-sm text-ink-600">à apprendre</p>
        </Card>
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-semibold text-ink-900">Développeurs recommandés</h2>
          <Link to="/matchs" className="text-sm font-medium text-accent-700 hover:underline">
            Tout voir
          </Link>
        </div>

        {data.recommended_matches.length === 0 ? (
          <div className="flex flex-col items-start gap-3">
            <p className="text-sm text-ink-600">
              Aucun match pour l'instant. Déclarez vos compétences pour en recevoir.
            </p>
            <Link to="/competences">
              <Button size="sm">Ajouter mes compétences</Button>
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {data.recommended_matches.map((match) => (
              <li key={match.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <Link
                    to={`/matchs/${match.id}`}
                    className="font-medium text-ink-900 hover:text-accent-700 hover:underline"
                  >
                    {match.user.full_name || 'Développeur'}
                  </Link>
                  {match.reasons[0] && (
                    <p className="truncate text-sm text-ink-600">{match.reasons[0]}</p>
                  )}
                </div>
                <span className="shrink-0 font-bold tabular-nums text-accent-700">
                  {Math.round(match.score)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink-900">Échanges en attente</h2>
            <Link to="/echanges" className="text-sm font-medium text-accent-700 hover:underline">
              Tout voir
            </Link>
          </div>
          <p className="mb-3 text-sm text-ink-600">
            {data.pending_exchanges.received} reçue(s) · {data.pending_exchanges.sent} envoyée(s)
          </p>
          {data.pending_exchanges.items.length === 0 ? (
            <p className="text-sm text-ink-500">Rien en attente.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.pending_exchanges.items.map((exchange) => (
                <li key={exchange.id} className="flex items-center justify-between gap-2">
                  <span className="truncate text-ink-700">
                    {EXCHANGE_TYPE_LABELS[exchange.type]} avec {exchange.requester.full_name}
                  </span>
                  <Badge tone="warning">En attente</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-semibold text-ink-900">Demandes sur mes projets</h2>
            <Link to="/projets" className="text-sm font-medium text-accent-700 hover:underline">
              Mes projets
            </Link>
          </div>
          {data.pending_join_requests.count === 0 ? (
            <p className="text-sm text-ink-500">Aucune demande en attente.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {data.pending_join_requests.items.map((request) => (
                <li key={request.id}>
                  <Link
                    to={`/projets/${request.project}`}
                    className="text-ink-700 hover:text-accent-700 hover:underline"
                  >
                    {request.applicant.full_name} souhaite rejoindre un de vos projets
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {data.my_projects.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">Mes projets</h2>
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
                    {project.join_requests_count} demande
                    {project.join_requests_count > 1 ? 's' : ''}
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
