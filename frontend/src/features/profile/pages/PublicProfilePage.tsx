import { Link, useParams } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import DemoBadge from '../../../components/DemoBadge'
import SkillBadge from '../../../components/SkillBadge'
import EndorsementList from '../../endorsements/components/EndorsementList'
import { Badge, Card, ErrorState, LoadingState } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { ApiError } from '../../../lib/api'
import { localCountryName } from '../../../lib/countryName'
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
      <header className="page-header flex flex-wrap items-start justify-between gap-4">
        <div>
          <Avatar name={name} size={80} className="mb-4" />
          <h1 className="text-[26px] font-bold leading-tight text-ink-900">{name}</h1>
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
            {data.availability.map((value) => (
              <Badge key={value} tone="accent">
                {t(AVAILABILITY_LABELS[value as Availability] ?? value)}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          {isMe ? (
            <Link to="/profil" className="text-sm font-medium text-accent-700 hover:underline">
              {t('Modifier mon profil')}
            </Link>
          ) : (
            isAuthenticated && <ReportButton targetType="USER" targetId={data.id} />
          )}
        </div>
      </header>

      {data.bio && (
        <Card>
          <h2 className="mb-2 font-semibold text-ink-900">{t('Présentation')}</h2>
          <p className="whitespace-pre-line text-sm text-ink-700">{data.bio}</p>
        </Card>
      )}

      {data.domains.length > 0 && (
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">{t('Domaines')}</h2>
          <ul className="flex flex-wrap gap-2">
            {data.domains.map((value) => (
              <li key={value}>
                <Badge>{t(DOMAIN_LABELS[value as Domain] ?? value)}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <h2 className="mb-3 font-semibold text-ink-900">{t('Sait faire')}</h2>
          {data.skills.offered.length === 0 ? (
            <p className="text-sm text-ink-600">{t('Aucune compétence déclarée.')}</p>
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
          <h2 className="mb-3 font-semibold text-ink-900">{t('Veut apprendre')}</h2>
          {data.skills.wanted.length === 0 ? (
            <p className="text-sm text-ink-600">{t('Aucun souhait déclaré.')}</p>
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
          <h2 className="mb-3 font-semibold text-ink-900">{t('Projets')}</h2>
          <ul className="flex flex-col gap-2">
            {data.projects.map((project) => (
              <li key={project.id} className="flex items-center justify-between gap-3 text-sm">
                <Link to={`/projets/${project.id}`} className="text-accent-700 hover:underline">
                  {project.title}
                </Link>
                <Badge>{t(PROJECT_STATUS_LABELS[project.status])}</Badge>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </section>
  )
}
