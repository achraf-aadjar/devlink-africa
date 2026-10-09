import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import {
  emptyPage,
  jsonResponse,
  page,
  renderWithRouter,
  SESSION_USER,
} from '../../../test/helpers'
import ProjectsPage from './ProjectsPage'

const PROJECT = {
  id: 4,
  title: 'Agri-Data',
  description: 'Collecte de données agricoles hors ligne.',
  status: 'OPEN',
  needs: [{ id: 6, name: 'Python', category: 'BACKEND' }],
  repo_url: '',
  demo_url: '',
  owner: { id: 2, full_name: 'Kofi Mensah', country: 'GH', is_demo: true },
  join_requests_count: 3,
  created_at: '2026-09-01T10:00:00Z',
  updated_at: '2026-09-20T10:00:00Z',
}

function stub(projects: unknown[] = [PROJECT]) {
  const fetchMock = vi.fn((url: string) => {
    const path = String(url)
    if (path.includes('/projects/')) return Promise.resolve(jsonResponse(page(projects)))
    if (path.includes('/skills/')) return Promise.resolve(jsonResponse(emptyPage()))
    return Promise.resolve(jsonResponse(SESSION_USER))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

describe('Project Hub', () => {
  it('liste les projets avec leurs besoins', async () => {
    stub()
    renderWithRouter(<ProjectsPage />)

    expect(await screen.findByRole('link', { name: 'Agri-Data' })).toBeInTheDocument()
    expect(screen.getByText('Python')).toBeInTheDocument()
    expect(screen.getByText(/3 demandes/)).toBeInTheDocument()
    // Le libellé figure aussi dans le filtre de statut : on cible la carte.
    const card = screen.getByRole('link', { name: 'Agri-Data' }).closest('li')
    expect(card).toHaveTextContent('Ouvert aux contributions')
    expect(card).toHaveTextContent('Mis à jour')
  })

  it('n affiche le bouton de création qu aux personnes connectées', async () => {
    stub()
    renderWithRouter(<ProjectsPage />)

    await screen.findByRole('link', { name: 'Agri-Data' })
    expect(screen.queryByRole('link', { name: 'Proposer un projet' })).not.toBeInTheDocument()
  })

  it('porte la recherche dans l URL', async () => {
    const fetchMock = stub()
    renderWithRouter(<ProjectsPage />)
    await screen.findByRole('link', { name: 'Agri-Data' })

    // Le formulaire se valide à la touche Entrée (pas de bouton dédié ici).
    await userEvent.type(screen.getByLabelText('Rechercher'), 'agricole{Enter}')

    await waitFor(() =>
      expect(fetchMock.mock.calls.some((call) => String(call[0]).includes('q=agricole'))).toBe(
        true,
      ),
    )
  })

  it('liste les projets en anglais', async () => {
    stub()
    renderWithRouter(<ProjectsPage />, { lang: 'en' })

    const card = (await screen.findByRole('link', { name: 'Agri-Data' })).closest('li')
    expect(card).toHaveTextContent('Open to contributions')
    expect(card).toHaveTextContent('Led by Kofi Mensah')
    expect(card).toHaveTextContent(/Updated .+ · 3 requests/)
    expect(screen.getByText('1 project found.')).toBeInTheDocument()
    expect(screen.getByLabelText('Search')).toHaveAttribute('placeholder', 'Title or description')
    expect(screen.getByRole('option', { name: 'In progress' })).toBeInTheDocument()
  })

  it('propose d élargir les critères sans résultat', async () => {
    stub([])
    renderWithRouter(<ProjectsPage />)

    expect(await screen.findByText('Aucun projet ne correspond')).toBeInTheDocument()
  })
})
