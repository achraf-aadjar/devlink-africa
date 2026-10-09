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
          <h1 className="text-3xl font-bold tracking-tight text-ink-900">
            {t('Explorer par pays')}
          </h1>
          <p className="mt-1 text-sm text-ink-600">
            {t('Les développeurs et les projets présents sur la plateforme, pays par pays.')}
          </p>
        </div>
        <Link
          to="/observatoire"
          className="rounded-full bg-white/[0.06] px-5 py-2 text-sm font-medium text-ink-900 ring-1 ring-inset ring-white/10 transition hover:bg-white/10"
        >
          {t('Observatoire des compétences')} →
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
        <ul className="flex flex-wrap gap-3">
          {data.results.map((country) => (
            <li key={country.code}>
              <Link
                to={`/pays/${country.code}`}
                className="group flex items-center gap-3 rounded-full bg-white/[0.04] py-2 pl-2 pr-5 ring-1 ring-inset ring-white/[0.07] transition hover:-translate-y-0.5 hover:bg-white/[0.07] hover:ring-accent-400/40"
              >
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.06] text-2xl"
                >
                  {country.flag}
                </span>
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold text-ink-900 group-hover:text-accent-800">
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
