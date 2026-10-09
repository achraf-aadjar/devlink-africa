import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import DemoBadge from '../../../components/DemoBadge'
import ScoreRing from '../../../components/ScoreRing'
import { Card } from '../../../components/ui'
import { useI18n } from '../../../i18n/useI18n'
import { countryFlag } from '../../../lib/labels'
import type { MatchSummary } from '../../../lib/types'

/** Carte d'un match dans la liste : personne, score, premières raisons. */
export default function MatchCard({ match }: { match: MatchSummary }) {
  const { t } = useI18n()
  const name = match.user.full_name || t('Développeur')

  return (
    <Card as="li" interactive className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar name={name} size={52} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate font-semibold text-ink-900">
            <Link to={`/matchs/${match.id}`} className="hover:text-accent-700">
              {name}
            </Link>
          </h2>
          <p className="mt-0.5 text-sm text-ink-600">
            {match.user.country && (
              <span className="mr-1" aria-hidden="true">
                {countryFlag(match.user.country)}
              </span>
            )}
            {match.user.country || t('Pays non renseigné')}
          </p>
        </div>
        <ScoreRing score={match.score} size={56} stroke={5} />
      </div>

      <DemoBadge isDemo={match.user.is_demo} />

      {match.reasons.length > 0 && (
        <ul className="flex flex-col gap-1.5 text-sm text-ink-700">
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

      <Link to={`/matchs/${match.id}`} className="btn btn-sm mt-auto w-fit">
        {t("Voir l'explication détaillée")}
        <span aria-hidden="true">→</span>
      </Link>
    </Card>
  )
}
