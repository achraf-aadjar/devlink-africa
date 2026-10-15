import { Link } from 'react-router-dom'
import { ButtonLink, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { useQuery } from '../../../lib/useQuery'
import { listMatches } from '../api/matches'
import MatchList from '../components/MatchList'

export default function MatchesPage() {
  const { t, tn } = useI18n()
  const { data, loading, error, reload } = useQuery(() => listMatches(), [])

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h1 className="page-title">{t('Mes matchs')}</h1>
          <p className="mt-2 text-sm text-ink-600">
            {t(
              "Dev Match vous propose des profils complémentaires : chacun sait ce que l'autre veut apprendre.",
            )}
          </p>
        </div>
        <p className="max-w-sm text-sm text-ink-700">
          <strong className="font-semibold text-ink-900">{t('Pas de paire parfaite ?')}</strong>{' '}
          {t('Vos compétences peuvent aussi circuler dans un cercle de trois ou quatre personnes.')}{' '}
          <Link to="/cercles" className="font-semibold text-accent-700 underline">
            {t("Voir mes cercles d'échange")}
          </Link>
        </p>
      </header>

      {loading && <LoadingState rows={3} label={t('Chargement de vos matchs…')} />}

      {error && <ErrorState onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState
          title={t('Aucun match pour le moment')}
          description={t(
            'Déclarez ce que vous savez faire et ce que vous voulez apprendre : nous chercherons alors des développeurs complémentaires.',
          )}
          icon="match"
          action={<ButtonLink to="/competences">{t('Ajouter mes compétences')}</ButtonLink>}
        />
      )}

      {data && data.results.length > 0 && (
        <>
          <p className="-mb-3 text-sm text-ink-600">
            {tn(
              data.count,
              '{n} développeur correspond à votre profil.',
              '{n} développeurs correspondent à votre profil.',
            )}
          </p>
          <MatchList matches={data.results} />
        </>
      )}
    </section>
  )
}
