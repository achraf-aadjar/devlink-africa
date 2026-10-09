import { Link } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import Icon from '../../../components/icons/Icon'
import ScoreRing from '../../../components/ScoreRing'
import { Badge, Button, Card } from '../../../components/ui'
import { contactHref } from '../../../lib/contact'
import type { Circle, CircleMember } from '../../../lib/types'
import { arrowSentence } from '../sentences'
import CircleDiagram from './CircleDiagram'

const STATUS: Record<
  Circle['status'],
  { label: string; tone: 'accent' | 'warning' | 'success' | 'neutral' }
> = {
  SUGGESTED: { label: 'Cercle possible', tone: 'accent' },
  PROPOSED: { label: 'En attente des réponses', tone: 'warning' },
  ACTIVE: { label: 'Actif', tone: 'success' },
  DECLINED: { label: 'Clos', tone: 'neutral' },
}

const RESPONSE_LABEL = {
  ACCEPTED: 'a accepté',
  PENDING: 'n’a pas encore répondu',
  DECLINED: 'a refusé',
} as const

function ContactLine({ member }: { member: CircleMember }) {
  const href = member.contact ? contactHref(member.contact) : null
  return (
    <li className="text-sm text-ink-800">
      {member.full_name} :{' '}
      {member.contact && href ? (
        <a
          href={href}
          target={href.startsWith('https://') ? '_blank' : undefined}
          rel="noopener noreferrer"
          className="break-all font-medium text-accent-800 underline hover:text-accent-900"
        >
          {member.contact}
        </a>
      ) : (
        <span className="text-ink-600">pas encore de moyen de contact</span>
      )}
    </li>
  )
}

export default function CircleCard({
  circle,
  meId,
  busy = false,
  onPropose,
  onAnswer,
}: {
  circle: Circle
  meId?: number
  busy?: boolean
  onPropose?: (circle: Circle) => void
  onAnswer?: (circle: Circle, accept: boolean) => void
}) {
  const status = STATUS[circle.status]
  const me = circle.members.find((member) => member.id === meId)
  const others = circle.members.filter((member) => member.id !== meId)
  const accepted = circle.members.filter((member) => member.response === 'ACCEPTED').length
  const hasDemo = circle.members.some((member) => member.is_demo)

  return (
    <Card as="li" className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Badge tone={status.tone}>{status.label}</Badge>
          <p className="text-sm text-ink-600">
            {circle.members.length} membres
            {circle.status === 'PROPOSED' &&
              ` · ${accepted} sur ${circle.members.length} ont accepté`}
          </p>
          {hasDemo && <DemoBadge isDemo />}
        </div>
        <ScoreRing score={circle.score} size={52} stroke={5} />
      </div>

      <CircleDiagram circle={circle} meId={meId} />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-900">Qui apprend quoi à qui</h3>
        <ol className="flex flex-col gap-1.5 text-sm text-ink-700">
          {circle.arrows.map((arrow, index) => (
            <li key={`${arrow.teacher}-${arrow.learner}`} className="flex gap-2">
              <span aria-hidden="true" className="text-accent-600">
                →
              </span>
              {arrowSentence(circle, index, meId)}
            </li>
          ))}
        </ol>
      </div>

      {circle.status !== 'SUGGESTED' && (
        <ul className="flex flex-wrap gap-2">
          {circle.members.map((member) => (
            <li key={member.id}>
              <Badge
                tone={
                  member.response === 'ACCEPTED'
                    ? 'success'
                    : member.response === 'DECLINED'
                      ? 'neutral'
                      : 'warning'
                }
              >
                {member.id === meId ? 'Vous' : member.full_name}{' '}
                {member.response ? RESPONSE_LABEL[member.response] : ''}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {circle.status === 'ACTIVE' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-emerald-950/40 px-5 py-4 ring-1 ring-inset ring-emerald-400/20">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <Icon name="check" size={16} />
            Tout le monde a accepté : vous pouvez vous contacter.
          </p>
          <ul className="flex flex-col gap-1">
            {others.map((member) => (
              <ContactLine key={member.id} member={member} />
            ))}
          </ul>
          {me && !me.contact && (
            <p className="text-sm text-ink-700">
              Vous n'avez pas indiqué votre moyen de contact :{' '}
              <Link to="/profil" className="font-medium text-accent-800 underline">
                ajoutez-le dans Mon profil
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {circle.status === 'DECLINED' && (
        <p className="text-sm text-ink-600">Un membre a refusé : ce cercle est clos.</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {circle.status === 'SUGGESTED' && onPropose && (
          <Button onClick={() => onPropose(circle)} loading={busy}>
            Proposer ce cercle
          </Button>
        )}
        {circle.status === 'PROPOSED' && me?.response === 'PENDING' && onAnswer && (
          <>
            <Button onClick={() => onAnswer(circle, true)} loading={busy}>
              Accepter
            </Button>
            <Button variant="secondary" onClick={() => onAnswer(circle, false)} disabled={busy}>
              Refuser
            </Button>
          </>
        )}
        {circle.status === 'PROPOSED' && me?.response === 'ACCEPTED' && (
          <p className="text-sm text-ink-600">
            Vous avez accepté. Le cercle s'active dès que tous les membres ont répondu oui.
          </p>
        )}
      </div>
    </Card>
  )
}
