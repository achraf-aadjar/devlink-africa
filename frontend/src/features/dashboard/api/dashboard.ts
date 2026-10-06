import { api } from '../../../lib/api'
import type { Dashboard } from '../../../lib/types'

export const getDashboard = () => api.get<Dashboard>('/dashboard/')
