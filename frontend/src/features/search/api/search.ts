import { api } from '../../../lib/api'
import type { Country, CountryDetail, Paginated, Project, SearchUser } from '../../../lib/types'

export interface UserFilters {
  q?: string
  country?: string
  skill?: string
  skill_wanted?: string
  level?: string
  availability?: string
  domain?: string
  page?: number
  /** Permet de passer les filtres à toQuery sans perdre le typage des clés connues. */
  [key: string]: string | number | undefined
}

function toQuery(filters: Record<string, unknown>): string {
  const query = new URLSearchParams()
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== '') query.set(key, String(value))
  })
  const suffix = query.toString()
  return suffix ? `?${suffix}` : ''
}

export const searchUsers = (filters: UserFilters = {}) =>
  api.get<Paginated<SearchUser>>(`/search/users/${toQuery(filters)}`)

export const searchProjects = (filters: Record<string, unknown> = {}) =>
  api.get<Paginated<Project>>(`/search/projects/${toQuery(filters)}`)

export const listCountries = () => api.get<{ results: Country[] }>('/countries/')

/** Tous les pays sélectionnables, y compris ceux sans habitant. */
export const listCountryChoices = () =>
  api.get<{ results: Array<Pick<Country, 'code' | 'name' | 'flag'>> }>('/countries/all/')
export const getCountry = (code: string) => api.get<CountryDetail>(`/countries/${code}/`)
