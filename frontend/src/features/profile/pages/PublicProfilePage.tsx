import { Link, useParams } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import DemoBadge from '../../../components/DemoBadge'
import SkillBadge from '../../../components/SkillBadge'
import EndorsementList from '../../endorsements/components/EndorsementList'
import { Badge, Card, ErrorState, LoadingState } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import {
  AVAILABILITY_LABELS,
  countryFlag,
  DOMAIN_LABELS,
  PROJECT_STATUS_LABELS,
} from '../../../lib/labels'
import type { Availability, Domain } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import ReportButton from '../../reports/components/ReportButton'
import { getPublicProfile } from '../api/profile'

/** Profil public d'un développeur, le « Dev Passport » (DL-20). */
export default function PublicProfilePage() {
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const { isAuthenticated, user } = useAuth()
  const { data, loading, error, reload } = useQuery(() => getPublicProfile(userId), [userId])

  if (loading) return <LoadingState rows={4} label="Chargement du profil…" />
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <ErrorState
        message={notFound ? "Ce profil n'existe pas." : "Le profil n'a pas pu être chargé."}
        onRetry={notFound ? undefined : reload}
      />
    )
  }
  if (!data) return null

  const isMe = user?.id === data.id

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Avatar name={data.full_name || 'Développeur'} size={80} className="mb-4 shadow-glow" />
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            {data.full_name || 'Développeur'}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {data.country && (
              <span className="mr-1" aria-hidden="true">
                {countryFlag(data.country)}
              </span>
            )}
            {data.country || 'Pays non renseigné'}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DemoBadge isDemo={data.is_demo} />
            {data.availability.map((value) => (
              <Badge key={value} tone="accent">
                {AVAILABILITY_LABELS[value as Availability] ?? value}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {isMe ? (
            <Link to="/profil" className="text-sm font-medium text-accent-700 hover:underline">
              Modifier mon profil
            </Link>
          ) : (
            isAuthenticated && <ReportButton targetType="USER" targetId={data.id} />
          )}
        </div>
      </header>

      {data.bio && (
        <Card>
          <h2 className="mb-2 font-semibold text-ink-900">Présentation</h2>
          <p className="whitespace-pre-line text-sm text-ink-700">{data.bio}</p>
        </Card>
      )}

      {data.domains.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">Domaines</h2>
          <ul className="flex flex-wrap gap-2">
            {data.domains.map((value) => (
              <li key={value}>
                <Badge>{DOMAIN_LABELS[value as Domain] ?? value}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">Sait faire</h2>
          {data.skills.offered.length === 0 ? (
            <p className="text-sm text-ink-600">Aucune compétence déclarée.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.skills.offered.map((entry) => (
                <li key={entry.id}>
                  <SkillBadge
                    name={entry.skill.name}
                    kind="OFFERED"
                    level={entry.level}
                    proofsCount={entry.proofs_count}
                    endorsements={entry.endorsements?.length ?? 0}
                  />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">Veut apprendre</h2>
          {data.skills.wanted.length === 0 ? (
            <p className="text-sm text-ink-600">Aucun souhait déclaré.</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {data.skills.wanted.map((entry) => (
                <li key={entry.id}>
                  <SkillBadge name={entry.skill.name} kind="WANTED" />
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <EndorsementList skills={data.skills.offered} />

      {data.projects.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">Projets</h2>
          <ul className="flex flex-col gap-2">
            {data.projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 text-sm">
                <Link to={`/projets/${project.id}`} className="text-accent-700 hover:underline">
                  {project.title}
                </Link>
                <Badge>{PROJECT_STATUS_LABELS[project.status]}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}
