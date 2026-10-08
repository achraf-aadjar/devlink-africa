import Avatar from '../../../components/Avatar'
import { Link, useParams } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import SkillBadge from '../../../components/SkillBadge'
import { Badge, Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { ApiError } from '../../../lib/api'
import { useQuery } from '../../../lib/useQuery'
import ProjectCard from '../../projects/components/ProjectCard'
import { getCountry } from '../../search/api/search'

export default function CountryDetailPage() {
  const { code } = useParams<{ code: string }>()
  const { data, loading, error, reload } = useQuery(() => getCountry(code ?? ''), [code])

  if (loading) return <LoadingState rows={3} label="Chargement du pays…" />
  if (error) {
    const unknown = error instanceof ApiError && error.status === 400
    return (
      <ErrorState
        message={unknown ? "Ce code pays n'est pas reconnu." : "Le pays n'a pas pu être chargé."}
        onRetry={unknown ? undefined : reload}
      />
    )
  }
  if (!data) return null

  const empty = data.developers_count === 0 && data.projects_count === 0

  return (
    <section className="flex flex-col gap-6">
      <nav aria-label="Fil d'Ariane">
        <Link to="/pays" className="text-sm text-ink-600 hover:text-accent-700 hover:underline">
          ← Tous les pays
        </Link>
      </nav>

      <header className="flex items-center gap-4">
        <span className="text-5xl" aria-hidden="true">
          {data.flag}
        </span>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">{data.name}</h1>
          <p className="mt-1 text-sm text-ink-600">
            {data.developers_count} développeur{data.developers_count > 1 ? 's' : ''} ·{' '}
            {data.projects_count} projet{data.projects_count > 1 ? 's' : ''}
          </p>
        </div>
      </header>

      {empty ? (
        <EmptyState
          title={`Personne encore inscrit depuis ${data.name}`}
          description="Soyez le premier : créez votre profil et faites connaître la plateforme autour de vous."
        />
      ) : (
        <>
          {data.top_skills.length > 0 && (
            <Card>
              <h2 className="mb-3 font-semibold text-ink-900">Technologies les plus présentes</h2>
              <ul className="flex flex-wrap gap-2">
                {data.top_skills.map((skill) => (
                  <li key={skill.id}>
                    <Badge tone="accent">
                      {skill.name} <span className="font-normal opacity-80">· {skill.count}</span>
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {data.developers.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold text-ink-900">Développeurs</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.developers.map((person) => (
                  <Card as="li" key={person.id} interactive className="flex flex-col gap-2">
                    <Avatar name={person.full_name || 'Développeur'} size={52} className="mb-1" />
                    <h3 className="font-semibold text-ink-900">
                      <Link
                        to={`/developpeurs/${person.id}`}
                        className="hover:text-accent-700 hover:underline"
                      >
                        {person.full_name || 'Développeur'}
                      </Link>
                    </h3>
                    <DemoBadge isDemo={person.is_demo} />
                    {person.offered_skills.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {person.offered_skills.slice(0, 3).map((skill) => (
                          <li key={skill.id}>
                            <SkillBadge name={skill.name} kind="OFFERED" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </ul>
            </div>
          )}

          {data.projects.length > 0 && (
            <div className="flex flex-col gap-3">
              <h2 className="font-semibold text-ink-900">Projets</h2>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {data.projects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
