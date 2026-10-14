import { useId } from 'react'
import Avatar from '../../../components/Avatar'
import { useI18n } from '../../../i18n/useI18n'
import type { Circle } from '../../../lib/types'
import { arrowSentence } from '../sentences'
import { cn } from '../../../lib/cn'

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
 * Le cercle dessiné comme au tableau tactique : les membres en aimants, et une
 * flèche au feutre de chacun vers celui à qui il apprend quelque chose, avec
 * la compétence écrite sur la flèche. Les flèches se tracent une fois, l'une
 * après l'autre, dans l'ordre où le savoir circule.
 *
 * Le dessin est décoratif pour les lecteurs d'écran : son contenu est résumé
 * dans `aria-label`, et la carte qui l'entoure le détaille en phrases.
 */
export default function CircleDiagram({
  circle,
  meId,
  className,
}: {
  circle: Circle
  meId?: number
  className?: string
}) {
  const { t } = useI18n()
  const uid = useId().replace(/:/g, '')
  const count = circle.members.length
  const angleOf = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / count
  const summary = circle.arrows.map((_, index) => arrowSentence(t, circle, index, meId)).join(' ')

  return (
    <div
      role="img"
      aria-label={t("Cercle d'échange. {summary}", { summary })}
      className={cn('relative mx-auto aspect-square w-full max-w-[20rem]', className)}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full text-ink-900"
        aria-hidden="true"
      >
        <defs>
          <marker
            id={`arrow-${uid}`}
            viewBox="0 0 10 10"
            refX="6"
            refY="5"
            markerWidth="5"
            markerHeight="5"
            orient="auto"
          >
            <path
              d="M1.5,1.5 L7,5 L1.5,8.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </marker>
        </defs>

        {circle.members.map((member, index) => {
          const start = angleOf(index) + GAP
          const end = angleOf(index + 1) - GAP
          const [x1, y1] = point(start)
          const [x2, y2] = point(end)
          const path = `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`
          return (
            <path
              key={member.id}
              d={path}
              pathLength={1}
              className="marker marker-draw animate-draw"
              stroke="currentColor"
              strokeWidth="1.1"
              markerEnd={`url(#arrow-${uid})`}
              style={{ animationDelay: `${index * 250}ms` }}
            />
          )
        })}
      </svg>

      {/* Compétences, écrites au milieu de chaque flèche. */}
      {circle.arrows.map((arrow, index) => {
        const [x, y] = point(angleOf(index) + Math.PI / count)
        return (
          <span
            key={`${arrow.teacher}-${arrow.learner}`}
            aria-hidden="true"
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-sm bg-ink-100 px-1.5 py-0.5 font-display text-sm font-bold uppercase leading-tight tracking-[0.02em] text-ink-900 ring-1 ring-ink-900/70"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            {arrow.skill.name}
          </span>
        )
      })}

      {/* Membres : un aimant chacun. */}
      {circle.members.map((member, index) => {
        const [x, y] = point(angleOf(index))
        const isMe = member.id === meId
        return (
          <div
            key={member.id}
            aria-hidden="true"
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-0.5"
            style={{ left: `${x}%`, top: `${y}%` }}
          >
            <Avatar
              name={member.full_name || t('Membre')}
              size={48}
              className={
                isMe ? 'ring-[3px] ring-ink-900 ring-offset-2 ring-offset-ink-50' : undefined
              }
            />
            <span className="whitespace-nowrap font-display text-sm font-bold uppercase leading-tight text-ink-900">
              {isMe ? t('Vous') : firstName(member.full_name) || t('Membre')}
              {member.country && (
                <span className="ml-1 font-sans text-xs font-medium normal-case text-ink-600">
                  {member.country}
                </span>
              )}
            </span>
          </div>
        )
      })}
    </div>
  )
}
