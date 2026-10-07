import { api } from '../../../lib/api'
import type { Paginated, SearchUser, SkillLevel } from '../../../lib/types'

export interface AIStatus {
  enabled: boolean
  features: string[]
}

export interface SkillSuggestion {
  skill: number
  name: string
  level?: SkillLevel
}

export interface ExtractedSkills {
  suggestions: { offered: SkillSuggestion[]; wanted: SkillSuggestion[] }
}

export interface NaturalSearchResult {
  criteria: Record<string, string>
  results: Paginated<SearchUser>
}

export const getAIStatus = () => api.get<AIStatus>('/ai/status/')

export const extractSkills = (text: string) =>
  api.post<ExtractedSkills>('/ai/extract-skills/', { text })

export const naturalSearch = (query: string) =>
  api.post<NaturalSearchResult>('/ai/search/', { query })

export const summarizeProject = (description: string) =>
  api.post<{ summary: string }>('/ai/summarize-project/', { description })

export const explainMatch = (match: number) =>
  api.post<{ sentence: string }>('/ai/explain-match/', { match })
