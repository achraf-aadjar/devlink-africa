import { useState } from 'react'
import Avatar from '../../../components/Avatar'
import { Link, useSearchParams } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import SkillBadge from '../../../components/SkillBadge'
import {
  Button,
  Card,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Select,
} from '../../../components/ui'
import { AVAILABILITY_LABELS, countryFlag, DOMAIN_LABELS, LEVEL_LABELS } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { listCatalog } from '../../skills/api/skills'
import ProjectCard from '../../projects/components/ProjectCard'
import NaturalSearchBar from '../../ai/components/NaturalSearchBar'
import { listCountries, searchProjects, searchUsers } from '../api/search'

type Tab = 'users' | 'projects'

const toOptions = (labels: Record<string, string>) =>
  Object.entries(labels).map(([value, label]) => ({ value, label }))

export default function SearchPage() {
  // Les filtres vivent dans l'URL : la recherche est partageable (DL-27).
  const [params, setParams] = useSearchParams()
  const tab = (params.get('onglet') as Tab) ?? 'users'
  const [draft, setDraft] = useState(params.get('q') ?? '')

  const filters = {
    q: params.get('q') ?? '',
    country: params.get('country') ?? '',
    skill: params.get('skill') ?? '',
    skill_wanted: params.get('skill_wanted') ?? '',
    level: params.get('level') ?? '',
    availability: params.get('availability') ?? '',
    domain: params.get('domain') ?? '',
  }

  const catalog = useQuery(() => listCatalog(), [])
  // Seuls les pays réellement représentés : filtrer sur un pays vide n'a pas de sens.
  const countries = useQuery(() => listCountries(), [])
  const users = useQuery(
    () => (tab === 'users' ? searchUsers(filters) : Promise.resolve(null)),
    [tab, ...Object.values(filters)],
  )
  const projects = useQuery(
    () =>
      tab === 'projects'
        ? searchProjects({ q: filters.q, country: filters.country, skill: filters.skill })
        : Promise.resolve(null),
    [tab, filters.q, filters.country, filters.skill],
  )

  function update(next: Record<string, string>) {
    const merged = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value)
      else merged.delete(key)
    })
    setParams(merged)
  }

  const skillOptions = (catalog.data?.results ?? []).map((skill) => ({
    value: skill.name,
    label: skill.name,
  }))
  const active = tab === 'users' ? users : projects

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">Recherche</h1>
        <p className="mt-1 text-sm text-ink-600">
          Trouvez un développeur par compétence et par pays, ou un projet à rejoindre.
        </p>
      </header>

      <div role="tablist" aria-label="Type de recherche" className="flex gap-2">
        {(['users', 'projects'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => update({ onglet: value === 'users' ? '' : value })}
            className={`rounded-lg px-4 py-2 text-sm font-medium ${
              tab === value
                ? 'bg-accent-400 text-white'
                : 'bg-ink-100 text-ink-700 hover:bg-ink-200'
            }`}
          >
            {value === 'users' ? 'Développeurs' : 'Projets'}
          </button>
        ))}
      </div>

      {tab === 'users' && (
        <NaturalSearchBar
          onCriteria={(criteria) => {
            // Les critères devinés remplissent les filtres habituels : ils
            // restent visibles et modifiables.
            setDraft(criteria.q ?? '')
            update({
              q: criteria.q ?? '',
              country: criteria.country ?? '',
              skill: criteria.skill ?? '',
              skill_wanted: criteria.skill_wanted ?? '',
              level: criteria.level ?? '',
              availability: criteria.availability ?? '',
              domain: criteria.domain ?? '',
            })
          }}
        />
      )}

      <Card>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault()
            update({ q: draft })
          }}
        >
          <Field
            label="Rechercher"
            value={draft}
            placeholder={tab === 'users' ? 'Nom ou présentation' : 'Titre ou description'}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Select
            label="Pays"
            value={filters.country}
            placeholder="Tous les pays"
            options={(countries.data?.results ?? []).map((country) => ({
              value: country.code,
              label: `${country.flag} ${country.name}`,
            }))}
            onChange={(event) => update({ country: event.target.value })}
          />
          <Select
            label={tab === 'users' ? 'Sait faire' : 'Compétence recherchée'}
            value={filters.skill}
            placeholder="Toutes"
            options={skillOptions}
            onChange={(event) => update({ skill: event.target.value })}
          />

          {tab === 'users' && (
            <>
              <Select
                label="Veut apprendre"
                value={filters.skill_wanted}
                placeholder="Toutes"
                options={skillOptions}
                onChange={(event) => update({ skill_wanted: event.target.value })}
              />
              <Select
                label="Niveau"
                value={filters.level}
                placeholder="Tous"
                options={toOptions(LEVEL_LABELS)}
                onChange={(event) => update({ level: event.target.value })}
              />
              <Select
                label="Disponibilité"
                value={filters.availability}
                placeholder="Toutes"
                options={toOptions(AVAILABILITY_LABELS)}
                onChange={(event) => update({ availability: event.target.value })}
              />
              <Select
                label="Domaine"
                value={filters.domain}
                placeholder="Tous"
                options={toOptions(DOMAIN_LABELS)}
                onChange={(event) => update({ domain: event.target.value })}
              />
            </>
          )}

          <div className="flex items-end gap-2">
            <Button type="submit" size="sm">
              Rechercher
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft('')
                setParams(new URLSearchParams(tab === 'projects' ? { onglet: 'projects' } : {}))
              }}
            >
              Réinitialiser
            </Button>
          </div>
        </form>
      </Card>

      {active.loading && <LoadingState rows={3} label="Recherche en cours…" />}
      {active.error && <ErrorState onRetry={active.reload} />}

      {tab === 'users' && users.data && (
        <>
          {users.data.results.length === 0 ? (
            <EmptyState
              title="Aucun développeur ne correspond"
              description="Essayez avec moins de filtres, ou explorez les profils par pays."
              action={
                <Link to="/pays">
                  <Button size="sm">Explorer par pays</Button>
                </Link>
              }
            />
          ) : (
            <>
              <p className="text-sm text-ink-600">
                {users.data.count} développeur{users.data.count > 1 ? 's' : ''} trouvé
                {users.data.count > 1 ? 's' : ''}.
              </p>
              <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {users.data.results.map((person) => (
                  <Card as="li" key={person.id} interactive className="flex flex-col gap-3">
                    <Avatar name={person.full_name || 'Développeur'} size={52} />
                    <div>
                      <h2 className="font-semibold text-ink-900">
                        <Link
                          to={`/developpeurs/${person.id}`}
                          className="hover:text-accent-700 hover:underline"
                        >
                          {person.full_name || 'Développeur'}
                        </Link>
                      </h2>
                      <p className="mt-0.5 text-sm text-ink-600">
                        {person.country && (
                          <span className="mr-1" aria-hidden="true">
                            {countryFlag(person.country)}
                          </span>
                        )}
                        {person.country || 'Pays non renseigné'}
                      </p>
                    </div>
                    <DemoBadge isDemo={person.is_demo} />
                    {person.bio && (
                      <p className="line-clamp-2 text-sm text-ink-600">{person.bio}</p>
                    )}
                    {person.offered_skills.length > 0 && (
                      <ul className="flex flex-wrap gap-1.5">
                        {person.offered_skills.slice(0, 4).map((skill) => (
                          <li key={skill.id}>
                            <SkillBadge name={skill.name} kind="OFFERED" />
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card>
                ))}
              </ul>
            </>
          )}
        </>
      )}

      {tab === 'projects' && projects.data && (
        <>
          {projects.data.results.length === 0 ? (
            <EmptyState
              title="Aucun projet ne correspond"
              description="Élargissez vos critères pour découvrir d'autres projets."
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.data.results.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
