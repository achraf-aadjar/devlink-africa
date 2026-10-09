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
      <header className="page-header flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-bold leading-tight text-ink-900">
            {t('Explorer par pays')}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {t('Les développeurs et les projets présents sur la plateforme, pays par pays.')}
          </p>
        </div>
        <Link to="/observatoire" className="btn">
          {t('Observatoire des compétences')} »
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

      {data && <AfricaTileMap countries={data.results} />}

      {data && data.results.length > 0 && (
        <ul className="grid overflow-hidden rounded border-l border-t border-ink-200 sm:grid-cols-2 lg:grid-cols-3">
          {data.results.map((country) => (
            <li key={country.code} className="border-b border-r border-ink-200">
              <Link
                to={`/pays/${country.code}`}
                className="group flex items-center gap-3 px-3 py-2.5 hover:bg-ink-100"
              >
                <span aria-hidden="true" className="text-2xl">
                  {country.flag}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-bold text-accent-700 group-hover:underline">
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
    </section>
  )
}
