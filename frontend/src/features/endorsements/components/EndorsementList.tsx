import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/icons/Icon'
import { Card } from '../../../components/ui'
import { countryFlag } from '../../../lib/labels'
import type { UserSkill } from '../../../lib/types'

const CONTEXT_LABEL = {
  EXCHANGE: 'après un échange',
  CIRCLE: 'dans un cercle d’échange',
} as const

/**
 * Le passeport vérifié : les compétences validées par des pairs, avec qui les a
 * validées, dans quel cadre, et ce qu'ils en disent.
 */
export default function EndorsementList({ skills }: { skills: UserSkill[] }) {
  const endorsed = skills.filter((entry) => (entry.endorsements?.length ?? 0) > 0)
  if (endorsed.length === 0) return null

  return (
    <Card as="section" labelledBy="passeport-verifie" className="flex flex-col gap-4">
      <div>
        <h2 id="passeport-verifie" className="flex items-center gap-2 font-semibold text-ink-900">
          <Icon name="proof" size={18} className="text-emerald-300" />
          Validé par ses pairs
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          Des compétences confirmées par des développeurs qui les ont apprises de cette personne.
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {endorsed.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink-900">
              {entry.skill.name}
              <span className="ml-2 font-normal text-emerald-300">
                validée par {entry.endorsements?.length}{' '}
                {(entry.endorsements?.length ?? 0) > 1 ? 'pairs' : 'pair'}
              </span>
            </p>
            <ul className="flex flex-col gap-2">
              {entry.endorsements?.map((endorsement) => (
                <li key={endorsement.id} className="flex items-start gap-3">
                  <Avatar name={endorsement.by.full_name} size={32} />
                  <div className="min-w-0 text-sm">
                    <p className="text-ink-800">
                      <Link
                        to={`/developpeurs/${endorsement.by.id}`}
                        className="font-medium hover:underline"
                      >
                        {endorsement.by.full_name}
                      </Link>
                      {endorsement.by.country && (
                        <span className="ml-1" aria-hidden="true">
                          {countryFlag(endorsement.by.country)}
                        </span>
                      )}
                      <span className="text-ink-500"> · {CONTEXT_LABEL[endorsement.context]}</span>
                    </p>
                    {endorsement.comment && (
                      <p className="mt-0.5 text-ink-600">« {endorsement.comment} »</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </Card>
  )
}
