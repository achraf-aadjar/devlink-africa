import { Link } from 'react-router-dom'
import DemoBadge from '../../../components/DemoBadge'
import Icon from '../../../components/icons/Icon'
import ScoreRing from '../../../components/ScoreRing'
import { Badge, Button, Card } from '../../../components/ui'
import { msg } from '../../../i18n/translate'
import { useI18n } from '../../../i18n/useI18n'
import { contactHref } from '../../../lib/contact'
import type { Circle, CircleMember, CircleResponse } from '../../../lib/types'
import { arrowSentence } from '../sentences'
import CircleDiagram from './CircleDiagram'

const STATUS: Record<
  Circle['status'],
  { label: string; tone: 'accent' | 'warning' | 'success' | 'neutral' }
> = {
  SUGGESTED: { label: msg('Cercle possible'), tone: 'accent' },
  PROPOSED: { label: msg('En attente des réponses'), tone: 'warning' },
  ACTIVE: { label: msg('Actif'), tone: 'success' },
  DECLINED: { label: msg('Clos'), tone: 'neutral' },
}

/** Réponse d'un autre membre : « Kwame a accepté ». */
const RESPONSE_LABEL: Record<CircleResponse, string> = {
  ACCEPTED: msg('{name} a accepté'),
  PENDING: msg('{name} n’a pas encore répondu'),
  DECLINED: msg('{name} a refusé'),
}

/** Réponse de l'utilisateur lui-même : « Vous avez accepté ». */
const MY_RESPONSE_LABEL: Record<CircleResponse, string> = {
  ACCEPTED: msg('Vous avez accepté'),
  PENDING: msg('Vous n’avez pas encore répondu'),
  DECLINED: msg('Vous avez refusé'),
}

function ContactLine({ member }: { member: CircleMember }) {
  const { t } = useI18n()
  const href = member.contact ? contactHref(member.contact) : null
  return (
    <li className="text-sm text-ink-800">
      {t('{name} :', { name: member.full_name })}{' '}
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
        <span className="text-ink-600">{t('pas encore de moyen de contact')}</span>
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
  children,
}: {
  circle: Circle
  meId?: number
  busy?: boolean
  onPropose?: (circle: Circle) => void
  onAnswer?: (circle: Circle, accept: boolean) => void
  /** Contenu ajouté sous le cercle, par exemple la validation des compétences. */
  children?: React.ReactNode
}) {
  const { t, tn } = useI18n()
  const status = STATUS[circle.status]
  const me = circle.members.find((member) => member.id === meId)
  const others = circle.members.filter((member) => member.id !== meId)
  const accepted = circle.members.filter((member) => member.response === 'ACCEPTED').length
  const acceptedCount = t('{accepted} sur {total} ont accepté', {
    accepted,
    total: circle.members.length,
  })
  const hasDemo = circle.members.some((member) => member.is_demo)

  return (
    <Card as="li" className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Badge tone={status.tone}>{t(status.label)}</Badge>
          <p className="text-sm text-ink-600">
            {tn(circle.members.length, '{n} membre', '{n} membres')}
            {circle.status === 'PROPOSED' && ` · ${acceptedCount}`}
          </p>
          {hasDemo && <DemoBadge isDemo />}
        </div>
        <ScoreRing score={circle.score} size={52} stroke={5} />
      </div>

      <CircleDiagram circle={circle} meId={meId} />

      <div>
        <h3 className="mb-2 text-sm font-semibold text-ink-900">{t('Qui apprend quoi à qui')}</h3>
        <ol className="flex flex-col gap-1.5 text-sm text-ink-700">
          {circle.arrows.map((arrow, index) => (
            <li key={`${arrow.teacher}-${arrow.learner}`} className="flex gap-2">
              <span aria-hidden="true" className="text-accent-600">
                →
              </span>
              {arrowSentence(t, circle, index, meId)}
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
                {member.id === meId
                  ? member.response
                    ? t(MY_RESPONSE_LABEL[member.response])
                    : t('Vous')
                  : member.response
                    ? t(RESPONSE_LABEL[member.response], { name: member.full_name })
                    : member.full_name}
              </Badge>
            </li>
          ))}
        </ul>
      )}

      {circle.status === 'ACTIVE' && (
        <div className="flex flex-col gap-2 rounded-2xl bg-emerald-950/40 px-5 py-4 ring-1 ring-inset ring-emerald-400/20">
          <p className="flex items-center gap-2 text-sm font-medium text-emerald-300">
            <Icon name="check" size={16} />
            {t('Tout le monde a accepté : vous pouvez vous contacter.')}
          </p>
          <ul className="flex flex-col gap-1">
            {others.map((member) => (
              <ContactLine key={member.id} member={member} />
            ))}
          </ul>
          {me && !me.contact && (
            <p className="text-sm text-ink-700">
              {t("Vous n'avez pas indiqué votre moyen de contact :")}{' '}
              <Link to="/profil" className="font-medium text-accent-800 underline">
                {t('ajoutez-le dans Mon profil')}
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {children}

      {circle.status === 'DECLINED' && (
        <p className="text-sm text-ink-600">{t('Un membre a refusé : ce cercle est clos.')}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2">
        {circle.status === 'SUGGESTED' && onPropose && (
          <Button onClick={() => onPropose(circle)} loading={busy}>
            {t('Proposer ce cercle')}
          </Button>
        )}
        {circle.status === 'PROPOSED' && me?.response === 'PENDING' && onAnswer && (
          <>
            <Button onClick={() => onAnswer(circle, true)} loading={busy}>
              {t('Accepter')}
            </Button>
            <Button variant="secondary" onClick={() => onAnswer(circle, false)} disabled={busy}>
              {t('Refuser')}
            </Button>
          </>
        )}
        {circle.status === 'PROPOSED' && me?.response === 'ACCEPTED' && (
          <p className="text-sm text-ink-600">
            {t("Vous avez accepté. Le cercle s'active dès que tous les membres ont répondu oui.")}
          </p>
        )}
      </div>
    </Card>
  )
}
