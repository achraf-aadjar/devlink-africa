import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import AuthProvider from '../../../app/AuthProvider'
import RegisterPage from './RegisterPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/inscription']}>
      <AuthProvider>
        <Routes>
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/tableau-de-bord" element={<h1>Tableau de bord</h1>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

const FILL = {
  email: 'ada@example.org',
  password: 'mot-de-passe-solide-2026',
}

describe("page d'inscription", () => {
  it('refuse un mot de passe de moins de 10 caractères', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), FILL.email)
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'court')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(
      await screen.findByText('Le mot de passe doit contenir au moins 10 caractères.'),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('exige le consentement à la politique de confidentialité', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), FILL.email)
    await userEvent.type(screen.getByLabelText(/mot de passe/i), FILL.password)
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(
      await screen.findByText(
        'Vous devez accepter la politique de confidentialité pour créer un compte.',
      ),
    ).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('crée le compte puis redirige', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse(
        {
          access: 'a',
          refresh: 'r',
          user: { id: 1, email: FILL.email, full_name: 'Ada', date_joined: '2026-10-07T00:00:00Z' },
        },
        201,
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    renderPage()

    await userEvent.type(screen.getByLabelText(/nom complet/i), 'Ada Lovelace')
    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), FILL.email)
    await userEvent.type(screen.getByLabelText(/mot de passe/i), FILL.password)
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument()
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string)
    expect(body).toEqual({
      email: FILL.email,
      password: FILL.password,
      full_name: 'Ada Lovelace',
      consent: true,
    })
  })

  it('affiche lerreur du serveur sur une adresse déjà utilisée', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ detail: 'Déjà utilisée.', code: 'email_already_used' }, 409),
        ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), FILL.email)
    await userEvent.type(screen.getByLabelText(/mot de passe/i), FILL.password)
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('Cette adresse e-mail est déjà utilisée.')).toBeInTheDocument()
  })

  it('affiche les erreurs de champ renvoyées par le serveur', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(
          {
            detail: 'Invalide.',
            code: 'invalid',
            errors: { password: ['Ce mot de passe est trop courant.'] },
          },
          400,
        ),
      ),
    )
    renderPage()

    await userEvent.type(screen.getByLabelText(/adresse e-mail/i), FILL.email)
    await userEvent.type(screen.getByLabelText(/mot de passe/i), 'motdepasse123')
    await userEvent.click(screen.getByRole('checkbox'))
    await userEvent.click(screen.getByRole('button', { name: 'Créer mon compte' }))

    expect(await screen.findByText('Ce mot de passe est trop courant.')).toBeInTheDocument()
  })
})
