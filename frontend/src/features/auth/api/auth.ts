/** Appels d'API de l'authentification (contrat : docs/api.md § 3). */

import { api } from '../../../lib/api'
import type { TokenPair, User } from '../../../lib/types'

export interface RegisterInput {
  email: string
  password: string
  full_name: string
  consent: boolean
}

export interface LoginInput {
  email: string
  password: string
}

export const register = (input: RegisterInput) =>
  api.post<TokenPair>('/auth/register/', input, { auth: false })

export const login = (input: LoginInput) =>
  api.post<TokenPair>('/auth/login/', input, { auth: false })

export const logout = (refresh: string) => api.post<void>('/auth/logout/', { refresh })

/** Identifiant client OAuth, vide si la connexion avec Google n'est pas configurée. */
export const getGoogleClientId = () =>
  api.get<{ client_id: string }>('/auth/google/client-id/', { auth: false })

export const googleSignIn = (credential: string) =>
  api.post<TokenPair>('/auth/google/', { credential }, { auth: false })

export type { User }

/** Demande un lien de réinitialisation ; la réponse est la même que le compte existe ou non. */
export const requestPasswordReset = (email: string) =>
  api.post<void>('/auth/password-reset/', { email }, { auth: false })

export const confirmPasswordReset = (input: { uid: string; token: string; password: string }) =>
  api.post<void>('/auth/password-reset/confirm/', input, { auth: false })
