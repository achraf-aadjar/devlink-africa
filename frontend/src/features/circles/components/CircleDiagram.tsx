import { useId } from 'react'
import Avatar from '../../../components/Avatar'
import { useI18n } from '../../../i18n/useI18n'
import type { Circle } from '../../../lib/types'
import { arrowSentence } from '../sentences'

/** Rayon du cercle et marge laissée autour de chaque avatar, en unités du schéma (0 à 100). */
const RADIUS = 34
const GAP = 0.36

function point(angle: number, radius = RADIUS): [number, number] {
  return [50 + radius * Math.cos(angle), 50 + radius * Math.sin(angle)]
}

/** Prénom seul : le schéma est petit, le nom complet figure dans la liste en dessous. */
function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0]
}

/**
 * Le cercle dessiné : les membres en rond, et une flèche de chacun vers celui
 * à qui il apprend quelque chose, avec la compétence transmise sur la flèche.
 *
 * Le dessin est décoratif pour les lecteurs d'écran : son contenu est résumé
 * dans `aria-label`, et la carte qui l'entoure le détaille en phrases.
 */
export default function CircleDiagram({ circle, meId }: { circle: Circle; meId?: number }) {
  const { t } = useI18n()
  const uid = useId().replace(/:/g, '')
  const count = circle.members.length
  const angleOf = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / count
  const summary = circle.arrows.map((_, index) => arrowSentence(t, circle, index, meId)).join(' ')

  return (
    <div
      role="img"
      aria-label={t("Cercle d'échange. {summary}", { summary })}
      className="relative mx-auto aspect-square w-full max-w-[20rem]"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <marker
            id={`arrow-${uid}`}
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#337ab7" />
          </marker>
        </defs>

        {circle.members.map((member, index) => {
          const start = angleOf(index) + GAP
          const end = angleOf(index + 1) - GAP
          const [x1, y1] = point(start)
          const [x2, y2] = point(end)
          return (
            <path
              key={member.id}
              d={`M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`}
              fill="none"
              stroke="#337ab7"
              strokeWidth="1"
              markerEnd={`url(#arrow-${uid})`}
            />
          )
        })}
      </svg>

      {/* Compétences, posées au milieu de chaque flèche. */}
      {circle.arrows.map((arrow, index) => {
        const [x, y] = point(angleOf(index) + Math.PI / count)
        return (
          <span
            key={`${arrow.teacher}-${arrow.learner}`}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-[3px] border border-accent-200 bg-accent-50 px-1.5 py-px text-xs font-bold text-accent-800"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {arrow.skill.name}
          </span>
        )
      })}

      {/* Membres. */}
      {circle.members.map((member, index) => {
        const [x, y] = point(angleOf(index))
        const isMe = member.id === meId
        return (
          <div
            key={member.id}
            aria-hidden="true"
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-1"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <Avatar
              name={member.full_name || t('Membre')}
              size={48}
              className={isMe ? 'outline outline-2 outline-offset-2 outline-[#d26911]' : undefined}
            />
            <span className="whitespace-nowrap bg-white px-1 text-xs font-bold text-ink-900">
              {isMe ? t('Vous') : firstName(member.full_name) || t('Membre')}
              {member.country && <span className="ml-1 text-ink-500">{member.country}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
