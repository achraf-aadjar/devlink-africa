import { render, type RenderOptions } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AuthProvider from '../app/AuthProvider'
import { setTokens } from '../lib/token'

export const SESSION_USER = {
  id: 1,
  email: 'ada@example.org',
  full_name: 'Ada Lovelace',
  date_joined: '2026-10-07T00:00:00Z',
}

export function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function emptyPage() {
  return { count: 0, next: null, previous: null, results: [] }
}

export function page<T>(results: T[]) {
  return { count: results.length, next: null, previous: null, results }
}

/**
 * Répond selon le chemin appelé, pour les écrans qui chargent plusieurs
 * ressources. Une route absente renvoie une page vide.
 */
export function routeFetch(routes: Record<string, unknown>) {
  return vi.fn((url: string) => {
    const path = String(url).replace('/api/v1', '').split('?')[0]
    const match = Object.keys(routes).find((key) => path === key || path.startsWith(key))
    if (match === undefined) return Promise.resolve(jsonResponse(emptyPage()))
    const value = routes[match]
    if (value instanceof Response) return Promise.resolve(value)
    return Promise.resolve(jsonResponse(value))
  })
}

/** Rend un composant dans un routeur, avec une session ouverte si demandé. */
export function renderWithRouter(
  ui: ReactElement,
  {
    route = '/',
    authenticated = false,
    ...options
  }: RenderOptions & { route?: string; authenticated?: boolean } = {},
) {
  if (authenticated) setTokens({ access: 'a', refresh: 'r' })

  return render(
    <MemoryRouter initialEntries={[route]}>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>,
    options,
  )
}
