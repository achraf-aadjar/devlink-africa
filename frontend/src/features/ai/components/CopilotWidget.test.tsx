import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import CopilotWidget from './CopilotWidget'

function stub({
  enabled = true,
  reply = { reply: 'Allez dans Mon profil.' } as unknown,
  status = 200,
} = {}) {
  const fetchMock = vi.fn((url: string) => {
    const path = String(url)
    if (path.includes('/ai/status/')) {
      return Promise.resolve(jsonResponse({ enabled, features: enabled ? ['copilot'] : [] }))
    }
    if (path.includes('/ai/copilot/')) {
      return Promise.resolve(jsonResponse(reply, status))
    }
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('DevLink Copilot', () => {
  it("ne s'affiche pas quand l'IA est désactivée", async () => {
    stub({ enabled: false })
    renderWithRouter(<CopilotWidget />, { authenticated: true })

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /DevLink Copilot/ })).not.toBeInTheDocument(),
    )
  })

  it("ne s'affiche pas sans session ouverte, même si l'IA est active", async () => {
    stub({ enabled: true })
    renderWithRouter(<CopilotWidget />)

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /DevLink Copilot/ })).not.toBeInTheDocument(),
    )
  })

  it('ouvre la fenêtre et répond à une question', async () => {
    stub()
    renderWithRouter(<CopilotWidget />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Ouvrir DevLink Copilot' }))
    await userEvent.type(
      screen.getByLabelText('Votre question pour DevLink Copilot'),
      'Comment je complète mon profil ?',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(await screen.findByText('Allez dans Mon profil.')).toBeInTheDocument()
    expect(screen.getByText('Comment je complète mon profil ?')).toBeInTheDocument()
  })

  it('propose de réessayer quand le service ne répond pas', async () => {
    stub({ status: 503, reply: { detail: 'Indisponible.', code: 'ai_unavailable' } })
    renderWithRouter(<CopilotWidget />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Ouvrir DevLink Copilot' }))
    await userEvent.type(screen.getByLabelText('Votre question pour DevLink Copilot'), 'Bonjour')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer' }))

    expect(
      await screen.findByText(/momentanément indisponible. Réessayez dans un instant/),
    ).toBeInTheDocument()
  })

  it('parle anglais, sans traduire la réponse du service', async () => {
    stub()
    renderWithRouter(<CopilotWidget />, { authenticated: true, lang: 'en' })

    await userEvent.click(await screen.findByRole('button', { name: 'Open DevLink Copilot' }))
    expect(screen.getByText(/Ask me anything about your profile/)).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Your question for DevLink Copilot'), 'Hello')
    await userEvent.click(screen.getByRole('button', { name: 'Send' }))

    expect(await screen.findByText('Allez dans Mon profil.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Minimize DevLink Copilot' })).toBeInTheDocument()
  })

  it('ferme la fenêtre', async () => {
    stub()
    renderWithRouter(<CopilotWidget />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: 'Ouvrir DevLink Copilot' }))
    expect(screen.getByRole('dialog', { name: 'DevLink Copilot' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Fermer DevLink Copilot' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
