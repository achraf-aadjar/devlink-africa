import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AuthProvider from '../../../app/AuthProvider'
import LoginPage from './LoginPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/connexion']}>
      <AuthProvider>
        <Routes>
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/tableau-de-bord" element={<h1>Tableau de bord</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('page de connexion', () => {
  it('affiche un formulaire accessible', () => {
    renderPage()

    expect(screen.getByRole('heading', { name: 'Se connecter' })).toBeInTheDocument()
    expect(screen.getByLabelText(/adresse e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mot de passe/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Se connecter' })).toBeInTheDocument()
  })

  it('valide côté client avant tout appel réseau', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Indiquez votre adresse e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Indiquez votre mot de passe.')).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('connecte puis redirige vers le tableau de bord', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse({
          access: 'a',
          refresh: 'r',
          user: {
            id: 1,
            email: 'ada@example.org',
            full_name: 'Ada',
            date_joined: '2026-10-07T00:00:00Z',
          },
        }),
      ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'ada@example.org')
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'mot-de-passe-solide-2026')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument()
    expect(localStorage.getItem('devlink.access_token')).toBe('a')
  })

  it('affiche un message unique sur des identifiants refusés', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { detail: 'Adresse e-mail ou mot de passe incorrect.', code: 'invalid_credentials' },
            401,
          ),
        ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'ada@example.org')
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'mauvais-mot-de-passe')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Adresse e-mail ou mot de passe incorrect.')
    expect(localStorage.getItem('devlink.access_token')).toBeNull()
  })

  it('affiche un message clair quand le serveur est injoignable', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'ada@example.org')
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'mot-de-passe-solide-2026')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Impossible de contacter le serveur/)
  })

  it('désactive le bouton pendant lenvoi', async () => {
    let resolve: (value: Response) => void = () => undefined
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => new Promise<Response>((r) => (resolve = r))),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), 'ada@example.org')
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'mot-de-passe-solide-2026')
    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Se connecter' })).toBeDisabled())
    resolve(
      jsonResponse({
        access: 'a',
        refresh: 'r',
        user: { id: 1, email: 'a@b.org', full_name: '', date_joined: '' },
      }),
    )
  })
})
