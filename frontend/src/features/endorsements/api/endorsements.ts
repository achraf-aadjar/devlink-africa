import { api } from '../../../lib/api'
import type { EndorsementCandidate, SkillEndorsement } from '../../../lib/types'

export const getEndorsementCandidates = () =>
  api.get<{ results: EndorsementCandidate[] }>('/endorsements/candidates/')

export const endorseSkill = (userSkill: number, comment = '') =>
  api.post<SkillEndorsement>('/endorsements/', { user_skill: userSkill, comment })

export const withdrawEndorsement = (id: number) => api.delete<void>(`/endorsements/${id}/`)
