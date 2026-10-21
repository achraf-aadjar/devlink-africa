import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/icons/Icon'
import DemoBadge from '../../../components/DemoBadge'
import SkillBadge from '../../../components/SkillBadge'
import {
  Button,
  ButtonLink,
  Card,
  Combobox,
  EmptyState,
  ErrorState,
  Field,
  LoadingState,
  Select,
} from '../../../components/ui'
import type { I18n } from '../../../i18n/context'
import { useI18n } from '../../../i18n/useI18n'
import { localCountryName } from '../../../lib/countryName'
import { AVAILABILITY_LABELS, countryFlag, DOMAIN_LABELS, LEVEL_LABELS } from '../../../lib/labels'
import { useQuery } from '../../../lib/useQuery'
import { listCatalog } from '../../skills/api/skills'
import ProjectCard from '../../projects/components/ProjectCard'
import NaturalSearchBar from '../../ai/components/NaturalSearchBar'
import { listCountries, searchProjects, searchUsers } from '../api/search'

type Tab = 'users' | 'projects'

const toOptions = (labels: Record<string, string>, t: I18n['t']) =>
  Object.entries(labels).map(([value, label]) => ({ value, label: t(label) }))

export default function SearchPage() {
  const { t, tn, lang } = useI18n()
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

  const skillOptions = [
    { value: '', label: t('Toutes') },
    ...(catalog.data?.results ?? []).map((skill) => ({ value: skill.name, label: skill.name })),
  ]
  const active = tab === 'users' ? users : projects
  const secondaryCount = [filters.level, filters.availability, filters.domain].filter(
    Boolean,
  ).length

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="page-title">{t('Recherche')}</h1>
        <p className="mt-2 text-sm text-ink-600">
          {t('Trouvez un développeur par compétence et par pays, ou un projet à rejoindre.')}
        </p>
      </header>

      <div
        role="tablist"
        aria-label={t('Type de recherche')}
        className="flex gap-1 border-b border-ink-300"
      >
        {(['users', 'projects'] as Tab[]).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => update({ onglet: value === 'users' ? '' : value })}
            className={`-mb-px min-h-11 border-b-[3px] px-4 font-display text-lg font-bold uppercase tracking-[0.02em] transition-colors ${
              tab === value
                ? 'border-brand text-ink-900'
                : 'border-transparent text-ink-600 hover:text-ink-900'
            }`}
          >
            {value === 'users' ? t('Développeurs') : t('Projets')}
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

      <Card className="!p-4 sm:!p-5">
        <form
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-[1.3fr_1fr_1fr_1fr_auto] xl:items-end"
          onSubmit={(event) => {
            event.preventDefault()
            update({ q: draft })
          }}
        >
          <Field
            label={t('Rechercher')}
            value={draft}
            placeholder={tab === 'users' ? t('Nom ou présentation') : t('Titre ou description')}
            onChange={(event) => setDraft(event.target.value)}
          />
          <Select
            label={t('Pays')}
            value={filters.country}
            placeholder={t('Tous les pays')}
            options={(countries.data?.results ?? []).map((country) => ({
              value: country.code,
              label: `${country.flag} ${localCountryName(country.code, country.name, lang)}`,
            }))}
            onChange={(event) => update({ country: event.target.value })}
          />
          <Combobox
            label={tab === 'users' ? t('Sait faire') : t('Compétence recherchée')}
            value={filters.skill}
            options={skillOptions}
            onChange={(value) => update({ skill: value })}
          />

          {tab === 'users' && (
            <Combobox
              label={t('Veut apprendre')}
              value={filters.skill_wanted}
              options={skillOptions}
              onChange={(value) => update({ skill_wanted: value })}
            />
          )}

          <div className="flex items-end gap-2">
            <Button type="submit">{t('Rechercher')}</Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setDraft('')
                setParams(new URLSearchParams(tab === 'projects' ? { onglet: 'projects' } : {}))
              }}
            >
              {t('Réinitialiser')}
            </Button>
          </div>

          {tab === 'users' && (
            <details
              className="group col-span-full border-t border-ink-200 pt-3"
              open={secondaryCount > 0}
            >
              <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-accent-700 [&::-webkit-details-marker]:hidden">
                <Icon
                  name="chevronDown"
                  size={18}
                  className="transition-transform group-open:rotate-180"
                />
                {secondaryCount > 0
                  ? tn(
                      secondaryCount,
                      'Plus de filtres ({n} actif)',
                      'Plus de filtres ({n} actifs)',
                    )
                  : t('Plus de filtres')}
              </summary>
              <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Select
                  label={t('Niveau')}
                  value={filters.level}
                  placeholder={t('Tous')}
                  options={toOptions(LEVEL_LABELS, t)}
                  onChange={(event) => update({ level: event.target.value })}
                />
                <Select
                  label={t('Disponibilité')}
                  value={filters.availability}
                  placeholder={t('Toutes')}
                  options={toOptions(AVAILABILITY_LABELS, t)}
                  onChange={(event) => update({ availability: event.target.value })}
                />
                <Select
                  label={t('Domaine')}
                  value={filters.domain}
                  placeholder={t('Tous')}
                  options={toOptions(DOMAIN_LABELS, t)}
                  onChange={(event) => update({ domain: event.target.value })}
                />
              </div>
            </details>
          )}
        </form>
      </Card>

      {active.loading && <LoadingState rows={3} label={t('Recherche en cours…')} />}
      {active.error && <ErrorState onRetry={active.reload} />}

      {tab === 'users' && users.data && (
        <>
          {users.data.results.length === 0 ? (
            <EmptyState
              title={t('Aucun développeur ne correspond')}
              description={t('Essayez avec moins de filtres, ou explorez les profils par pays.')}
              action={
                <ButtonLink to="/pays" size="sm">
                  {t('Explorer par pays')}
                </ButtonLink>
              }
            />
          ) : (
            <>
              <p className="text-sm text-ink-600">
                {tn(users.data.count, '{n} développeur trouvé.', '{n} développeurs trouvés.')}
              </p>
              <ul className="surface divide-y divide-ink-200 overflow-hidden">
                {users.data.results.map((person) => (
                  <li
                    key={person.id}
                    className="grid gap-x-6 gap-y-3 px-4 py-4 transition-colors hover:bg-ink-50 sm:px-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1fr)] lg:items-start"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar name={person.full_name || t('Développeur')} size={44} />
                      <div className="min-w-0">
                        <h2 className="font-semibold text-ink-900">
                          <Link
                            to={`/developpeurs/${person.id}`}
                            className="hover:text-accent-700 hover:underline"
                          >
                            {person.full_name || t('Développeur')}
                          </Link>
                        </h2>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-sm text-ink-600">
                          <span>
                            {person.country && (
                              <span className="mr-1" aria-hidden="true">
                                {countryFlag(person.country)}
                              </span>
                            )}
                            {person.country
                              ? localCountryName(person.country, person.country, lang)
                              : t('Pays non renseigné')}
                          </span>
                          <DemoBadge isDemo={person.is_demo} compact />
                        </p>
                        {person.bio && (
                          <p className="mt-1 line-clamp-2 text-sm text-ink-700">{person.bio}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 pl-14 lg:pl-0">
                      <span className="text-xs font-medium text-ink-600">{t('Sait faire')}</span>
                      {person.offered_skills.length > 0 ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {person.offered_skills.slice(0, 4).map((skill) => (
                            <li key={skill.id}>
                              <SkillBadge name={skill.name} kind="OFFERED" />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-ink-500">—</span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5 pl-14 lg:pl-0">
                      <span className="text-xs font-medium text-ink-600">
                        {t('Veut apprendre')}
                      </span>
                      {person.wanted_skills.length > 0 ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {person.wanted_skills.slice(0, 4).map((skill) => (
                            <li key={skill.id}>
                              <SkillBadge name={skill.name} kind="WANTED" />
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-sm text-ink-500">—</span>
                      )}
                    </div>
                  </li>
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
              title={t('Aucun projet ne correspond')}
              description={t("Élargissez vos critères pour découvrir d'autres projets.")}
            />
          ) : (
            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
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
