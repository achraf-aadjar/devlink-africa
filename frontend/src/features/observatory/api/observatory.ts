import { api } from '../../../lib/api'
import type { Observatory } from '../../../lib/types'

export const getObservatory = () => api.get<Observatory>('/observatory/', { auth: false })
