import { api } from '../../../lib/api'
import type { Exchange, ExchangeStatus, Paginated } from '../../../lib/types'

export const listExchanges = (
  params: { direction?: 'sent' | 'received'; status?: string } = {},
) => {
  const query = new URLSearchParams()
  if (params.direction) query.set('direction', params.direction)
  if (params.status) query.set('status', params.status)
  const suffix = query.toString()
  return api.get<Paginated<Exchange>>(`/exchanges/${suffix ? `?${suffix}` : ''}`)
}

export const changeExchangeStatus = (id: number, status: ExchangeStatus) =>
  api.patch<Exchange>(`/exchanges/${id}/`, { status })
