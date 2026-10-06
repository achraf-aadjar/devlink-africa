import { Link } from 'react-router-dom'
import { Card, EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import { useQuery } from '../../../lib/useQuery'
import { listCountries } from '../../search/api/search'

/** Exploration par pays (DL-38). La carte en tuiles remplace une carte SVG. */
export default function CountriesPage() {
  const { data, loading, error, reload } = useQuery(() => listCountries(), [])

  return (
    <section className="flex flex-col gap-6">
      <header>
        <h1 className="text-2xl font-bold text-ink-900">Explorer par pays</h1>
        <p className="mt-1 text-sm text-ink-600">
          Les développeurs et les projets présents sur la plateforme, pays par pays.
        </p>
      </header>

      {loading && <LoadingState rows={3} label="Chargement des pays…" />}
      {error && <ErrorState onRetry={reload} />}

      {data && data.results.length === 0 && (
        <EmptyState
          title="Aucun pays représenté"
          description="Les profils n'ont pas encore renseigné leur pays."
        />
      )}

      {data && data.results.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {data.results.map((country) => (
            <Card as="li" key={country.code} className="p-0">
              <Link
                to={`/pays/${country.code}`}
                className="flex h-full flex-col gap-1 rounded-card p-4 hover:bg-accent-50"
              >
                <span className="text-3xl" aria-hidden="true">
                  {country.flag}
                </span>
                <span className="font-semibold text-ink-900">{country.name}</span>
                <span className="text-sm text-ink-600">
                  {country.developers_count} développeur{country.developers_count > 1 ? 's' : ''}
                </span>
                <span className="text-sm text-ink-600">
                  {country.projects_count} projet{country.projects_count > 1 ? 's' : ''}
                </span>
              </Link>
            </Card>
          ))}
        </ul>
      )}
    </section>
  )
}
