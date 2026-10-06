import { api } from '../../../lib/api'
import type {
  Exchange,
  ExchangeType,
  MatchDetail,
  MatchFeedback,
  MatchSummary,
  Paginated,
} from '../../../lib/types'

export const listMatches = (page = 1) => api.get<Paginated<MatchSummary>>(`/matches/?page=${page}`)

export const getMatch = (id: number) => api.get<MatchDetail>(`/matches/${id}/`)

export const sendFeedback = (id: number, input: { is_relevant: boolean; comment?: string }) =>
  api.post<MatchFeedback>(`/matches/${id}/feedback/`, input)

export const requestExchange = (
  matchId: number,
  input: { type: ExchangeType; message: string; skill?: number },
) => api.post<Exchange>(`/matches/${matchId}/request/`, input)
