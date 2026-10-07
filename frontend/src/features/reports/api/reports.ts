import { api } from '../../../lib/api'
import type { ReportReason, ReportTargetType } from '../../../lib/types'

export interface ReportInput {
  target_type: ReportTargetType
  target_id: number
  reason: ReportReason
  details?: string
}

export const sendReport = (input: ReportInput) => api.post<{ id: number }>('/reports/', input)
