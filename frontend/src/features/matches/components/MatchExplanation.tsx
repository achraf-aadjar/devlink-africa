import Magnet from '../../../components/board/Magnet'
import MarkerArrow from '../../../components/board/MarkerArrow'
import { Badge } from '../../../components/ui'
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

/** Compétences écrites au feutre le long d'une flèche, ou une ligne vide. */
function SkillList({
  skills,
  tone,
  empty,
}: {
  skills: Array<{ name: string }>
  tone: 'offered' | 'wanted'
  empty: string
}) {
  if (skills.length === 0) return <p className="text-sm text-ink-600">{empty}</p>
  return (
    <ul className="flex flex-wrap justify-center gap-1.5">
      {skills.map((skill) => (
        <li key={skill.name}>
          <Badge tone={tone}>{skill.name}</Badge>
        </li>
      ))}
    </ul>
  )
}

/**
 * Le tableau tactique d'un match : deux aimants, et entre eux ce que chacun
 * apprend à l'autre. Bleu pour ce que vous donnez, orange pour ce que vous
 * recevez, comme partout dans l'application.
 */
function PairBoard({
  explanation,
  partnerName,
  myName,
}: {
  explanation: Explanation
  partnerName: string
  myName: string
}) {
  const { t } = useI18n()

  // Un seul exemplaire de chaque bloc dans la page : seules les flèches
  // (décoratives) changent de sens selon la largeur d'écran.
  return (
    <section
      aria-labelledby="qui-apprend"
      className="rounded-card bg-ink-50 p-5 ring-1 ring-inset ring-veil/[0.12] sm:p-8"
    >
      <h2 id="qui-apprend" className="sr-only">
        {t('Qui apprend quoi à qui')}
      </h2>
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 sm:flex sm:items-center">
        <Magnet name={partnerName} className="col-span-2 mx-auto sm:mx-0" />

        <div className="col-span-2 grid grid-cols-2 gap-4 sm:flex sm:min-w-0 sm:flex-1 sm:flex-col sm:gap-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <MarkerArrow direction="down" className="h-14 w-6 text-demand-fill sm:hidden" />
            <h3 className="text-sm font-semibold text-ink-800">
              {t('{name} peut vous apprendre', { name: partnerName })}
            </h3>
            <SkillList
              skills={explanation.they_can_teach_you}
              tone="wanted"
              empty={t(
                'Rien pour le moment. Ajoutez des compétences à apprendre dans votre profil.',
              )}
            />
            <MarkerArrow
              direction="right"
              className="hidden h-6 w-full text-demand-fill sm:block"
            />
          </div>
          <div className="flex flex-col items-center gap-2 text-center">
            <MarkerArrow direction="up" className="h-14 w-6 text-brand sm:hidden" delay={350} />
            <MarkerArrow
              direction="left"
              className="hidden h-6 w-full text-brand sm:block"
              delay={350}
            />
            <SkillList
              skills={explanation.you_can_teach_them}
              tone="offered"
              empty={t('Rien pour le moment. Déclarez ce que vous savez faire.')}
            />
            <h3 className="text-sm font-semibold text-ink-800">{t('Vous pouvez lui apprendre')}</h3>
          </div>
        </div>

        <Magnet name={myName} caption={t('vous')} className="col-span-2 mx-auto sm:mx-0" />
      </div>
    </section>
  )
}

/**
 * Composition du score : une seule barre de 100 points, découpée selon le
 * poids de chaque critère. Chaque case se remplit de ce que le critère a
 * rapporté : on voit d'un coup d'œil ce qui pèse le plus et ce qui manque.
 */
