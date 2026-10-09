import { useId } from 'react'
import Avatar from '../../../components/Avatar'
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
  return fullName.trim().split(/\s+/)[0] || 'Membre'
}

/**
 * Le cercle dessiné : les membres en rond, et une flèche de chacun vers celui
 * à qui il apprend quelque chose, avec la compétence transmise sur la flèche.
 *
 * Le dessin est décoratif pour les lecteurs d'écran : son contenu est résumé
 * dans `aria-label`, et la carte qui l'entoure le détaille en phrases.
 */
export default function CircleDiagram({ circle, meId }: { circle: Circle; meId?: number }) {
  const uid = useId().replace(/:/g, '')
  const count = circle.members.length
  const angleOf = (index: number) => -Math.PI / 2 + (index * 2 * Math.PI) / count
  const summary = circle.arrows.map((_, index) => arrowSentence(circle, index, meId)).join(' ')

  return (
    <div
      role="img"
      aria-label={`Cercle d'échange. ${summary}`}
      className="relative mx-auto aspect-square w-full max-w-[20rem]"
    >
      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`flow-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#388bfd" />
            <stop offset="100%" stopColor="#a371f7" />
          </linearGradient>
          <marker
            id={`arrow-${uid}`}
            viewBox="0 0 10 10"
            refX="7"
            refY="5"
            markerWidth="4.5"
            markerHeight="4.5"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill="#a5d6ff" />
          </marker>
          <radialGradient id={`halo-${uid}`}>
            <stop offset="0%" stopColor="#1f6feb" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#1f6feb" stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle cx="50" cy="50" r="46" fill={`url(#halo-${uid})`} />
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="rgb(255 255 255 / 0.05)"
          strokeWidth="0.6"
        />

        {circle.members.map((member, index) => {
          const start = angleOf(index) + GAP
          const end = angleOf(index + 1) - GAP
          const [x1, y1] = point(start)
          const [x2, y2] = point(end)
          const path = `M ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`
          return (
            <g key={member.id}>
              <path
                d={path}
                fill="none"
                stroke={`url(#flow-${uid})`}
                strokeWidth="1.1"
                strokeLinecap="round"
                markerEnd={`url(#arrow-${uid})`}
              />
              <path
                d={path}
                fill="none"
                stroke="#cfe6ff"
                strokeOpacity="0.85"
                strokeWidth="0.8"
                strokeLinecap="round"
                strokeDasharray="1.2 6"
                className="animate-flow"
              />
            </g>
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
            className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink-50/95 px-2.5 py-1 text-xs font-semibold text-accent-900 shadow-glow"
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
              name={member.full_name || 'Membre'}
              size={48}
              className={isMe ? 'ring-[3px] ring-accent-500' : undefined}
            />
            <span className="whitespace-nowrap rounded-full bg-ink-50/80 px-2 text-xs font-medium text-ink-900">
              {isMe ? 'Vous' : firstName(member.full_name)}
              {member.country && <span className="ml-1 text-ink-500">{member.country}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}
