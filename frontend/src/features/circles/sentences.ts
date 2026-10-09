import type { I18n } from '../../i18n/context'
import type { Circle } from '../../lib/types'

/**
 * Une phrase par flèche du cercle, à la deuxième personne quand l'utilisateur
 * est concerné : « Vous apprenez React à Kwame. », « Imani vous apprend Docker. ».
 * `t` vient de `useI18n()` : la phrase suit la langue de l'interface.
 */
export function arrowSentence(t: I18n['t'], circle: Circle, index: number, meId?: number): string {
  const arrow = circle.arrows[index]
  const name = (id: number) =>
    circle.members.find((member) => member.id === id)?.full_name ?? t('Un membre')
  const skill = arrow.skill.name
  const teacher = name(arrow.teacher)
  const learner = name(arrow.learner)
  if (arrow.teacher === meId) return t('Vous apprenez {skill} à {learner}.', { skill, learner })
  if (arrow.learner === meId) return t('{teacher} vous apprend {skill}.', { teacher, skill })
  return t('{teacher} apprend {skill} à {learner}.', { teacher, skill, learner })
}
