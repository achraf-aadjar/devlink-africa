import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import MatchesPage from './MatchesPage'

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const MATCH = {
  id: 31,
  user: { id: 2, full_name: 'Kofi Mensah', country: 'GH', avatar_url: '', is_demo: true },
  score: 82.5,
  reasons: ['Kofi peut vous apprendre Python.'],
  computed_at: '2026-10-15T09:00:00Z',
}

function renderPage() {
  return render(
    <MemoryRouter>
      <MatchesPage />
    </MemoryRouter>,
  )
}

describe('page des matchs', () => {
  it('affiche un état de chargement puis la liste', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ count: 1, next: null, previous: null, results: [MATCH] }),
        ),
    )
    renderPage()

    expect(screen.getByRole('status')).toHaveTextContent('Chargement de vos matchs…')
    expect(await screen.findByText('Kofi Mensah')).toBeInTheDocument()
    expect(screen.getByText('83')).toBeInTheDocument()
    expect(screen.getByText('Kofi peut vous apprendre Python.')).toBeInTheDocument()
  })

  it('étiquette les profils de démonstration', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ count: 1, next: null, previous: null, results: [MATCH] }),
        ),
    )
    renderPage()

    expect(await screen.findByText('Profil de démonstration')).toBeInTheDocument()
  })

  it('propose une action utile quand il n y a aucun match', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(jsonResponse({ count: 0, next: null, previous: null, results: [] })),
    )
    renderPage()

    expect(await screen.findByText('Aucun match pour le moment')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ajouter mes compétences' })).toHaveAttribute(
      'href',
      '/competences',
    )
  })

  it('affiche une erreur avec un bouton de réessai', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    renderPage()

    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument()
  })
})
