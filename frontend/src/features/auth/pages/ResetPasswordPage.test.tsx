import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse } from '../../../test/helpers'
import ResetPasswordPage from './ResetPasswordPage'

function renderPage(search: string) {
  return render(
    <MemoryRouter initialEntries={[`/mot-de-passe/reinitialiser${search}`]}>
      <Routes>
        <Route path="/mot-de-passe/reinitialiser" element={<ResetPasswordPage />} />
        <Route path="/connexion" element={<h1>Connexion</h1>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('page nouveau mot de passe', () => {
  it('signale un lien sans identifiant', () => {
    renderPage('')

    expect(screen.getByRole('alert')).toHaveTextContent(/invalide ou a expiré/)
    expect(screen.getByRole('link', { name: 'Demander un nouveau lien' })).toBeInTheDocument()
  })

  it('refuse un mot de passe trop court sans appeler le serveur', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderPage('?uid=MQ&token=abc')

    await userEvent.type(screen.getByLabelText(/nouveau mot de passe/i), 'court')
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }))

    expect(await screen.findByText(/doit contenir au moins 10/)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('change le mot de passe puis renvoie vers la connexion', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    renderPage('?uid=MQ&token=abc')

    await userEvent.type(
      screen.getByLabelText(/nouveau mot de passe/i),
      'nouveau-mot-de-passe-2027',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }))

    expect(await screen.findByRole('heading', { name: 'Connexion' })).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({
      uid: 'MQ',
      token: 'abc',
      password: 'nouveau-mot-de-passe-2027',
    })
  })

  it('bascule sur l’écran de lien invalide quand le serveur refuse le jeton', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { detail: 'Ce lien est invalide ou a expiré.', code: 'invalid_reset_token' },
            400,
          ),
        ),
    )
    renderPage('?uid=MQ&token=abc')

    await userEvent.type(
      screen.getByLabelText(/nouveau mot de passe/i),
      'nouveau-mot-de-passe-2027',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Changer le mot de passe' }))

    expect(
      await screen.findByRole('link', { name: 'Demander un nouveau lien' }),
    ).toBeInTheDocument()
  })
})
