import { api } from '../../../lib/api'
import type {
  MySkills,
  Paginated,
  Skill,
  SkillKind,
  SkillLevel,
  UserSkill,
} from '../../../lib/types'

export const listCatalog = (
  params: { category?: string; search?: string; page_size?: number } = {},
) => {
  const query = new URLSearchParams()
  if (params.category) query.set('category', params.category)
  if (params.search) query.set('search', params.search)
  query.set('page_size', String(params.page_size ?? 100))
  return api.get<Paginated<Skill>>(`/skills/?${query.toString()}`)
}

export const getMySkills = () => api.get<MySkills>('/me/skills/')

export const addSkill = (input: { skill: number; kind: SkillKind; level?: SkillLevel }) =>
  api.post<UserSkill>('/me/skills/', input)

export const updateSkillLevel = (id: number, level: SkillLevel) =>
  api.patch<UserSkill>(`/me/skills/${id}/`, { level })

export const removeSkill = (id: number) => api.delete<void>(`/me/skills/${id}/`)
