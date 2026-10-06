/** Client d'API typé. Seul endroit du frontend qui parle au backend. */

import { getAccessToken, getRefreshToken, setAccessToken, setTokens } from './token'
import type { ApiErrorBody } from './types'

export const API_URL: string = import.meta.env.VITE_API_URL ?? '/api/v1'

/** Erreur d'API portant le corps uniforme du backend (detail / code / errors). */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly fieldErrors: Record<string, string[]>

  constructor(status: number, body: Partial<ApiErrorBody> | null) {
    super(body?.detail ?? "Une erreur s'est produite.")
    this.name = 'ApiError'
    this.status = status
    this.code = body?.code ?? 'error'
    this.fieldErrors = body?.errors ?? {}
  }

  /** Message à afficher sous un champ de formulaire, s'il y en a un. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors[field]?.[0]
  }
}

type Options = Omit<RequestInit, 'body'> & { body?: unknown; auth?: boolean }

async function send(path: string, options: Options): Promise<Response> {
  const { body, headers, auth = true, ...rest } = options
  const token = auth ? getAccessToken() : null

  return fetch(`${API_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
}

/** Tente un renouvellement du jeton d'accès. Renvoie true en cas de succès. */
async function refreshAccessToken(): Promise<boolean> {
  const refresh = getRefreshToken()
  if (!refresh) return false

  const response = await send('/auth/refresh/', { method: 'POST', body: { refresh }, auth: false })
  if (!response.ok) {
    setTokens(null)
    return false
  }

  const data = (await response.json()) as { access: string; refresh?: string }
  // Le backend fait tourner le jeton de rafraîchissement : on garde le nouveau.
  if (data.refresh) setTokens({ access: data.access, refresh: data.refresh })
  else setAccessToken(data.access)
  return true
}

async function parse<T>(response: Response): Promise<T> {
  if (response.status === 204) return undefined as T

  const text = await response.text()
  let data: unknown = null
  try {
    data = text ? JSON.parse(text) : null
  } catch {
    // Réponse non JSON (page d'erreur du serveur web, par exemple).
    throw new ApiError(response.status, { detail: 'Réponse inattendue du serveur.' })
  }

  if (!response.ok) throw new ApiError(response.status, data as ApiErrorBody)
  return data as T
}

/**
 * Exécute une requête. Si le jeton d'accès a expiré (401), tente une seule fois
 * de le renouveler puis rejoue la requête.
 */
export async function request<T>(path: string, options: Options = {}): Promise<T> {
  let response = await send(path, options)

  if (response.status === 401 && options.auth !== false && getRefreshToken()) {
    if (await refreshAccessToken()) {
      response = await send(path, options)
    }
  }

  return parse<T>(response)
}

export const api = {
  get: <T>(path: string, options?: Options) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Options) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Options) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, body?: unknown, options?: Options) =>
    request<T>(path, { ...options, method: 'DELETE', body }),
}
