import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import MatchSentence from './MatchSentence'

function stub({ enabled = true, sentence = 'Vous pourriez vous entraider.', status = 200 } = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn((url: string) => {
      const path = String(url)
      if (path.includes('/ai/status/')) {
        return Promise.resolve(jsonResponse({ enabled, features: [] }))
      }
      if (path.includes('/ai/explain-match/')) {
        return Promise.resolve(
          status === 200
            ? jsonResponse({ sentence })
            : jsonResponse({ detail: 'Indisponible.', code: 'ai_unavailable' }, status),
        )
      }
      return Promise.resolve(jsonResponse(SESSION_USER))
    }),
  )
}

describe('phrase du match', () => {
  it("ne s'affiche pas quand l'IA est désactivée", async () => {
    stub({ enabled: false })
    renderWithRouter(<MatchSentence matchId={31} />, { authenticated: true })

    await waitFor(() =>
      expect(screen.queryByRole('button', { name: /Résumer ce match/ })).not.toBeInTheDocument(),
    )
  })

  it('affiche la phrase demandée', async () => {
    stub()
    renderWithRouter(<MatchSentence matchId={31} />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: /Résumer ce match/ }))

    expect(await screen.findByText('Vous pourriez vous entraider.')).toBeInTheDocument()
  })

  it('renvoie aux raisons détaillées si l IA ne répond pas', async () => {
    stub({ status: 503 })
    renderWithRouter(<MatchSentence matchId={31} />, { authenticated: true })

    await userEvent.click(await screen.findByRole('button', { name: /Résumer ce match/ }))

    expect(await screen.findByText(/raisons détaillées ci-dessous/)).toBeInTheDocument()
  })
})
