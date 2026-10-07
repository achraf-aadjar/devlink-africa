import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import PersonalDataCard from './PersonalDataCard'

function stub(deleteResponse?: Response) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = String(url)
    if (init?.method === 'DELETE') {
      return Promise.resolve(deleteResponse ?? new Response(null, { status: 204 }))
    }
    if (path.includes('/me/export/')) {
      return Promise.resolve(jsonResponse({ user: { email: 'ada@example.org' }, skills: [] }))
    }
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  vi.stubGlobal('URL', {
    ...URL,
    createObjectURL: () => 'blob:x',
    revokeObjectURL: () => undefined,
  })
  return fetchMock
}

describe('mes données personnelles', () => {
  it('propose les deux droits de la loi n° 2008-12', () => {
    stub()
    renderWithRouter(<PersonalDataCard />, { authenticated: true })

    expect(screen.getByRole('button', { name: 'Télécharger mes données' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer mon compte' })).toBeInTheDocument()
  })

  it('télécharge l export', async () => {
    const fetchMock = stub()
    renderWithRouter(<PersonalDataCard />, { authenticated: true })

    await userEvent.click(screen.getByRole('button', { name: 'Télécharger mes données' }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/me/export/'))).toBe(
        true,
      ),
    )
  })

  it('demande le mot de passe avant de supprimer', async () => {
    const fetchMock = stub()
    renderWithRouter(<PersonalDataCard />, { authenticated: true })

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }))

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText(/irréversible/)).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => call[1]?.method === 'DELETE')).toBe(false)
  })

  it('supprime le compte avec le mot de passe', async () => {
    const fetchMock = stub()
    renderWithRouter(<PersonalDataCard />, { authenticated: true })

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }))
    await userEvent.type(screen.getByLabelText(/Confirmez avec votre mot de passe/), 'secret-12345')
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }))

    await waitFor(() => {
      const deleted = fetchMock.mock.calls.find((call) => call[1]?.method === 'DELETE')
      expect(JSON.parse(deleted?.[1]?.body as string)).toEqual({ password: 'secret-12345' })
    })
  })

  it('affiche l erreur d un mot de passe incorrect', async () => {
    stub(
      jsonResponse(
        { detail: 'Invalide.', code: 'invalid', errors: { password: ['Mot de passe incorrect.'] } },
        400,
      ),
    )
    renderWithRouter(<PersonalDataCard />, { authenticated: true })

    await userEvent.click(screen.getByRole('button', { name: 'Supprimer mon compte' }))
    await userEvent.type(screen.getByLabelText(/Confirmez avec votre mot de passe/), 'mauvais')
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer définitivement' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Mot de passe incorrect.')
  })
})
