import type { Circle } from '../../lib/types'

/**
 * Une phrase par flèche du cercle, à la deuxième personne quand l'utilisateur
 * est concerné : « Vous apprenez React à Kwame. », « Imani vous apprend Docker. ».
 */
export function arrowSentence(circle: Circle, index: number, meId?: number): string {
  const arrow = circle.arrows[index]
  const name = (id: number) =>
    circle.members.find((member) => member.id === id)?.full_name ?? 'Un membre'
  const skill = arrow.skill.name
  if (arrow.teacher === meId) return `Vous apprenez ${skill} à ${name(arrow.learner)}.`
  if (arrow.learner === meId) return `${name(arrow.teacher)} vous apprend ${skill}.`
  return `${name(arrow.teacher)} apprend ${skill} à ${name(arrow.learner)}.`
}
