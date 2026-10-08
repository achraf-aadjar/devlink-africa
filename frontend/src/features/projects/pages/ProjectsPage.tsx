import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Select,
} from '../../../components/ui'
import { useAuth } from '../../auth/hooks/useAuth'
import { PROJECT_STATUS_LABELS } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { listCatalog } from '../../skills/api/skills'
import { listProjects } from '../api/projects'
import ProjectCard from '../components/ProjectCard'

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS).map(([value, label]) => ({
  value,
  label,
}))

export default function ProjectsPage() {
  const { isAuthenticated } = useAuth()
  // Les filtres vivent dans l'URL : un lien de recherche est partageable (DL-27).
  const [params, setParams] = useSearchParams()
  const [draft, setDraft] = useState(params.get('q') ?? '')

  const filters = {
    q: params.get('q') ?? '',
    skill: params.get('skill') ?? '',
    status: params.get('status') ?? '',
  }

  const catalog = useQuery(() => listCatalog(), [])
  const { data, loading, error, reload } = useQuery(
    () => listProjects(filters),
    [filters.q, filters.skill, filters.status],
  )

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value)
      else merged.delete(key)
    })
    setParams(merged)
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">Project Hub</h1>
          <p className="mt-1 text-sm text-ink-600">
            Des projets africains qui cherchent des contributeurs.
          </p>
        </div>
        {isAuthenticated && (
          <Link to="/projets/nouveau">
            <Button>Proposer un projet</Button>
          </Link>
        )}
      </header>

      <Card>
        <form
          className="grid gap-4 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault()
            update({ q: draft })
          }}
        >
          <Field
            label="Rechercher"
            value={draft}
            placeholder="Titre ou description"
            onChange={(event) => setDraft(event.target.value)}
          />
          <Select
            label="Compétence recherchée"
            value={filters.skill}
            placeholder="Toutes"
            options={(catalog.data?.results ?? []).map((skill) => ({
              value: skill.name,
              label: skill.name,
            }))}
            onChange={(event) => update({ skill: event.target.value })}
          />
          <Select
            label="Statut"
            value={filters.status}
            placeholder="Tous"
            options={STATUS_OPTIONS}
            onChange={(event) => update({ status: event.target.value })}
          />
        </form>
      </Card>

      {loading && <LoadingState rows={3} label="Chargement des projets…" />}
      {error && <ErrorState onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState
          title="Aucun projet ne correspond"
          description="Élargissez vos critères, ou proposez votre propre projet à la communauté."
          action={
            isAuthenticated ? (
              <Link to="/projets/nouveau">
                <Button size="sm">Proposer un projet</Button>
              </Link>
            ) : undefined
          }
        />
      )}

      {data && data.results.length > 0 && (
        <>
          <p className="text-sm text-ink-600">
            {data.count} projet{data.count > 1 ? 's' : ''} trouvé{data.count > 1 ? 's' : ''}.
          </p>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.results.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
