import { Link, useParams } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import DemoBadge from '../../../components/DemoBadge'
import SkillBadge from '../../../components/SkillBadge'
import EndorsementList from '../../endorsements/components/EndorsementList'
import { Badge, ButtonLink, ErrorState, LoadingState } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { localCountryName } from '../../../lib/countryName'
import {
  AVAILABILITY_LABELS,
  countryFlag,
  DOMAIN_LABELS,
  PROJECT_STATUS_LABELS,
  PROOF_KIND_LABELS,
} from '../../../lib/labels'
import type { Availability, Domain } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import ReportButton from '../../reports/components/ReportButton'
import { getPublicProfile } from '../api/profile'

/** Profil public d'un développeur, le « Dev Passport » (DL-20). */
export default function PublicProfilePage() {
  const { t, lang } = useI18n()
  const { id } = useParams<{ id: string }>()
  const userId = Number(id)
  const { isAuthenticated, user } = useAuth()
  const { data, loading, error, reload } = useQuery(() => getPublicProfile(userId), [userId])

  if (loading) return <LoadingState rows={4} label={t('Chargement du profil…')} />
  if (error) {
    const notFound = error instanceof ApiError && error.status === 404
    return (
      <ErrorState
        message={notFound ? t("Ce profil n'existe pas.") : t("Le profil n'a pas pu être chargé.")}
        onRetry={notFound ? undefined : reload}
      />
    )
  }
  if (!data) return null

  const isMe = user?.id === data.id
  const name = data.full_name || t('Développeur')

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-5">
          <Avatar name={name} size={80} className="shrink-0" />
          <div className="min-w-0">
            <h1 className="page-title">{name}</h1>
            <p className="mt-1 text-sm text-ink-600">
              {data.country && (
                <span className="mr-1" aria-hidden="true">
                  {countryFlag(data.country)}
                </span>
              )}
              {data.country
                ? localCountryName(data.country, data.country, lang)
                : t('Pays non renseigné')}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <DemoBadge isDemo={data.is_demo} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isMe ? (
            <ButtonLink to="/profil" variant="secondary">
              {t('Modifier mon profil')}
            </ButtonLink>
          ) : isAuthenticated ? (
            <ReportButton targetType="USER" targetId={data.id} />
          ) : (
            <ButtonLink to="/inscription">{t('Créer mon compte pour échanger')}</ButtonLink>
          )}
        </div>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* La fiche : présentation, puis ce que la personne donne et cherche. */}
        <article className="surface divide-y divide-ink-200">
          {data.bio && (
            <section aria-labelledby="presentation" className="p-5 sm:p-6">
              <h2 id="presentation" className="sheet-title">
                {t('Présentation')}
              </h2>
              <p className="mt-2 max-w-prose whitespace-pre-line text-ink-800">{data.bio}</p>
            </section>
          )}

          <section aria-labelledby="sait-faire" className="p-5 sm:p-6">
            <h2 id="sait-faire" className="sheet-title">
              {t('Sait faire')}
            </h2>
            {data.skills.offered.length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">{t('Aucune compétence déclarée.')}</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-3">
                {data.skills.offered.map((entry) => (
                  <li key={entry.id}>
                    <SkillBadge
                      name={entry.skill.name}
                      kind="OFFERED"
                      level={entry.level}
                      proofsCount={entry.proofs_count}
                      endorsements={entry.endorsements?.length ?? 0}
                    />
                    {entry.proofs && entry.proofs.length > 0 && (
                      <ul className="mt-1.5 flex flex-col gap-1 pl-3">
                        {entry.proofs.map((proof) => (
                          <li key={proof.id} className="text-sm">
                            {proof.url ? (
                              <a
                                href={proof.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-accent-700 hover:underline"
                              >
                                {proof.title}
                              </a>
                            ) : (
                              <span className="font-medium text-ink-800">{proof.title}</span>
                            )}
                            <span className="ml-2 text-ink-600">
                              {t(PROOF_KIND_LABELS[proof.kind])}
                            </span>
                            {proof.description && (
                              <p className="text-ink-600">{proof.description}</p>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="veut-apprendre" className="p-5 sm:p-6">
            <h2 id="veut-apprendre" className="sheet-title">
              {t('Veut apprendre')}
            </h2>
            {data.skills.wanted.length === 0 ? (
              <p className="mt-2 text-sm text-ink-600">{t('Aucun souhait déclaré.')}</p>
            ) : (
              <ul className="mt-3 flex flex-wrap gap-2">
                {data.skills.wanted.map((entry) => (
                  <li key={entry.id}>
                    <SkillBadge name={entry.skill.name} kind="WANTED" />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </article>

        <aside className="flex flex-col gap-6">
          {(data.availability.length > 0 || data.domains.length > 0) && (
            <section className="surface flex flex-col gap-4 p-5">
              {data.availability.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">{t('Disponible pour')}</h2>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {data.availability.map((value) => (
                      <li key={value}>
                        <Badge>{t(AVAILABILITY_LABELS[value as Availability] ?? value)}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {data.domains.length > 0 && (
                <div>
                  <h2 className="text-sm font-semibold text-ink-900">{t('Domaines')}</h2>
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {data.domains.map((value) => (
                      <li key={value}>
                        <Badge>{t(DOMAIN_LABELS[value as Domain] ?? value)}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          )}

          <EndorsementList skills={data.skills.offered} />

          {data.projects.length > 0 && (
            <section aria-labelledby="projets-profil" className="surface p-5">
              <h2 id="projets-profil" className="sheet-title">
                {t('Projets')}
              </h2>
              <ul className="mt-3 flex flex-col divide-y divide-ink-200">
                {data.projects.map((project) => (
                  <li
                    key={project.id}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <Link
                      to={`/projets/${project.id}`}
                      className="font-medium text-accent-700 hover:underline"
                    >
                      {project.title}
                    </Link>
                    <Badge>{t(PROJECT_STATUS_LABELS[project.status])}</Badge>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </section>
  )
}
