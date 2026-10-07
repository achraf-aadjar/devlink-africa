import { Link } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import { Card } from '../../../components/ui'
import { countryFlag } from '../../../lib/labels'
import type { MatchSummary } from '../../../lib/types'

/** Carte d'un match dans la liste : score, personne, premières raisons. */
export default function MatchCard({ match }: { match: MatchSummary }) {
  return (
    <Card as="li" interactive className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-ink-900">
            <Link to={`/matchs/${match.id}`} className="hover:text-accent-700 hover:underline">
              {match.user.full_name || 'Développeur'}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">
            {match.user.country && (
              <span className="mr-1" aria-hidden="true">
                {countryFlag(match.user.country)}
              </span>
            )}
            {match.user.country || 'Pays non renseigné'}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-2xl font-bold tabular-nums text-accent-700">
            {Math.round(match.score)}
          </p>
          <p className="text-xs text-ink-500">sur 100</p>
        </div>
      </div>

      <DemoBadge isDemo={match.user.is_demo} />

      {match.reasons.length > 0 && (
        <ul className="flex flex-col gap-1 text-sm text-ink-700">
          {match.reasons.slice(0, 2).map((reason) => (
            <li key={reason} className="flex gap-2">
              <span aria-hidden="true" className="text-accent-600">
                →
              </span>
              {reason}
            </li>
          ))}
        </ul>
      )}

      <Link
        to={`/matchs/${match.id}`}
        className="mt-auto text-sm font-medium text-accent-700 hover:underline"
      >
        Voir l'explication détaillée
      </Link>
    </Card>
  )
}
