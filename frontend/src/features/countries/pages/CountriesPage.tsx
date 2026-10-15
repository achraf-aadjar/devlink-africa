import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { localCountryName } from '../../../lib/countryName'
import { useQuery } from '../../../lib/useQuery'
import { listCountries } from '../../search/api/search'
import AfricaTileMap from '../components/AfricaTileMap'

/** Exploration par pays (DL-38). La carte en tuiles remplace une carte SVG. */
export default function CountriesPage() {
  const { t, tn, lang } = useI18n()
  const { data, loading, error, reload } = useQuery(() => listCountries(), [])

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="page-title">{t('Explorer par pays')}</h1>
          <p className="mt-1 text-sm text-ink-600">
            {t('Les développeurs et les projets présents sur la plateforme, pays par pays.')}
          </p>
        </div>
        <Link
          to="/observatoire"
          className="text-sm font-semibold text-accent-700 underline underline-offset-4 hover:text-accent-800"
        >
          {t('Observatoire des compétences')}
        </Link>
      </header>

      {loading && <LoadingState rows={3} label={t('Chargement des pays…')} />}
      {error && <ErrorState onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState
          title={t('Aucun pays représenté')}
          description={t("Les profils n'ont pas encore renseigné leur pays.")}
        />
      )}

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,36rem)_minmax(0,1fr)]">
        {data && <AfricaTileMap countries={data.results} />}

        {data && data.results.length > 0 && (
          <ul className="surface grid grid-cols-1 divide-y divide-ink-200 overflow-hidden sm:grid-cols-2 sm:divide-y-0">
            {data.results.map((country) => (
              <li key={country.code}>
                <Link
                  to={`/pays/${country.code}`}
                  className="group flex h-full items-center gap-3 border-ink-200 px-4 py-3 transition-colors hover:bg-ink-50 sm:border-b"
                >
                  <span aria-hidden="true" className="text-2xl leading-none">
                    {country.flag}
                  </span>
                  <span className="flex flex-col leading-tight">
                    <span className="font-semibold text-ink-900 group-hover:text-accent-700 group-hover:underline">
                      {localCountryName(country.code, country.name, lang)}
                    </span>
                    <span className="text-xs text-ink-600">
                      <span>
                        {tn(country.developers_count, '{n} développeur', '{n} développeurs')}
                      </span>
                      {' · '}
                      <span>{tn(country.projects_count, '{n} projet', '{n} projets')}</span>
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
