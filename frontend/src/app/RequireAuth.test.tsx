import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { setTokens } from '../lib/token'
import AuthProvider from './AuthProvider'
import RequireAuth from './RequireAuth'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<h1>Se connecter</h1>} />
          <Route element={<RequireAuth />}>
            <Route path="/tableau-de-bord" element={<h1>Tableau de bord</h1>} />
          </Route>
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('garde de routes', () => {
  it('renvoie vers la connexion sans session', async () => {
    vi.stubGlobal('fetch', vi.fn())

    renderAt('/tableau-de-bord')

    expect(await screen.findByRole('heading', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('affiche la page privée quand la session est valide', async () => {
    setTokens({ access: 'a', refresh: 'r' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ id: 1, email: 'ada@example.org', full_name: 'Ada', date_joined: '' }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        ),
      ),
    )

    renderAt('/tableau-de-bord')

    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument()
  })

  it('renvoie vers la connexion si le jeton stocké est refusé', async () => {
    setTokens({ access: 'expire', refresh: 'revoque' })
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 'token_not_valid' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    renderAt('/tableau-de-bord')

    expect(await screen.findByRole('heading', { name: 'Se connecter' })).toBeInTheDocument()
  })
})
