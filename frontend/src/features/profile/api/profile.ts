import { api } from '../../../lib/api'
import type { Me, PublicProfile } from '../../../lib/types'

export interface ProfileUpdate {
  full_name?: string
  country?: string
  bio?: string
  availability?: string[]
  domains?: string[]
  avatar_url?: string
}

export const getMe = () => api.get<Me>('/me/')
export const updateMe = (input: ProfileUpdate) => api.patch<Me>('/me/', input)
export const getPublicProfile = (id: number) => api.get<PublicProfile>(`/users/${id}/`)

/** Export de mes données (droit d'accès, loi n° 2008-12). */
export const exportMyData = () => api.get<Record<string, unknown>>('/me/export/')

/** Suppression définitive du compte (droit d'effacement). */
export const deleteMyAccount = (password: string) => api.delete<void>('/me/delete/', { password })
