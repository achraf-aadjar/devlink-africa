import { api } from '../../../lib/api'
import type { Circle, Paginated } from '../../../lib/types'

export const getCircleSuggestions = () => api.get<{ results: Circle[] }>('/circles/suggestions/')

export const listCircles = (params: { awaiting?: boolean } = {}) =>
  api.get<Paginated<Circle>>(`/circles/${params.awaiting ? '?awaiting=me' : ''}`)

export const proposeCircle = (members: number[]) => api.post<Circle>('/circles/', { members })

export const answerCircle = (id: number, decision: 'ACCEPT' | 'DECLINE') =>
  api.patch<Circle>(`/circles/${id}/`, { decision })