function ScoreComposition({ explanation }: { explanation: Explanation }) {
  const { t, lang } = useI18n()
  // Une décimale, au format de la langue (« 31,5 » en français, « 31.5 » en anglais).
  const format = (points: number) =>
    points.toLocaleString(lang === 'en' ? 'en-GB' : 'fr-FR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })
  const rows = explanation.breakdown.map((item) => ({
    ...item,
    label: t(CRITERION_LABELS[item.criterion] ?? item.label),
    ratio: item.weight > 0 ? Math.min(item.points / item.weight, 1) : 0,
  }))

  return (
    <section aria-labelledby="score-composition" className="surface p-5 sm:p-6">
      <h2 id="score-composition" className="sheet-title">
        {t('Comment le score est calculé')}
      </h2>
      <p className="mt-1 text-sm text-ink-600">
        {t('Chaque critère a un poids maximal. La somme des points donne exactement le score.')}
      </p>

      <div className="mt-5 flex h-4 gap-0.5 overflow-hidden rounded-sm">
        {rows.map((row, index) => (
          <div
            key={row.criterion}
            role="meter"
            aria-valuenow={Math.round(row.points)}
            aria-valuemin={0}
            aria-valuemax={row.weight}
            aria-label={t('{label} : {points} points sur {weight}', {
              label: row.label,
              points: format(row.points),
              weight: row.weight,
            })}
            title={`${row.label} : ${format(row.points)} / ${row.weight}`}
            className="relative h-full bg-ink-200"
            style={{ flexGrow: row.weight, flexBasis: 0 }}
          >
            <div
              className="animate-bar-fill absolute inset-y-0 left-0 origin-left bg-brand"
              style={{ width: `${row.ratio * 100}%`, animationDelay: `${index * 80}ms` }}
            />
          </div>
        ))}
      </div>

      <table className="mt-5 w-full text-sm">
        <caption className="sr-only">{t('Points obtenus par critère')}</caption>
        <thead>
          <tr className="border-b border-ink-300 text-left font-display text-[0.9375rem] font-bold uppercase tracking-[0.02em] text-ink-700">
            <th scope="col" className="pb-2 font-bold">
              {t('Critère')}
            </th>
            <th scope="col" className="pb-2 text-right font-bold">
              {t('Points')}
            </th>
            <th scope="col" className="pb-2 text-right font-bold">
              {t('Sur')}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.criterion} className="border-b border-ink-200 last:border-0">
              <th scope="row" className="py-2.5 text-left font-medium text-ink-800">
                {row.label}
              </th>
              <td
                className={`py-2.5 text-right font-semibold tabular-nums ${
                  row.points > 0 ? 'text-ink-900' : 'text-ink-500'
                }`}
              >
                {format(row.points)}
              </td>
              <td className="py-2.5 text-right tabular-nums text-ink-600">{row.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {explanation.common_skills.length > 0 && (
        <div className="mt-5 border-t border-ink-200 pt-4">
          <h3 className="mb-2 text-sm font-medium text-ink-800">
            {t('Technologies que vous maîtrisez tous les deux')}
          </h3>
          <ul className="flex flex-wrap gap-1.5">
            {explanation.common_skills.map((skill) => (
              <li key={skill.name}>
                <Badge>{skill.name}</Badge>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

/**
 * L'explication d'un match : le cœur de l'interface.
 *
 * Trois niveaux de lecture, du plus rapide au plus détaillé :
 * 1. qui apprend quoi à qui, sur le tableau ;
 * 2. les raisons, en phrases courtes ;
 * 3. la composition du score, critère par critère.
 *
 * La somme des points est égale au score : l'utilisateur peut donc vérifier
 * lui-même le calcul, ce qui est tout l'intérêt d'un match expliqué. Le score
 * lui-même est affiché par la page, à côté de l'action.
 */
export default function MatchExplanation({
  explanation,
  partnerName,
  myName,
}: {
  explanation: Explanation
  partnerName: string
  myName: string
}) {
  const { t } = useI18n()

  return (
    <div className="flex flex-col gap-6">
      <PairBoard explanation={explanation} partnerName={partnerName} myName={myName} />

      {explanation.capped && (
        <p className="rounded-card bg-warning/10 px-4 py-3 text-sm text-ink-800 ring-1 ring-inset ring-warning/30">
          {t("Ce score est plafonné : l'échange ne va pour l'instant que dans un sens.")}
        </p>
      )}

      {explanation.reasons.length > 0 && (
        <section aria-labelledby="match-reasons" className="surface p-5 sm:p-6">
          <h2 id="match-reasons" className="sheet-title">
            {t('Pourquoi ce match')}
          </h2>
          <ul className="mt-3 flex flex-col divide-y divide-ink-200">
            {explanation.reasons.map((reason) => (
              <li key={reason} className="flex gap-3 py-2.5 text-sm text-ink-800">
                <span aria-hidden="true" className="mt-2 h-0.5 w-3 shrink-0 rounded bg-ink-400" />
                {reason}
              </li>
            ))}
          </ul>
        </section>
      )}

      <ScoreComposition explanation={explanation} />
    </div>
  )
}
