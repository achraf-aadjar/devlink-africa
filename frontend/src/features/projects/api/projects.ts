import { api } from '../../../lib/api'
import type { JoinRequest, Paginated, Project, ProjectStatus } from '../../../lib/types'

export interface ProjectFilters {
  q?: string
  country?: string
  skill?: string
  status?: string
  owner?: number
  page?: number
}

export interface ProjectInput {
  title: string
  description?: string
  needs?: number[]
  status?: ProjectStatus
  repo_url?: string
  demo_url?: string
}

function toQuery(filters: ProjectFilters): string {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export const listProjects = (filters: ProjectFilters = {}) =>
  api.get<Paginated<Project>>(`/projects/${toQuery(filters)}`)

export const getProject = (id: number) => api.get<Project>(`/projects/${id}/`)
export const createProject = (input: ProjectInput) => api.post<Project>('/projects/', input)
export const updateProject = (id: number, input: Partial<ProjectInput>) =>
  api.patch<Project>(`/projects/${id}/`, input)
export const deleteProject = (id: number) => api.delete<void>(`/projects/${id}/`)

export const joinProject = (id: number, message: string) =>
  api.post<JoinRequest>(`/projects/${id}/join/`, { message })

export const decideJoinRequest = (id: number, status: 'ACCEPTED' | 'DECLINED') =>
  api.patch<JoinRequest>(`/join-requests/${id}/`, { status })
