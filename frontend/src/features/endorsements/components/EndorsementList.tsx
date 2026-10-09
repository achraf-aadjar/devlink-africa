import { Link } from 'react-router-dom'
import Avatar from '../../../components/Avatar'
import Icon from '../../../components/icons/Icon'
import { Card } from '../../../components/ui'
import { msg } from '../../../i18n/translate'
import { useI18n } from '../../../i18n/useI18n'
import { countryFlag } from '../../../lib/labels'
import type { UserSkill } from '../../../lib/types'

const CONTEXT_LABEL = {
  EXCHANGE: msg('après un échange'),
  CIRCLE: msg('dans un cercle d’échange'),
} as const

/**
 * Le passeport vérifié : les compétences validées par des pairs, avec qui les a
 * validées, dans quel cadre, et ce qu'ils en disent.
 */
export default function EndorsementList({ skills }: { skills: UserSkill[] }) {
  const { t, tn } = useI18n()
  const endorsed = skills.filter((entry) => (entry.endorsements?.length ?? 0) > 0)
  if (endorsed.length === 0) return null

  return (
    <Card as="section" labelledBy="passeport-verifie" className="flex flex-col gap-4">
      <div>
        <h2 id="passeport-verifie" className="flex items-center gap-2 font-semibold text-ink-900">
          <Icon name="proof" size={18} className="text-[#3c763d]" />
          {t('Validé par ses pairs')}
        </h2>
        <p className="mt-1 text-sm text-ink-600">
          {t(
            'Des compétences confirmées par des développeurs qui les ont apprises de cette personne.',
          )}
        </p>
      </div>
      <ul className="flex flex-col gap-4">
        {endorsed.map((entry) => (
          <li key={entry.id} className="flex flex-col gap-2">
            <p className="text-sm font-semibold text-ink-900">
              {entry.skill.name}
              <span className="ml-2 font-normal text-[#3c763d]">
                {tn(
                  entry.endorsements?.length ?? 0,
                  'validée par {n} pair',
                  'validée par {n} pairs',
                )}
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
                      <span className="text-ink-500">
                        {' '}
                        · {t(CONTEXT_LABEL[endorsement.context])}
                      </span>
                    </p>
                    {endorsement.comment && (
                      <p className="mt-0.5 text-ink-600">
                        {t('« {comment} »', { comment: endorsement.comment })}
                      </p>
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
