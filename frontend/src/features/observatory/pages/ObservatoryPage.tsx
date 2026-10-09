import { Link } from 'react-router-dom'
import { EmptyState, ErrorState, LoadingState } from '../../../components/ui'
import type { ObservatorySkill } from '../../../lib/types'
import { useQuery } from '../../../lib/useQuery'
import { useAuth } from '../../auth/hooks/useAuth'
import { getObservatory } from '../api/observatory'
import SupplyDemandChart from '../components/SupplyDemandChart'
import { offeredText, SERIES, wantedText } from '../series'

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="surface flex flex-col gap-1 p-5">
      <dt className="text-sm text-ink-600">{label}</dt>
      <dd className="text-3xl font-semibold text-ink-900">{value.toLocaleString('fr-FR')}</dd>
    </div>
  )
}

function Ranking({
  title,
  description,
  skills,
  side,
}: {
  title: string
  description: string
  skills: ObservatorySkill[]
  side: 'wanted' | 'offered'
}) {
  return (
    <section className="surface flex flex-col gap-4 p-6" aria-label={title}>
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-900">
          <span
            aria-hidden="true"
            className="h-3 w-3 rounded-[3px]"
            style={{ background: SERIES[side].color }}
          />
          {title}
        </h2>
        <p className="mt-1 text-sm text-ink-600">{description}</p>
      </div>
      {skills.length === 0 ? (
        <p className="text-sm text-ink-600">Rien à signaler pour l'instant.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {skills.map((skill) => (
            <li key={skill.name} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium text-ink-900">{skill.name}</span>
              <span className="text-ink-600">
                {wantedText(skill.wanted)} · {offeredText(skill.offered)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

/**
 * Observatoire des compétences : ce que les développeurs du continent savent
 * faire, et ce qu'ils cherchent à apprendre. Des comptes seulement, jamais de
 * nom (voir backend/search/observatory.py).
 */
export default function ObservatoryPage() {
  const { isAuthenticated } = useAuth()
  const { data, loading, error, reload } = useQuery(() => getObservatory(), [])

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-ink-900">
          Observatoire des compétences
        </h1>
        <p className="max-w-3xl text-ink-600">
          Ce que les développeurs inscrits savent faire, et ce qu'ils veulent apprendre, pays par
          pays. Uniquement des chiffres : aucun nom n'apparaît ici.
        </p>
      </header>

      {loading && <LoadingState rows={3} label="Chargement de l'observatoire…" />}
      {error && <ErrorState onRetry={reload} />}

      {data && data.skills.length === 0 && (
        <EmptyState
          title="L'observatoire est encore vide"
          description="Il se remplit à mesure que les développeurs déclarent leurs compétences."
        />
      )}

      {data && data.skills.length > 0 && (
        <>
          <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile label="Développeurs inscrits" value={data.totals.developers} />
            <StatTile label="Pays représentés" value={data.totals.countries} />
            <StatTile label="Compétences proposées" value={data.totals.offered} />
            <StatTile label="Envies d'apprendre" value={data.totals.wanted} />
          </dl>

          <div className="surface p-6">
            <SupplyDemandChart skills={data.skills} />
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Ranking
              title="Ce qui manque le plus"
              description="Plus de personnes veulent l'apprendre que de personnes pour l'enseigner."
              skills={data.shortages}
              side="wanted"
            />
            <Ranking
              title="Savoirs disponibles à partager"
              description="Plus de personnes peuvent l'enseigner que de personnes qui le cherchent."
              skills={data.surpluses}
              side="offered"
            />
          </div>

          {data.bridges.length > 0 && (
            <section className="flex flex-col gap-4" aria-labelledby="ponts">
              <div>
                <h2 id="ponts" className="text-xl font-semibold text-ink-900">
                  Des ponts entre pays
                </h2>
                <p className="mt-1 text-sm text-ink-600">
                  Une compétence cherchée dans un pays est déjà proposée ailleurs sur le continent.
                </p>
              </div>
              <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {data.bridges.map((bridge) => (
                  <li
                    key={`${bridge.skill}-${bridge.wanted_in.code}`}
                    className="surface flex flex-col gap-1 px-5 py-4 text-sm text-ink-700"
                  >
                    <span>
                      <span aria-hidden="true" className="mr-1">
                        {bridge.wanted_in.flag}
                      </span>
                      <strong className="font-semibold text-ink-900">
                        {bridge.wanted_in.name}
                      </strong>{' '}
                      cherche <strong className="font-semibold text-ink-900">{bridge.skill}</strong>
                    </span>
                    <span className="text-ink-600">
                      proposé par :{' '}
                      {bridge.offered_in.map((country, index) => (
                        <span key={country.code}>
                          {index > 0 && ', '}
                          <span aria-hidden="true">{country.flag}</span> {country.name}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!isAuthenticated && (
            <p className="text-ink-700">
              Vous savez ce qui manque à quelqu'un ?{' '}
              <Link to="/inscription" className="font-medium text-accent-800 underline">
                Créez votre profil
              </Link>{' '}
              : vos compétences rejoignent l'observatoire, et Dev Match vous présente ceux qui en
              ont besoin.
            </p>
          )}
        </>
      )}
    </section>
  )
}
