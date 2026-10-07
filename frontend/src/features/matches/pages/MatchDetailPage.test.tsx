import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { jsonResponse, renderWithRouter, SESSION_USER } from '../../../test/helpers'
import MatchDetailPage from './MatchDetailPage'

const MATCH = {
  id: 31,
  user: { id: 2, full_name: 'Kofi Mensah', country: 'GH', avatar_url: '', is_demo: false },
  score: 82.5,
  computed_at: '2026-10-15T09:00:00Z',
  reasons: ['Kofi peut vous apprendre Python.'],
  explanation: {
    breakdown: [
      { criterion: 'complementarity', label: 'Complémentarité', weight: 35, points: 31.5 },
      { criterion: 'reciprocity', label: 'Réciprocité', weight: 20, points: 20 },
      { criterion: 'collaboration', label: 'Envie de collaborer', weight: 15, points: 11 },
      { criterion: 'common_tech', label: 'Technologies communes', weight: 10, points: 10 },
      { criterion: 'availability', label: 'Disponibilité', weight: 10, points: 5 },
      { criterion: 'domain', label: 'Domaine', weight: 10, points: 5 },
    ],
    they_can_teach_you: [{ name: 'Python', level: 'ADVANCED' }],
    you_can_teach_them: [{ name: 'React', level: 'INTERMEDIATE' }],
    common_skills: [],
    capped: false,
    reasons: ['Kofi peut vous apprendre Python.'],
  },
  my_feedback: null,
}

function stub(payload: unknown = MATCH, status = 200) {
  const fetchMock = vi.fn((url: string, init?: RequestInit) => {
    const path = String(url)
    if (init?.method === 'POST' && path.includes('/feedback/')) {
      return Promise.resolve(
        jsonResponse({ id: 5, match: 31, is_relevant: true, comment: '' }, 201),
      )
    }
    if (init?.method === 'POST' && path.includes('/request/')) {
      return Promise.resolve(jsonResponse({ id: 9 }, 201))
    }
    if (path.includes('/matches/31/')) return Promise.resolve(jsonResponse(payload, status))
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

function renderPage() {
  return renderWithRouter(
    <Routes>
      <Route path="/matchs/:id" element={<MatchDetailPage />} />
    </Routes>,
    { route: '/matchs/31', authenticated: true },
  )
}

describe('détail d un match', () => {
  it('affiche le score et l explication complète', async () => {
    stub()
    renderPage()

    expect(await screen.findByRole('heading', { name: 'Kofi Mensah' })).toBeInTheDocument()
    expect(screen.getByText('83')).toBeInTheDocument()
    expect(screen.getAllByRole('meter')).toHaveLength(6)
  })

  it('propose un échange', async () => {
    const fetchMock = stub()
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Proposer un échange' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(screen.getByLabelText(/Votre message/), 'Bonjour Kofi')
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }))

    await waitFor(() => {
      const posted = fetchMock.mock.calls.find((call) => String(call[0]).includes('/request/'))
      expect(JSON.parse(posted?.[1]?.body as string)).toMatchObject({
        type: 'MENTORAT',
        message: 'Bonjour Kofi',
      })
    })
    expect(dialog).not.toBeInTheDocument()
  })

  it('refuse d envoyer un message vide', async () => {
    const fetchMock = stub()
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Proposer un échange' }))
    await userEvent.click(screen.getByRole('button', { name: 'Envoyer la demande' }))

    expect(await screen.findByText('Écrivez un mot pour vous présenter.')).toBeInTheDocument()
    expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/request/'))).toBe(false)
  })

  it('enregistre un avis sur le match', async () => {
    const fetchMock = stub()
    renderPage()

    await userEvent.click(await screen.findByRole('button', { name: 'Utile' }))

    await waitFor(() =>
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('/feedback/'))).toBe(
        true,
      ),
    )
  })

  it('affiche un avis déjà donné', async () => {
    stub({
      ...MATCH,
      my_feedback: { id: 5, match: 31, is_relevant: true, comment: '', created_at: '' },
    })
    renderPage()

    expect(await screen.findByText(/Vous avez répondu/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Utile' })).not.toBeInTheDocument()
  })

  it('explique un match inaccessible', async () => {
    stub({ detail: 'Introuvable.', code: 'not_found' }, 404)
    renderPage()

    expect(await screen.findByRole('alert')).toHaveTextContent(/ne vous concerne pas/)
  })
})
