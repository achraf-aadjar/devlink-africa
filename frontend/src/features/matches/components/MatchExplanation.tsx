import ScoreRing from '../../../components/ScoreRing'
import { Badge, Card } from '../../../components/ui'
import { msg } from '../../../i18n/translate'
import { useI18n } from '../../../i18n/useI18n'
import type { MatchExplanation as Explanation } from '../../../lib/types'

/**
 * Libellés des critères. L'API les rédige en français (matching/scoring.py) et
 * les stocke avec le match : on les retraduit ici, d'après le code du critère.
 */
const CRITERION_LABELS: Record<string, string> = {
  complementarity: msg('Complémentarité'),
  reciprocity: msg('Réciprocité'),
  collaboration: msg('Envie de collaborer'),
  common_tech: msg('Technologies communes'),
  availability: msg('Disponibilité'),
  domain: msg('Domaine'),
}

/** Couleur de la barre selon la part du critère obtenue. */
function barTone(ratio: number): string {
  if (ratio >= 0.75) return 'bg-accent-600'
  if (ratio >= 0.4) return 'bg-accent-400'
  return 'bg-ink-500'
}

/**
 * L'explication d'un match : le cœur de l'interface.
 *
 * Trois niveaux de lecture, du plus rapide au plus détaillé :
 * 1. le score, lisible en un coup d'œil ;
 * 2. ce que chacun peut apprendre à l'autre, en phrases courtes ;
 * 3. la répartition des points par critère.
 *
 * La somme des points est égale au score : l'utilisateur peut donc vérifier
 * lui-même le calcul, ce qui est tout l'intérêt d'un match expliqué.
 */
export default function MatchExplanation({
  explanation,
  score,
  partnerName,
}: {
  explanation: Explanation
  score: number
  partnerName: string
}) {
  const { t } = useI18n()
  const total = Math.round(score)

  return (
    <div className="flex flex-col gap-6">
      {/* Niveau 1 : le score, en jauge circulaire sur un halo. */}
      <div className="relative isolate flex flex-col items-center gap-3 py-4 text-center">
        <div
          aria-hidden="true"
          className="glow-blob inset-x-0 top-0 -z-10 mx-auto h-48 w-72 bg-brand/25"
        />
        <p className="text-sm font-medium text-accent-800">{t('Score de compatibilité')}</p>
        <ScoreRing score={total} size={148} stroke={10} showMax />
        {explanation.capped && (
          <p className="max-w-sm text-sm text-ink-600">
            {t("Ce score est plafonné : l'échange ne va pour l'instant que dans un sens.")}
          </p>
        )}
      </div>

      {/* Niveau 2 : qui apprend quoi à qui */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-ink-900">
            {t('{name} peut vous apprendre', { name: partnerName })}
          </h3>
          {explanation.they_can_teach_you.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {explanation.they_can_teach_you.map((skill) => (
                <li key={skill.name}>
                  <Badge tone="offered">{skill.name}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-600">
              {t('Rien pour le moment. Ajoutez des compétences à apprendre dans votre profil.')}
            </p>
          )}
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-ink-900">{t('Vous pouvez lui apprendre')}</h3>
          {explanation.you_can_teach_them.length > 0 ? (
            <ul className="flex flex-wrap gap-2">
              {explanation.you_can_teach_them.map((skill) => (
                <li key={skill.name}>
                  <Badge tone="wanted">{skill.name}</Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-600">
              {t('Rien pour le moment. Déclarez ce que vous savez faire.')}
            </p>
          )}
        </Card>
      </div>

      {/* Les raisons, en phrases */}
      {explanation.reasons.length > 0 && (
        <Card>
          <h3 className="mb-3 font-semibold text-ink-900">{t('Pourquoi ce match')}</h3>
          <ul className="flex flex-col gap-2">
            {explanation.reasons.map((reason) => (
              <li key={reason} className="flex gap-2 text-sm text-ink-700">
                <span aria-hidden="true" className="text-accent-600">
                  →
                </span>
                {reason}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Niveau 3 : la répartition détaillée */}
      <Card>
        <h3 className="mb-1 font-semibold text-ink-900">{t('Comment le score est calculé')}</h3>
        <p className="mb-4 text-sm text-ink-600">
          {t('Chaque critère a un poids maximal. La somme des points donne exactement le score.')}
        </p>

        <ul className="flex flex-col gap-3">
          {explanation.breakdown.map((item) => {
            const ratio = item.weight > 0 ? item.points / item.weight : 0
            const label = t(CRITERION_LABELS[item.criterion] ?? item.label)
            const points = item.points.toFixed(1)
            return (
              <li key={item.criterion}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-ink-800">{label}</span>
                  <span className="tabular-nums text-ink-600">
                    {points} / {item.weight}
                  </span>
                </div>
                <div
                  role="meter"
                  aria-valuenow={Math.round(item.points)}
                  aria-valuemin={0}
                  aria-valuemax={item.weight}
                  aria-label={t('{label} : {points} points sur {weight}', {
                    label,
                    points,
                    weight: item.weight,
                  })}
                  className="h-2 overflow-hidden rounded-full bg-ink-100"
                >
                  <div
                    className={`h-full rounded-full ${barTone(ratio)}`}
                    style={{ width: `${Math.max(ratio * 100, 1)}%` }}
                  />
                </div>
              </li>
            )
          })}
        </ul>

        {explanation.common_skills.length > 0 && (
          <div className="mt-5 border-t border-ink-200 pt-4">
            <h4 className="mb-2 text-sm font-medium text-ink-800">
              {t('Technologies que vous maîtrisez tous les deux')}
            </h4>
            <ul className="flex flex-wrap gap-2">
              {explanation.common_skills.map((skill) => (
                <li key={skill.name}>
                  <Badge>{skill.name}</Badge>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </div>
  )
}
