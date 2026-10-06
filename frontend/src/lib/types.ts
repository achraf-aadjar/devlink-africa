/** Types des réponses de l'API, alignés sur docs/api.md (contrat gelé DL-04). */

export type Availability = 'MENTORING' | 'COLLABORATION' | 'OPEN_SOURCE' | 'FREELANCE'
export type Domain =
  'WEB' | 'MOBILE' | 'DATA' | 'DEVOPS' | 'DESIGN' | 'IA' | 'SECURITE' | 'EMBARQUE'
export type SkillLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
export type SkillKind = 'OFFERED' | 'WANTED'

export interface User {
  id: number
  email: string
  full_name: string
  date_joined: string
}

export interface Profile {
  country: string
  bio: string
  availability: Availability[]
  domains: Domain[]
  avatar_url: string
  is_demo: boolean
  completeness: number
}

export interface TokenPair {
  access: string
  refresh: string
  user: User
}

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Corps d'erreur uniforme renvoyé par le backend. */
export interface ApiErrorBody {
  detail: string
  code: string
  errors?: Record<string, string[]>
}

export interface Health {
  status: string
  version: string
}
