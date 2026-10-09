import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AuthProvider from '../../../app/AuthProvider'
import { jsonResponse, renderWithRouter, routeFetch } from '../../../test/helpers'
import LoginPage from './LoginPage'

// Google désactivé dans ces tests : ils portent sur le mot de passe. Un
// identifiant vide masque le bouton (voir useGoogleClientId).
const GOOGLE_OFF = { '/auth/google/client-id': { client_id: '' } }

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
    const fetchMock = routeFetch(GOOGLE_OFF)
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await userEvent.click(screen.getByRole('button', { name: 'Se connecter' }))

    expect(await screen.findByText('Indiquez votre adresse e-mail.')).toBeInTheDocument()
    expect(screen.getByText('Indiquez votre mot de passe.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/auth/login'))).toBe(false)
  })

  it('connecte puis redirige vers le tableau de bord', async () => {
    vi.stubGlobal(
      'fetch',
      routeFetch({
        ...GOOGLE_OFF,
        '/auth/login': {
          access: 'a',
          refresh: 'r',
          user: {
            id: 1,
            email: 'ada@example.org',
            full_name: 'Ada',
            date_joined: '2026-10-07T00:00:00Z',
          },
        },
      }),
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
      routeFetch({
        ...GOOGLE_OFF,
        '/auth/login': jsonResponse(
          { detail: 'Adresse e-mail ou mot de passe incorrect.', code: 'invalid_credentials' },
          401,
        ),
      }),
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

  it('s’affiche et valide en anglais', async () => {
    vi.stubGlobal('fetch', routeFetch(GOOGLE_OFF))
    renderWithRouter(<LoginPage />, { route: '/connexion', lang: 'en' })

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute(
      'href',
      '/inscription',
    )

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }))

    expect(await screen.findByText('Enter your email address.')).toBeInTheDocument()
    expect(screen.getByText('Enter your password.')).toBeInTheDocument()
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
